import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';
import { GroundSystem } from './GroundSystem';
import { ProceduralArchitect } from './ProceduralArchitect';
import { EditorContext } from './EditorContext';
import { regenerateSplats } from './ZoneSystemSplatRegen';
import { worldToChunkTile, markTileAndNeighbors } from './ZoneSystemUtils';

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

        const chunksToUpdate = new Set<string>();
        const dirtyGroundTiles = new Map<string, Set<string>>();

        // 1. Process Updates (apply zone changes to worldData)
        rawUpdates.forEach((u) => {
            const { chunkKey, tileKey } = worldToChunkTile(u.x, u.y);

            let data = worldData.get(chunkKey);
            if (!data) {
                data = { id: chunkKey, objects: [], zones: {} };
                worldData.set(chunkKey, data);
            }
            if (!data.zones) data.zones = {};
            if (!data.zones[tileKey]) data.zones[tileKey] = {};

            const currentZoneId = data.zones[tileKey][u.category];
            let changed = false;

            if (u.zoneId === null) {
                if (currentZoneId !== undefined) {
                    delete data.zones[tileKey][u.category];
                    changed = true;
                }
            } else {
                if (currentZoneId !== u.zoneId) {
                    data.zones[tileKey][u.category] = u.zoneId;
                    changed = true;
                }
            }

            if (changed) {
                chunksToUpdate.add(chunkKey);
                if (
                    u.category === ZoneCategory.BIOME ||
                    u.category === ZoneCategory.CIVILIZATION ||
                    u.category === ZoneCategory.TERRAIN
                ) {
                    markTileAndNeighbors(u.x, u.y, chunkKey, tileKey, dirtyGroundTiles);
                }
            }
        });

        // 1b. Coast sync: add/remove terrain_coast on grasslands adjacent to water
        const coastUpdates = this.architect.computeCoastUpdates(
            worldData,
            new Set(dirtyGroundTiles.keys())
        );
        for (const u of coastUpdates) {
            const { chunkKey, tileKey } = worldToChunkTile(u.x, u.y);

            const data = worldData.get(chunkKey);
            if (!data) continue;
            if (!data.zones) data.zones = {};
            if (!data.zones[tileKey]) data.zones[tileKey] = {};

            const current = data.zones[tileKey][u.category];
            if (u.zoneId === null) {
                if (current !== undefined) {
                    delete data.zones[tileKey][u.category];
                    chunksToUpdate.add(chunkKey);
                    markTileAndNeighbors(u.x, u.y, chunkKey, tileKey, dirtyGroundTiles);
                }
            } else if (current !== u.zoneId) {
                data.zones[tileKey][u.category] = u.zoneId;
                chunksToUpdate.add(chunkKey);
                markTileAndNeighbors(u.x, u.y, chunkKey, tileKey, dirtyGroundTiles);
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
            const SPLATS_PER_CHUNK = MapEditorConfig.SPLAT_RES;
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
        const { chunkKey, tileKey } = worldToChunkTile(x, y);
        const data = worldData.get(chunkKey);
        if (!data || !data.zones) return null;
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
        // Reuse or create a Container for zone sprites
        let overlayContainer = container.getChildByLabel('zone_overlay') as PIXI.Container;
        if (!overlayContainer) {
            overlayContainer = new PIXI.Container();
            overlayContainer.label = 'zone_overlay';
            container.addChild(overlayContainer);
        }

        const { TILE_SIZE } = MapEditorConfig;

        // Hide all existing sprites (return to pool)
        for (let i = 0; i < overlayContainer.children.length; i++) {
            overlayContainer.children[i].visible = false;
        }

        let spriteIndex = 0;

        // Iterate all tiles in this chunk that have zones
        for (const [tileKey, categories] of Object.entries(zones)) {
            const [lx, ly] = tileKey.split(',').map(Number);

            Object.entries(categories).forEach(([cat, zoneId]) => {
                const def = ZoneConfig[zoneId];
                const isVisible = !EditorContext.hiddenZoneIds.has(zoneId);

                if (def && isVisible) {
                    let sprite = overlayContainer.children[spriteIndex] as PIXI.Sprite;
                    if (!sprite) {
                        sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
                        sprite.width = TILE_SIZE;
                        sprite.height = TILE_SIZE;
                        overlayContainer.addChild(sprite);
                    }

                    sprite.x = lx * TILE_SIZE;
                    sprite.y = ly * TILE_SIZE;
                    sprite.tint = def.color;
                    sprite.alpha = 0.3;
                    sprite.visible = true;

                    spriteIndex++;
                }
            });
        }
    }
}
