import { ChunkManager } from './ChunkManager';
import { ChunkData } from './MapEditorTypes';
import { Logger } from '@core/Logger';
import { createNoise2D } from 'simplex-noise';
import { MapEditorConfig } from './MapEditorConfig';
import {
    WATER_TERRAIN_IDS,
    WATER_SPLAT_TERRAIN_IDS
} from './Mapgen4BiomeConfig';
import { ProceduralRules } from './data/ProceduralRules';

/**
 * ProceduralArchitect — Smart generation of map content from zone state.
 * Handles biome-based transitions, city grid generation, organic forest clustering,
 * coast sync, and splat evaluation for ground blending.
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

    private generateForest(_chunkManager: ChunkManager, _chunkX: number, _chunkY: number) {
        // Example: Use noise to place trees
    }

    private generateCity(_chunkManager: ChunkManager, _chunkX: number, _chunkY: number) {
        // Example: Grid roads + Buildings
    }

    /**
     * Processes adjacency rules for ground painting.
     * Returns zone updates (pass-through) and splat operations from procedural rules.
     * Splats are evaluated after zone updates are applied; for now we pass through zones only.
     */
    public processAdjacency(
        rawUpdates: { x: number; y: number; category: string; zoneId: string | null }[],
        _worldData: Map<string, ChunkData>
    ): {
        zones: typeof rawUpdates;
        splats: { x: number; y: number; radius: number; intensity: number }[];
    } {
        return { zones: rawUpdates, splats: [] };
    }

    /**
     * Compute coast zone updates based on data-driven ProceduralRules.
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

        const ruleInfo = ProceduralRules.COASTLINE_INTERPOLATION;

        // Coast extends N tiles from water; check all tiles within COAST_DEPTH steps
        const hasWaterWithin = (tileLeftX: number, tileLeftY: number, steps: number): boolean => {
            for (let dx = -steps; dx <= steps; dx++) {
                for (let dy = -steps; dy <= steps; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = tileLeftX + dx * TILE_SIZE;
                    const ny = tileLeftY + dy * TILE_SIZE;
                    const n = getNeighborTerrain(nx + TILE_SIZE / 2, ny + TILE_SIZE / 2);
                    if (n && ruleInfo.requiredAdjacentZoneIds.includes(n)) return true;
                }
            }
            return false;
        };

        /** Directly adjacent to water (using rule radius). Used for ADD to respect polygon cap. */
        const hasRuleRequiredNeighbor = (tileLeftX: number, tileLeftY: number): boolean => {
            const steps = ruleInfo.radiusTiles;
            for (let dx = -steps; dx <= steps; dx++) {
                for (let dy = -steps; dy <= steps; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = tileLeftX + dx * TILE_SIZE;
                    const ny = tileLeftY + dy * TILE_SIZE;
                    const t = getNeighborTerrain(nx + TILE_SIZE / 2, ny + TILE_SIZE / 2);
                    if (t && ruleInfo.requiredAdjacentZoneIds.includes(t)) return true;
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
                const isTargetBiome = ruleInfo.validBaseBiomes.includes(biome);

                // Using hardcoded COAST_DEPTH here for the fade-out logic
                const hasWaterNearby = hasWaterWithin(gx, gy, COAST_DEPTH);

                if (terrain === ruleInfo.targetZoneId && !hasWaterNearby) {
                    // Remove coast if no water nearby
                    updates.push({
                        x: gx + TILE_SIZE / 2,
                        y: gy + TILE_SIZE / 2,
                        category: ruleInfo.targetZoneCategory,
                        zoneId: null
                    });
                } else if (
                    isTargetBiome &&
                    hasRuleRequiredNeighbor(gx, gy) &&
                    terrain &&
                    !WATER_TERRAIN_IDS.includes(terrain as (typeof WATER_TERRAIN_IDS)[number])
                ) {
                    // Add coast if directly adjacent to water and valid
                    updates.push({
                        x: gx + TILE_SIZE / 2,
                        y: gy + TILE_SIZE / 2,
                        category: ruleInfo.targetZoneCategory,
                        zoneId: ruleInfo.targetZoneId
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
