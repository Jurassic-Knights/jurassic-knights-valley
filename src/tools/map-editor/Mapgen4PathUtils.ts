/**
 * Mapgen4PathUtils — Shared mesh pathfinding helpers for Road and Railroad generators.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';

/** Find the side index between regions r1 and r2, or -1 if not adjacent. */
export function findSideBetween(mesh: Mesh, r1: number, r2: number): number {
    const sides: number[] = [];
    mesh.s_around_r(r1, sides);
    for (const s of sides) {
        if (s < 0) continue;
        const ra = mesh.r_begin_s(s);
        const rb = mesh.r_end_s(s);
        if ((ra === r1 && rb === r2) || (ra === r2 && rb === r1)) return s;
    }
    return -1;
}

/** Get flow for edge (check both halfedges since flow may be on either). */
export function getFlowForSide(mesh: Mesh, map: Mapgen4Map, s: number): number {
    const f1 = map.flow_s[s] ?? 0;
    const opp = mesh.s_opposite_s(s);
    const f2 = opp >= 0 && opp < mesh.numSolidSides ? (map.flow_s[opp] ?? 0) : 0;
    return Math.max(f1, f2);
}

/** Reusable sides buffer to avoid allocations in hot path. */
export const SIDES_BUFFER: number[] = [];

/** Canonical edge key for (r1, r2) — order-independent. */
export function edgeKey(a: number, b: number): string {
    return a < b ? `${a},${b}` : `${b},${a}`;
}
