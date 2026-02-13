import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';
import { GroundSystem } from './GroundSystem';
import { ProceduralArchitect } from './ProceduralArchitect';
import { EditorContext } from './EditorContext';
import { regenerateSplats } from './ZoneSystemSplatRegen';

export class ZoneSystem {
    private architect: ProceduralArchitect;

    constructor(private groundSystem: GroundSystem) {
        this.architect = new ProceduralArchitect();
    }

    /**
     * Sets a zone for a specific tile.
     */
    public setZone(
        x: number,
        y: number,
        category: string,
        zoneId: string | null,
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): void {
        this.setZones([{ x, y, category, zoneId }], worldData, loadedChunks);
    }

    public async setZones(
        rawUpdates: { x: number; y: number; category: string; zoneId: string | null }[],
        worldData: Map<string, ChunkData>,
        loadedChunks: Map<string, PIXI.Container>
    ): Promise<{ chunkKey: string; idx: number; oldVal: number; newVal: number }[]> {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunksToUpdate = new Set<string>();
        // Track dirty tiles for ground update: Map<ChunkKey, Set<tileKey "lx,ly">>
        const dirtyGroundTiles = new Map<string, Set<string>>();

        // 1. Process Updates (apply zone changes to worldData)
        rawUpdates.forEach((u) => {
            const chunkX = Math.floor(u.x / chunkSizePx);
            const chunkY = Math.floor(u.y / chunkSizePx);
            const chunkKey = `${chunkX},${chunkY}`;

            const localX = Math.floor((u.x - chunkX * chunkSizePx) / TILE_SIZE);
            const localY = Math.floor((u.y - chunkY * chunkSizePx) / TILE_SIZE);
            const tileKey = `${localX},${localY}`;

            let data = worldData.get(chunkKey);
            if (!data) {
                data = { id: chunkKey, objects: [], zones: {} };
                worldData.set(chunkKey, data);
            }
            if (!data.zones) data.zones = {};
            if (!data.zones[tileKey]) data.zones[tileKey] = {};

            // Optimization: Skip if value is same
            const currentZoneId = data.zones[tileKey][u.category];

            let changed = false;
            // Handle clearing specific category
            if (u.zoneId === null) {
                // Delete
                if (currentZoneId !== undefined) {
                    delete data.zones[tileKey][u.category];
                    changed = true;
                }
            } else {
                // Set/Update
                if (currentZoneId !== u.zoneId) {
                    data.zones[tileKey][u.category] = u.zoneId;
                    changed = true;
                }
            }

            if (changed) {
                chunksToUpdate.add(chunkKey);
                // If this is a ground-affecting category, mark for ground update
                if (
                    u.category === ZoneCategory.BIOME ||
                    u.category === ZoneCategory.CIVILIZATION ||
                    u.category === ZoneCategory.TERRAIN
                ) {
                    if (!dirtyGroundTiles.has(chunkKey)) dirtyGroundTiles.set(chunkKey, new Set());
                    // Mark Current
                    dirtyGroundTiles.get(chunkKey)!.add(`${localX},${localY}`);

                    // Mark Neighbors (3x3) to fix blending seams
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = localX + dx;
                            const ny = localY + dy;
                            // Note: This logic assumes neighbors are in SAME chunk.
                            // For cross-chunk, we need global-to-chunk conversion again.

                            // Simplified: Just re-calculate Global for neighbor
                            const gx = u.x + dx * TILE_SIZE;
                            const gy = u.y + dy * TILE_SIZE;

                            const nChunkX = Math.floor(gx / chunkSizePx);
                            const nChunkY = Math.floor(gy / chunkSizePx);
                            const nChunkKey = `${nChunkX},${nChunkY}`;

                            if (!dirtyGroundTiles.has(nChunkKey))
                                dirtyGroundTiles.set(nChunkKey, new Set());

                            const nLocalX = Math.floor((gx - nChunkX * chunkSizePx) / TILE_SIZE);
                            const nLocalY = Math.floor((gy - nChunkY * chunkSizePx) / TILE_SIZE);

                            dirtyGroundTiles.get(nChunkKey)!.add(`${nLocalX},${nLocalY}`);
                        }
                    }
                }
            }
        });

        // 1b. Coast sync: add/remove terrain_coast on grasslands adjacent to water
        const coastUpdates = this.architect.computeCoastUpdates(
            worldData,
            new Set(dirtyGroundTiles.keys())
        );
        for (const u of coastUpdates) {
            const chunkX = Math.floor(u.x / chunkSizePx);
            const chunkY = Math.floor(u.y / chunkSizePx);
            const chunkKey = `${chunkX},${chunkY}`;
            const localX = Math.floor((u.x - chunkX * chunkSizePx) / TILE_SIZE);
            const localY = Math.floor((u.y - chunkY * chunkSizePx) / TILE_SIZE);
            const tileKey = `${localX},${localY}`;

            const data = worldData.get(chunkKey);
            if (!data) continue;
            if (!data.zones) data.zones = {};
            if (!data.zones[tileKey]) data.zones[tileKey] = {};

            const current = data.zones[tileKey][u.category];
            if (u.zoneId === null) {
                if (current !== undefined) {
                    delete data.zones[tileKey][u.category];
                    chunksToUpdate.add(chunkKey);
                    if (!dirtyGroundTiles.has(chunkKey)) dirtyGroundTiles.set(chunkKey, new Set());
                    dirtyGroundTiles.get(chunkKey)!.add(tileKey);
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (dx === 0 && dy === 0) continue;
                            const gx = u.x + dx * TILE_SIZE;
                            const gy = u.y + dy * TILE_SIZE;
                            const nCX = Math.floor(gx / chunkSizePx);
                            const nCY = Math.floor(gy / chunkSizePx);
                            const nKey = `${nCX},${nCY}`;
                            if (!dirtyGroundTiles.has(nKey)) dirtyGroundTiles.set(nKey, new Set());
                            const nLX = Math.floor((gx - nCX * chunkSizePx) / TILE_SIZE);
                            const nLY = Math.floor((gy - nCY * chunkSizePx) / TILE_SIZE);
                            dirtyGroundTiles.get(nKey)!.add(`${nLX},${nLY}`);
                        }
                    }
                }
            } else if (current !== u.zoneId) {
                data.zones[tileKey][u.category] = u.zoneId;
                chunksToUpdate.add(chunkKey);
                if (!dirtyGroundTiles.has(chunkKey)) dirtyGroundTiles.set(chunkKey, new Set());
                dirtyGroundTiles.get(chunkKey)!.add(tileKey);
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const gx = u.x + dx * TILE_SIZE;
                        const gy = u.y + dy * TILE_SIZE;
                        const nCX = Math.floor(gx / chunkSizePx);
                        const nCY = Math.floor(gy / chunkSizePx);
                        const nKey = `${nCX},${nCY}`;
                        if (!dirtyGroundTiles.has(nKey)) dirtyGroundTiles.set(nKey, new Set());
                        const nLX = Math.floor((gx - nCX * chunkSizePx) / TILE_SIZE);
                        const nLY = Math.floor((gy - nCY * chunkSizePx) / TILE_SIZE);
                        dirtyGroundTiles.get(nKey)!.add(`${nLX},${nLY}`);
                    }
                }
            }
        }

        // 1c. Splats for coast tiles (grass+sand blend)
        const allSplatChanges: { chunkKey: string; idx: number; oldVal: number; newVal: number }[] =
            [];
        const dirtyTilesForSplats: { x: number; y: number }[] = [];
        for (const [chunkKey, tiles] of dirtyGroundTiles) {
            const [cx, cy] = chunkKey.split(',').map(Number);
            for (const tileKey of tiles) {
                const [lx, ly] = tileKey.split(',').map(Number);
                dirtyTilesForSplats.push({
                    x: (cx * CHUNK_SIZE + lx) * TILE_SIZE,
                    y: (cy * CHUNK_SIZE + ly) * TILE_SIZE
                });
            }
        }
        if (dirtyTilesForSplats.length > 0) {
            const splats = this.architect.evaluateSplats(dirtyTilesForSplats, worldData);
            const changes = await this.groundSystem.paintSplatBatch(
                splats,
                true,
                worldData,
                loadedChunks
            );
            allSplatChanges.push(...changes);
        }

        // 2. Batch Render Overlays
        chunksToUpdate.forEach((chunkKey) => {
            const chunkContainer = loadedChunks.get(chunkKey);
            const data = worldData.get(chunkKey);
            if (chunkContainer && data && data.zones) {
                this.renderZoneOverlay(chunkContainer, data.zones);
            }
        });

        // 3. Update Ground Textures (only tiles not already re-rendered by paintSplatBatch)
        const alreadyRendered = new Set<string>();
        for (const c of allSplatChanges) {
            const { CHUNK_SIZE } = MapEditorConfig;
            const SPLATS_PER_CHUNK = CHUNK_SIZE * 4;
            const localSx = c.idx % SPLATS_PER_CHUNK;
            const localSy = Math.floor(c.idx / SPLATS_PER_CHUNK);
            alreadyRendered.add(
                `${c.chunkKey}:${Math.floor(localSx / 4)},${Math.floor(localSy / 4)}`
            );
        }
        for (const [chunkKey, tiles] of dirtyGroundTiles) {
            if (!loadedChunks.has(chunkKey)) continue;
            const chunk = loadedChunks.get(chunkKey);
            const data = worldData.get(chunkKey);
            if (!chunk || !data) continue;
            let groundLayer = chunk.getChildByLabel('ground_layer') as PIXI.Container;
            if (!groundLayer) {
                groundLayer = new PIXI.Container();
                (groundLayer as { label?: string }).label = 'ground_layer';
                chunk.addChildAt(groundLayer, 0);
            }
            const remaining = Array.from(tiles).filter(
                (tKey) => !alreadyRendered.has(`${chunkKey}:${tKey}`)
            );
            if (remaining.length > 0) {
                await Promise.all(
                    remaining.map((tKey) => {
                        const [lx, ly] = tKey.split(',').map(Number);
                        return this.groundSystem.updateTile(
                            chunkKey,
                            lx,
                            ly,
                            data!,
                            groundLayer,
                            undefined,
                            undefined,
                            undefined,
                            worldData
                        );
                    })
                );
            }
        }

        return allSplatChanges;
    }

    public getZone(
        x: number,
        y: number,
        category: string,
        worldData: Map<string, ChunkData>
    ): string | null {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunkX = Math.floor(x / chunkSizePx);
        const chunkY = Math.floor(y / chunkSizePx);
        const chunkKey = `${chunkX},${chunkY}`;

        const data = worldData.get(chunkKey);
        if (!data || !data.zones) return null;

        const localX = Math.floor((x - chunkX * chunkSizePx) / TILE_SIZE);
        const localY = Math.floor((y - chunkY * chunkSizePx) / TILE_SIZE);
        const tileKey = `${localX},${localY}`;

        return data.zones[tileKey]?.[category] || null;
    }

    /** Regenerate splat data from zone state. Called on map load. */
    public regenerateSplats(worldData: Map<string, ChunkData>): void {
        regenerateSplats(worldData, this.architect);
    }

    public renderZoneOverlay(
        container: PIXI.Container,
        zones: Record<string, Record<string, string>>
    ) {
        // Reuse or create Graphics for zones
        let g = container.getChildByName('zone_overlay') as PIXI.Graphics;
        if (!g) {
            g = new PIXI.Graphics();
            (g as { label?: string }).label = 'zone_overlay';
            container.addChild(g);
        }

        g.clear();
        const { TILE_SIZE } = MapEditorConfig;

        // Iterate all tiles in this chunk that have zones
        for (const [tileKey, categories] of Object.entries(zones)) {
            const [lx, ly] = tileKey.split(',').map(Number);

            Object.entries(categories).forEach(([cat, zoneId]) => {
                // TODO: Fix unknown type or circular ref if ZoneConfig is not available?
                // ZoneConfig is imported.
                const def = ZoneConfig[zoneId];

                const isVisible = !EditorContext.hiddenZoneIds.has(zoneId);

                if (def && isVisible) {
                    g.rect(lx * TILE_SIZE, ly * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    g.fill({ color: def.color, alpha: 0.3 });
                }
            });
        }
    }
}
