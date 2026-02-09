import { ChunkManager } from './ChunkManager';
import { ChunkData } from './MapEditorTypes';
import { Logger } from '@core/Logger';
import { createNoise2D } from 'simplex-noise';
import { MapEditorConfig } from './MapEditorConfig';

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
    public generateChunk(chunkManager: ChunkManager, chunkX: number, chunkY: number, biomeId: string) {
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
     * Processes adjacency rules for ground painting
     * @param updates The paint actions from the user
     * @param worldData The entire world state (read-only access for neighbors)
     */
    /**
     * Reactively evaluates splats for a set of dirty tiles.
     * Determines if splats should be ADDED or REMOVED based on current neighborhood.
     */
    public evaluateSplats(
        dirtyTiles: { x: number, y: number }[],
        worldData: Map<string, ChunkData>
    ): { x: number, y: number, radius: number, intensity: number }[] {
        const splatResults: { x: number, y: number, radius: number, intensity: number }[] = [];
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        // Rules defining which splats strictly depend on zones
        const rules = [
            // Water (Cause) -> Grass (Target) => Add Coast (Result)
            {
                cause: 'terrain_water',
                target: 'grasslands',
                requiredSplat: true, // Boolean flag for "this rule enforces blending"
                splatRadius: 4.5,
                splatIntensity: 255
            },
            // Self-Rule: Water needs Water Splat
            {
                cause: 'terrain_water',
                target: 'SELF',
                requiredSplat: true,
                splatRadius: 2.5,
                splatIntensity: 255
            }
        ];

        // For every dirty tile, we check:
        // 1. Does it match a SELF rule?
        // 2. Does it match a NEIGHBOR rule (as the Target)?

        dirtyTiles.forEach(tile => {
            const chunkX = Math.floor(tile.x / chunkSizePx);
            const chunkY = Math.floor(tile.y / chunkSizePx);
            const key = `${chunkX},${chunkY}`;

            const data = worldData.get(key);
            if (!data || !data.zones) return;

            const localX = Math.floor((tile.x - (chunkX * chunkSizePx)) / TILE_SIZE);
            const localY = Math.floor((tile.y - (chunkY * chunkSizePx)) / TILE_SIZE);
            const tileKey = `${localX},${localY}`;

            const biome = data.zones[tileKey]?.['biome'];
            const terrain = data.zones[tileKey]?.['terrain'];
            // Normalize IDs
            const myIds = [biome, terrain].filter(Boolean) as string[];

            // 1. Check SELF Rules
            let shouldBeSplat = false;
            // Simplified: We assume we are checking for "Water Splat" logic specifically for now.
            // In a full system, we'd check ALL managed splat types independenty.
            // Here we just toggle "Blending" on/off.

            // Check if *I* am Water (Self Rule)
            if (myIds.includes('terrain_water')) shouldBeSplat = true;

            // 2. Check Neighbor Rules (Am I adjacent to Water?)
            if (!shouldBeSplat) {
                // Check 8 neighbors
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        // Neighbor Coords
                        const nx = tile.x + (dx * TILE_SIZE);
                        const ny = tile.y + (dy * TILE_SIZE);

                        // Look up Neighbor
                        const nCX = Math.floor(nx / chunkSizePx);
                        const nCY = Math.floor(ny / chunkSizePx);
                        const nKey = `${nCX},${nCY}`;
                        const nData = worldData.get(nKey);

                        if (nData && nData.zones) {
                            const nLX = Math.floor((nx - (nCX * chunkSizePx)) / TILE_SIZE);
                            const nLY = Math.floor((ny - (nCY * chunkSizePx)) / TILE_SIZE);
                            const nTKey = `${nLX},${nLY}`;

                            const nBiome = nData.zones[nTKey]?.['biome'];
                            const nTerrain = nData.zones[nTKey]?.['terrain'];
                            const nIds = [nBiome, nTerrain].filter(Boolean) as string[];

                            // Does Neighbor have 'terrain_water'?
                            if (nIds.includes('terrain_water')) {
                                // Am I 'grasslands'? (Target)
                                // Or generic "Non-Water"?
                                // Rule says target: 'grasslands'. 
                                // Let's simplify: Any non-water adj to water gets blend?
                                // Strict rule:
                                if (myIds.some(id => id && (id === 'grasslands' || id === 'biome_grasslands'))) {
                                    shouldBeSplat = true;
                                }
                            }
                        }
                    }
                }
            }

            // APPLY or REMOVE
            // We apply to the intersection (Edge) or Center depending on rule?
            // "Coast" is an overlay. 
            // If shouldBeSplat, we add. If not, we remove.

            // Note: This applies to the TILE CENTER splat (radius covers edges).
            // A TILE that needs blending gets a splat at its center.
            const centerX = tile.x + (TILE_SIZE / 2);
            const centerY = tile.y + (TILE_SIZE / 2);

            splatResults.push({
                x: centerX,
                y: centerY,
                radius: 36, // ~1.1 Tiles
                intensity: shouldBeSplat ? 255 : -255 // Add or Erase
            });
        });

        return splatResults;
    }
}
