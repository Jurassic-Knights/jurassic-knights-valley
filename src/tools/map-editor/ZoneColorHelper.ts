/**
 * ZoneColorHelper — Map zone data to display color (0xRRGGBB).
 * Used by placeholder ground rendering and any future mapgen preview.
 */

import { ZoneConfig } from '@data/ZoneConfig';

/** Terrain (water/coast) overrides civ overrides biome. Returns 0xRRGGBB. */
export function getTileColorHex(zones: Record<string, string> | undefined): number {
    if (!zones) return 0x222222;
    const terrain = zones['terrain'];
    const civ = zones['civilization'];
    const biome = zones['biome'];
    if (terrain === 'terrain_water') return ZoneConfig['terrain_water']?.color ?? 0x2980b9;
    if (terrain === 'terrain_coast') return ZoneConfig['terrain_coast']?.color ?? 0xf39c12;
    if (terrain === 'terrain_river') return ZoneConfig['terrain_river']?.color ?? 0x3498db;
    if (civ === 'civ_outpost') return ZoneConfig['civ_outpost']?.color ?? 0x3498db;
    if (civ === 'civ_trench') return ZoneConfig['civ_trench']?.color ?? 0x7f8c8d;
    if (biome) {
        const z = ZoneConfig[biome] ?? ZoneConfig[`biome_${biome}`];
        if (z) return z.color;
    }
    return 0x222222;
}
