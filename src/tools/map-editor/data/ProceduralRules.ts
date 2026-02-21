import { WATER_SPLAT_TERRAIN_IDS } from '../Mapgen4BiomeConfig';

export interface AdjacencyRule {
    ruleId: string;
    targetZoneCategory: string;
    targetZoneId: string | null;
    requiredAdjacentZoneIds: (string | null)[];
    validBaseBiomes: string[];
    radiusTiles: number;
}

export const ProceduralRules: Record<string, AdjacencyRule> = {
    COASTLINE_INTERPOLATION: {
        ruleId: 'coastline_interpolation',
        targetZoneCategory: 'terrain',
        targetZoneId: 'terrain_coast',
        // Note: Using the exported constant array for dynamic water identification
        requiredAdjacentZoneIds: [...WATER_SPLAT_TERRAIN_IDS],
        validBaseBiomes: ['grasslands', 'biome_grasslands'],
        radiusTiles: 1 // Only adjacent tiles become coast; splat does the gradient
    }
};
