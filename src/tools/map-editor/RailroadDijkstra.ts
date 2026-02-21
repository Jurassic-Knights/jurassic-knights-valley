/**
 * RailroadDijkstra — Simple BFS pathfinding for railroad generation.
 * Finds shortest path (by hop count) between two regions on the mesh.
 * No terrain blocking — the user manually places stations and waypoints.
 */

import type { Mesh } from './mapgen4/types';

const SIDES_BUF: number[] = [];

/**
 * BFS from `from` to `to` on the mesh. No terrain constraints — traverses
 * any non-ghost region. Returns the region-ID path including both endpoints,
 * or `[]` when unreachable (should only happen for disconnected mesh regions).
 */
export function bfsPath(
    mesh: Mesh,
    from: number,
    to: number
): number[] {
    if (from === to) return [from];

    const prev = new Map<number, number>();
    prev.set(from, -1);
    const queue: number[] = [from];
    let head = 0;

    while (head < queue.length) {
        const r = queue[head++]!;
        if (r === to) break;

        mesh.s_around_r(r, SIDES_BUF);
        for (const s of SIDES_BUF) {
            if (s < 0 || mesh.is_ghost_s(s)) continue;
            const rNext = mesh.r_begin_s(s) === r ? mesh.r_end_s(s) : mesh.r_begin_s(s);
            if (mesh.is_ghost_r(rNext)) continue;
            if (prev.has(rNext)) continue;
            prev.set(rNext, r);
            queue.push(rNext);
        }
    }

    if (!prev.has(to)) return [];

    const path: number[] = [];
    for (let r: number = to; r !== -1; r = prev.get(r)!) {
        path.push(r);
    }
    path.reverse();
    return path;
}
