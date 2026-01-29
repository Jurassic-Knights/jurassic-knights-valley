
import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';

interface MapObject {
    id: string; // Asset ID
    x: number; // World X
    y: number; // World Y
}

interface ChunkData {
    id: string; // x,y
    objects: MapObject[];
}

/**
 * ChunkManager
 * 
 * Manages the lifecycle of Map Chunks.
 * Handles Dynamic Loading/Unloading based on Viewport visibility.
 */
export class ChunkManager {
    private container: PIXI.Container;
    private loadedChunks: Map<string, PIXI.Container>;
    private pool: PIXI.Container[]; // Object pool for performance

    // Persistent World Data
    private worldData: Map<string, ChunkData>;

    constructor(parentContainer: PIXI.Container) {
        this.container = new PIXI.Container();
        parentContainer.addChild(this.container);

        this.loadedChunks = new Map();
        this.pool = [];
        this.worldData = new Map();
    }

    /**
     * Adds an object to the world at specific coordinates
     */
    public addObject(x: number, y: number, assetId: string): void {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunkX = Math.floor(x / chunkSizePx);
        const chunkY = Math.floor(y / chunkSizePx);
        const chunkKey = `${chunkX},${chunkY}`;

        // 1. Update Persistent Data
        let data = this.worldData.get(chunkKey);
        if (!data) {
            data = { id: chunkKey, objects: [] };
            this.worldData.set(chunkKey, data);
        }
        data.objects.push({ id: assetId, x, y });

        // 2. If chunk is visible, add Sprite immediately
        const chunkContainer = this.loadedChunks.get(chunkKey);
        if (chunkContainer) {
            this.renderObject(chunkContainer, assetId, x, y, chunkX, chunkY);
        }
    }

    private renderObject(container: PIXI.Container, assetId: string, worldX: number, worldY: number, chunkX: number, chunkY: number) {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        // Local position within chunk
        const localX = worldX - (chunkX * chunkSizePx);
        const localY = worldY - (chunkY * chunkSizePx);

        // 1. Create Placeholder Sprite Immediately
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.tint = 0xFFFF00; // Yellow = Loading
        sprite.width = 64;
        sprite.height = 64;
        sprite.anchor.set(0.5);
        sprite.x = localX;
        sprite.y = localY;
        container.addChild(sprite);

        // 2. Load Asset Asynchronously (via AssetLoader for White BG removal)
        // 2. Load Asset Asynchronously (via AssetLoader for White BG removal)
        AssetLoader.preloadImage(assetId)
            .then((imageSource) => {
                if (!sprite.destroyed) {
                    const texture = PIXI.Texture.from(imageSource);
                    sprite.texture = texture;
                    sprite.tint = 0xFFFFFF; // Remove tint

                    // --- Smart Sizing ---
                    // Lookup entity config to get intended game size
                    let targetWidth = 64;
                    let targetHeight = 64;

                    // Search all registries for this ID
                    const reg = (window as any).__ENTITY_REGISTRY__;
                    if (reg) {
                        const entity = reg.nodes?.[assetId] ||
                            reg.enemies?.[assetId] ||
                            reg.environment?.[assetId] ||
                            reg.resources?.[assetId];

                        if (entity && entity.width && entity.height) {
                            targetWidth = entity.width;
                            targetHeight = entity.height;
                        }
                    }

                    sprite.width = targetWidth;
                    sprite.height = targetHeight;
                }
            })
            .catch((err) => {
                Logger.warn(`[ChunkManager] Failed to load ${assetId}: ${err}`);
                if (!sprite.destroyed) {
                    sprite.tint = 0xFF00FF; // Magenta = Error
                }
            });

        Logger.info(`[ChunkManager] Placed object ${assetId} at local ${localX.toFixed(0)},${localY.toFixed(0)}`);
    }

    /**
     * Update observable chunks based on viewport
     * @param viewRect The visible area in WORLD coordinates
     */
    public update(viewRect: { x: number, y: number, width: number, height: number }): void {
        const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        // Calculate chunk indices covering the viewport
        const startX = Math.floor(viewRect.x / chunkSizePx);
        const startY = Math.floor(viewRect.y / chunkSizePx);
        const endX = Math.ceil((viewRect.x + viewRect.width) / chunkSizePx);
        const endY = Math.ceil((viewRect.y + viewRect.height) / chunkSizePx);

        // Add Buffer (1 chunk extra on all sides)
        const minX = startX - 1;
        const minY = startY - 1;
        const maxX = endX + 1;
        const maxY = endY + 1;

        const visibleKeys = new Set<string>();

        // 1. Identify chunks that SHOULD be visible
        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                // Check bounds of the 1250x1250 world
                if (x < 0 || y < 0 || x >= MapEditorConfig.WORLD_WIDTH_TILES / CHUNK_SIZE || y >= MapEditorConfig.WORLD_HEIGHT_TILES / CHUNK_SIZE) {
                    continue;
                }
                const key = `${x},${y}`;
                visibleKeys.add(key);

                if (!this.loadedChunks.has(key)) {
                    // Logger.info(`[ChunkManager] ViewRect: ${viewRect.x.toFixed(0)},${viewRect.y.toFixed(0)} loading ${key}`);
                    this.loadChunk(key, x, y);
                }
            }
        }

        // 2. Unload chunks that are NO LONGER visible
        for (const [key, chunk] of this.loadedChunks) {
            if (!visibleKeys.has(key)) {
                this.unloadChunk(key);
            }
        }
    }

    private loadChunk(key: string, x: number, y: number): void {
        const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        // Get container from pool or create new
        let chunk = this.pool.pop();
        if (!chunk) {
            chunk = new PIXI.Container();
        }

        chunk.x = x * chunkSizePx;
        chunk.y = y * chunkSizePx;
        chunk.visible = true;

        // --- Debug Visualization ---
        const debugGraphics = this.getDebugGraphics(chunk);
        debugGraphics.clear();
        debugGraphics.strokeStyle = { width: 32, color: MapEditorConfig.Colors.CHUNK_BORDER, alpha: 0.5 };
        debugGraphics.rect(0, 0, chunkSizePx, chunkSizePx);
        debugGraphics.stroke();

        // Add coordinates text
        const text = new PIXI.Text({
            text: key,
            style: { fill: 0xFFFFFF, fontSize: 32 }
        });
        text.x = 10;
        text.y = 10;
        chunk.addChild(text);

        // --- Render Stored Objects ---
        const data = this.worldData.get(key);
        if (data) {
            for (const obj of data.objects) {
                this.renderObject(chunk, obj.id, obj.x, obj.y, x, y);
            }
        }

        this.container.addChild(chunk);
        this.loadedChunks.set(key, chunk);
    }

    private unloadChunk(key: string): void {
        const chunk = this.loadedChunks.get(key);
        if (chunk) {
            chunk.removeChildren(); // Clear contents (text, graphics, sprites)
            chunk.parent?.removeChild(chunk);
            this.pool.push(chunk); // Return to pool
            this.loadedChunks.delete(key);
        }
    }

    private getDebugGraphics(container: PIXI.Container): PIXI.Graphics {
        // Reuse existing graphics object if it exists
        let g = container.children.find(c => c instanceof PIXI.Graphics) as PIXI.Graphics;
        if (!g) {
            g = new PIXI.Graphics();
            container.addChild(g);
        }
        return g;
    }

    public serialize(): any {
        const exportData: any[] = [];
        this.worldData.forEach(chunk => {
            exportData.push(chunk);
        });
        return {
            version: 1,
            chunks: exportData
        };
    }
}
