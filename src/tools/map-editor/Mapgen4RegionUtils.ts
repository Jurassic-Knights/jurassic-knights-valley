/**
 * Mapgen4RegionUtils — Region lookup for mapgen4 mesh.
 * Used by rasterization, preview, and railroad spline drawing.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { MAPGEN4_MAP_SIZE, MAPGEN4_WATER_ELEVATION_THRESHOLDS } from './Mapgen4BiomeConfig';

export { MAPGEN4_MAP_SIZE };

/** BFS from water; returns distance from nearest water (0 = water, 1 = adjacent, etc.). Runs until all reachable regions visited. */
export function computeRegionDistanceFromWater(
    mesh: Mesh,
    map: Mapgen4Map,
    _maxSteps: number
): Map<number, number> {
    const { waterMax } = MAPGEN4_WATER_ELEVATION_THRESHOLDS;
    const water = new Set<number>();
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const elev = map.elevation_r[r] ?? 0;
        if (elev < waterMax) water.add(r);
    }

    const dist = new Map<number, number>();
    for (const r of water) dist.set(r, 0);

    const sides: number[] = [];
    let frontier = Array.from(water);

    while (frontier.length > 0) {
        const next: number[] = [];
        for (const r of frontier) {
            const d = dist.get(r)!;
            mesh.s_around_r(r, sides);
            for (const s of sides) {
                if (s < 0 || mesh.is_ghost_s(s)) continue;
                const rA = mesh.r_begin_s(s);
                const rB = mesh.r_end_s(s);
                const rNext = rA === r ? rB : rA;
                if (mesh.is_ghost_r(rNext) || dist.has(rNext)) continue;
                dist.set(rNext, d + 1);
                next.push(rNext);
            }
        }
        frontier = next;
    }

    return dist;
}

export const MAPGEN4_GRID_CELL = 20;
export const MAPGEN4_GRID_N = MAPGEN4_MAP_SIZE / MAPGEN4_GRID_CELL;

export function findRegionAt(mesh: Mesh, x: number, y: number, cellRegions: number[][]): number {
    const cx = Math.max(0, Math.min(MAPGEN4_GRID_N - 1, Math.floor(x / MAPGEN4_GRID_CELL)));
    const cy = Math.max(0, Math.min(MAPGEN4_GRID_N - 1, Math.floor(y / MAPGEN4_GRID_CELL)));
    const candidates: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < MAPGEN4_GRID_N && ny >= 0 && ny < MAPGEN4_GRID_N) {
                const list = cellRegions[ny * MAPGEN4_GRID_N + nx];
                if (list) candidates.push(...list);
            }
        }
    }
    if (candidates.length === 0) return 0;
    let bestR = candidates[0];
    let bestD = (mesh.x_of_r(bestR) - x) ** 2 + (mesh.y_of_r(bestR) - y) ** 2;
    for (let i = 1; i < candidates.length; i++) {
        const r = candidates[i];
        if (mesh.is_ghost_r(r)) continue;
        const d = (mesh.x_of_r(r) - x) ** 2 + (mesh.y_of_r(r) - y) ** 2;
        if (d < bestD) {
            bestD = d;
            bestR = r;
        }
    }
    return bestR;
}

export function buildCellRegions(mesh: Mesh): number[][] {
    const grid: number[][] = Array.from<number[]>({ length: MAPGEN4_GRID_N * MAPGEN4_GRID_N }, () => []);
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const gx = Math.floor(mesh.x_of_r(r) / MAPGEN4_GRID_CELL);
        const gy = Math.floor(mesh.y_of_r(r) / MAPGEN4_GRID_CELL);
        if (gx >= 0 && gx < MAPGEN4_GRID_N && gy >= 0 && gy < MAPGEN4_GRID_N) {
            const idx = gy * MAPGEN4_GRID_N + gx;
            grid[idx].push(r);
        }
    }
    return grid;
}
