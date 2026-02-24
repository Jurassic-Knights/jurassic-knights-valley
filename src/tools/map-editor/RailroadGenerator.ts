/**
 * RailroadGenerator — Build railroad track through manual stations and waypoints.
 * Uses unconstrained BFS for every leg. Requires explicit station order (no procedural stations).
 */

import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import { findRailroadPath, findRailroadPathVia } from './RailroadPathfinder';
import { findSideBetween, getFlowForSide } from './Mapgen4PathUtils';
import { Logger } from '@core/Logger';
import type { RailroadCrossing } from './RailroadGeneratorTypes';

export type { RailroadCrossing } from './RailroadGeneratorTypes';

/** Manual station order and waypoints per leg. Required for railroad generation. */
export interface RailroadGeneratorOverrides {
    /** Station region IDs in visit order (1->2->3...). Required. */
    explicitStationOrder: number[];
    /** Waypoint region IDs per leg. waypointsByLeg[i] = waypoints for leg from station i to i+1. */
    waypointsByLeg?: number[][];
}

/**
 * Build one continuous closed railroad loop through manual stations and waypoints.
 * No terrain constraints — the path goes wherever the user's stations and waypoints say.
 * Returns path, crossings, and stationRegionIds for debug overlay.
 */
export function runRailroadGenerator(
    mesh: Mesh,
    map: Mapgen4Map,
    riversParam: { lg_min_flow: number },
    _townRadius?: number,
    overrides?: RailroadGeneratorOverrides
): { path: number[]; crossings: RailroadCrossing[]; stationRegionIds: number[] } {
    if (!overrides?.explicitStationOrder || overrides.explicitStationOrder.length < 2) {
        return { path: [], crossings: [], stationRegionIds: [] };
    }

    const tour = [...overrides.explicitStationOrder];
    const n = tour.length;
    const minFlow = Math.exp(riversParam.lg_min_flow);

    let path: number[] = [];

    for (let i = 0; i < n; i++) {
        const from = tour[i]!;
        const to = tour[(i + 1) % n]!;
        const manualWaypoints = overrides?.waypointsByLeg?.[i];

        let seg: number[];
        if (manualWaypoints && manualWaypoints.length > 0) {
            seg = findRailroadPathVia(mesh, from, to, manualWaypoints);
        } else {
            seg = findRailroadPath(mesh, from, to);
        }

        if (seg.length < 2) {
            Logger.warn(`[RailroadGenerator] BFS failed leg ${from}->${to}, using direct hop`);
            seg = [from, to];
        }

        if (path.length === 0) {
            path = [...seg];
        } else {
            path = path.concat(seg.slice(1));
        }
    }

    const crossings = collectRiverCrossings(mesh, map, path, minFlow);
    return { path, crossings, stationRegionIds: tour };
}

/** Walk path and collect edges that cross rivers for bridge zones. */
function collectRiverCrossings(
    mesh: Mesh,
    map: Mapgen4Map,
    path: number[],
    minFlow: number
): RailroadCrossing[] {
    const crossings: RailroadCrossing[] = [];
    for (let i = 0; i < path.length - 1; i++) {
        const r1 = path[i]!;
        const r2 = path[i + 1]!;
        const s = findSideBetween(mesh, r1, r2);
        if (s < 0) continue;
        const flow = getFlowForSide(mesh, map, s);
        if (flow >= minFlow) {
            crossings.push({ r1, r2, crossesRiver: true });
        }
    }
    return crossings;
}
