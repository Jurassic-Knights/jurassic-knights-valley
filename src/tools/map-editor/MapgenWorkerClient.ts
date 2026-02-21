// MapgenWorkerClient.ts
// Handles communication with the Mapgen Worker and deserialization of mapgen4 objects.

import { Logger } from '@core/Logger';
import { TriangleMesh } from './mapgen4/dual-mesh';
import type { Mesh } from './mapgen4/types';
import Mapgen4Map from './mapgen4/map';
import type { Mapgen4Param } from './Mapgen4Param';
import type { ManualTownsAndRailroads } from './Mapgen4Generator';

let worker: Worker | null = null;
let lastJobId = 0;
const pendingJobs = new Map<number, { resolve: (val: any) => void; reject: (err: Error) => void }>();

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(new URL('../../workers/MapgenWorker.ts', import.meta.url), {
            type: 'module'
        });
        worker.onmessage = (e) => {
            const { jobId, success, error, ...data } = e.data;
            const job = pendingJobs.get(jobId);
            if (job) {
                pendingJobs.delete(jobId);
                if (success) {
                    job.resolve(data);
                } else {
                    job.reject(new Error(error || 'Worker failed without error message'));
                }
            }
        };
        worker.onerror = (err) => {
            Logger.error('[MapgenWorkerClient] Worker error:', err.message);
        };
    }
    return worker;
}

export interface MapgenWorkerResult {
    mesh: Mesh;
    map: Mapgen4Map;
    townsAndRoads: {
        towns: import('./TownGenerator').TownSite[];
        roadSegments: import('./RoadGenerator').RoadSegment[];
        railroadPath: number[];
        railroadCrossings: import('./RailroadGenerator').RailroadCrossing[];
        railroadStationIds: number[];
    };
    cellRegions: number[][];
    distanceFromWater: Map<number, number>;
}

export function runMapgenWorker(param: Mapgen4Param, manual?: ManualTownsAndRailroads): Promise<MapgenWorkerResult> {
    const w = getWorker();
    const jobId = ++lastJobId;

    return new Promise((resolve, reject) => {
        pendingJobs.set(jobId, { resolve, reject });
        w.postMessage({ jobId, param, manual });
    }).then((res: any) => {
        const { meshData, mapData, townsAndRoads, cellRegions, distanceFromWater } = res;

        // Reconstruct Mesh
        const tm = new TriangleMesh(meshData);
        const mesh = tm as Mesh;
        mesh.is_boundary_t = meshData.is_boundary_t;
        mesh.length_s = meshData.length_s;

        // Reconstruct Mapgen4Map
        const map = new Mapgen4Map(mesh, mapData.t_peaks, { spacing: mapData.spacing });
        map.seed = mapData.seed;
        map.mountainJaggedness = mapData.mountainJaggedness;
        map.windAngleDeg = mapData.windAngleDeg;
        map.elevation_t = mapData.elevation_t;
        map.elevation_r = mapData.elevation_r;
        map.humidity_r = mapData.humidity_r;
        map.moisture_t = mapData.moisture_t;
        map.rainfall_r = mapData.rainfall_r;
        map.s_downslope_t = mapData.s_downslope_t;
        map.t_order = mapData.t_order;
        map.flow_t = mapData.flow_t;
        map.flow_s = mapData.flow_s;
        map.r_wind_order = mapData.r_wind_order;
        map.wind_sort_r = mapData.wind_sort_r;
        map.mountain_distance_t = mapData.mountain_distance_t;

        // Reconstruct distanceFromWater Map
        const distMap = new Map<number, number>(distanceFromWater);

        return {
            mesh,
            map,
            townsAndRoads,
            cellRegions,
            distanceFromWater: distMap
        };
    });
}
