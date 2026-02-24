/**
 * Mapgen4ZoneMapping — Mapgen4 elevation/position/river → editor zones.
 * Used by rasterization and preview rendering.
 */

import { ZoneConfig } from '@data/ZoneConfig';
import {
    positionToBiome,
    elevationToTerrainFromConfig,
    MAPGEN4_WATER_ELEVATION_THRESHOLDS,
    BIOME_PREVIEW_PALETTE
} from './Mapgen4BiomeConfig';

/** Max polygon steps from water for terrain_coast. Prevents coastal grass extending too far inland. */
export const COAST_MAX_POLYGON_STEPS = 3;

/** Central mapping: mapgen4 elevation/position/river → editor zones. */
export function mapgen4ToZones(
    elevation: number,
    _rainfall: number,
    isRiver: boolean,
    x: number,
    y: number,
    meshSeed: number,
    distanceFromWater?: number
): Record<string, string> {
    const zones: Record<string, string> = {};
    const biome = positionToBiome(x, y, meshSeed, elevation);
    const { deepWaterMax, waterMax, coastMax } = MAPGEN4_WATER_ELEVATION_THRESHOLDS;
    if (elevation < deepWaterMax) {
        zones['terrain'] = 'terrain_deep_water';
        zones['biome'] = biome;
    } else if (elevation < waterMax) {
        zones['terrain'] = 'terrain_water';
        zones['biome'] = biome;
    } else if (elevation < coastMax) {
        const withinCoastRange =
            distanceFromWater !== undefined && distanceFromWater <= COAST_MAX_POLYGON_STEPS;
        zones['terrain'] = withinCoastRange ? 'terrain_coast' : 'terrain_dirtbank';
        zones['biome'] = biome;
    } else if (isRiver) {
        zones['terrain'] = 'terrain_river';
        zones['biome'] = biome;
    } else {
        zones['biome'] = biome;
        zones['terrain'] = elevationToTerrainFromConfig(elevation);
    }
    return zones;
}

/** Discrete elevation band grayscale (black→white). Water bands get darker values. */
export const ELEVATION_BAND_GRAY: Record<string, number> = {
    terrain_deep_water: 15,
    terrain_water: 35,
    terrain_coast: 55,
    terrain_river: 40,
    terrain_dirtbank: 80,
    terrain_lowland: 110,
    terrain_land: 140,
    terrain_highland: 165,
    terrain_hill: 190,
    terrain_midmountain: 215,
    terrain_mountain: 240
};

function parseHex(hex: string): { r: number; g: number; b: number } {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** Modulate color brightness by elevation. Higher = brighter for clear elevation viz. */
export function applyElevationBrightness(hexColor: string, gray: number): string {
    const c = parseHex(hexColor);
    const t = gray / 255;
    const brightness = 0.48 + 0.5 * t;
    const r = Math.round(Math.max(0, Math.min(255, c.r * brightness)));
    const g = Math.round(Math.max(0, Math.min(255, c.g * brightness)));
    const b = Math.round(Math.max(0, Math.min(255, c.b * brightness)));
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/** Build fill color for a polygon region. Civ overlay blended on top. */
export function polygonPreviewColor(
    _elevation: number,
    filteredZones: Record<string, string>
): string {
    const terrain = filteredZones['terrain'];
    const biome = filteredZones['biome'];
    const civ = filteredZones['civilization'];

    let baseColor: string;
    const gray = terrain ? (ELEVATION_BAND_GRAY[terrain] ?? 128) : 128;
    const palette = biome && BIOME_PREVIEW_PALETTE[biome];
    const terrainColor = palette && terrain ? palette[terrain] : undefined;
    if (terrainColor) {
        baseColor = applyElevationBrightness(terrainColor, gray);
    } else {
        const g = gray.toString(16).padStart(2, '0');
        baseColor = `#${g}${g}${g}`;
    }

    if (!civ) return baseColor;
    const civDef = ZoneConfig[civ];
    if (!civDef) return baseColor;
    const base = parseHex(baseColor);
    const zr = (civDef.color >> 16) & 0xff;
    const zg = (civDef.color >> 8) & 0xff;
    const zb = civDef.color & 0xff;
    const blend = 0.55;
    const r = Math.round(base.r * (1 - blend) + zr * blend);
    const g = Math.round(base.g * (1 - blend) + zg * blend);
    const b = Math.round(base.b * (1 - blend) + zb * blend);
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}
