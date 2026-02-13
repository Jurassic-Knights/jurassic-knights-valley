/**
 * TownGenerator — Place towns on the mapgen4 mesh.
 * Applies civilization zones to existing polygon regions. Max 2 towns per biome.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { positionToBiome } from './Mapgen4BiomeConfig';

/** Max towns per biome (total max = 4 biomes × 2 = 8). */
export const TOWNS_PER_BIOME = 2;

/** Biomes in round-robin order for interleaved placement across the continent. */
const BIOME_ORDER = ['grasslands', 'tundra', 'desert', 'badlands'] as const;

export interface TownGeneratorParam {
    /** Ignored; towns are capped at 2 per biome. Kept for UI compatibility. */
    numTowns: number;
    minSpacing: number;
    townRadius: number;
    defaultZoneId: string;
    elevationMin: number;
    elevationMax: number;
    rainfallMin: number;
    rainfallMax: number;
    seed?: number;
}

export interface TownSite {
    regionId: number;
    zoneId: string;
}

/** Check if region r is on a river (has a side with flow >= minFlow). */
function isRegionOnRiver(mesh: Mesh, map: Mapgen4Map, r: number, minFlow: number): boolean {
    const sides: number[] = [];
    mesh.s_around_r(r, sides);
    for (const s of sides) {
        if (s < 0 || s >= map.flow_s.length) continue;
        if (map.flow_s[s] >= minFlow) return true;
    }
    return false;
}

/** Check if region r is within n polygon steps of a river. */
function isWithinNStepsOfRiver(
    mesh: Mesh,
    map: Mapgen4Map,
    r: number,
    minFlow: number,
    n: number
): boolean {
    if (n <= 0) return isRegionOnRiver(mesh, map, r, minFlow);
    const visited = new Set<number>();
    let frontier: number[] = [r];
    visited.add(r);
    for (let step = 0; step <= n && frontier.length > 0; step++) {
        const next: number[] = [];
        for (const curr of frontier) {
            if (isRegionOnRiver(mesh, map, curr, minFlow)) return true;
            const sides: number[] = [];
            mesh.s_around_r(curr, sides);
            for (const s of sides) {
                if (s < 0 || mesh.is_ghost_s(s)) continue;
                const rNext = mesh.r_begin_s(s) === curr ? mesh.r_end_s(s) : mesh.r_begin_s(s);
                if (mesh.is_ghost_r(rNext) || visited.has(rNext)) continue;
                visited.add(rNext);
                next.push(rNext);
            }
        }
        frontier = next;
    }
    return false;
}

/** Min polygon steps a town must be from a river. */
const TOWN_RIVER_BUFFER_STEPS = 3;

/**
 * Place towns on the mesh. Max 2 per biome. Filters by elevation, rainfall.
 * Towns must be at least TOWN_RIVER_BUFFER_STEPS polygons away from rivers.
 * Round-robin per biome ensures interleaved placement; minSpacing prevents clustering
 * within and across biomes. Random selection among valid candidates avoids edge-hugging.
 */
export function runTownGenerator(
    mesh: Mesh,
    map: Mapgen4Map,
    param: TownGeneratorParam,
    riversParam: { lg_min_flow: number },
    meshSeed: number
): TownSite[] {
    const MIN_FLOW = Math.exp(riversParam.lg_min_flow);
    /* Use param.seed when set; otherwise meshSeed so same map always yields same towns (persists across refresh). */
    const rng = seededRandom(param.seed ?? meshSeed);
    const candidates: { r: number; biome: string }[] = [];

    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const elev = map.elevation_r[r];
        const rain = map.rainfall_r[r];
        if (elev < param.elevationMin || elev > param.elevationMax) continue;
        if (rain < param.rainfallMin || rain > param.rainfallMax) continue;
        if (isWithinNStepsOfRiver(mesh, map, r, MIN_FLOW, TOWN_RIVER_BUFFER_STEPS)) continue;
        const x = mesh.x_of_r(r);
        const y = mesh.y_of_r(r);
        const biome = positionToBiome(x, y, meshSeed, elev);
        candidates.push({ r, biome });
    }

    if (candidates.length === 0) return [];

    const towns: TownSite[] = [];
    const used = new Set<number>();
    const countByBiome: Record<string, number> = { grasslands: 0, tundra: 0, desert: 0, badlands: 0 };

    /** Build placement slots: round-robin by biome so we interleave across the continent. */
    const slots: string[] = [];
    for (let i = 0; i < TOWNS_PER_BIOME; i++) {
        slots.push(...BIOME_ORDER);
    }

    for (const targetBiome of slots) {
        if ((countByBiome[targetBiome] ?? 0) >= TOWNS_PER_BIOME) continue;

        const candidatesForBiome = candidates.filter(
            (c) => c.biome === targetBiome && !used.has(c.r)
        );
        if (candidatesForBiome.length === 0) continue;

        const valid: { r: number }[] = [];
        for (const c of candidatesForBiome) {
            const x = mesh.x_of_r(c.r);
            const y = mesh.y_of_r(c.r);
            let minDist = Infinity;
            for (const t of towns) {
                const tx = mesh.x_of_r(t.regionId);
                const ty = mesh.y_of_r(t.regionId);
                const d = Math.hypot(x - tx, y - ty);
                if (d < minDist) minDist = d;
            }
            if (minDist >= param.minSpacing) valid.push(c);
        }

        if (valid.length > 0) {
            const chosen = valid[Math.floor(rng() * valid.length)];
            towns.push({ regionId: chosen.r, zoneId: param.defaultZoneId });
            used.add(chosen.r);
            countByBiome[targetBiome] = (countByBiome[targetBiome] ?? 0) + 1;
        }
    }

    return towns;
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
    };
}
