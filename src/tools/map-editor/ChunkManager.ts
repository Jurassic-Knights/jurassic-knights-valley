import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { ZoneConfig } from '@data/ZoneConfig';

export interface MapObject {
    id: string; // Asset ID
    x: number; // World X
    y: number; // World Y
}

export interface ChunkData {
    id: string; // x,y
    objects: MapObject[];
    zones?: Record<string, Record<string, string>>; // "localX,localY" -> { [Category]: zoneId }
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

    private gridOpacity: number = 0.5;

    public setGridOpacity(opacity: number) {
        this.gridOpacity = opacity;
        // Apply immediately to all loaded chunks
        this.loadedChunks.forEach(chunk => {
            const g = this.getDebugGraphics(chunk);
            // We draw the stroke with alpha in style, but we can also just set alpha on the Graphics object
            // However, the draw call used 'alpha' in the stroke style.
            // Simplest way: just redraw or update the Graphics alpha? 
            // Setting g.alpha affects fill+stroke. Our debug graphics is just stroke.
            g.alpha = opacity;
            // Wait, if we drew with 0.5 alpha, and set g.alpha = 1, effective is 0.5.
            // If we want FULL control, we should have drawn with alpha 1 and used g.alpha.
            // Let's force a redraw to be safe/clean.

            const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
            const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

            g.clear();
            g.strokeStyle = { width: 32, color: MapEditorConfig.Colors.CHUNK_BORDER, alpha: 1 }; // Draw solid
            g.rect(0, 0, chunkSizePx, chunkSizePx);
            g.stroke();
            g.alpha = opacity; // Control via container alpha
        });
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
            data = { id: chunkKey, objects: [], zones: {} };
            this.worldData.set(chunkKey, data);
        }
        data.objects.push({ id: assetId, x, y });

        // 2. If chunk is visible, add Sprite immediately
        const chunkContainer = this.loadedChunks.get(chunkKey);
        if (chunkContainer) {
            this.renderObject(chunkContainer, assetId, x, y, chunkX, chunkY);
        }
    }

    /**
     * Sets a zone for a specific tile.
     * @param x World Tile X
     * @param y World Tile Y
     * @param category Zone Category
     * @param zoneId Zone ID
     */
    public setZone(x: number, y: number, category: string, zoneId: string | null): void {
        this.setZones([{ x, y, category, zoneId }]);
    }

    public setZones(updates: { x: number, y: number, category: string, zoneId: string | null }[]): void {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunksToUpdate = new Set<string>();

        // 1. Process Updates
        updates.forEach(u => {
            const chunkX = Math.floor(u.x / chunkSizePx);
            const chunkY = Math.floor(u.y / chunkSizePx);
            const chunkKey = `${chunkX},${chunkY}`;

            const localX = Math.floor((u.x - (chunkX * chunkSizePx)) / TILE_SIZE);
            const localY = Math.floor((u.y - (chunkY * chunkSizePx)) / TILE_SIZE);
            const tileKey = `${localX},${localY}`;

            let data = this.worldData.get(chunkKey);
            if (!data) {
                data = { id: chunkKey, objects: [], zones: {} };
                this.worldData.set(chunkKey, data);
            }
            if (!data.zones) data.zones = {};
            if (!data.zones[tileKey]) data.zones[tileKey] = {};

            // Optimization: Skip if value is same
            const currentZoneId = data.zones[tileKey][u.category];

            if (u.zoneId === null) {
                // Delete
                if (currentZoneId !== undefined) {
                    delete data.zones[tileKey][u.category];
                    chunksToUpdate.add(chunkKey);
                }
            } else {
                // Set/Update
                if (currentZoneId !== u.zoneId) {
                    data.zones[tileKey][u.category] = u.zoneId;
                    chunksToUpdate.add(chunkKey);
                }
            }
        });

        // 2. Batch Render
        chunksToUpdate.forEach(chunkKey => {
            const chunkContainer = this.loadedChunks.get(chunkKey);
            const data = this.worldData.get(chunkKey);
            if (chunkContainer && data && data.zones) {
                this.renderZoneOverlay(chunkContainer, data.zones);
            }
        });
    }

    public getZone(x: number, y: number, category: string): string | null {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunkX = Math.floor(x / chunkSizePx);
        const chunkY = Math.floor(y / chunkSizePx);
        const chunkKey = `${chunkX},${chunkY}`;

        const data = this.worldData.get(chunkKey);
        if (!data || !data.zones) return null;

        const localX = Math.floor((x - (chunkX * chunkSizePx)) / TILE_SIZE);
        const localY = Math.floor((y - (chunkY * chunkSizePx)) / TILE_SIZE);
        const tileKey = `${localX},${localY}`;

        return data.zones[tileKey]?.[category] || null;
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
                    // Registry access via global window for editor tools
                    type RegistryDict = Record<string, { width?: number; height?: number } | undefined>;
                    const reg = (window as unknown as {
                        __ENTITY_REGISTRY__: {
                            nodes?: RegistryDict;
                            enemies?: RegistryDict;
                            resources?: RegistryDict;
                            items?: RegistryDict;
                            environment?: RegistryDict;
                        }
                    }).__ENTITY_REGISTRY__;
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
    public update(viewRect: { x: number, y: number, width: number, height: number }, zoom: number): void {
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
            } else {
                // 3. Update Debug Grid Visibility (LOD) & Scale
                const g = this.getDebugGraphics(chunk);

                // Hide if extremely far out (< 0.5%)
                const isVisible = zoom > 0.005;
                g.visible = isVisible;

                if (isVisible) {
                    // Dynamic Line Width: Ensure at least 1-2 screen pixels
                    // standard = 32 world units. 
                    // At 0.01 zoom -> 0.32px (invisible/glitchy)
                    // Target: 2 screen pixels -> 2 / zoom
                    const lineWidth = Math.max(32, 2 / zoom);

                    // Redraw
                    const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
                    const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

                    g.clear();
                    // Use solid color, non-scaling stroke alignment
                    g.rect(0, 0, chunkSizePx, chunkSizePx);
                    g.stroke({ width: lineWidth, color: MapEditorConfig.Colors.CHUNK_BORDER, alpha: this.gridOpacity });
                }
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
        debugGraphics.strokeStyle = { width: 32, color: MapEditorConfig.Colors.CHUNK_BORDER, alpha: 1 }; // Draw solid
        debugGraphics.rect(0, 0, chunkSizePx, chunkSizePx);
        debugGraphics.stroke();
        debugGraphics.alpha = this.gridOpacity; // Apply current opacity

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
            if (data.zones) {
                this.renderZoneOverlay(chunk, data.zones);
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

    private renderZoneOverlay(container: PIXI.Container, zones: Record<string, Record<string, string>>) {
        // Reuse or create Graphics for zones
        let g = container.getChildByName('zone_overlay') as PIXI.Graphics;
        if (!g) {
            g = new PIXI.Graphics();
            g.label = 'zone_overlay';
            // Insert before Debug Graphics (child index?)
            // Usually keep it on top of objects? Or below?
            // "Overlay" implies Top.
            container.addChild(g);
        }

        g.clear();
        const { TILE_SIZE } = MapEditorConfig;

        // Iterate all tiles in this chunk that have zones
        for (const [tileKey, categories] of Object.entries(zones)) {
            const [lx, ly] = tileKey.split(',').map(Number);

            // Render each active category as a colored rect
            // Overlapping? Draw based on priority or just last one?
            // Let's draw concentrically or just blend?
            // Simple approach: Draw rects.

            Object.entries(categories).forEach(([cat, zoneId]) => {
                const def = ZoneConfig[zoneId];
                // Check Global Visibility Filter (ID Based)
                const visibleFilters = (window as any).visibleZoneIds as Set<string>;
                const isVisible = visibleFilters ? visibleFilters.has(zoneId) : true;

                if (def && isVisible) {
                    g.rect(lx * TILE_SIZE, ly * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    g.fill({ color: def.color, alpha: 0.3 });
                }
            });
        }
    }

    public serialize(): { version: number; chunks: ChunkData[] } {
        const exportData: ChunkData[] = [];
        this.worldData.forEach((chunk) => {
            exportData.push(chunk);
        });
        return {
            version: 1,
            chunks: exportData
        };
    }
}
