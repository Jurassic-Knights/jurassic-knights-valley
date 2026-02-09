
import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { GroundPalette } from '@data/ZonePalette';
import { ZoneCategory } from '@data/ZoneConfig';
import { GroundBlendRenderer, BlendAssets } from '@core/rendering/GroundBlendRenderer';

export class GroundSystem {
    private renderer: GroundBlendRenderer;
    private spriteCache: Map<string, PIXI.Sprite[][]> = new Map();
    private textureCache: Record<string, PIXI.Texture> = {};
    private dataCache: Map<string, Uint8ClampedArray> = new Map();

    constructor() {
        this.renderer = new GroundBlendRenderer();
    }

    /**
     * Clear all caches (e.g. on map reload)
     */
    public clearCache() {
        this.spriteCache.clear();
        this.textureCache = {};
    }

    /**
     * Helper to get or cache raw image data
     */
    private async getAssetData(id: string, isHeightMap: boolean = false): Promise<Uint8ClampedArray | null> {
        const cacheKey = isHeightMap ? id + '_height' : id;
        if (this.dataCache.has(cacheKey)) return this.dataCache.get(cacheKey)!;

        let data: Uint8ClampedArray | null = null;

        if (isHeightMap) {
            const path = AssetLoader.getHeightMapPath(id);
            if (path) {
                const img = await this.loadImage(path);
                if (img) data = GroundBlendRenderer.extractData(img);
            }
        } else {
            const path = AssetLoader.getImagePath(id);
            // Logger.warn(`[GroundSystem] Loading ${id} from ${path}`);
            const img = await AssetLoader.preloadImage(id, false);
            if (img) {
                data = GroundBlendRenderer.extractData(img);
                // Cache PIXI Texture for Fast Path usage
                if (!this.textureCache[id]) {
                    this.textureCache[id] = PIXI.Texture.from(img);
                }
            } else {
                Logger.error(`[GroundSystem] Failed to load ${id}. Path resolved to: ${path}`);
                // Create Magenta Fallback (32x32)
                const size = 32;
                data = new Uint8ClampedArray(size * size * 4);
                const c = document.createElement('canvas');
                c.width = size;
                c.height = size;
                const ctx = c.getContext('2d')!;
                ctx.fillStyle = '#ff00ff';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, size / 2, size / 2);
                ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
                data = ctx.getImageData(0, 0, size, size).data;

                // Cache Fallback Texture
                if (!this.textureCache[id]) {
                    this.textureCache[id] = PIXI.Texture.from(c);
                }
            }
        }

        if (data) {
            this.dataCache.set(cacheKey, data);
        }

        return data;
    }

    /**
     * Render the ground for a specific chunk
     */
    /**
     * Resolves the Palette ID based on Biome Context and Zone Modifiers
     */
    private resolvePaletteId(biomeId: string | undefined, modifierId: string | null): string | null {
        if (!biomeId) return null; // No Biome = No Render

        if (!modifierId) return biomeId; // Just the biome

        const compositeId = `${biomeId}_${modifierId}`;
        if (GroundPalette[compositeId]) return compositeId;

        // Strict Mode: Do NOT fallback to modifierId alone.
        // Terrain zones are data-only unless the Biome explicitly supports a visual override.
        return biomeId;
    }

    /**
     * Render the ground for a specific chunk
     */
    public async renderChunk(chunkContainer: PIXI.Container, data: ChunkData, chunkX: number, chunkY: number) {
        const chunkKey = data.id;

        // 1. Clear Existing
        const existing = chunkContainer.getChildByLabel('ground_layer');
        if (existing) {
            existing.destroy({ children: true });
        }

        const groundLayer = new PIXI.Container();
        groundLayer.label = 'ground_layer';
        groundLayer.zIndex = 0;
        chunkContainer.addChildAt(groundLayer, 0);

        // 2. Prepare Data
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const SPLAT_RES = CHUNK_SIZE * 4;

        let splatData = data.splatMap ? new Uint8ClampedArray(data.splatMap) : new Uint8ClampedArray(SPLAT_RES * SPLAT_RES);

        // 3. Render Loop
        // Pre-Load Assets (Batching)
        const uniquePaletteIds = new Set<string>();

        // Identify all unique resolved palette IDs needed for this chunk
        for (const zoneMap of Object.values(data.zones || {})) {
            const biome = zoneMap[ZoneCategory.BIOME];
            const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
            const pid = this.resolvePaletteId(biome, modifier);
            if (pid) uniquePaletteIds.add(pid);
        }

        if (uniquePaletteIds.size === 0) {
            // Nothing to render in this chunk (fully void?)
            // We can return early? No, we might need to clear existing tiles.
            // But if we clear existing container at step 1, we are good.
        }

        const preloadedAssets = new Map<string, unknown>();
        await Promise.all(Array.from(uniquePaletteIds).map(async (pid) => {
            const palette = GroundPalette[pid] || GroundPalette['default'];
            const [b, o, n, h] = await Promise.all([
                AssetLoader.preloadImage(palette.baseId, false),
                AssetLoader.preloadImage(palette.overlayId, false),
                AssetLoader.preloadImage(palette.noiseId, false),
                this.loadImage(AssetLoader.getHeightMapPath(palette.baseId))
            ]);

            if (b) {
                if (!o || !n || !h) {
                    Logger.warn(`[GroundSystem] Missing aux assets for ${pid}. b:${!!b} o:${!!o} n:${!!n} h:${!!h}`);
                }

                const safeO = o || b;
                const safeN = n || b;
                const safeH = h || b;

                const assetData = {
                    base: GroundBlendRenderer.extractData(b),
                    overlay: GroundBlendRenderer.extractData(safeO),
                    noise: GroundBlendRenderer.extractData(safeN),
                    heightMap: GroundBlendRenderer.extractData(safeH),
                    width: b.width,
                    height: b.height,
                    baseWidth: b.width, // Multi-Resolution Support
                    overlayWidth: safeO.width,
                    noiseWidth: safeN.width,
                    heightWidth: safeH.width,
                    baseTexture: PIXI.Texture.from(b), // Cache Texture for Fast Path
                    palette
                };
                preloadedAssets.set(pid, assetData);
            } else {
                Logger.error(`[GroundSystem] Failed to load BASE texture for ${pid} (${palette.baseId})`);
            }
        }));

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const tileKey = `${lx},${ly}`;
                const zoneMap = (data.zones && data.zones[tileKey]) || {};

                // Determine Resolved Palette ID
                const biome = zoneMap[ZoneCategory.BIOME];
                const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
                const pid = this.resolvePaletteId(biome, modifier);

                // Render Tile
                // Only render if we have a valid palette ID (Meaning we have a biome)
                if (pid) {
                    const assets = preloadedAssets.get(pid);
                    if (assets) {
                        await this.updateTile(chunkKey, lx, ly, data, groundLayer, pid, splatData, assets);
                    }
                }
            }
        }
    }

    /**
     * Updates a single Ground Tile
     * Used by both initial render and brush updates
     */
    public async updateTile(
        chunkKey: string,
        lx: number,
        ly: number,
        data: ChunkData,
        groundLayer: PIXI.Container,
        resolvedPaletteId: string | null = null,
        splatDataOverride?: Uint8ClampedArray,
        preloadedAssets?: Map<string, unknown>
    ) {
        const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
        const SPLAT_RES = CHUNK_SIZE * 4;

        // Resolve Palette ID if not provided
        if (!resolvedPaletteId) {
            const tileKey = `${lx},${ly}`;
            const zoneMap = (data.zones && data.zones[tileKey]) || {};
            const biome = zoneMap[ZoneCategory.BIOME];
            const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
            resolvedPaletteId = this.resolvePaletteId(biome, modifier);
        }

        // If still no ID (because no biome), ensure we clear any existing sprite and return
        if (!resolvedPaletteId) {
            const sprite = this.getCachedSprite(chunkKey, lx, ly);
            if (sprite) {
                sprite.destroy();
                // clear cache
                if (this.spriteCache.has(chunkKey)) {
                    this.spriteCache.get(chunkKey)![lx][ly] = null;
                    // TODO: Fix typing or splice? just setting to null/undefined ok inside our own cache manager
                }
            }
            return;
        }

        // Use Preloaded or Load on Demand
        let base, overlay, noise, baseH, palette;

        // Safe check for missing palette
        if (!GroundPalette[resolvedPaletteId]) {
            resolvedPaletteId = 'default';
        }

        if (preloadedAssets) {
            base = preloadedAssets.base;
            overlay = preloadedAssets.overlay;
            noise = preloadedAssets.noise;
            baseH = preloadedAssets.heightMap;
            palette = preloadedAssets.palette; // Should match resolvedPaletteId lookup
        } else {
            // Fallback for independent calls (e.g. Paint Brush)
            palette = GroundPalette[resolvedPaletteId];

            // Use caching helper for instant access during painting
            [base, overlay, noise, baseH] = await Promise.all([
                this.getAssetData(palette.baseId),
                this.getAssetData(palette.overlayId),
                this.getAssetData(palette.noiseId),
                this.getAssetData(palette.baseId, true)
            ]);
        }

        // Fix: Ensure we have valid images
        if (!base) {
            return;
        }

        // Get Weights (5x5 for Seamless Interpolation)
        const splatData = splatDataOverride || (data.splatMap ? new Uint8ClampedArray(data.splatMap) : new Uint8ClampedArray(SPLAT_RES * SPLAT_RES));

        let maxWeight = 0;
        const weights = new Uint8ClampedArray(25); // 5x5

        // We need points 0,1,2,3,4 relative to local tile.
        // Point 4 is the first point of the neighbor tile.
        // If we simply read index 4, it works unless we are at the right edge of the chunk.

        for (let sy = 0; sy < 5; sy++) {
            for (let sx = 0; sx < 5; sx++) {

                // Determine source coordinate in SplatMap Resolution
                // Local Tile Offset (lx * 4) + sub-offset (sx)
                let sampleX = (lx * 4) + sx;
                let sampleY = (ly * 4) + sy;

                // Clamp to Edge of Chunk Splat Map (SPLAT_RES - 1)
                // Ideally we would fetch neighbor chunk, but clamping prevents crash
                // and is acceptable for chunk boundaries v1
                if (sampleX >= SPLAT_RES) sampleX = SPLAT_RES - 1;
                if (sampleY >= SPLAT_RES) sampleY = SPLAT_RES - 1;

                const idx = (sampleY * SPLAT_RES) + sampleX;

                // Safety
                let w = 0;
                if (idx < splatData.length) {
                    w = splatData[idx];
                }

                weights[(sy * 5) + sx] = w;
                if (w > maxWeight) maxWeight = w;
            }
        }

        let texture: PIXI.Texture;

        // Optimization: Fast Path for weight 0
        if (maxWeight === 0) {
            // Optimization: Use Cached Texture directly
            if (preloadedAssets && preloadedAssets.baseTexture) {
                texture = preloadedAssets.baseTexture;
            } else {
                if (!this.textureCache[palette.baseId]) {
                    // Cache check handled in getAssetData
                }
                texture = this.textureCache[palette.baseId] || PIXI.Texture.WHITE;
            }
        } else {
            // Determine dimensions
            let texWidth = 32;
            let texHeight = 32;

            if (preloadedAssets) {
                texWidth = preloadedAssets.width;
                texHeight = preloadedAssets.height;
            } else {
                // If dynamic update, check the cache for the source image
                const img = AssetLoader.getImage(palette!.baseId);
                if (img) {
                    texWidth = img.width;
                    texHeight = img.height;
                }
            }

            // CRITICAL FIX: Verify dimensions match buffer size
            if (base && base.length > 0) {
                const expectedPixels = base.length / 4;
                const currentPixels = texWidth * texHeight;

                if (currentPixels !== expectedPixels) {
                    const side = Math.sqrt(expectedPixels);
                    if (Number.isInteger(side)) {
                        texWidth = side;
                        texHeight = side;
                    }
                }
            }

            const assets: BlendAssets = {
                base: base as Uint8ClampedArray,
                overlay: overlay as Uint8ClampedArray,
                noise: noise as Uint8ClampedArray,
                heightMap: baseH as Uint8ClampedArray,
                width: texWidth,
                height: texHeight
            };

            // Get Global Tile Coords
            const [cx, cy] = chunkKey.split(',').map(Number);
            const globalTx = cx * CHUNK_SIZE + lx;
            const globalTy = cy * CHUNK_SIZE + ly;

            const bitmap = await this.renderer.generateTile(weights, assets, {
                thresholdBias: 0.5,
                noiseScale: 0.2, // Subtle noise
                tileX: globalTx,
                tileY: globalTy
            });
            texture = PIXI.Texture.from(bitmap);
            (texture as { _isGenerated?: boolean })._isGenerated = true;
        }

        // Place Sprite
        // Check cache first
        let sprite = this.getCachedSprite(chunkKey, lx, ly);

        if (sprite) {
            // Destroy old texture if it was a generated unique texture
            // CAREFUL: Only destroy if it was a generated unique texture
            if (sprite.texture && (sprite.texture as { _isGenerated?: boolean })._isGenerated) {
                sprite.texture.destroy(true);
            }
            sprite.texture = texture;
        } else {
            sprite = new PIXI.Sprite(texture);
            sprite.x = lx * TILE_SIZE;
            sprite.y = ly * TILE_SIZE;
            sprite.width = TILE_SIZE;
            sprite.height = TILE_SIZE;
            groundLayer.addChild(sprite);
            this.setCachedSprite(chunkKey, lx, ly, sprite);
        }
    }

    // --- Helpers ---

    private async loadImage(path: string | null): Promise<HTMLImageElement | null> {
        if (!path) return null;
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = path;
        });
    }

    private getCachedSprite(chunkKey: string, lx: number, ly: number): PIXI.Sprite | null {
        if (!this.spriteCache.has(chunkKey)) return null;
        const c = this.spriteCache.get(chunkKey)!;
        if (!c[lx]) return null;
        return c[lx][ly];
    }

    private setCachedSprite(chunkKey: string, lx: number, ly: number, sprite: PIXI.Sprite) {
        if (!this.spriteCache.has(chunkKey)) {
            // Init 32x32 array
            const arr = Array(MapEditorConfig.CHUNK_SIZE).fill(null).map(() => Array(MapEditorConfig.CHUNK_SIZE).fill(null));
            this.spriteCache.set(chunkKey, arr);
        }
        this.spriteCache.get(chunkKey)![lx][ly] = sprite;
    }

    /**
     * Paint onto the Splat Map
     */
    public async paintSplat(
        worldX: number,
        worldY: number,
        radius: number,
        intensity: number,
        soft: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): Promise<{ chunkKey: string, idx: number, oldVal: number, newVal: number }[]> {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        // Resolution: 4 splats per tile (8px per splat)
        const SPLAT_CELL_SIZE = TILE_SIZE / 4;
        const SPLATS_PER_CHUNK = CHUNK_SIZE * 4;

        const centerSplatX = Math.floor(worldX / SPLAT_CELL_SIZE);
        const centerSplatY = Math.floor(worldY / SPLAT_CELL_SIZE);
        const dirtyTiles = new Map<string, Set<string>>();
        const changes: { chunkKey: string, idx: number, oldVal: number, newVal: number }[] = [];

        const rCeil = Math.ceil(radius);
        for (let x = -rCeil; x <= rCeil; x++) {
            for (let y = -rCeil; y <= rCeil; y++) {
                const distSq = x * x + y * y;
                if (distSq > radius * radius) continue;

                let factor = 1.0;
                if (soft && radius > 1.5) {
                    const dist = Math.sqrt(distSq);
                    factor = Math.max(0, 1 - (dist / radius));
                    factor = factor * factor * (3 - 2 * factor);
                }

                const sx = centerSplatX + x;
                const sy = centerSplatY + y;

                const chunkX = Math.floor(sx / SPLATS_PER_CHUNK);
                const chunkY = Math.floor(sy / SPLATS_PER_CHUNK);
                const chunkKey = `${chunkX},${chunkY}`;

                let data = worldData.get(chunkKey);
                if (!data) {
                    data = { id: chunkKey, objects: [], zones: {}, splatMap: [] };
                    worldData.set(chunkKey, data);
                    const SPLAT_RES = MapEditorConfig.CHUNK_SIZE * 4;
                    data.splatMap = Array.from(new Uint8ClampedArray(SPLAT_RES * SPLAT_RES));
                }
                if (!data.splatMap || data.splatMap.length === 0) {
                    const SPLAT_RES = MapEditorConfig.CHUNK_SIZE * 4;
                    data.splatMap = Array.from(new Uint8ClampedArray(SPLAT_RES * SPLAT_RES));
                }

                const localSx = ((sx % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                const localSy = ((sy % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                const idx = (localSy * SPLATS_PER_CHUNK) + localSx;

                let val = data.splatMap[idx] || 0;
                const delta = intensity * factor;
                const newVal = Math.min(255, Math.max(0, val + delta));

                if (Math.abs(val - newVal) > 0.5) {
                    changes.push({ chunkKey, idx, oldVal: val, newVal });

                    data.splatMap[idx] = newVal;
                    const tileX = Math.floor(localSx / 4);
                    const tileY = Math.floor(localSy / 4);
                    const tKey = `${tileX},${tileY}`;
                    if (!dirtyTiles.has(chunkKey)) dirtyTiles.set(chunkKey, new Set());
                    dirtyTiles.get(chunkKey)!.add(tKey);
                }
            }
        }

        const promises: Promise<void>[] = [];
        for (const [chunkKey, tiles] of dirtyTiles) {
            const chunk = loadedChunks.get(chunkKey);
            if (chunk) {
                // Ensure ground layer exists
                let groundLayer = chunk.getChildByLabel('ground_layer') as PIXI.Container;
                if (!groundLayer) {
                    groundLayer = new PIXI.Container();
                    groundLayer.label = 'ground_layer';
                    chunk.addChildAt(groundLayer, 0);
                }

                tiles.forEach(tKey => {
                    const [lx, ly] = tKey.split(',').map(Number);
                    const data = worldData.get(chunkKey)!;
                    promises.push(this.updateTile(chunkKey, lx, ly, data, groundLayer));
                });
            }
        }
        await Promise.all(promises);

        return changes;
    }

    public async restoreSplatData(
        changesByChunk: Map<string, { idx: number, oldVal: number, newVal: number }[]>,
        undo: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ) {
        const dirtyTiles = new Map<string, Set<string>>();
        const SPLATS_PER_CHUNK = MapEditorConfig.CHUNK_SIZE * 4;

        for (const [chunkKey, changes] of changesByChunk) {
            const data = worldData.get(chunkKey);
            if (!data || !data.splatMap) continue;

            changes.forEach(c => {
                // Apply Change
                const val = undo ? c.oldVal : c.newVal;
                data.splatMap![c.idx] = val;

                // Mark Dirty
                const localSy = Math.floor(c.idx / SPLATS_PER_CHUNK);
                const localSx = c.idx % SPLATS_PER_CHUNK;
                const tileX = Math.floor(localSx / 4);
                const tileY = Math.floor(localSy / 4);
                const tKey = `${tileX},${tileY}`;

                if (!dirtyTiles.has(chunkKey)) dirtyTiles.set(chunkKey, new Set());
                dirtyTiles.get(chunkKey)!.add(tKey);
            });
        }

        // Render Updates
        const promises: Promise<void>[] = [];
        for (const [chunkKey, tiles] of dirtyTiles) {
            const chunk = loadedChunks.get(chunkKey);
            if (chunk) {
                // Ensure ground layer exists
                let groundLayer = chunk.getChildByLabel('ground_layer') as PIXI.Container;
                // If undoing to empty, it might be gone? No, chunk exists.
                if (!groundLayer) {
                    // Should exist if we are undoing paint on it
                    groundLayer = new PIXI.Container();
                    groundLayer.label = 'ground_layer';
                    chunk.addChildAt(groundLayer, 0);
                }

                tiles.forEach(tKey => {
                    const [lx, ly] = tKey.split(',').map(Number);
                    const data = worldData.get(chunkKey)!;
                    promises.push(this.updateTile(chunkKey, lx, ly, data, groundLayer));
                });
            }
        }
        await Promise.all(promises);
    }
}
