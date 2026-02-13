/**
 * RailroadDijkstra — Dijkstra pathfinding for railroad generation.
 * Turn cost, slope cost, slingshot (around-town) variant.
 */

import FlatQueue from 'flatqueue';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { getFlowForSide, SIDES_BUFFER, edgeKey } from './Mapgen4PathUtils';
import type { RailroadGeneratorParam } from './RailroadGeneratorTypes';

/** Dijkstra that excludes regions inside a town (for pathing around town boundary). */
export function dijkstraAroundTown(
    mesh: Mesh,
    map: Mapgen4Map,
    start: number,
    param: RailroadGeneratorParam,
    minFlow: number,
    townCenter: number,
    townRadius: number,
    forbiddenEdges?: Set<string>
): { dist: Map<string, number>; prev: Map<string, string> } {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const townRadiusSq = townRadius * townRadius;
    const inside = (r: number) => {
        const dx = mesh.x_of_r(r) - tx;
        const dy = mesh.y_of_r(r) - ty;
        return dx * dx + dy * dy <= townRadiusSq;
    };

    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const turnWeight = param.turnWeight ?? 8;
    const slopeWeight = param.slopeWeight ?? 12;
    const riverCrossingCost = param.riverCrossingCost ?? 1.5;

    dist.set(stateKey(start, start), 0);
    const q = new FlatQueue<{ r: number; fromR: number }>();
    q.push({ r: start, fromR: start }, 0);

    const sides = SIDES_BUFFER;

    while (q.length > 0) {
        const { r, fromR } = q.pop()!;
        const sk = stateKey(r, fromR);
        const d = dist.get(sk) ?? Infinity;
        if (d === Infinity) continue;

        mesh.s_around_r(r, sides);

        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;
            if (inside(rNext)) continue;

            const elevNext = map.elevation_r[rNext] ?? 0;
            if (elevNext < 0) continue;

            const flow = getFlowForSide(mesh, map, s);
            const isRiver = flow >= minFlow;
            if (forbiddenEdges?.has(edgeKey(r, rNext))) continue;

            const elevHere = map.elevation_r[r] ?? 0;
            const len = (mesh as { length_s?: Float32Array }).length_s?.[s] ?? 1;
            const slopeCost = Math.abs(elevNext - elevHere) * slopeWeight;
            const turn = turnCost(mesh, fromR, r, rNext, turnWeight);
            const baseCost = len + slopeCost + turn;
            const cost = isRiver ? baseCost * riverCrossingCost : baseCost;

            const nextKey = stateKey(rNext, r);
            const newDist = d + cost;
            const oldDist = dist.get(nextKey) ?? Infinity;
            if (newDist < oldDist) {
                dist.set(nextKey, newDist);
                prev.set(nextKey, sk);
                q.push({ r: rNext, fromR: r }, newDist);
            }
        }
    }
    return { dist, prev };
}

export function stateKey(r: number, fromR: number): string {
    return `${r},${fromR}`;
}

export function turnCost(
    mesh: Mesh,
    fromR: number,
    r: number,
    rNext: number,
    turnWeight: number
): number {
    if (turnWeight <= 0 || fromR === r) return 0;
    const x0 = mesh.x_of_r(fromR);
    const y0 = mesh.y_of_r(fromR);
    const x1 = mesh.x_of_r(r);
    const y1 = mesh.y_of_r(r);
    const x2 = mesh.x_of_r(rNext);
    const y2 = mesh.y_of_r(rNext);
    const v1x = x1 - x0;
    const v1y = y1 - y0;
    const v2x = x2 - x1;
    const v2y = y2 - y1;
    const len1 = Math.hypot(v1x, v1y) || 1;
    const len2 = Math.hypot(v2x, v2y) || 1;
    const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
    return Math.max(0, 1 - cos) * turnWeight;
}

export function dijkstra(
    mesh: Mesh,
    map: Mapgen4Map,
    start: number,
    param: RailroadGeneratorParam,
    minFlow: number,
    forbiddenEdges?: Set<string>
): { dist: Map<string, number>; prev: Map<string, string> } {
    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const turnWeight = param.turnWeight ?? 8;
    const slopeWeight = param.slopeWeight ?? 12;
    const riverCrossingCost = param.riverCrossingCost ?? 1.5;

    dist.set(stateKey(start, start), 0);
    const q = new FlatQueue<{ r: number; fromR: number }>();
    q.push({ r: start, fromR: start }, 0);

    const sides = SIDES_BUFFER;

    while (q.length > 0) {
        const { r, fromR } = q.pop()!;
        const sk = stateKey(r, fromR);
        const d = dist.get(sk) ?? Infinity;
        if (d === Infinity) continue;

        mesh.s_around_r(r, sides);

        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;

            const elevNext = map.elevation_r[rNext] ?? 0;
            if (elevNext < 0) continue;

            const flow = getFlowForSide(mesh, map, s);
            const isRiver = flow >= minFlow;
            if (forbiddenEdges?.has(edgeKey(r, rNext))) continue;

            const elevHere = map.elevation_r[r] ?? 0;
            const len = (mesh as { length_s?: Float32Array }).length_s?.[s] ?? 1;
            const slopeCost = Math.abs(elevNext - elevHere) * slopeWeight;
            const turn = turnCost(mesh, fromR, r, rNext, turnWeight);
            const baseCost = len + slopeCost + turn;
            const cost = isRiver ? baseCost * riverCrossingCost : baseCost;

            const nextKey = stateKey(rNext, r);
            const newDist = d + cost;
            const oldDist = dist.get(nextKey) ?? Infinity;
            if (newDist < oldDist) {
                dist.set(nextKey, newDist);
                prev.set(nextKey, sk);
                q.push({ r: rNext, fromR: r }, newDist);
            }
        }
    }
    return { dist, prev };
}

export function bestDistTo(dist: Map<string, number>, target: number): number {
    let best = Infinity;
    dist.forEach((d, k) => {
        if (k.startsWith(`${target},`)) best = Math.min(best, d);
    });
    return best;
}

export function pathFromPrev(
    dist: Map<string, number>,
    prev: Map<string, string>,
    from: number,
    to: number
): number[] {
    let bestKey: string | null = null;
    let bestD = Infinity;
    dist.forEach((d, k) => {
        if (k.startsWith(`${to},`) && d < bestD) {
            bestD = d;
            bestKey = k;
        }
    });
    if (!bestKey) return [];

    const path: number[] = [];
    let key: string | undefined = bestKey;
    while (key) {
        const r = parseInt(key.split(',')[0], 10);
        path.push(r);
        if (r === from) break;
        key = prev.get(key);
    }
    path.reverse();
    return path;
}

function angularArcCost(
    mesh: Mesh,
    townCenter: number,
    thetaFrom: number,
    thetaTo: number,
    r: number
): number {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const rx = mesh.x_of_r(r) - tx;
    const ry = mesh.y_of_r(r) - ty;
    const theta = Math.atan2(ry, rx);
    let d = theta - thetaFrom;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    const arcLen = thetaTo - thetaFrom;
    const arcLenNorm = Math.atan2(Math.sin(arcLen), Math.cos(arcLen));
    if (Math.abs(arcLenNorm) < 0.1) return 0;
    if (arcLenNorm >= 0) {
        if (d >= 0 && d <= arcLenNorm) return 0;
        return 80;
    }
    if (d <= 0 && d >= arcLenNorm) return 0;
    return 80;
}

/** Dijkstra for slingshot: outside town, prefers regions in the shorter angular arc. */
export function dijkstraSlingshot(
    mesh: Mesh,
    map: Mapgen4Map,
    start: number,
    param: RailroadGeneratorParam,
    minFlow: number,
    townCenter: number,
    townRadius: number,
    thetaFrom: number,
    thetaTo: number,
    forbiddenEdges?: Set<string>
): { dist: Map<string, number>; prev: Map<string, string> } {
    const tx = mesh.x_of_r(townCenter);
    const ty = mesh.y_of_r(townCenter);
    const townRadiusSq = townRadius * townRadius;
    const inside = (r: number) => {
        const dx = mesh.x_of_r(r) - tx;
        const dy = mesh.y_of_r(r) - ty;
        return dx * dx + dy * dy <= townRadiusSq;
    };

    const dist = new Map<string, number>();
    const prev = new Map<string, string>();
    const turnWeight = param.turnWeight ?? 8;
    const slopeWeight = param.slopeWeight ?? 12;
    const riverCrossingCost = param.riverCrossingCost ?? 1.5;

    dist.set(stateKey(start, start), 0);
    const q = new FlatQueue<{ r: number; fromR: number }>();
    q.push({ r: start, fromR: start }, 0);

    const sides = SIDES_BUFFER;

    while (q.length > 0) {
        const { r, fromR } = q.pop()!;
        const sk = stateKey(r, fromR);
        const d = dist.get(sk) ?? Infinity;
        if (d === Infinity) continue;

        mesh.s_around_r(r, sides);

        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;
            if (inside(rNext)) continue;

            const elevNext = map.elevation_r[rNext] ?? 0;
            if (elevNext < 0) continue;

            const flow = getFlowForSide(mesh, map, s);
            const isRiver = flow >= minFlow;
            if (forbiddenEdges?.has(edgeKey(r, rNext))) continue;

            const elevHere = map.elevation_r[r] ?? 0;
            const len = (mesh as { length_s?: Float32Array }).length_s?.[s] ?? 1;
            const slopeCost = Math.abs(elevNext - elevHere) * slopeWeight;
            const turn = turnCost(mesh, fromR, r, rNext, turnWeight);
            const arcCost = angularArcCost(mesh, townCenter, thetaFrom, thetaTo, rNext);
            const baseCost = len + slopeCost + turn + arcCost;
            const cost = isRiver ? baseCost * riverCrossingCost : baseCost;

            const nextKey = stateKey(rNext, r);
            const newDist = d + cost;
            const oldDist = dist.get(nextKey) ?? Infinity;
            if (newDist < oldDist) {
                dist.set(nextKey, newDist);
                prev.set(nextKey, sk);
                q.push({ r: rNext, fromR: r }, newDist);
            }
        }
    }
    return { dist, prev };
}
