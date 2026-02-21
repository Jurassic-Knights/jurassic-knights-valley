// MapgenWorker.ts
// Offloads heavy procedural terrain mesh and map generation from the main thread.

import { buildMeshAndMap, computeTownsAndRoads } from '../tools/map-editor/Mapgen4Generator';
import { buildCellRegions, computeRegionDistanceFromWater } from '../tools/map-editor/Mapgen4RegionUtils';
import { COAST_MAX_POLYGON_STEPS } from '../tools/map-editor/Mapgen4ZoneMapping';

self.onmessage = async (e: MessageEvent) => {
    const { jobId, param, manual } = e.data;

    try {
        const meshAndMap = buildMeshAndMap(param);
        const townsAndRoads = computeTownsAndRoads(meshAndMap.mesh, meshAndMap.map, param, manual);
        const cellRegions = buildCellRegions(meshAndMap.mesh);
        const distMap = computeRegionDistanceFromWater(meshAndMap.mesh, meshAndMap.map, COAST_MAX_POLYGON_STEPS);
        const distanceFromWater = Array.from(distMap.entries());

        const meshData = {
            numSides: meshAndMap.mesh.numSides,
            numSolidSides: meshAndMap.mesh.numSolidSides,
            numRegions: meshAndMap.mesh.numRegions,
            numSolidRegions: meshAndMap.mesh.numSolidRegions,
            numTriangles: meshAndMap.mesh.numTriangles,
            numSolidTriangles: meshAndMap.mesh.numSolidTriangles,
            numBoundaryRegions: meshAndMap.mesh.numBoundaryRegions,
            _halfedges: meshAndMap.mesh._halfedges,
            _triangles: meshAndMap.mesh._triangles,
            _s_of_r: meshAndMap.mesh._s_of_r,
            _vertex_t: meshAndMap.mesh._vertex_t,
            _vertex_r: meshAndMap.mesh._vertex_r,
            is_boundary_t: meshAndMap.mesh.is_boundary_t,
            length_s: meshAndMap.mesh.length_s
        };

        const mapData = {
            seed: meshAndMap.map.seed,
            spacing: meshAndMap.map.spacing,
            t_peaks: meshAndMap.map.t_peaks,
            mountainJaggedness: meshAndMap.map.mountainJaggedness,
            windAngleDeg: meshAndMap.map.windAngleDeg,
            elevation_t: meshAndMap.map.elevation_t,
            elevation_r: meshAndMap.map.elevation_r,
            humidity_r: meshAndMap.map.humidity_r,
            moisture_t: meshAndMap.map.moisture_t,
            rainfall_r: meshAndMap.map.rainfall_r,
            s_downslope_t: meshAndMap.map.s_downslope_t,
            t_order: meshAndMap.map.t_order,
            flow_t: meshAndMap.map.flow_t,
            flow_s: meshAndMap.map.flow_s,
            r_wind_order: meshAndMap.map.r_wind_order,
            wind_sort_r: meshAndMap.map.wind_sort_r,
            mountain_distance_t: meshAndMap.map.mountain_distance_t
        };

        // Collect transferables
        const transferables: Transferable[] = [
            meshData._halfedges.buffer,
            meshData._triangles.buffer,
            meshData._s_of_r.buffer,
            meshData.is_boundary_t.buffer,
            meshData.length_s.buffer,
            mapData.elevation_t.buffer,
            mapData.elevation_r.buffer,
            mapData.humidity_r.buffer,
            mapData.moisture_t.buffer,
            mapData.rainfall_r.buffer,
            mapData.s_downslope_t.buffer,
            mapData.t_order.buffer,
            mapData.flow_t.buffer,
            mapData.flow_s.buffer,
            mapData.r_wind_order.buffer,
            mapData.wind_sort_r.buffer,
            mapData.mountain_distance_t.buffer
        ];

        (self as any).postMessage({
            jobId,
            success: true,
            meshData,
            mapData,
            townsAndRoads,
            cellRegions,
            distanceFromWater // [[regionId, distance], ...]
        }, transferables);

    } catch (err: unknown) {
        (self as any).postMessage({ jobId, success: false, error: (err as Error).message });
    }
};
