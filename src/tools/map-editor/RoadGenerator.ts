/**
 * RoadGenerator — Build road network between towns on the mapgen4 mesh.
 * Roads can cross rivers; segments that do get crossesRiver flag for bridge zone.
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { MapEditorConfig } from './MapEditorConfig';
import { findSideBetween, getFlowForSide } from './Mapgen4PathUtils';
import {
    multiSourceDijkstraNearest,
    buildCoverageGrid,
    sampleCoverageWaypoints,
    getPathBetween
} from './RoadPathUtils';

export interface RoadGeneratorParam {
    shortcutsPerTown: number;
    riverCrossingCost: number; // >1 = prefer land when both viable
    seed?: number;
    /** When > 0, add general road coverage across the map, not just between towns. Grid divisions per axis. */
    coverageGridSize: number;
    /** Multiply slope cost in pathfinding; higher = roads prefer flatter terrain. */
    slopeWeight: number;
    /** How much waypoint roads curve (0–0.3). 0 = straight; ~0.15 = organic swoop. Town-to-town stays straight. */
    waypointCurviness?: number;
}

export interface RoadSegment {
    r1: number;
    r2: number;
    crossesRiver: boolean;
}

/**
 * Build road network between towns and/or coverage waypoints. Uses MST + shortcuts.
 * Roads follow terrain (low slope) via Dijkstra cost. When coverageGridSize > 0,
 * adds a grid of waypoints across land for general road coverage.
 * Returns segments with crossesRiver flag for bridge zones.
 */
export function runRoadGenerator(
    mesh: Mesh,
    map: Mapgen4Map,
    townRegionIds: number[],
    param: RoadGeneratorParam,
    riversParam: { lg_min_flow: number }
): RoadSegment[] {
    const MIN_FLOW = Math.exp(riversParam.lg_min_flow);

    // Build waypoint set: towns + optional coverage grid
    const coverageSize = param.coverageGridSize ?? 0;
    const coverageWaypoints =
        coverageSize >= 2 ? sampleCoverageWaypoints(mesh, map, coverageSize) : [];
    const allWaypoints = [...new Set([...townRegionIds, ...coverageWaypoints])];

    if (allWaypoints.length < 2) return [];

    const townSet = new Set(townRegionIds);
    const gridN = MapEditorConfig.RoadGenerator.COVERAGE_GRID_N;
    const grid = buildCoverageGrid(mesh, map, gridN);
    const rng = param.seed != null ? seededRandom(param.seed) : Math.random;

    const segments: RoadSegment[] = [];
    const edgeSet = new Set<string>();
    const key = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);

    // MST: connect all waypoints with shortest paths (terrain-following)
    // Waypoint roads use organic paths; town-to-town stays relatively straight.
    const connected = new Set<number>([allWaypoints[0]]);
    const unconnected = new Set(allWaypoints);
    unconnected.delete(allWaypoints[0]);

    while (unconnected.size > 0) {
        const result = multiSourceDijkstraNearest(
            mesh,
            map,
            connected,
            unconnected,
            param,
            MIN_FLOW
        );
        if (!result) break;

        const { from: bestFrom, to: bestTo } = result;
        const path = getPathBetween(
            mesh,
            map,
            bestFrom,
            bestTo,
            param,
            MIN_FLOW,
            townSet,
            grid,
            gridN,
            rng
        );
        for (let i = 0; i < path.length - 1; i++) {
            const ra = path[i];
            const rb = path[i + 1];
            const s = findSideBetween(mesh, ra, rb);
            const crossesRiver = s >= 0 && getFlowForSide(mesh, map, s) >= MIN_FLOW;
            const k = key(ra, rb);
            if (!edgeSet.has(k)) {
                edgeSet.add(k);
                segments.push({ r1: ra, r2: rb, crossesRiver });
            }
        }
        connected.add(bestTo);
        unconnected.delete(bestTo);
    }

    // Shortcuts: add extra connections. Cap when coverage adds many waypoints to avoid lag.
    const numTowns = townRegionIds.length;
    const rawShortcuts = numTowns >= 2
        ? Math.max(param.shortcutsPerTown * numTowns, 1)
        : Math.max(Math.floor(allWaypoints.length * 0.1), 1);
    const shortcutCount = Math.min(rawShortcuts, MapEditorConfig.RoadGenerator.MAX_SHORTCUTS);
    for (let i = 0; i < shortcutCount; i++) {
        const idx1 = Math.floor(rng() * allWaypoints.length);
        const idx2 = Math.floor(rng() * allWaypoints.length);
        if (idx1 === idx2) continue;
        const r1 = allWaypoints[idx1];
        const r2 = allWaypoints[idx2];
        const k = key(r1, r2);
        if (edgeSet.has(k)) continue;

        const path = getPathBetween(
            mesh,
            map,
            r1,
            r2,
            param,
            MIN_FLOW,
            townSet,
            grid,
            gridN,
            rng
        );
        if (path.length < 2) continue;
        for (let j = 0; j < path.length - 1; j++) {
            const ra = path[j];
            const rb = path[j + 1];
            const s = findSideBetween(mesh, ra, rb);
            const crossesRiver = s >= 0 && getFlowForSide(mesh, map, s) >= MIN_FLOW;
            const kEdge = key(ra, rb);
            if (!edgeSet.has(kEdge)) {
                edgeSet.add(kEdge);
                segments.push({ r1: ra, r2: rb, crossesRiver });
            }
        }
    }

    return segments;
}

function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
    };
}
