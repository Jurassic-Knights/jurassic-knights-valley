import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { GroundPalette } from '@data/ZonePalette';
import { ZoneCategory } from '@data/ZoneConfig';
import { GroundBlendRenderer } from '@core/rendering/GroundBlendRenderer';
import { applyPaintOps, applyRestoreSplat } from './GroundSystemSplat';
import { resolvePaletteId } from './GroundSystemPalette';
import { getAssetData, preloadPaletteAssets, AssetCaches } from './GroundSystemAssets';
import { computeTileTexture } from './GroundSystemTileTexture';

/**
 * GroundSystem — Ground rendering for map editor chunks.
 * Manages tile textures, splat painting, caching, and procedural ground blending.
 */
export class GroundSystem {
    private renderer: GroundBlendRenderer;
    private spriteCache: Map<string, PIXI.Sprite[][]> = new Map();
    private caches: AssetCaches = {
        dataCache: new Map(),
        textureCache: {}
    };

    constructor() {
        this.renderer = new GroundBlendRenderer();
    }

    public clearCache() {
        this.spriteCache.clear();
        this.caches.dataCache.clear();
        this.caches.textureCache = {};
    }

    public async renderChunk(
        chunkContainer: PIXI.Container,
        data: ChunkData,
        chunkX: number,
        chunkY: number,
        worldData?: Map<string, ChunkData>
    ) {
        const chunkKey = data.id;

        const existing = chunkContainer.getChildByLabel('ground_layer');
        if (existing) existing.destroy({ children: true });

        const groundLayer = new PIXI.Container();
        groundLayer.label = 'ground_layer';
        groundLayer.zIndex = 0;
        chunkContainer.addChildAt(groundLayer, 0);

        const { CHUNK_SIZE, SPLAT_RES } = MapEditorConfig;
        const splatData = data.splatMap
            ? new Uint8ClampedArray(data.splatMap)
            : new Uint8ClampedArray(SPLAT_RES * SPLAT_RES);

        const uniquePaletteIds = new Set<string>();
        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const tileKey = `${lx},${ly}`;
                const zoneMap = (data.zones && data.zones[tileKey]) || {};
                const biome = zoneMap[ZoneCategory.BIOME];
                const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
                const pid = resolvePaletteId(
                    biome,
                    modifier,
                    worldData ? { chunkKey, lx, ly, data, worldData } : undefined
                );
                if (pid) uniquePaletteIds.add(pid);
            }
        }

        const preloadedAssets = await preloadPaletteAssets(uniquePaletteIds);

        for (let ly = 0; ly < CHUNK_SIZE; ly++) {
            for (let lx = 0; lx < CHUNK_SIZE; lx++) {
                const tileKey = `${lx},${ly}`;
                const zoneMap = (data.zones && data.zones[tileKey]) || {};
                const biome = zoneMap[ZoneCategory.BIOME];
                const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
                const pid = resolvePaletteId(
                    biome,
                    modifier,
                    worldData ? { chunkKey, lx, ly, data, worldData } : undefined
                );

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

    public async updateTile(
        chunkKey: string,
        lx: number,
        ly: number,
        data: ChunkData,
        groundLayer: PIXI.Container,
        resolvedPaletteId: string | null = null,
        splatDataOverride?: Uint8ClampedArray,
        preloadedAssets?: unknown,
        worldData?: Map<string, ChunkData>
    ) {
        const { TILE_SIZE, CHUNK_SIZE, SPLAT_RES } = MapEditorConfig;

        if (!resolvedPaletteId) {
            const tileKey = `${lx},${ly}`;
            const zoneMap = (data.zones && data.zones[tileKey]) || {};
            const biome = zoneMap[ZoneCategory.BIOME];
            const modifier = zoneMap['terrain'] || zoneMap[ZoneCategory.CIVILIZATION] || null;
            resolvedPaletteId = resolvePaletteId(
                biome,
                modifier,
                worldData ? { chunkKey, lx, ly, data, worldData } : undefined
            );
        }

        if (!resolvedPaletteId) {
            const sprite = this.getCachedSprite(chunkKey, lx, ly);
            if (sprite) {
                sprite.destroy();
                if (this.spriteCache.has(chunkKey)) {
                    this.spriteCache.get(chunkKey)![lx][ly] = null;
                }
            }
            return;
        }

        const palette = GroundPalette[resolvedPaletteId] || GroundPalette['default'];
        const splatData =
            splatDataOverride ??
            (data.splatMap
                ? new Uint8ClampedArray(data.splatMap)
                : new Uint8ClampedArray(SPLAT_RES * SPLAT_RES));

        const loadAsset = (id: string, isHeightMap?: boolean) =>
            getAssetData(id, !!isHeightMap, this.caches);

        const texture = await computeTileTexture(
            chunkKey,
            lx,
            ly,
            data,
            splatData,
            worldData,
            preloadedAssets as Parameters<typeof computeTileTexture>[6],
            loadAsset,
            palette,
            this.caches.textureCache,
            this.renderer
        );

        let sprite = this.getCachedSprite(chunkKey, lx, ly);
        if (sprite) {
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

    private getCachedSprite(chunkKey: string, lx: number, ly: number): PIXI.Sprite | null {
        if (!this.spriteCache.has(chunkKey)) return null;
        const c = this.spriteCache.get(chunkKey)!;
        if (!c[lx]) return null;
        return c[lx][ly];
    }

    private setCachedSprite(chunkKey: string, lx: number, ly: number, sprite: PIXI.Sprite) {
        if (!this.spriteCache.has(chunkKey)) {
            const arr = Array(MapEditorConfig.CHUNK_SIZE)
                .fill(null)
                .map(() => Array(MapEditorConfig.CHUNK_SIZE).fill(null));
            this.spriteCache.set(chunkKey, arr);
        }
        this.spriteCache.get(chunkKey)![lx][ly] = sprite;
    }

    public async paintSplatBatch(
        ops: { x: number; y: number; radius: number; intensity: number }[],
        soft: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): Promise<{ chunkKey: string; idx: number; oldVal: number; newVal: number }[]> {
        if (ops.length === 0) return [];
        const { changeMap, dirtyTiles } = applyPaintOps(ops, soft, worldData);
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

    public async paintSplat(
        worldX: number,
        worldY: number,
        radius: number,
        intensity: number,
        soft: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): Promise<{ chunkKey: string; idx: number; oldVal: number; newVal: number }[]> {
        const { changeMap, dirtyTiles } = applyPaintOps(
            [{ x: worldX, y: worldY, radius, intensity }],
            soft,
            worldData
        );
        const changes = Array.from(changeMap.values());

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
        return changes;
    }

    public async restoreSplatData(
        changesByChunk: Map<string, { idx: number; oldVal: number; newVal: number }[]>,
        undo: boolean,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ) {
        const dirtyTiles = applyRestoreSplat(changesByChunk, undo, worldData);

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
    }
}
