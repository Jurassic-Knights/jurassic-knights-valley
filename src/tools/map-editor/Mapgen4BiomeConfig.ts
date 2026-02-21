/**
 * Mapgen4BiomeConfig — Config-driven thresholds for mapgen4 → zone mapping.
 * Used by Mapgen4Generator for radial biome layout and elevation→terrain.
 */

import { createNoise2D } from 'simplex-noise';
import { makeRandFloat } from './mapgen4/Prng';

/** Map size (mesh coords 0..MAP_SIZE). Center = (CENTER_X, CENTER_Y). */
export const MAPGEN4_MAP_SIZE = 1000;
export const MAPGEN4_CENTER_X = 500;
export const MAPGEN4_CENTER_Y = 500;
/** Inner radius for grasslands (~25% area: π·R² ≈ 250000). */
export const MAPGEN4_INNER_RADIUS = 282;
/** Amplitude of noise perturbing the grasslands boundary (±units). */
export const MAPGEN4_BIOME_RADIUS_NOISE = 65;
/** Amplitude of noise perturbing sector boundaries (±radians). */
export const MAPGEN4_BIOME_ANGLE_NOISE = 0.35;
/** Influence of elevation on boundary (0=none, 0.15=valleys extend grasslands). */
export const MAPGEN4_BIOME_ELEVATION_INFLUENCE = 0.12;

/** Rainfall thresholds (0..1). Legacy; TownGenerator uses for placement. Biome assignment uses position. */
export const MAPGEN4_RAINFALL_THRESHOLDS = {
    desertMax: 0.25,
    badlandsMax: 0.5,
    tundraMax: 0.75
} as const;

/** Water elevation thresholds (mesh coords; negative = below sea level). */
export const MAPGEN4_WATER_ELEVATION_THRESHOLDS = {
    deepWaterMax: -0.2,
    waterMax: -0.1,
    coastMax: 0
} as const;

/** Land elevation (0..1) bands for granular terrain. */
export const MAPGEN4_ELEVATION_THRESHOLDS = {
    dirtbankMax: 0.1,
    lowlandMax: 0.2,
    landMax: 0.35,
    highlandMax: 0.5,
    hillMax: 0.65,
    midmountainMax: 0.8
} as const;

export type TerrainZoneId =
    | 'terrain_dirtbank'
    | 'terrain_lowland'
    | 'terrain_land'
    | 'terrain_highland'
    | 'terrain_hill'
    | 'terrain_midmountain'
    | 'terrain_mountain';

export function rainfallToBiomeFromConfig(rainfall: number): string {
    const { desertMax, badlandsMax, tundraMax } = MAPGEN4_RAINFALL_THRESHOLDS;
    if (rainfall < desertMax) return 'desert';
    if (rainfall < badlandsMax) return 'badlands';
    if (rainfall < tundraMax) return 'tundra';
    return 'grasslands';
}

export function elevationToTerrainFromConfig(elevation: number): TerrainZoneId {
    const { dirtbankMax, lowlandMax, landMax, highlandMax, hillMax, midmountainMax } = MAPGEN4_ELEVATION_THRESHOLDS;
    if (elevation < dirtbankMax) return 'terrain_dirtbank';
    if (elevation < lowlandMax) return 'terrain_lowland';
    if (elevation < landMax) return 'terrain_land';
    if (elevation < highlandMax) return 'terrain_highland';
    if (elevation < hillMax) return 'terrain_hill';
    if (elevation < midmountainMax) return 'terrain_midmountain';
    return 'terrain_mountain';
}

/** Outer-ring biomes (t2–t4); permutation order determined by seed. */
const OUTER_BIOMES = ['tundra', 'desert', 'badlands'] as const;

/** Cache noise by seed (LRU-ish, max 4). */
const biomeNoiseCache = new Map<number, (x: number, y: number) => number>();
const MAX_NOISE_CACHE = 4;

function getBiomeNoise(seed: number): (x: number, y: number) => number {
    if (biomeNoiseCache.has(seed)) return biomeNoiseCache.get(seed)!;
    if (biomeNoiseCache.size >= MAX_NOISE_CACHE) {
        const first = biomeNoiseCache.keys().next().value;
        if (first !== undefined) biomeNoiseCache.delete(first);
    }
    const n = createNoise2D(makeRandFloat(seed));
    biomeNoiseCache.set(seed, n);
    return n;
}

function seededShuffle<T>(arr: readonly T[], seed: number): T[] {
    const result = [...arr];
    let s = seed >>> 0;
    for (let i = result.length - 1; i > 0; i--) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const j = Math.floor((s / 0xffffffff) * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/** Normalized coords [0,1] for noise input. */
const NORM_SCALE = 1 / MAPGEN4_MAP_SIZE;

/**
 * Biome from radial position with organic boundaries.
 * Grasslands center, tundra/desert/badlands in 3 sectors. Noise perturbs the
 * radius and angle so boundaries look natural; optional elevation makes them
 * slightly follow terrain (valleys extend grasslands).
 */
export function positionToBiome(
    x: number,
    y: number,
    meshSeed: number,
    elevation?: number
): string {
    const dx = x - MAPGEN4_CENTER_X;
    const dy = y - MAPGEN4_CENTER_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const angleNorm = angle >= 0 ? angle : angle + 2 * Math.PI;

    const noise = getBiomeNoise(meshSeed);
    const nx = x * NORM_SCALE * 3;
    const ny = y * NORM_SCALE * 3;
    const radiusNoise = noise(nx, ny);
    const angleNoise = noise(nx + 50, ny + 70);

    const radiusOffset =
        radiusNoise * MAPGEN4_BIOME_RADIUS_NOISE +
        (elevation != null ? (elevation - 0.3) * MAPGEN4_BIOME_ELEVATION_INFLUENCE * 80 : 0);
    const effectiveRadius = MAPGEN4_INNER_RADIUS + radiusOffset;

    if (dist < effectiveRadius) return 'grasslands';

    const angleOffset = angleNoise * MAPGEN4_BIOME_ANGLE_NOISE;
    const effectiveAngle = angleNorm + angleOffset;
    const wrapped = ((effectiveAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const sector = Math.floor((wrapped / (2 * Math.PI)) * 3) % 3;
    const permuted = seededShuffle(OUTER_BIOMES, meshSeed);
    return permuted[sector];
}

/** Terrain zone IDs for water/coast (display priority over civ). */
export const WATER_TERRAIN_IDS = [
    'terrain_deep_water',
    'terrain_water',
    'terrain_coast',
    'terrain_river'
] as const;

/** Terrain zone IDs that emit water splats (deep water and water only). */
export const WATER_SPLAT_TERRAIN_IDS = ['terrain_deep_water', 'terrain_water'] as const;

/** Terrain zone IDs for land (used in palette). */
export const LAND_TERRAIN_IDS = [
    'terrain_dirtbank',
    'terrain_lowland',
    'terrain_land',
    'terrain_highland',
    'terrain_hill',
    'terrain_midmountain',
    'terrain_mountain'
] as const;

/**
 * Biome + terrain-specific preview colors. Includes water, coast, and land.
 * Water varies subtly by biome; tundra = iced over. Brightness modulated by elevation.
 */
export const BIOME_PREVIEW_PALETTE: Record<string, Record<string, string>> = {
    grasslands: {
        terrain_deep_water: '#1a4a6a',
        terrain_water: '#2a6080',
        terrain_coast: '#6b8050',
        terrain_river: '#2a6080',
        terrain_dirtbank: '#6b5520',
        terrain_lowland: '#4a7c3f',
        terrain_land: '#529055',
        terrain_highland: '#3d6d42',
        terrain_hill: '#5c6458',
        terrain_midmountain: '#647068',
        terrain_mountain: '#788078'
    },
    tundra: {
        terrain_deep_water: '#2a4a58',
        terrain_water: '#487088',
        terrain_coast: '#708898',
        terrain_river: '#487088',
        terrain_dirtbank: '#4a5260',
        terrain_lowland: '#608090',
        terrain_land: '#7098a8',
        terrain_highland: '#88b0c0',
        terrain_hill: '#4e5e70',
        terrain_midmountain: '#364658',
        terrain_mountain: '#5a6a78'
    },
    desert: {
        terrain_deep_water: '#1a4050',
        terrain_water: '#2a5868',
        terrain_coast: '#b89870',
        terrain_river: '#2a5868',
        terrain_dirtbank: '#6e5840',
        terrain_lowland: '#b09068',
        terrain_land: '#c4a070',
        terrain_highland: '#8a6848',
        terrain_hill: '#706858',
        terrain_midmountain: '#585048',
        terrain_mountain: '#787068'
    },
    badlands: {
        terrain_deep_water: '#202830',
        terrain_water: '#303840',
        terrain_coast: '#504848',
        terrain_river: '#303840',
        terrain_dirtbank: '#4a4242',
        terrain_lowland: '#5c2828',
        terrain_land: '#6e3232',
        terrain_highland: '#481c1c',
        terrain_hill: '#3a3a3a',
        terrain_midmountain: '#2a2a2a',
        terrain_mountain: '#4a4a4a'
    }
};
