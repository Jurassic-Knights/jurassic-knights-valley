// MapgenWorkerClient.ts
// Handles communication with the Mapgen Worker and deserialization of mapgen4 objects.

import { Logger } from '@core/Logger';
import { TriangleMesh } from './mapgen4/dual-mesh';
import type { Mesh } from './mapgen4/types';
import Mapgen4Map from './mapgen4/map';
import type { Mapgen4Param } from './Mapgen4Param';
import type { ManualTownsAndRailroads } from './Mapgen4Generator';

import MapgenWorker from '../../workers/MapgenWorker?worker';

interface RawWorkerResult {
    meshData: unknown;
    mapData: unknown;
    townsAndRoads: MapgenWorkerResult['townsAndRoads'];
    cellRegions: number[][];
    distanceFromWater: Iterable<readonly [number, number]>;
}

let worker: Worker | null = null;
let lastJobId = 0;
const pendingJobs = new Map<
    number,
    { resolve: (val: RawWorkerResult) => void; reject: (err: Error) => void }
>();

function getWorker(): Worker {
    if (!worker) {
        worker = new MapgenWorker();
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

export function runMapgenWorker(
    param: Mapgen4Param,
    manual?: ManualTownsAndRailroads
): Promise<MapgenWorkerResult> {
    const w = getWorker();
    const jobId = ++lastJobId;

    return new Promise<RawWorkerResult>((resolve, reject) => {
        pendingJobs.set(jobId, { resolve, reject });
        w.postMessage({ jobId, param, manual });
    }).then((res) => {
        const { meshData, mapData, townsAndRoads, cellRegions, distanceFromWater } = res;

        const mData = meshData as Record<string, unknown>;
        const pData = mapData as Record<string, unknown>;

        // Reconstruct Mesh
        const tm = new TriangleMesh(mData as unknown as import('./mapgen4/types').Mesh);
        const mesh = tm as Mesh;
        mesh.is_boundary_t = mData.is_boundary_t as Int8Array;
        mesh.length_s = mData.length_s as Float32Array;

        // Reconstruct Mapgen4Map
        const map = new Mapgen4Map(mesh, pData.t_peaks as number[], {
            spacing: pData.spacing as number
        });
        map.seed = pData.seed as number;
        map.mountainJaggedness = pData.mountainJaggedness as number;
        map.windAngleDeg = pData.windAngleDeg as number;
        map.elevation_t = pData.elevation_t as Float32Array;
        map.elevation_r = pData.elevation_r as Float32Array;
        map.humidity_r = pData.humidity_r as Float32Array;
        map.moisture_t = pData.moisture_t as Float32Array;
        map.rainfall_r = pData.rainfall_r as Float32Array;
        map.s_downslope_t = pData.s_downslope_t as Int32Array;
        map.t_order = pData.t_order as Int32Array;
        map.flow_t = pData.flow_t as Float32Array;
        map.flow_s = pData.flow_s as Float32Array;
        map.r_wind_order = pData.r_wind_order as Int32Array;
        // @ts-expect-error - Mapgen4Map types define this as Float32Array but it's passed as Int32Array
        map.wind_sort_r = pData.wind_sort_r as Int32Array;
        map.mountain_distance_t = pData.mountain_distance_t as Float32Array;

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
