import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { GroundPalette } from '@data/ZonePalette';
import { ZoneCategory } from '@data/ZoneConfig';
import { GroundBlendRenderer, BlendAssets } from '@core/rendering/GroundBlendRenderer';

/** Sample splat weight; reads from neighbor chunk when at boundaries. Returns 0 when out of bounds and neighbor missing (no fallback). */
function getSplatWeight(
    chunkKey: string,
    sampleX: number,
    sampleY: number,
    data: ChunkData,
    worldData?: Map<string, ChunkData>
): number {
    const { CHUNK_SIZE } = MapEditorConfig;
    const SPLAT_RES = CHUNK_SIZE * 4;

    if (sampleX >= 0 && sampleX < SPLAT_RES && sampleY >= 0 && sampleY < SPLAT_RES) {
        const idx = sampleY * SPLAT_RES + sampleX;
        const arr = data.splatMap;
        return (arr && idx < arr.length ? arr[idx] : 0) ?? 0;
    }
    if (!worldData) return 0;

    const [cx, cy] = chunkKey.split(',').map(Number);
    const nCx = cx + Math.floor(sampleX / SPLAT_RES);
    const nCy = cy + Math.floor(sampleY / SPLAT_RES);
    const nKey = `${nCx},${nCy}`;
    const nData = worldData.get(nKey);

    if (nData?.splatMap && nData.splatMap.length > 0) {
        const nLx = ((sampleX % SPLAT_RES) + SPLAT_RES) % SPLAT_RES;
        const nLy = ((sampleY % SPLAT_RES) + SPLAT_RES) % SPLAT_RES;
        const idx = nLy * SPLAT_RES + nLx;
        if (idx < nData.splatMap!.length) return nData.splatMap![idx];
    }

    return 0;
}

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
    private async getAssetData(
        id: string,
        isHeightMap: boolean = false
    ): Promise<Uint8ClampedArray | null> {
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
     * Resolves the Palette ID from biome and modifier. Weight alone drives the visual (3-layer blend);
     * no neighbor-aware or terrain-specific overrides (terrain_coast, terrain_water, etc.).
     */
    private resolvePaletteId(
        biomeId: string | undefined,
        modifierId: string | null,
        _ctx?: {
            chunkKey: string;
            lx: number;
            ly: number;
            data: ChunkData;
            worldData: Map<string, ChunkData>;
        }
    ): string | null {
        if (!biomeId) return null;

        const normalizedBiome = GroundPalette[biomeId]
            ? biomeId
            : biomeId.startsWith('biome_')
              ? biomeId
              : `biome_${biomeId}`;

        if (!modifierId) return normalizedBiome;
        const compositeId = `${normalizedBiome}_${modifierId}`;
        return GroundPalette[compositeId] ? compositeId : normalizedBiome;
    }

    /**
     * Render the ground for a specific chunk
     * @param worldData Optional - when provided, enables cross-chunk splat sampling for seamless boundaries
     */
    public async renderChunk(
        chunkContainer: PIXI.Container,
        data: ChunkData,
        chunkX: number,
        chunkY: number,
        worldData?: Map<string, ChunkData>
    ) {
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

        const splatData = data.splatMap
            ? new Uint8ClampedArray(data.splatMap)
            : new Uint8ClampedArray(SPLAT_RES * SPLAT_RES);

        // 3. Render Loop
        // Pre-Load Assets (Batching) - include neighbor-aware palettes for boundary blending
        const uniquePaletteIds = new Set<string>();
        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const tileKey = `${lx},${ly}`;
                const zoneMap = (data.zones && data.zones[tileKey]) || {};
                const biome = zoneMap[ZoneCategory.BIOME];
                const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
                const pid = this.resolvePaletteId(
                    biome,
                    modifier,
                    worldData ? { chunkKey, lx, ly, data, worldData } : undefined
                );
                if (pid) uniquePaletteIds.add(pid);
            }
        }

        if (uniquePaletteIds.size === 0) {
            // Nothing to render in this chunk (fully void?)
            // We can return early? No, we might need to clear existing tiles.
            // But if we clear existing container at step 1, we are good.
        }

        const preloadedAssets = new Map<string, unknown>();
        await Promise.all(
            Array.from(uniquePaletteIds).map(async (pid) => {
                const palette = GroundPalette[pid] || GroundPalette['default'];
                const [b, m, o, n, h] = await Promise.all([
                    AssetLoader.preloadImage(palette.baseId, false),
                    AssetLoader.preloadImage(palette.midId, false),
                    AssetLoader.preloadImage(palette.overlayId, false),
                    AssetLoader.preloadImage(palette.noiseId, false),
                    this.loadImage(AssetLoader.getHeightMapPath(palette.baseId))
                ]);

                if (b) {
                    if (!m || !o || !n || !h) {
                        Logger.warn(
                            `[GroundSystem] Missing aux assets for ${pid}. b:${!!b} m:${!!m} o:${!!o} n:${!!n} h:${!!h}`
                        );
                    }

                    const safeM = m || b;
                    const safeO = o || b;
                    const safeN = n || b;
                    const safeH = h || b;

                    const assetData = {
                        base: GroundBlendRenderer.extractData(b),
                        mid: GroundBlendRenderer.extractData(safeM),
                        overlay: GroundBlendRenderer.extractData(safeO),
                        noise: GroundBlendRenderer.extractData(safeN),
                        heightMap: GroundBlendRenderer.extractData(safeH),
                        width: b.width,
                        height: b.height,
                        baseWidth: b.width,
                        midWidth: safeM.width,
                        overlayWidth: safeO.width,
                        noiseWidth: safeN.width,
                        heightWidth: safeH.width,
                        baseTexture: PIXI.Texture.from(b),
                        palette
                    };
                    preloadedAssets.set(pid, assetData);
                } else {
                    Logger.error(
                        `[GroundSystem] Failed to load BASE texture for ${pid} (${palette.baseId})`
                    );
                }
            })
        );

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const tileKey = `${lx},${ly}`;
                const zoneMap = (data.zones && data.zones[tileKey]) || {};

                const biome = zoneMap[ZoneCategory.BIOME];
                const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
                const pid = this.resolvePaletteId(
                    biome,
                    modifier,
                    worldData ? { chunkKey, lx, ly, data, worldData } : undefined
                );

                // Render Tile
                // Only render if we have a valid palette ID (Meaning we have a biome)
                if (pid) {
                    const assets = preloadedAssets.get(pid);
                    if (assets) {
                        await this.updateTile(
                            chunkKey,
                            lx,
                            ly,
                            data,
                            groundLayer,
                            pid,
                            splatData,
                            assets,
                            worldData
                        );
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
        preloadedAssets?: Map<string, unknown>,
        worldData?: Map<string, ChunkData>
    ) {
        const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
        const SPLAT_RES = CHUNK_SIZE * 4;

        if (!resolvedPaletteId) {
            const tileKey = `${lx},${ly}`;
            const zoneMap = (data.zones && data.zones[tileKey]) || {};
            const biome = zoneMap[ZoneCategory.BIOME];
            const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
            resolvedPaletteId = this.resolvePaletteId(
                biome,
                modifier,
                worldData ? { chunkKey, lx, ly, data, worldData } : undefined
            );
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
        let base, mid, overlay, noise, baseH, palette;

        if (!GroundPalette[resolvedPaletteId]) {
            resolvedPaletteId = 'default';
        }

        if (preloadedAssets) {
            base = preloadedAssets.base;
            mid = preloadedAssets.mid;
            overlay = preloadedAssets.overlay;
            noise = preloadedAssets.noise;
            baseH = preloadedAssets.heightMap;
            palette = preloadedAssets.palette;
        } else {
            palette = GroundPalette[resolvedPaletteId];
            [base, mid, overlay, noise, baseH] = await Promise.all([
                this.getAssetData(palette.baseId),
                this.getAssetData(palette.midId),
                this.getAssetData(palette.overlayId),
                this.getAssetData(palette.noiseId),
                this.getAssetData(palette.baseId, true)
            ]);
        }

        // Fix: Ensure we have valid images
        if (!base) {
            return;
        }

        // 6x6 weight grid (positions -1..4) for symmetric blending at tile edges
        const splatData =
            splatDataOverride ??
            (data.splatMap
                ? new Uint8ClampedArray(data.splatMap)
                : new Uint8ClampedArray(SPLAT_RES * SPLAT_RES));

        let maxWeight = 0;
        const weights = new Uint8ClampedArray(36); // 6x6

        for (let sy = 0; sy < 6; sy++) {
            for (let sx = 0; sx < 6; sx++) {
                const sampleX = lx * 4 + sx - 1;
                const sampleY = ly * 4 + sy - 1;

                const w = worldData
                    ? getSplatWeight(chunkKey, sampleX, sampleY, data, worldData)
                    : (() => {
                          const clampedX = Math.max(0, Math.min(SPLAT_RES - 1, sampleX));
                          const clampedY = Math.max(0, Math.min(SPLAT_RES - 1, sampleY));
                          const idx = clampedY * SPLAT_RES + clampedX;
                          return idx < splatData.length ? splatData[idx] : 0;
                      })();

                weights[sy * 6 + sx] = w;
                if (w > maxWeight) maxWeight = w;
            }
        }

        let texture: PIXI.Texture;

        // Fast path: no blend needed — use cached base texture directly
        if (maxWeight === 0) {
            if (preloadedAssets && preloadedAssets.baseTexture) {
                texture = preloadedAssets.baseTexture;
            } else {
                texture = this.textureCache[palette.baseId] || PIXI.Texture.WHITE;
            }
        } else {
            // Blend path: send to worker
            let texWidth = 32;
            let texHeight = 32;

            if (preloadedAssets) {
                texWidth = preloadedAssets.width;
                texHeight = preloadedAssets.height;
            } else {
                const img = AssetLoader.getImage(palette!.baseId);
                if (img) {
                    texWidth = img.width;
                    texHeight = img.height;
                }
            }

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
                mid: mid as Uint8ClampedArray,
                overlay: overlay as Uint8ClampedArray,
                noise: noise as Uint8ClampedArray,
                heightMap: baseH as Uint8ClampedArray,
                width: texWidth,
                height: texHeight
            };

            const [cx, cy] = chunkKey.split(',').map(Number);
            const globalTx = cx * CHUNK_SIZE + lx;
            const globalTy = cy * CHUNK_SIZE + ly;

            const bitmap = await this.renderer.generateTile(weights, assets, {
                thresholdBias: 0.5,
                noiseScale: 0.2,
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
            const arr = Array(MapEditorConfig.CHUNK_SIZE)
                .fill(null)
                .map(() => Array(MapEditorConfig.CHUNK_SIZE).fill(null));
            this.spriteCache.set(chunkKey, arr);
        }
        this.spriteCache.get(chunkKey)![lx][ly] = sprite;
    }

    /**
     * Batch paint multiple splats in one pass. Avoids race conditions and repeated iteration.
     */
    public async paintSplatBatch(
        ops: { x: number; y: number; radius: number; intensity: number }[],
        soft: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): Promise<{ chunkKey: string; idx: number; oldVal: number; newVal: number }[]> {
        if (ops.length === 0) return [];
        const changeMap = new Map<
            string,
            { chunkKey: string; idx: number; oldVal: number; newVal: number }
        >();
        const dirtyTiles = new Map<string, Set<string>>();
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const SPLAT_CELL_SIZE = TILE_SIZE / 4;
        const SPLATS_PER_CHUNK = CHUNK_SIZE * 4;

        for (const op of ops) {
            const centerSplatX = Math.floor(op.x / SPLAT_CELL_SIZE);
            const centerSplatY = Math.floor(op.y / SPLAT_CELL_SIZE);
            const rCeil = Math.ceil(op.radius);

            for (let dx = -rCeil; dx <= rCeil; dx++) {
                for (let dy = -rCeil; dy <= rCeil; dy++) {
                    const distSq = dx * dx + dy * dy;
                    if (distSq > op.radius * op.radius) continue;
                    let factor = 1;
                    if (soft && op.radius > 1.5) {
                        const dist = Math.sqrt(distSq);
                        factor = Math.max(0, 1 - dist / op.radius);
                        factor = factor * factor * (3 - 2 * factor);
                    }
                    const sx = centerSplatX + dx;
                    const sy = centerSplatY + dy;
                    const chunkX = Math.floor(sx / SPLATS_PER_CHUNK);
                    const chunkY = Math.floor(sy / SPLATS_PER_CHUNK);
                    const chunkKey = `${chunkX},${chunkY}`;

                    let data = worldData.get(chunkKey);
                    if (!data) {
                        data = {
                            id: chunkKey,
                            objects: [],
                            zones: {},
                            splatMap: Array.from(
                                new Uint8ClampedArray(SPLATS_PER_CHUNK * SPLATS_PER_CHUNK)
                            )
                        };
                        worldData.set(chunkKey, data);
                    }
                    if (!data.splatMap?.length) {
                        data.splatMap = Array.from(
                            new Uint8ClampedArray(SPLATS_PER_CHUNK * SPLATS_PER_CHUNK)
                        );
                    }
                    const localSx = ((sx % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                    const localSy = ((sy % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                    const idx = localSy * SPLATS_PER_CHUNK + localSx;
                    const cellKey = `${chunkKey}:${idx}`;
                    const val = data.splatMap[idx] || 0;
                    const newVal = Math.min(255, Math.max(0, val + op.intensity * factor));
                    if (Math.abs(val - newVal) > 0.5) {
                        const existing = changeMap.get(cellKey);
                        changeMap.set(cellKey, {
                            chunkKey,
                            idx,
                            oldVal: existing?.oldVal ?? val,
                            newVal
                        });
                        data.splatMap[idx] = newVal;
                        const tileX = Math.floor(localSx / 4);
                        const tileY = Math.floor(localSy / 4);
                        if (!dirtyTiles.has(chunkKey)) dirtyTiles.set(chunkKey, new Set());
                        dirtyTiles.get(chunkKey)!.add(`${tileX},${tileY}`);
                    }
                }
            }
        }
        const allChanges = Array.from(changeMap.values());

        const promises: Promise<void>[] = [];
        for (const [chunkKey, tiles] of dirtyTiles) {
            const chunk = loadedChunks.get(chunkKey);
            if (!chunk) continue;
            let groundLayer = chunk.getChildByLabel('ground_layer') as PIXI.Container;
            if (!groundLayer) {
                groundLayer = new PIXI.Container();
                groundLayer.label = 'ground_layer';
                chunk.addChildAt(groundLayer, 0);
            }
            const data = worldData.get(chunkKey)!;
            for (const tKey of tiles) {
                const [lx, ly] = tKey.split(',').map(Number);
                promises.push(
                    this.updateTile(
                        chunkKey,
                        lx,
                        ly,
                        data,
                        groundLayer,
                        undefined,
                        undefined,
                        undefined,
                        worldData
                    )
                );
            }
        }
        await Promise.all(promises);
        return allChanges;
    }

    /**
     * Paint onto the Splat Map (single op; use paintSplatBatch for multiple)
     */
    public async paintSplat(
        worldX: number,
        worldY: number,
        radius: number,
        intensity: number,
        soft: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): Promise<{ chunkKey: string; idx: number; oldVal: number; newVal: number }[]> {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        // Resolution: 4 splats per tile (8px per splat)
        const SPLAT_CELL_SIZE = TILE_SIZE / 4;
        const SPLATS_PER_CHUNK = CHUNK_SIZE * 4;

        const centerSplatX = Math.floor(worldX / SPLAT_CELL_SIZE);
        const centerSplatY = Math.floor(worldY / SPLAT_CELL_SIZE);
        const dirtyTiles = new Map<string, Set<string>>();
        const changes: { chunkKey: string; idx: number; oldVal: number; newVal: number }[] = [];

        const rCeil = Math.ceil(radius);
        for (let x = -rCeil; x <= rCeil; x++) {
            for (let y = -rCeil; y <= rCeil; y++) {
                const distSq = x * x + y * y;
                if (distSq > radius * radius) continue;

                let factor = 1.0;
                if (soft && radius > 1.5) {
                    const dist = Math.sqrt(distSq);
                    factor = Math.max(0, 1 - dist / radius);
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
                const idx = localSy * SPLATS_PER_CHUNK + localSx;

                const val = data.splatMap[idx] || 0;
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

                tiles.forEach((tKey) => {
                    const [lx, ly] = tKey.split(',').map(Number);
                    const data = worldData.get(chunkKey)!;
                    promises.push(
                        this.updateTile(
                            chunkKey,
                            lx,
                            ly,
                            data,
                            groundLayer,
                            undefined,
                            undefined,
                            undefined,
                            worldData
                        )
                    );
                });
            }
        }
        await Promise.all(promises);

        return changes;
    }

    public async restoreSplatData(
        changesByChunk: Map<string, { idx: number; oldVal: number; newVal: number }[]>,
        undo: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ) {
        const dirtyTiles = new Map<string, Set<string>>();
        const SPLATS_PER_CHUNK = MapEditorConfig.CHUNK_SIZE * 4;

        for (const [chunkKey, changes] of changesByChunk) {
            const data = worldData.get(chunkKey);
            if (!data || !data.splatMap) continue;

            changes.forEach((c) => {
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

                tiles.forEach((tKey) => {
                    const [lx, ly] = tKey.split(',').map(Number);
                    const data = worldData.get(chunkKey)!;
                    promises.push(
                        this.updateTile(
                            chunkKey,
                            lx,
                            ly,
                            data,
                            groundLayer,
                            undefined,
                            undefined,
                            undefined,
                            worldData
                        )
                    );
                });
            }
        }
        await Promise.all(promises);
    }
}
