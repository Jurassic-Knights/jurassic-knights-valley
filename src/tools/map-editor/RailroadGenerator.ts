/**
 * RailroadGenerator — Build simple railroad track through all towns.
 * Straight-line spline: one polygon per town (outside town), connected in order, loop back to first.
 * No pathfinding; spline interpolates between station positions.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { orderStationsByAngleAroundCentroid } from './RailroadPathUtils';
import type { RailroadGeneratorParam, RailroadCrossing } from './RailroadGeneratorTypes';

export type { RailroadGeneratorParam, RailroadCrossing } from './RailroadGeneratorTypes';

/** Find one polygon adjacent to town center, outside town radius. Exactly one polygon away. */
function findStationOnePolygonAway(
    mesh: Mesh,
    townCenter: number,
    townRadius: number
): number {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const townRadiusSq = townRadius * townRadius;

    const sides: number[] = [];
    mesh.s_around_r(townCenter, sides);

    let best: number | null = null;
    let bestDistSq = -1;

    for (const s of sides) {
        if (s < 0 || mesh.is_ghost_s(s)) continue;
        const rNext = mesh.r_begin_s(s) === townCenter ? mesh.r_end_s(s) : mesh.r_begin_s(s);
        if (mesh.is_ghost_r(rNext)) continue;

        const dx = mesh.x_of_r(rNext) - tx;
        const dy = mesh.y_of_r(rNext) - ty;
        const distSq = dx * dx + dy * dy;

        if (distSq > townRadiusSq) return rNext;
        if (distSq > bestDistSq) {
            bestDistSq = distSq;
            best = rNext;
        }
    }
    return best ?? townCenter;
}

/**
 * Build one continuous closed railroad loop through all towns.
 * Path: first town station → each town in order → back to first town.
 * Straight lines between stations; one polygon outside each town.
 */
export function runRailroadGenerator(
    mesh: Mesh,
    _map: Mapgen4Map,
    townRegionIds: number[],
    _roadSegments: { r1: number; r2: number }[],
    _param: RailroadGeneratorParam,
    _riversParam: { lg_min_flow: number },
    townRadius?: number
): { path: number[]; crossings: RailroadCrossing[] } {
    if (townRegionIds.length < 2) return { path: [], crossings: [] };

    const radius = townRadius ?? 30;
    const stationIds = townRegionIds.map((t) => findStationOnePolygonAway(mesh, t, radius));
    let tour = orderStationsByAngleAroundCentroid(mesh, townRegionIds, stationIds);

    const n = tour.length;
    if (n < 2) return { path: [], crossings: [] };

    const distSq = (a: number, b: number) => {
        const dx = mesh.x_of_r(a) - mesh.x_of_r(b);
        const dy = mesh.y_of_r(a) - mesh.y_of_r(b);
        return dx * dx + dy * dy;
    };
    let bestCloseDistSq = distSq(tour[n - 1], tour[0]);
    let bestStart = 0;
    for (let start = 1; start < n; start++) {
        const prev = (start - 1 + n) % n;
        const d = distSq(tour[prev], tour[start]);
        if (d < bestCloseDistSq) {
            bestCloseDistSq = d;
            bestStart = start;
        }
    }
    if (bestStart > 0) {
        tour = [...tour.slice(bestStart), ...tour.slice(0, bestStart)];
    }

    const path: number[] = [...tour, tour[0]];

    return { path, crossings: [] };
}
