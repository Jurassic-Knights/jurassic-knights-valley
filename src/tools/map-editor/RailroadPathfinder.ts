/**
 * RailroadPathfinder — Plug-and-play pathfinding for railroads.
 * BFS on mesh with no terrain constraints. The user manually places
 * stations and waypoints; pathfinding just connects them.
 */

import type { Mesh } from './mapgen4/types';
import { bfsPath } from './RailroadDijkstra';

/**
 * Find shortest path (by hop count) from region A to region B.
 * No blocking — traverses any non-ghost region.
 */
export function findRailroadPath(
    mesh: Mesh,
    from: number,
    to: number
): number[] {
    return bfsPath(mesh, from, to);
}

/**
 * Find path from A to B via waypoints: A -> via1 -> via2 -> ... -> B.
 * If any segment via a waypoint fails, falls back to direct A->B.
 */
export function findRailroadPathVia(
    mesh: Mesh,
    from: number,
    to: number,
    via: number[]
): number[] {
    if (via.length === 0) return findRailroadPath(mesh, from, to);

    const segments: number[][] = [];
    let last = from;

    for (const wp of via) {
        const seg = findRailroadPath(mesh, last, wp);
        if (seg.length < 2) return findRailroadPath(mesh, from, to);
        segments.push(seg);
        last = wp;
    }

    const segToEnd = findRailroadPath(mesh, last, to);
    if (segToEnd.length < 2) return findRailroadPath(mesh, from, to);

    let path = segments[0]!;
    for (let i = 1; i < segments.length; i++) {
        path = [...path, ...segments[i]!.slice(1)];
    }
    path = [...path, ...segToEnd.slice(1)];
    return path;
}
