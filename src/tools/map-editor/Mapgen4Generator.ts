/**
 * Mapgen4Generator — Run mapgen4 and rasterize to editor ChunkData.
 * Orchestrates mesh building, towns/roads/railroads, preview, and rasterization.
 */

import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import type { ChunkData } from './MapEditorTypes';
import { buildMesh, makeDefaultConstraints } from './mapgen4/buildMesh';
import Mapgen4Map from './mapgen4/map';
import type { MapConstraints } from './mapgen4/map';
import type { Mesh } from './mapgen4/types';
import { runRoadGenerator } from './RoadGenerator';
import { runRailroadGenerator } from './RailroadGenerator';
import {
    buildCellRegions,
    findRegionAt,
    MAPGEN4_MAP_SIZE,
    computeRegionDistanceFromWater
} from './Mapgen4RegionUtils';
import { mapgen4ToZones, COAST_MAX_POLYGON_STEPS } from './Mapgen4ZoneMapping';
import { isTileOnRiver } from './Mapgen4RiverUtils';
import { drawCachedMeshToCanvas } from './Mapgen4PreviewRenderer';
import { buildRailroadSplineMeshData } from './RailroadSplineBuilder';

import type { Mapgen4Param } from './Mapgen4Param';
export type { TownSite, RoadSegment, RailroadCrossing, Mapgen4Param } from './Mapgen4Param';
export type { TownsParam, RoadsParam, RailroadsParam } from './Mapgen4Param';

export { drawCachedMeshToCanvas } from './Mapgen4PreviewRenderer';
export { buildRailroadSplineMeshData } from './RailroadSplineBuilder';
export { mapgen4ToZones } from './Mapgen4ZoneMapping';

export interface MeshAndMap {
    mesh: Mesh;
    map: Mapgen4Map;
}

const PREVIEW_MAP_SIZE = 1000;

/** Build mesh + map from params (expensive). Call once when params change. */
export function buildMeshAndMap(param: Mapgen4Param): MeshAndMap {
    const { mesh, t_peaks } = buildMesh(param.meshSeed, param.spacing, param.mountainSpacing);
    const constraints: MapConstraints = makeDefaultConstraints(
        param.elevation.seed,
        param.elevation.island
    );
    const map = new Mapgen4Map(mesh, t_peaks, { spacing: param.spacing });
    map.assignElevation(param.elevation, constraints);
    map.assignRainfall(param.biomes);
    map.assignRivers(param.rivers);
    return { mesh, map };
}

/** Manual editor data: when present, overrides procedural towns/stations/waypoints. */
export interface ManualTownsAndRailroads {
    manualTowns?: number[];
    manualStations?: { regionId: number; order: number }[];
    railroadWaypoints?: { legIndex: number; regionId: number }[];
}

/** Compute towns, roads, and railroads from manual data only. No procedural towns or railroads. */
export function computeTownsAndRoads(
    mesh: Mesh,
    map: Mapgen4Map,
    param: Mapgen4Param,
    manual?: ManualTownsAndRailroads
): {
    towns: import('./TownGenerator').TownSite[];
    roadSegments: import('./RoadGenerator').RoadSegment[];
    railroadPath: number[];
    railroadCrossings: import('./RailroadGenerator').RailroadCrossing[];
    railroadStationIds: number[];
} {
    const townsParam = param.towns;
    const defaultZoneId = townsParam?.defaultZoneId ?? 'zone_grasslands';

    const towns: import('./TownGenerator').TownSite[] =
        manual?.manualTowns && manual.manualTowns.length > 0
            ? manual.manualTowns.map((regionId) => ({ regionId, zoneId: defaultZoneId }))
            : [];

    const roadsOk =
        param.roads?.enabled &&
        param.roads &&
        (towns.length >= 2 || (param.roads.coverageGridSize ?? 0) >= 2);
    const roadSegments = roadsOk
        ? runRoadGenerator(
              mesh,
              map,
              towns.map((t) => t.regionId),
              {
                  shortcutsPerTown: param.roads.shortcutsPerTown ?? 1,
                  riverCrossingCost: param.roads.riverCrossingCost ?? 1.2,
                  seed: param.roads.seed ?? param.meshSeed,
                  coverageGridSize: param.roads.coverageGridSize ?? 0,
                  slopeWeight: param.roads.slopeWeight ?? 3,
                  waypointCurviness: param.roads.waypointCurviness ?? 0.15
              },
              param.rivers
          )
        : [];

    const railroadsOk =
        param.railroads?.enabled &&
        param.railroads &&
        (manual?.manualStations?.length ?? 0) >= 2;
    let railroadPath: number[] = [];
    let railroadCrossings: import('./RailroadGenerator').RailroadCrossing[] = [];
    let railroadStationIds: number[] = [];
    if (railroadsOk && manual?.manualStations && manual.manualStations.length >= 2) {
        const sorted = [...manual.manualStations].sort((a, b) => a.order - b.order);
        const explicitOrder = sorted.map((s) => s.regionId);
        railroadStationIds = explicitOrder;
        try {
            const waypointsByLeg: number[][] = [];
            if (manual.railroadWaypoints?.length) {
                for (const w of manual.railroadWaypoints) {
                    const i = w.legIndex;
                    while (waypointsByLeg.length <= i) waypointsByLeg.push([]);
                    waypointsByLeg[i]!.push(w.regionId);
                }
            }
            const overrides: import('./RailroadGenerator').RailroadGeneratorOverrides = {
                explicitStationOrder: explicitOrder,
                waypointsByLeg: waypointsByLeg.length ? waypointsByLeg : undefined
            };
            const result = runRailroadGenerator(
                mesh,
                map,
                param.rivers,
                townsParam?.townRadius ?? 30,
                overrides
            );
            railroadPath = result.path;
            railroadCrossings = result.crossings;
            railroadStationIds = result.stationRegionIds;
        } catch (err) {
            Logger.warn('[Mapgen4] Railroad generation failed:', err);
            railroadPath = [];
            railroadCrossings = [];
        }
    }

    return { towns, roadSegments, railroadPath, railroadCrossings, railroadStationIds };
}

/** Run mesh + map only and draw to canvas for instant preview. */
export function runAndDrawPreview(canvas: HTMLCanvasElement, param: Mapgen4Param): void {
    const { mesh, map } = buildMeshAndMap(param);
    drawCachedMeshToCanvas(canvas, mesh, map, param, 0, 0, PREVIEW_MAP_SIZE, PREVIEW_MAP_SIZE);
}

/** Draw procedural preview with a viewport in mesh coords (0..1000). */
export function runAndDrawPreviewWithViewport(
    canvas: HTMLCanvasElement,
    param: Mapgen4Param,
    vpX: number,
    vpY: number,
    vpW: number,
    vpH: number
): void {
    const { mesh, map } = buildMeshAndMap(param);
    drawCachedMeshToCanvas(canvas, mesh, map, param, vpX, vpY, vpW, vpH);
}

/** Generate world data from mapgen4 params and rasterize to ChunkData map. */
export function generateMapgen4(param: Mapgen4Param): Map<string, ChunkData> {
    const { mesh, map } = buildMeshAndMap(param);
    const { towns, roadSegments, railroadPath, railroadCrossings } = computeTownsAndRoads(
        mesh,
        map,
        param
    );

    const cellRegions = buildCellRegions(mesh);
    const worldW = MapEditorConfig.WORLD_WIDTH_TILES;
    const worldH = MapEditorConfig.WORLD_HEIGHT_TILES;
    const CHUNK_SIZE = MapEditorConfig.CHUNK_SIZE;
    const townRadiusSq = (param.towns?.townRadius ?? 30) ** 2;

    const worldData = new Map<string, ChunkData>();
    const distanceFromWater = computeRegionDistanceFromWater(mesh, map, COAST_MAX_POLYGON_STEPS);

    for (let ty = 0; ty < worldH; ty++) {
        for (let tx = 0; tx < worldW; tx++) {
            const cx = Math.floor(tx / CHUNK_SIZE);
            const cy = Math.floor(ty / CHUNK_SIZE);
            const chunkKey = `${cx},${cy}`;
            if (!worldData.has(chunkKey)) {
                worldData.set(chunkKey, {
                    id: chunkKey,
                    objects: [],
                    zones: {}
                });
            }
            const chunk = worldData.get(chunkKey)!;
            const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const tileKey = `${lx},${ly}`;

            const x = ((tx + 0.5) / worldW) * MAPGEN4_MAP_SIZE;
            const y = ((ty + 0.5) / worldH) * MAPGEN4_MAP_SIZE;
            const r = findRegionAt(mesh, x, y, cellRegions);
            const elevation = map.elevation_r[r];
            const rainfall = map.rainfall_r[r];
            const isRiver = isTileOnRiver(x, y, r, mesh, map.flow_s, param.rivers, param.spacing);
            const dist = distanceFromWater.get(r);
            chunk.zones![tileKey] = mapgen4ToZones(
                elevation,
                rainfall,
                isRiver,
                x,
                y,
                param.meshSeed,
                dist
            );

            for (const t of towns) {
                const txMesh = mesh.x_of_r(t.regionId);
                const tyMesh = mesh.y_of_r(t.regionId);
                if ((x - txMesh) ** 2 + (y - tyMesh) ** 2 <= townRadiusSq) {
                    chunk.zones![tileKey]['civilization'] = t.zoneId;
                    break;
                }
            }
        }
    }

    for (const seg of roadSegments) {
        if (!seg.crossesRiver) continue;
        const x1 = mesh.x_of_r(seg.r1);
        const y1 = mesh.y_of_r(seg.r1);
        const x2 = mesh.x_of_r(seg.r2);
        const y2 = mesh.y_of_r(seg.r2);
        const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mx = x1 + t * (x2 - x1);
            const my = y1 + t * (y2 - y1);
            const tileX = Math.floor((mx / MAPGEN4_MAP_SIZE) * worldW);
            const tileY = Math.floor((my / MAPGEN4_MAP_SIZE) * worldH);
            if (tileX >= 0 && tileX < worldW && tileY >= 0 && tileY < worldH) {
                const cx = Math.floor(tileX / CHUNK_SIZE);
                const cy = Math.floor(tileY / CHUNK_SIZE);
                const chunkKey = `${cx},${cy}`;
                const chunk = worldData.get(chunkKey);
                if (chunk && chunk.zones) {
                    const lx = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                    const ly = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                    const tileKey = `${lx},${ly}`;
                    if (!chunk.zones[tileKey]) chunk.zones[tileKey] = {};
                    chunk.zones[tileKey]['civilization'] = 'civ_bridge';
                }
            }
        }
    }

    for (const cross of railroadCrossings) {
        if (!cross.crossesRiver) continue;
        const x1 = mesh.x_of_r(cross.r1);
        const y1 = mesh.y_of_r(cross.r1);
        const x2 = mesh.x_of_r(cross.r2);
        const y2 = mesh.y_of_r(cross.r2);
        const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2);
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const mx = x1 + t * (x2 - x1);
            const my = y1 + t * (y2 - y1);
            const tileX = Math.floor((mx / MAPGEN4_MAP_SIZE) * worldW);
            const tileY = Math.floor((my / MAPGEN4_MAP_SIZE) * worldH);
            if (tileX >= 0 && tileX < worldW && tileY >= 0 && tileY < worldH) {
                const cx = Math.floor(tileX / CHUNK_SIZE);
                const cy = Math.floor(tileY / CHUNK_SIZE);
                const chunkKey = `${cx},${cy}`;
                const chunk = worldData.get(chunkKey);
                if (chunk && chunk.zones) {
                    const lx = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                    const ly = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                    const tileKey = `${lx},${ly}`;
                    if (!chunk.zones[tileKey]) chunk.zones[tileKey] = {};
                    chunk.zones[tileKey]['civilization'] = 'civ_bridge';
                }
            }
        }
    }

    return worldData;
}

/** Serialize ChunkData map to payload for MapEditorCore.loadData(). */
export function toSerializedPayload(worldData: Map<string, ChunkData>): {
    version: number;
    chunks: ChunkData[];
} {
    const chunks: ChunkData[] = [];
    worldData.forEach((chunk) => chunks.push(chunk));
    return { version: 1, chunks };
}

/** Default mapgen4 params (match mapgen4.ts initialParams).
 * Includes towns, roads, railroads so the game shows civilization features
 * when map fetch fails (e.g. production build, no API server).
 */
export const DEFAULT_MAPGEN4_PARAM: Mapgen4Param = {
    spacing: 5.5,
    mountainSpacing: 35,
    meshSeed: 12345,
    elevation: {
        seed: 187,
        island: 0.5,
        noisy_coastlines: 0.01,
        hill_height: 0.02,
        mountain_jagged: 0,
        mountain_sharpness: 9.8,
        mountain_folds: 0.05,
        ocean_depth: 1.4
    },
    biomes: {
        wind_angle_deg: 0,
        raininess: 0.9,
        rain_shadow: 0.5,
        evaporation: 0.5
    },
    rivers: {
        lg_min_flow: 2.7,
        lg_river_width: -2.4,
        flow: 0.2
    },
    towns: {
        enabled: true,
        numTowns: 6,
        minSpacing: 80,
        townRadius: 20,
        defaultZoneId: 'civ_town',
        elevationMin: 0,
        elevationMax: 0.35,
        rainfallMin: 0.2,
        rainfallMax: 1
    },
    roads: {
        enabled: true,
        baseWidth: 256,
        shortcutsPerTown: 2,
        riverCrossingCost: 1.2,
        coverageGridSize: 4,
        slopeWeight: 4,
        waypointCurviness: 0.15
    },
    railroads: {
        enabled: true
    }
};
