import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';
import { GroundSystem } from './GroundSystem';
import { ObjectSystem } from './ObjectSystem';
import { ZoneSystem } from './ZoneSystem';
import { ChunkData } from './MapEditorTypes';

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

    // Sub-Systems
    private groundSystem: GroundSystem;
    private objectSystem: ObjectSystem;
    private zoneSystem: ZoneSystem;

    constructor(parentContainer: PIXI.Container) {
        this.container = new PIXI.Container();
        parentContainer.addChild(this.container);

        this.loadedChunks = new Map();
        this.pool = [];
        this.worldData = new Map();

        // Initialize Systems
        this.groundSystem = new GroundSystem();
        this.objectSystem = new ObjectSystem();
        this.zoneSystem = new ZoneSystem(this.groundSystem);
    }

    private gridOpacity: number = 0.5;

    public setGridOpacity(opacity: number) {
        this.gridOpacity = opacity;
        // Apply immediately to all loaded chunks
        this.loadedChunks.forEach(chunk => {
            const g = this.getDebugGraphics(chunk);
            if (g) {
                g.alpha = opacity;
            }
        });
    }

    // --- Ground System Delegation ---

    public async renderProceduralGround(chunk: PIXI.Container, chunkX: number, chunkY: number) {
        const chunkKey = `${chunkX},${chunkY}`;
        const data = this.worldData.get(chunkKey);
        if (data) {
            await this.groundSystem.renderChunk(chunk, data, chunkX, chunkY);
        }
    }

    public async paintSplat(worldX: number, worldY: number, radius: number, intensity: number, soft: boolean = true) {
        return await this.groundSystem.paintSplat(worldX, worldY, radius, intensity, soft, this.worldData, this.loadedChunks);
    }

    /**
     * Update a specific ground tile (Delegated)
     */
    public async updateGroundTile(chunkKey: string, lx: number, ly: number) {
        const chunk = this.loadedChunks.get(chunkKey);
        const data = this.worldData.get(chunkKey);
        if (chunk && data) {
            let groundLayer = chunk.getChildByLabel('ground_layer') as PIXI.Container;
            if (!groundLayer) {
                groundLayer = new PIXI.Container();
                (groundLayer as { label?: string }).label = 'ground_layer';
                chunk.addChildAt(groundLayer, 0);
            }
            await this.groundSystem.updateTile(chunkKey, lx, ly, data, groundLayer);
        }
    }

    public async restoreSplatData(changes: Map<string, { idx: number, oldVal: number, newVal: number }[]>, undo: boolean) {
        await this.groundSystem.restoreSplatData(changes, undo, this.worldData, this.loadedChunks);
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

        // Delegate to ObjectSystem
        this.objectSystem.addObject(data, assetId, x, y);

        // 2. If chunk is visible, add Sprite immediately
        const chunkContainer = this.loadedChunks.get(chunkKey);
        if (chunkContainer) {
            this.objectSystem.renderObject(chunkContainer, assetId, x, y, chunkX, chunkY);
        }
    }
    /**
     * Removes an object at specific world coordinates
     */
    public removeObjectAt(x: number, y: number): void {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunkX = Math.floor(x / chunkSizePx);
        const chunkY = Math.floor(y / chunkSizePx);
        const chunkKey = `${chunkX},${chunkY}`;

        const data = this.worldData.get(chunkKey);
        const chunkContainer = this.loadedChunks.get(chunkKey);

        if (data && chunkContainer) {
            this.objectSystem.removeObject(chunkContainer, data, x, y, chunkX, chunkY);
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
        this.zoneSystem.setZone(x, y, category, zoneId, this.worldData, this.loadedChunks);
    }

    public async setZones(updates: { x: number, y: number, category: string, zoneId: string | null }[]) {
        await this.zoneSystem.setZones(updates, this.worldData, this.loadedChunks);
    }

    public getZone(x: number, y: number, category: string): string | null {
        return this.zoneSystem.getZone(x, y, category, this.worldData);
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

        // NEW: Render Ground PRIOR to objects
        this.renderProceduralGround(chunk, x, y);

        // --- Render Stored Objects ---
        const data = this.worldData.get(key);
        if (data) {
            // Delegate object rendering
            this.objectSystem.renderChunkObjects(chunk, data, x, y);

            if (data.zones) {
                this.zoneSystem.renderZoneOverlay(chunk, data.zones);
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



    public refreshZones(): void {
        this.loadedChunks.forEach((chunk, key) => {
            const data = this.worldData.get(key);
            if (data && data.zones) {
                this.zoneSystem.renderZoneOverlay(chunk, data.zones);
            }
        });
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
