/**
 * RailroadBlockedRegions — Regions railroads must avoid (towns, water, coast).
 * Hard constraint: stay on land only.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';

export interface RailroadBlockedRegionsContext {
    /** Town center region IDs. Regions inside any town are blocked. */
    townRegionIds: number[];
    /** Distance from town center (mesh units). Regions within this radius are blocked. */
    townRadius: number;
}

/** BFS steps from water to consider "coastal" — blocked so we stay inland. */
const COASTAL_BUFFER_STEPS = 2;

export interface RailroadBlockedRegionsOptions {
    /** When true, only block water. Railroad pathfinding uses this as its sole blocking policy (water only). */
    pathfindingOnly?: boolean;
}

/**
 * Build set of region IDs that railroads must not pass through.
 * Default: towns, water (elevation < 0), and coastal buffer.
 * pathfindingOnly: true = water only (ensures paths are found when land route exists).
 */
export function buildBlockedRegions(
    mesh: Mesh,
    map: Mapgen4Map,
    context: RailroadBlockedRegionsContext,
    options?: RailroadBlockedRegionsOptions
): Set<number> {
    const blocked = new Set<number>();

    if (!options?.pathfindingOnly) {
        for (const townCenter of context.townRegionIds) {
            const inside = regionsInsideTown(mesh, townCenter, context.townRadius);
            for (const r of inside) blocked.add(r);
        }

        const waterAndCoast = regionsWaterAndCoastalBuffer(mesh, map, COASTAL_BUFFER_STEPS);
        for (const r of waterAndCoast) blocked.add(r);
    } else {
        for (let r = 0; r < mesh.numSolidRegions; r++) {
            if (mesh.is_ghost_r(r)) continue;
            const elev = map.elevation_r[r] ?? 0;
            if (elev < 0) blocked.add(r);
        }
    }

    return blocked;
}

/** Collect water regions (elevation < 0) and regions within bufferSteps of water. */
function regionsWaterAndCoastalBuffer(
    mesh: Mesh,
    map: Mapgen4Map,
    bufferSteps: number
): Set<number> {
    const water = new Set<number>();
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const elev = map.elevation_r[r] ?? 0;
        if (elev < 0) water.add(r);
    }

    const result = new Set<number>(water);
    const sides: number[] = [];
    let frontier = Array.from(water);

    for (let step = 0; step < bufferSteps && frontier.length > 0; step++) {
        const next: number[] = [];
        for (const r of frontier) {
            mesh.s_around_r(r, sides);
            for (const s of sides) {
                if (s < 0 || mesh.is_ghost_s(s)) continue;
                const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
                if (mesh.is_ghost_r(rNext) || result.has(rNext)) continue;
                result.add(rNext);
                next.push(rNext);
            }
        }
        frontier = next;
    }

    return result;
}

/** BFS from town center; collect all regions within townRadius. */
function regionsInsideTown(
    mesh: Mesh,
    townCenter: number,
    townRadius: number
): Set<number> {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const townRadiusSq = townRadius * townRadius;

    const inside = new Set<number>();
    const queue: number[] = [townCenter];
    inside.add(townCenter);

    const sides: number[] = [];

    while (queue.length > 0) {
        const r = queue.shift()!;
        mesh.s_around_r(r, sides);

        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext) || inside.has(rNext)) continue;

            const dx = mesh.x_of_r(rNext) - tx;
            const dy = mesh.y_of_r(rNext) - ty;
            if (dx * dx + dy * dy > townRadiusSq) continue;

            inside.add(rNext);
            queue.push(rNext);
        }
    }

    return inside;
}
