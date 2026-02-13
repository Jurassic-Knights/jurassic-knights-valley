/**
 * RailroadPathUtils — Town routing and ring helpers for RailroadGenerator.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';

/** Check if line segments (a1,a2) and (b1,b2) intersect, excluding shared endpoints. */
export function segmentsIntersect(
    a1: { x: number; y: number },
    a2: { x: number; y: number },
    b1: { x: number; y: number },
    b2: { x: number; y: number }
): boolean {
    const dxa = a2.x - a1.x;
    const dya = a2.y - a1.y;
    const dxb = b2.x - b1.x;
    const dyb = b2.y - b1.y;
    const denom = dxa * dyb - dya * dxb;
    if (Math.abs(denom) < 1e-10) return false;
    const t = ((b1.x - a1.x) * dyb - (b1.y - a1.y) * dxb) / denom;
    const u = ((b1.x - a1.x) * dya - (b1.y - a1.y) * dxa) / denom;
    if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return false;
    const ix = a1.x + t * dxa;
    const iy = a1.y + t * dya;
    const eps = 1e-6;
    const onA1 = Math.hypot(ix - a1.x, iy - a1.y) < eps;
    const onA2 = Math.hypot(ix - a2.x, iy - a2.y) < eps;
    const onB1 = Math.hypot(ix - b1.x, iy - b1.y) < eps;
    const onB2 = Math.hypot(ix - b2.x, iy - b2.y) < eps;
    if (onA1 || onA2 || onB1 || onB2) return false;
    return true;
}

import {
    dijkstraAroundTown,
    dijkstraSlingshot,
    pathFromPrev,
    bestDistTo,
} from './RailroadDijkstra';
import type { RailroadGeneratorParam } from './RailroadGeneratorTypes';

export function findStationRegion(mesh: Mesh, townCenter: number, townRadius: number): number {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const townRadiusSq = townRadius * townRadius;

    const visited = new Set<number>();
    const queue: number[] = [townCenter];
    visited.add(townCenter);

    while (queue.length > 0) {
        const r = queue.shift()!;
        const sides: number[] = [];
        mesh.s_around_r(r, sides);
        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext) || visited.has(rNext)) continue;
            visited.add(rNext);

            const dx = mesh.x_of_r(rNext) - tx;
            const dy = mesh.y_of_r(rNext) - ty;
            if (dx * dx + dy * dy > townRadiusSq) return rNext;
            queue.push(rNext);
        }
    }
    return townCenter;
}

export function findTownRingRegions(
    mesh: Mesh,
    townCenter: number,
    townRadius: number
): number[] {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const townRadiusSq = townRadius * townRadius;

    const inside = new Set<number>();
    const boundary = new Set<number>();
    const queue: number[] = [townCenter];
    inside.add(townCenter);

    while (queue.length > 0) {
        const r = queue.shift()!;
        const sides: number[] = [];
        mesh.s_around_r(r, sides);
        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;
            const dx = mesh.x_of_r(rNext) - tx;
            const dy = mesh.y_of_r(rNext) - ty;
            const outside = dx * dx + dy * dy > townRadiusSq;
            if (outside) {
                boundary.add(rNext);
            } else if (!inside.has(rNext)) {
                inside.add(rNext);
                queue.push(rNext);
            }
        }
    }

    const list = Array.from(boundary);
    list.sort((a, b) => {
        const ax = mesh.x_of_r(a) - tx;
        const ay = mesh.y_of_r(a) - ty;
        const bx = mesh.x_of_r(b) - tx;
        const by = mesh.y_of_r(b) - ty;
        return Math.atan2(ay, ax) - Math.atan2(by, bx);
    });
    return list;
}

export function pathAroundTown(
    mesh: Mesh,
    map: Mapgen4Map,
    fromR: number,
    toR: number,
    param: RailroadGeneratorParam,
    minFlow: number,
    townCenter: number,
    townRadius: number,
    approachR: number,
    exitTowardR: number,
    forbiddenEdges?: Set<string>
): number[] {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const thetaFrom =
        Math.atan2(mesh.y_of_r(approachR) - ty, mesh.x_of_r(approachR) - tx);
    const thetaTo =
        Math.atan2(mesh.y_of_r(exitTowardR) - ty, mesh.x_of_r(exitTowardR) - tx);
    const { dist, prev } = dijkstraSlingshot(
        mesh,
        map,
        fromR,
        param,
        minFlow,
        townCenter,
        townRadius,
        thetaFrom,
        thetaTo,
        forbiddenEdges
    );
    return pathFromPrev(dist, prev, fromR, toR);
}

/**
 * Path from prevEnd to station rb, passing through ring entry. Stays outside town.
 * Used when pathAround fails; ensures track passes by a polygon adjacent to the town.
 */
export function pathThroughRingToStation(
    mesh: Mesh,
    map: Mapgen4Map,
    prevEnd: number,
    entry: number,
    rb: number,
    townCenter: number,
    townRadius: number,
    param: RailroadGeneratorParam,
    minFlow: number,
    forbiddenEdges?: Set<string>
): number[] {
    const { dist: distToEntry, prev: prevToEntry } = dijkstraAroundTown(
        mesh,
        map,
        prevEnd,
        param,
        minFlow,
        townCenter,
        townRadius,
        forbiddenEdges
    );
    const pathToEntry = pathFromPrev(distToEntry, prevToEntry, prevEnd, entry);
    if (pathToEntry.length < 2) return [];

    const { dist: distFromEntry, prev: prevFromEntry } = dijkstraAroundTown(
        mesh,
        map,
        entry,
        param,
        minFlow,
        townCenter,
        townRadius,
        forbiddenEdges
    );
    const pathFromEntryToRb = pathFromPrev(distFromEntry, prevFromEntry, entry, rb);
    if (pathFromEntryToRb.length < 2) return [];

    return [...pathToEntry, ...pathFromEntryToRb.slice(1)];
}

export function pickRingEntry(dist: Map<string, number>, ring: number[]): number {
    let bestR = ring[0];
    let bestD = bestDistTo(dist, bestR);
    for (let i = 1; i < ring.length; i++) {
        const d = bestDistTo(dist, ring[i]);
        if (d < bestD) {
            bestD = d;
            bestR = ring[i];
        }
    }
    return bestR;
}

/**
 * Order stations using road graph when available: follows road connectivity to reduce crossing.
 * Falls back to angle-around-centroid when road graph doesn't yield a full tour.
 */
export function orderStationsByRoadGraph(
    townRegionIds: number[],
    stationIds: number[],
    roadSegments: { r1: number; r2: number }[]
): number[] {
    const n = townRegionIds.length;
    if (n < 2) return [...stationIds];

    const adj = new Map<number, number[]>();
    for (const { r1, r2 } of roadSegments) {
        if (!adj.has(r1)) adj.set(r1, []);
        adj.get(r1)!.push(r2);
        if (!adj.has(r2)) adj.set(r2, []);
        adj.get(r2)!.push(r1);
    }

    const roadDist = (from: number, to: number): number => {
        const q: number[] = [from];
        const dist = new Map<number, number>([[from, 0]]);
        while (q.length > 0) {
            const r = q.shift()!;
            const d = dist.get(r)!;
            if (r === to) return d;
            for (const next of adj.get(r) ?? []) {
                if (dist.has(next)) continue;
                dist.set(next, d + 1);
                q.push(next);
            }
        }
        return Infinity;
    };

    const tour: number[] = [0];
    const unvisited = new Set(townRegionIds.map((_, i) => i));
    unvisited.delete(0);

    while (unvisited.size > 0) {
        const current = townRegionIds[tour[tour.length - 1]];
        let best = -1;
        let bestD = Infinity;
        for (const i of unvisited) {
            const d = roadDist(current, townRegionIds[i]);
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        }
        if (best < 0 || bestD >= Infinity) break;
        tour.push(best);
        unvisited.delete(best);
    }

    if (tour.length === n) return tour.map((i) => stationIds[i]);
    return [];
}

/**
 * Order station regions by angle around the centroid of all towns.
 * Produces a clean geographic loop: start at first town, visit each in clockwise order, end back at start.
 */
export function orderStationsByAngleAroundCentroid(
    mesh: Mesh,
    townRegionIds: number[],
    stationIds: number[]
): number[] {
    const n = townRegionIds.length;
    if (n < 2) return [...stationIds];

    let cx = 0;
    let cy = 0;
    for (const r of townRegionIds) {
        cx += mesh.x_of_r(r);
        cy += mesh.y_of_r(r);
    }
    cx /= n;
    cy /= n;

    const indices = townRegionIds.map((_, i) => i);
    indices.sort((a, b) => {
        const ax = mesh.x_of_r(townRegionIds[a]) - cx;
        const ay = mesh.y_of_r(townRegionIds[a]) - cy;
        const bx = mesh.x_of_r(townRegionIds[b]) - cx;
        const by = mesh.y_of_r(townRegionIds[b]) - cy;
        return Math.atan2(ay, ax) - Math.atan2(by, bx);
    });

    return indices.map((i) => stationIds[i]);
}

export function pickRingExit(mesh: Mesh, ring: number[], targetR: number): number {
    const tx = mesh.x_of_r(targetR);
    const ty = mesh.y_of_r(targetR);
    let bestR = ring[0];
    let bestD =
        (mesh.x_of_r(bestR) - tx) ** 2 + (mesh.y_of_r(bestR) - ty) ** 2;
    for (let i = 1; i < ring.length; i++) {
        const r = ring[i];
        const d = (mesh.x_of_r(r) - tx) ** 2 + (mesh.y_of_r(r) - ty) ** 2;
        if (d < bestD) {
            bestD = d;
            bestR = r;
        }
    }
    return bestR;
}
