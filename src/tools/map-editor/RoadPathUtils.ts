/**
 * RoadPathUtils — Pathfinding and coverage utilities for RoadGenerator.
 */

import FlatQueue from 'flatqueue';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { MAPGEN4_ELEVATION_THRESHOLDS } from './Mapgen4BiomeConfig';
import { SIDES_BUFFER } from './Mapgen4PathUtils';
import type { RoadGeneratorParam } from './RoadGenerator';

const ROAD_MAX_ELEVATION = MAPGEN4_ELEVATION_THRESHOLDS.hillMax;
const MAP_SIZE = 1000;

/** Dijkstra from start to all reachable regions. Returns { dist, prev }. */
export function dijkstra(
    mesh: Mesh,
    map: Mapgen4Map,
    start: number,
    param: RoadGeneratorParam,
    minFlow: number
): { dist: Map<number, number>; prev: Map<number, number> } {
    const dist = new Map<number, number>();
    const prev = new Map<number, number>();
    dist.set(start, 0);
    const q = new FlatQueue<number>();
    q.push(start, 0);

    const sides = SIDES_BUFFER;
    sides.length = 0;

    while (q.length > 0) {
        const r = q.pop()!;
        const d = dist.get(r) ?? Infinity;
        mesh.s_around_r(r, sides);

        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;

            const elevNext = map.elevation_r[rNext] ?? 0;
            if (elevNext < 0 || elevNext >= ROAD_MAX_ELEVATION) continue;
            const elevHere = map.elevation_r[r] ?? 0;
            const len = (mesh as { length_s?: Float32Array }).length_s?.[s] ?? 1;
            const flow = map.flow_s[s] ?? 0;
            const isRiver = flow >= minFlow;
            const slopeWeight = param.slopeWeight ?? 3;
            const slopeCost = Math.abs(elevNext - elevHere) * slopeWeight;
            const cost = len * (isRiver ? param.riverCrossingCost : 1) + slopeCost;

            const newDist = d + cost;
            const oldDist = dist.get(rNext) ?? Infinity;
            if (newDist < oldDist) {
                dist.set(rNext, newDist);
                prev.set(rNext, r);
                q.push(rNext, newDist);
            }
        }
    }
    return { dist, prev };
}

/** Multi-source Dijkstra: all nodes in connected start at dist 0. Stops when first unconnected waypoint is popped. */
export function multiSourceDijkstraNearest(
    mesh: Mesh,
    map: Mapgen4Map,
    connected: Set<number>,
    unconnected: Set<number>,
    param: RoadGeneratorParam,
    minFlow: number
): { from: number; to: number; prev: Map<number, number> } | null {
    const dist = new Map<number, number>();
    const prev = new Map<number, number>();
    const q = new FlatQueue<number>();
    for (const r of connected) {
        dist.set(r, 0);
        prev.set(r, r);
        q.push(r, 0);
    }

    const sides = SIDES_BUFFER;
    sides.length = 0;
    const slopeWeight = param.slopeWeight ?? 3;

    while (q.length > 0) {
        const r = q.pop()!;
        if (unconnected.has(r)) {
            let origin = r;
            while (!connected.has(origin)) {
                origin = prev.get(origin)!;
            }
            return { from: origin, to: r, prev };
        }
        const d = dist.get(r) ?? Infinity;
        mesh.s_around_r(r, sides);

        for (const s of sides) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;

            const elevNext = map.elevation_r[rNext] ?? 0;
            if (elevNext < 0 || elevNext >= ROAD_MAX_ELEVATION) continue;
            const elevHere = map.elevation_r[r] ?? 0;
            const len = (mesh as { length_s?: Float32Array }).length_s?.[s] ?? 1;
            const flow = map.flow_s[s] ?? 0;
            const isRiver = flow >= minFlow;
            const slopeCost = Math.abs(elevNext - elevHere) * slopeWeight;
            const cost = len * (isRiver ? param.riverCrossingCost : 1) + slopeCost;

            const newDist = d + cost;
            const oldDist = dist.get(rNext) ?? Infinity;
            if (newDist < oldDist) {
                dist.set(rNext, newDist);
                prev.set(rNext, r);
                q.push(rNext, newDist);
            }
        }
    }
    return null;
}

/** Build grid of regions for spatial lookup. */
export function buildCoverageGrid(mesh: Mesh, map: Mapgen4Map, gridN: number): number[][] {
    const cellSize = MAP_SIZE / gridN;
    const grid: number[][] = Array.from<number[]>({ length: gridN * gridN }, () => []);
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const elev = map.elevation_r[r] ?? 0;
        if (elev < 0 || elev >= ROAD_MAX_ELEVATION) continue;
        const gx = Math.floor(mesh.x_of_r(r) / cellSize);
        const gy = Math.floor(mesh.y_of_r(r) / cellSize);
        if (gx >= 0 && gx < gridN && gy >= 0 && gy < gridN) {
            grid[gy * gridN + gx].push(r);
        }
    }
    return grid;
}

/** Find nearest land region to (x,y) using grid lookup. */
export function findNearestLandRegion(
    mesh: Mesh,
    map: Mapgen4Map,
    x: number,
    y: number,
    grid: number[][],
    gridN: number
): number {
    const cellSize = MAP_SIZE / gridN;
    const cx = Math.max(0, Math.min(gridN - 1, Math.floor(x / cellSize)));
    const cy = Math.max(0, Math.min(gridN - 1, Math.floor(y / cellSize)));
    const candidates: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < gridN && ny >= 0 && ny < gridN) {
                const list = grid[ny * gridN + nx];
                if (list) candidates.push(...list);
            }
        }
    }
    let bestR = -1;
    let bestD = Infinity;
    for (const r of candidates) {
        if (mesh.is_ghost_r(r)) continue;
        const elev = map.elevation_r[r] ?? 0;
        if (elev < 0 || elev >= ROAD_MAX_ELEVATION) continue;
        const d = (mesh.x_of_r(r) - x) ** 2 + (mesh.y_of_r(r) - y) ** 2;
        if (d < bestD) {
            bestD = d;
            bestR = r;
        }
    }
    return bestR;
}

/** Sample coverage waypoints on a grid across land. */
export function sampleCoverageWaypoints(mesh: Mesh, map: Mapgen4Map, gridSize: number): number[] {
    if (gridSize < 2) return [];
    const cellSize = MAP_SIZE / gridSize;
    const grid = buildCoverageGrid(mesh, map, gridSize);
    const seen = new Set<number>();
    const waypoints: number[] = [];
    for (let j = 0; j < gridSize; j++) {
        for (let i = 0; i < gridSize; i++) {
            const x = (i + 0.5) * cellSize;
            const y = (j + 0.5) * cellSize;
            const r = findNearestLandRegion(mesh, map, x, y, grid, gridSize);
            if (r >= 0 && !seen.has(r)) {
                seen.add(r);
                waypoints.push(r);
            }
        }
    }
    return waypoints;
}

/** Reconstruct path from prev map. */
export function pathFromPrev(prev: Map<number, number>, from: number, to: number): number[] {
    const path: number[] = [];
    let r = to;
    while (r !== undefined) {
        path.unshift(r);
        if (r === from) break;
        r = prev.get(r)!;
    }
    return path;
}

/** Pick a via region offset perpendicular to A–B at fraction t (0–1). sign: 1 or -1. */
export function pickViaRegion(
    mesh: Mesh,
    map: Mapgen4Map,
    from: number,
    to: number,
    grid: number[][],
    gridN: number,
    curviness: number,
    rng: () => number,
    t: number,
    sign: 1 | -1
): number {
    const ax = mesh.x_of_r(from);
    const ay = mesh.y_of_r(from);
    const bx = mesh.x_of_r(to);
    const by = mesh.y_of_r(to);
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return -1;

    const mx = ax + dx * t;
    const my = ay + dy * t;
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const offset = dist * curviness * (0.5 + rng() * 0.5);
    const vx = mx + perpX * offset * sign;
    const vy = my + perpY * offset * sign;

    return findNearestLandRegion(mesh, map, vx, vy, grid, gridN);
}

/** Build organic path from A to B. Town-to-town uses direct path; waypoint roads use via points. */
export function getPathBetween(
    mesh: Mesh,
    map: Mapgen4Map,
    from: number,
    to: number,
    param: RoadGeneratorParam,
    minFlow: number,
    townSet: Set<number>,
    grid: number[][],
    gridN: number,
    rng: () => number
): number[] {
    const curviness = param.waypointCurviness ?? 0.15;
    const isTownToTown = townSet.has(from) && townSet.has(to);

    const runDirect = () => {
        const { dist, prev } = dijkstra(mesh, map, from, param, minFlow);
        if ((dist.get(to) ?? Infinity) >= Infinity) return [];
        return pathFromPrev(prev, from, to);
    };

    if (isTownToTown || curviness <= 0) return runDirect();

    const via1 = pickViaRegion(mesh, map, from, to, grid, gridN, curviness, rng, 1 / 3, 1);
    const via2 = pickViaRegion(mesh, map, from, to, grid, gridN, curviness, rng, 2 / 3, -1);

    const vias = [...new Set([via1, via2].filter((v) => v >= 0 && v !== from && v !== to))];
    if (vias.length === 0) return runDirect();

    const path: number[] = [];
    let last = from;
    for (const via of vias) {
        const { dist, prev } = dijkstra(mesh, map, last, param, minFlow);
        if ((dist.get(via) ?? Infinity) >= Infinity) return runDirect();
        const seg = pathFromPrev(prev, last, via);
        path.push(...seg.slice(0, -1));
        last = via;
    }
    const { dist, prev } = dijkstra(mesh, map, last, param, minFlow);
    if ((dist.get(to) ?? Infinity) >= Infinity) return runDirect();
    path.push(...pathFromPrev(prev, last, to));
    return path;
}
