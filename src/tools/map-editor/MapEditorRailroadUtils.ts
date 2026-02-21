/**
 * MapEditorRailroadUtils
 *
 * Shared railroad geometry utilities: mesh-to-world conversion,
 * point-to-segment distance, region handle radius, spline hit testing.
 */
import { MapEditorConfig } from './MapEditorConfig';
import { buildRailroadSplineSamples } from './RailroadSplineBuilder';

export const MESH_TO_WORLD =
    (MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE) / 1000;

/** Right-click within this world distance of spline path shows "Add spline point". */
export const SPLINE_HIT_THRESHOLD_WORLD = 120;

/** Distance from point (px,py) to segment (ax,ay)-(bx,by). */
export function distancePointToSegment(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
): number {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy || 1e-20;
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    return Math.hypot(px - qx, py - qy);
}

/** Build leg index for each path index (leg 0 = station 0→1, leg 1 = 1→2, …). */
export function buildLegForPathIndex(path: number[], stationIds: number[]): number[] {
    const n = stationIds.length;
    if (n < 2 || path.length === 0) return [];
    const out: number[] = [];
    let leg = 0;
    for (let i = 0; i < path.length; i++) {
        out.push(leg);
        if (path[i] === stationIds[(leg + 1) % n]) leg = (leg + 1) % n;
    }
    return out;
}

import type { Mesh } from './mapgen4/types';

export interface ProcCacheLike {
    meshAndMap: { mesh: Mesh };
    railroadPath: number[];
    railroadStationIds: number[];
}

/** World-space radius for a handle so it fits inside the polygon. */
export function getRegionHandleRadiusWorld(
    mesh: ProcCacheLike['meshAndMap']['mesh'],
    regionId: number
): number {
    const cx = mesh.x_of_r(regionId);
    const cy = mesh.y_of_r(regionId);
    const tOut: number[] = [];
    mesh.t_around_r(regionId, tOut);
    if (tOut.length < 3) return 15 * MESH_TO_WORLD;
    let sum = 0;
    for (let i = 0; i < tOut.length; i++) {
        const tx = mesh.x_of_t(tOut[i]!);
        const ty = mesh.y_of_t(tOut[i]!);
        sum += Math.hypot(tx - cx, ty - cy);
    }
    const avgMeshRadius = (sum / tOut.length) * 0.9;
    return avgMeshRadius * MESH_TO_WORLD;
}

/** True if (worldX, worldY) is within maxDistanceWorld of the railroad spline path. */
export function isWorldPointOnSplinePath(
    procCache: ProcCacheLike | null,
    worldX: number,
    worldY: number,
    maxDistanceWorld: number
): boolean {
    if (!procCache || procCache.railroadPath.length < 2 || procCache.railroadStationIds.length < 2)
        return false;
    const { mesh } = procCache.meshAndMap;
    const path = procCache.railroadPath;
    const stationIds = procCache.railroadStationIds;
    const samples = buildRailroadSplineSamples(mesh, path, stationIds);
    if (samples.length < 2) return false;
    let minD = Infinity;
    for (let i = 0; i < samples.length - 1; i++) {
        const ax = samples[i]!.x * MESH_TO_WORLD;
        const ay = samples[i]!.y * MESH_TO_WORLD;
        const bx = samples[i + 1]!.x * MESH_TO_WORLD;
        const by = samples[i + 1]!.y * MESH_TO_WORLD;
        const d = distancePointToSegment(worldX, worldY, ax, ay, bx, by);
        if (d < minD) minD = d;
    }
    return minD <= maxDistanceWorld;
}

/** Leg index (0..n-1) for the spline segment nearest to (worldX, worldY). Null if no path. */
export function getNearestLegIndexForWorldPoint(
    procCache: ProcCacheLike | null,
    getRegionAtWorld: (wx: number, wy: number) => number | null,
    worldX: number,
    worldY: number
): number | null {
    if (!procCache || procCache.railroadPath.length < 2 || procCache.railroadStationIds.length < 2)
        return null;
    const path = procCache.railroadPath;
    const stationIds = procCache.railroadStationIds;
    const legForPathIndex = buildLegForPathIndex(path, stationIds);
    if (legForPathIndex.length === 0) return null;
    const regionId = getRegionAtWorld(worldX, worldY);
    if (regionId != null) {
        const j = path.indexOf(regionId);
        if (j >= 0) return legForPathIndex[j] ?? null;
    }
    const { mesh } = procCache.meshAndMap;
    let bestIdx = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < path.length; i++) {
        const rx = mesh.x_of_r(path[i]!) * MESH_TO_WORLD;
        const ry = mesh.y_of_r(path[i]!) * MESH_TO_WORLD;
        const dSq = (worldX - rx) ** 2 + (worldY - ry) ** 2;
        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestIdx = i;
        }
    }
    return legForPathIndex[bestIdx] ?? null;
}

/** 
 * Calculate the insertion index for a new waypoint within a specific leg.
 * Finds the closest point on the path to the click, and returns how many existing
 * waypoints in this leg come before it.
 */
export function getWaypointInsertionIndex(
    procCache: ProcCacheLike | null,
    legIndex: number,
    waypoints: { legIndex: number; regionId: number }[],
    worldX: number,
    worldY: number
): number {
    if (!procCache || procCache.railroadPath.length < 2 || procCache.railroadStationIds.length < 2)
        return 0;
    
    const path = procCache.railroadPath;
    const stationIds = procCache.railroadStationIds;
    const legForPathIndex = buildLegForPathIndex(path, stationIds);
    if (legForPathIndex.length === 0) return 0;
    
    // 1. Find the index on the global path closest to worldX, worldY
    const { mesh } = procCache.meshAndMap;
    let bestIdx = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < path.length; i++) {
        if (legForPathIndex[i] !== legIndex) continue;
        const rx = mesh.x_of_r(path[i]!) * MESH_TO_WORLD;
        const ry = mesh.y_of_r(path[i]!) * MESH_TO_WORLD;
        const dSq = (worldX - rx) ** 2 + (worldY - ry) ** 2;
        if (dSq < bestDistSq) {
            bestDistSq = dSq;
            bestIdx = i;
        }
    }
    
    // 2. See how many existing waypoints for this leg appear *before* this path index
    let insertIndex = 0;
    for (const wp of waypoints) {
        if (wp.legIndex === legIndex) {
            const wpPathIdx = path.indexOf(wp.regionId);
            if (wpPathIdx >= 0 && wpPathIdx < bestIdx) {
                insertIndex++;
            }
        }
    }
    
    return insertIndex;
}
