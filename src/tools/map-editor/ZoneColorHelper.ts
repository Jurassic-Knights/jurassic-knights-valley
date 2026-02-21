/**
 * ZoneColorHelper — Map zone data to display color (0xRRGGBB).
 * Used by placeholder ground rendering and any future mapgen preview.
 * Data-driven: all colors from ZoneConfig.
 */

import { ZoneConfig } from '@data/ZoneConfig';
import { WATER_TERRAIN_IDS } from './Mapgen4BiomeConfig';

const FALLBACK_COLOR = 0x222222;

function getZoneColor(id: string): number {
    const z = ZoneConfig[id] ?? ZoneConfig[`biome_${id}`];
    return z?.color ?? FALLBACK_COLOR;
}

/** Water/coast always wins; civ overrides land terrain; biome fallback. Returns 0xRRGGBB. */
export function getTileColorHex(zones: Record<string, string> | undefined): number {
    if (!zones) return FALLBACK_COLOR;
    const terrain = zones['terrain'];
    const civ = zones['civilization'];
    const biome = zones['biome'];
    if (terrain && WATER_TERRAIN_IDS.includes(terrain as (typeof WATER_TERRAIN_IDS)[number])) return getZoneColor(terrain);
    if (civ) return getZoneColor(civ);
    if (terrain) return getZoneColor(terrain);
    if (biome) return getZoneColor(biome);
    return FALLBACK_COLOR;
}
