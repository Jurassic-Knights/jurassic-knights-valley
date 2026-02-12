/**
 * Mapgen4BiomeConfig — Config-driven thresholds for mapgen4 → zone mapping.
 * Used by Mapgen4Generator for rainfall→biome and elevation→terrain.
 */

/** Rainfall thresholds (0..1) for biome. Below first → desert, below second → badlands, below third → tundra, else grasslands. */
export const MAPGEN4_RAINFALL_THRESHOLDS = {
    desertMax: 0.25,
    badlandsMax: 0.5,
    tundraMax: 0.75
} as const;

/** Land elevation (0..1) band max for lowland / hill. Above hill → mountain. */
export const MAPGEN4_ELEVATION_THRESHOLDS = {
    lowlandMax: 0.35,
    hillMax: 0.7
} as const;

export function rainfallToBiomeFromConfig(rainfall: number): string {
    const { desertMax, badlandsMax, tundraMax } = MAPGEN4_RAINFALL_THRESHOLDS;
    if (rainfall < desertMax) return 'desert';
    if (rainfall < badlandsMax) return 'badlands';
    if (rainfall < tundraMax) return 'tundra';
    return 'grasslands';
}

export function elevationToTerrainFromConfig(elevation: number): 'terrain_lowland' | 'terrain_hill' | 'terrain_mountain' {
    const { lowlandMax, hillMax } = MAPGEN4_ELEVATION_THRESHOLDS;
    if (elevation < lowlandMax) return 'terrain_lowland';
    if (elevation < hillMax) return 'terrain_hill';
    return 'terrain_mountain';
}
