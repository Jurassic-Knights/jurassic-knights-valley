/**
 * Mapgen4RiverUtils — River detection for mapgen4 mesh.
 * Used by rasterization and zone mapping.
 */

import type { Mesh } from './mapgen4/types';

/** Distance from point (px,py) to segment (ax,ay)-(bx,by). */
export function pointToSegmentDistance(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
): number {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    return Math.hypot(px - qx, py - qy);
}

/**
 * Whether tile at (x,y) in region r is on a river, using mapgen4's flow_s and
 * river width formula: width = sqrt(flow - MIN_FLOW) * spacing * RIVER_WIDTH.
 */
export function isTileOnRiver(
    x: number,
    y: number,
    r: number,
    mesh: Mesh,
    flow_s: Float32Array,
    riversParam: { lg_min_flow: number; lg_river_width: number },
    spacing: number
): boolean {
    const MIN_FLOW = Math.exp(riversParam.lg_min_flow);
    const RIVER_WIDTH = Math.exp(riversParam.lg_river_width);
    const sides: number[] = [];
    mesh.s_around_r(r, sides);
    for (let i = 0; i < sides.length; i++) {
        const s = sides[i];
        const flow = flow_s[s];
        if (flow < MIN_FLOW) continue;
        const width = Math.sqrt(flow - MIN_FLOW) * spacing * RIVER_WIDTH;
        const r1 = mesh.r_begin_s(s);
        const r2 = mesh.r_end_s(s);
        const ax = mesh.x_of_r(r1);
        const ay = mesh.y_of_r(r1);
        const bx = mesh.x_of_r(r2);
        const by = mesh.y_of_r(r2);
        if (pointToSegmentDistance(x, y, ax, ay, bx, by) < width) return true;
    }
    return false;
}
