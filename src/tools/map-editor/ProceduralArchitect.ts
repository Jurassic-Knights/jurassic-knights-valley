import { ChunkManager } from './ChunkManager';
import { ChunkData } from './MapEditorTypes';
import { Logger } from '@core/Logger';
import { createNoise2D } from 'simplex-noise';
import { MapEditorConfig } from './MapEditorConfig';
import {
    WATER_TERRAIN_IDS,
    WATER_SPLAT_TERRAIN_IDS
} from './Mapgen4BiomeConfig';

/**
 * ProceduralArchitect
 *
 * Handles smart generation of map content.
 * - Biome-based transitions
 * - City grid generation
 * - Organic forest clustering
 */
export class ProceduralArchitect {
    private noise: (x: number, y: number) => number;

    constructor() {
        this.noise = createNoise2D();
    }

    /**
     * Fills a specific chunk with biome-appropriate content
     */
    public generateChunk(
        chunkManager: ChunkManager,
        chunkX: number,
        chunkY: number,
        biomeId: string
    ) {
        Logger.info(`[Architect] Generating ${biomeId} for chunk ${chunkX},${chunkY}`);

        switch (biomeId) {
            case 'forest':
                this.generateForest(chunkManager, chunkX, chunkY);
                break;
            case 'city':
                this.generateCity(chunkManager, chunkX, chunkY);
                break;
            // ...
        }
    }

    private generateForest(chunkManager: ChunkManager, chunkX: number, chunkY: number) {
        // Example: Use noise to place trees
    }

    private generateCity(chunkManager: ChunkManager, chunkX: number, chunkY: number) {
        // Example: Grid roads + Buildings
    }

    /**
     * Processes adjacency rules for ground painting.
     * Returns zone updates (pass-through) and splat operations from procedural rules.
     * Splats are evaluated after zone updates are applied; for now we pass through zones only.
     */
    public processAdjacency(
        rawUpdates: { x: number; y: number; category: string; zoneId: string | null }[],
        worldData: Map<string, ChunkData>
    ): {
        zones: typeof rawUpdates;
        splats: { x: number; y: number; radius: number; intensity: number }[];
    } {
        return { zones: rawUpdates, splats: [] };
    }

    /**
     * Compute coast zone updates: terrain_coast on grasslands adjacent to water.
     * Expands 2 tiles deep from water for a natural gradient. Uses BFS from water.
     */
    public computeCoastUpdates(
        worldData: Map<string, ChunkData>,
        dirtyChunkKeys: Set<string>
    ): { x: number; y: number; category: string; zoneId: string | null }[] {
        const updates: { x: number; y: number; category: string; zoneId: string | null }[] = [];
        const { CHUNK_SIZE, TILE_SIZE, Procedural } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
        const COAST_DEPTH = Procedural.COAST_DEPTH;

        const getNeighborTerrain = (gx: number, gy: number): string | null => {
            const nCX = Math.floor(gx / chunkSizePx);
            const nCY = Math.floor(gy / chunkSizePx);
            const nData = worldData.get(`${nCX},${nCY}`);
            if (!nData?.zones) return null;
            const nLX = Math.floor((gx - nCX * chunkSizePx) / TILE_SIZE);
            const nLY = Math.floor((gy - nCY * chunkSizePx) / TILE_SIZE);
            return nData.zones[`${nLX},${nLY}`]?.['terrain'] ?? null;
        };

        // Coast extends N tiles from water; check all tiles within COAST_DEPTH steps
        const hasWaterWithin = (tileLeftX: number, tileLeftY: number, steps: number): boolean => {
            for (let dx = -steps; dx <= steps; dx++) {
                for (let dy = -steps; dy <= steps; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = tileLeftX + dx * TILE_SIZE;
                    const ny = tileLeftY + dy * TILE_SIZE;
                    const n = getNeighborTerrain(nx + TILE_SIZE / 2, ny + TILE_SIZE / 2);
                    if (n && WATER_SPLAT_TERRAIN_IDS.includes(n as (typeof WATER_SPLAT_TERRAIN_IDS)[number])) return true;
                }
            }
            return false;
        };

        const hasWaterNeighbor = (tileLeftX: number, tileLeftY: number): boolean => {
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = tileLeftX + dx * TILE_SIZE;
                    const ny = tileLeftY + dy * TILE_SIZE;
                    const t = getNeighborTerrain(nx + TILE_SIZE / 2, ny + TILE_SIZE / 2);
                    if (t && WATER_SPLAT_TERRAIN_IDS.includes(t as (typeof WATER_SPLAT_TERRAIN_IDS)[number])) return true;
                }
            }
            return false;
        };

        for (const chunkKey of dirtyChunkKeys) {
            const data = worldData.get(chunkKey);
            if (!data?.zones) continue;
            const [cx, cy] = chunkKey.split(',').map(Number);

            for (const [tileKey, categories] of Object.entries(data.zones)) {
                const [lx, ly] = tileKey.split(',').map(Number);
                const gx = (cx * CHUNK_SIZE + lx) * TILE_SIZE;
                const gy = (cy * CHUNK_SIZE + ly) * TILE_SIZE;
                const biome = categories['biome'];
                const terrain = categories['terrain'];
                const isGrasslands = biome === 'grasslands' || biome === 'biome_grasslands';
                const hasWater = hasWaterNeighbor(gx, gy);
                const hasWaterNearby = hasWaterWithin(gx, gy, COAST_DEPTH);

                if (terrain === 'terrain_coast' && !hasWaterNearby) {
                    updates.push({
                        x: gx + TILE_SIZE / 2,
                        y: gy + TILE_SIZE / 2,
                        category: 'terrain',
                        zoneId: null
                    });
                } else if (
                    isGrasslands &&
                    hasWaterNearby &&
                    terrain &&
                    !WATER_TERRAIN_IDS.includes(terrain as (typeof WATER_TERRAIN_IDS)[number])
                ) {
                    updates.push({
                        x: gx + TILE_SIZE / 2,
                        y: gy + TILE_SIZE / 2,
                        category: 'terrain',
                        zoneId: 'terrain_coast'
                    });
                }
            }
        }
        return updates;
    }

    /**
     * Generate splat ops. Only WATER tiles emit splats, with a large radius so
     * the gradient extends through coast tiles and bleeds into grass tiles.
     * No clearing ops — they would erase the gradient; stale data is handled by regenerateSplats on load.
     */
    public evaluateSplats(
        dirtyTiles: { x: number; y: number }[],
        worldData: Map<string, ChunkData>
    ): { x: number; y: number; radius: number; intensity: number }[] {
        const splatResults: { x: number; y: number; radius: number; intensity: number }[] = [];
        const { CHUNK_SIZE, TILE_SIZE, Procedural } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
        const WATER_RADIUS = Procedural.WATER_SPLAT_RADIUS;
        const WATER_INTENSITY = Procedural.WATER_SPLAT_INTENSITY;

        dirtyTiles.forEach((tile) => {
            const chunkX = Math.floor(tile.x / chunkSizePx);
            const chunkY = Math.floor(tile.y / chunkSizePx);
            const key = `${chunkX},${chunkY}`;

            const data = worldData.get(key);
            if (!data?.zones) return;

            const localX = Math.floor((tile.x - chunkX * chunkSizePx) / TILE_SIZE);
            const localY = Math.floor((tile.y - chunkY * chunkSizePx) / TILE_SIZE);
            const tileKey = `${localX},${localY}`;
            const terrain = data.zones[tileKey]?.['terrain'];
            const centerX = tile.x + TILE_SIZE / 2;
            const centerY = tile.y + TILE_SIZE / 2;

            if (terrain && WATER_SPLAT_TERRAIN_IDS.includes(terrain as (typeof WATER_SPLAT_TERRAIN_IDS)[number])) {
                splatResults.push({
                    x: centerX,
                    y: centerY,
                    radius: WATER_RADIUS,
                    intensity: WATER_INTENSITY
                });
            }
        });

        return splatResults;
    }
}
