/**
 * Mapgen4PreviewRenderer — Draw mapgen4 mesh to canvas for preview and sidebar.
 * Polygons, rivers, roads, railroads.
 */

import { MapEditorConfig } from './MapEditorConfig';
import { EditorContext } from './EditorContext';
import {
    mapgen4ToZones,
    polygonPreviewColor,
    COAST_MAX_POLYGON_STEPS
} from './Mapgen4ZoneMapping';
import { computeRegionDistanceFromWater } from './Mapgen4RegionUtils';
import { RAILROAD_TILE_WORLD_PX } from './RailroadSplineBuilder';
import { drawRailroadSpline } from './Mapgen4RailroadPreview';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import type { Mapgen4Param, TownSite, RoadSegment, RailroadCrossing } from './Mapgen4Param';
import { runRoadGenerator } from './RoadGenerator';
import { buildMeshAndMap } from './Mapgen4Generator';

const PREVIEW_MAP_SIZE = 1000;

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
/** Fill color for polygons used as railroad stations (distinct from zone/terrain). */
const STATION_POLYGON_FILL = '#8B6914';

/**
 * Draw cached mesh + map to canvas (cheap). Viewport in mesh coords (0..1000).
 * towns and roadSegments are optional; when omitted, computed inline.
 * hiddenZoneIds: zone IDs to exclude. When omitted, uses EditorContext.hiddenZoneIds.
 * skipRailroad: when true, railroad not drawn on canvas (rendered as Pixi mesh in map editor).
 * target: canvas or 2d context. Game passes ctx to ensure same draw target.
 */
export function drawCachedMeshToCanvas(
    target: HTMLCanvasElement | CanvasRenderingContext2D,
    mesh: Mesh,
    map: Mapgen4Map,
    param: Mapgen4Param,
    vpX: number,
    vpY: number,
    vpW: number,
    vpH: number,
    cachedTowns?: TownSite[],
    cachedRoadSegments?: RoadSegment[],
    cachedRailroadPath?: number[],
    cachedRailroadCrossings?: RailroadCrossing[],
    cachedRailroadStationIds?: number[],
    hiddenZoneIds?: Set<string>,
    skipRailroad?: boolean,
    cachedDistanceFromWater?: Map<number, number>
): void {
    const ctx = 'getContext' in target ? target.getContext('2d') : target;
    if (!ctx) return;
    const canvas = ctx.canvas;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const scaleX = w / vpW;
    const scaleY = h / vpH;
    const toCanvas = (x: number, y: number) => ({
        x: (x - vpX) * scaleX,
        y: (y - vpY) * scaleY
    });

    const hidden = hiddenZoneIds ?? EditorContext.hiddenZoneIds;
    const townsParam = param.towns;
    const roadsParam = param.roads;
    const towns = cachedTowns ?? [];
    const townRadiusSq = (townsParam?.townRadius ?? 30) ** 2;
    const roadsOk =
        roadsParam?.enabled &&
        roadsParam &&
        (towns.length >= 2 || (roadsParam.coverageGridSize ?? 0) >= 2);
    const roadSegments =
        cachedRoadSegments ??
        (roadsOk
            ? runRoadGenerator(
                mesh,
                map,
                towns.map((t) => t.regionId),
                {
                    shortcutsPerTown: roadsParam.shortcutsPerTown ?? 1,
                    riverCrossingCost: roadsParam.riverCrossingCost ?? 1.2,
                    seed: roadsParam.seed ?? param.meshSeed,
                    coverageGridSize: roadsParam.coverageGridSize ?? 0,
                    slopeWeight: roadsParam.slopeWeight ?? 3,
                    waypointCurviness: roadsParam.waypointCurviness ?? 0.15
                },
                param.rivers
            )
            : []);

    let railroadPath: number[] = [];
    let railroadCrossings: RailroadCrossing[] = [];
    let railroadStationIds: number[] = [];
    if (cachedRailroadStationIds != null) railroadStationIds = cachedRailroadStationIds;
    if (cachedRailroadPath != null && cachedRailroadCrossings != null) {
        railroadPath = cachedRailroadPath;
        railroadCrossings = cachedRailroadCrossings;
    }

    const margin = 80;
    const vpMinX = vpX - margin;
    const vpMaxX = vpX + vpW + margin;
    const vpMinY = vpY - margin;
    const vpMaxY = vpY + vpH + margin;

    const distanceFromWater =
        cachedDistanceFromWater ?? computeRegionDistanceFromWater(mesh, map, COAST_MAX_POLYGON_STEPS);
    const stationRegionSet = new Set(railroadStationIds);
    const tOut: number[] = [];
    const scale = Math.min(scaleX, scaleY);

    _drawPolygons(ctx, mesh, map, param, towns, hidden, stationRegionSet, distanceFromWater, townRadiusSq, tOut, scaleX, scaleY, vpX, vpY, vpMinX, vpMaxX, vpMinY, vpMaxY);
    _drawRivers(ctx, mesh, map, param, scaleX, scaleY, scale, vpX, vpY, vpMinX, vpMaxX, vpMinY, vpMaxY);
    _drawRoads(ctx, mesh, roadSegments, param, scaleX, scaleY, scale, vpX, vpY, vpMinX, vpMaxX, vpMinY, vpMaxY);

    if (!skipRailroad && railroadPath.length >= 2) {
        const WORLD_WIDTH_PX_RAIL = MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE;
        const tileWidthCanvas = RAILROAD_TILE_WORLD_PX * scale * (1000 / WORLD_WIDTH_PX_RAIL);
        drawRailroadSpline(
            ctx,
            mesh,
            map,
            railroadPath,
            railroadCrossings,
            param.meshSeed,
            toCanvas,
            scale,
            tileWidthCanvas,
            vpMinX,
            vpMaxX,
            vpMinY,
            vpMaxY,
            railroadStationIds
        );
    }
}

function _drawPolygons(
    ctx: CanvasRenderingContext2D, mesh: Mesh, map: Mapgen4Map, param: Mapgen4Param, towns: TownSite[], hidden: Set<string>,
    stationRegionSet: Set<number>, distanceFromWater: Map<number, number>, townRadiusSq: number, tOut: number[],
    scaleX: number, scaleY: number, vpX: number, vpY: number, vpMinX: number, vpMaxX: number, vpMinY: number, vpMaxY: number
) {
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const rx = mesh.x_of_r(r);
        const ry = mesh.y_of_r(r);
        if (rx < vpMinX || rx > vpMaxX || ry < vpMinY || ry > vpMaxY) continue;
        mesh.t_around_r(r, tOut);
        if (tOut.length < 3) continue;
        const elev = map.elevation_r[r];
        const rain = map.rainfall_r[r];
        const dist = distanceFromWater.get(r);
        const zones = mapgen4ToZones(elev, rain, false, rx, ry, param.meshSeed, dist);
        let civ: string | undefined;
        for (const t of towns) {
            const tx = mesh.x_of_r(t.regionId);
            const ty = mesh.y_of_r(t.regionId);
            if ((rx - tx) ** 2 + (ry - ty) ** 2 <= townRadiusSq) {
                civ = t.zoneId;
                break;
            }
        }
        if (civ) zones['civilization'] = civ;
        const filteredZones: Record<string, string> = {};
        for (const [k, v] of Object.entries(zones)) {
            if (v && !hidden.has(v)) filteredZones[k] = v;
        }
        ctx.beginPath();
        ctx.moveTo((mesh.x_of_t(tOut[0]!) - vpX) * scaleX, (mesh.y_of_t(tOut[0]!) - vpY) * scaleY);
        for (let i = 1; i < tOut.length; i++) {
            ctx.lineTo((mesh.x_of_t(tOut[i]!) - vpX) * scaleX, (mesh.y_of_t(tOut[i]!) - vpY) * scaleY);
        }
        ctx.closePath();
        ctx.fillStyle = stationRegionSet.has(r) ? STATION_POLYGON_FILL : polygonPreviewColor(elev, filteredZones);
        ctx.fill();
    }
}

function _drawRivers(
    ctx: CanvasRenderingContext2D, mesh: Mesh, map: Mapgen4Map, param: Mapgen4Param,
    scaleX: number, scaleY: number, scale: number, vpX: number, vpY: number, vpMinX: number, vpMaxX: number, vpMinY: number, vpMaxY: number
) {
    const MIN_FLOW = Math.exp(param.rivers.lg_min_flow);
    const RIVER_WIDTH = Math.exp(param.rivers.lg_river_width);
    ctx.strokeStyle = '#2a5a8a';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let s = 0; s < mesh.numSolidSides; s++) {
        const flow = map.flow_s[s];
        if (flow < MIN_FLOW) continue;
        const r1 = mesh.r_begin_s(s);
        const r2 = mesh.r_end_s(s);
        if (mesh.is_ghost_r(r1) || mesh.is_ghost_r(r2)) continue;
        const tInner = mesh.t_inner_s(s);
        const tOuter = mesh.t_outer_s(s);
        if (mesh.is_ghost_t(tInner) || mesh.is_ghost_t(tOuter)) continue;
        const ax = mesh.x_of_t(tInner);
        const ay = mesh.y_of_t(tInner);
        const bx = mesh.x_of_t(tOuter);
        const by = mesh.y_of_t(tOuter);
        if ((ax < vpMinX && bx < vpMinX) || (ax > vpMaxX && bx > vpMaxX) || (ay < vpMinY && by < vpMinY) || (ay > vpMaxY && by > vpMaxY)) continue;
        const widthMesh = Math.sqrt(flow - MIN_FLOW) * param.spacing * RIVER_WIDTH;
        ctx.lineWidth = Math.max(1, widthMesh * scale);
        ctx.beginPath();
        ctx.moveTo((ax - vpX) * scaleX, (ay - vpY) * scaleY);
        ctx.lineTo((bx - vpX) * scaleX, (by - vpY) * scaleY);
        ctx.stroke();
    }
}

function _drawRoads(
    ctx: CanvasRenderingContext2D, mesh: Mesh, roadSegments: RoadSegment[], param: Mapgen4Param,
    scaleX: number, scaleY: number, scale: number, vpX: number, vpY: number, vpMinX: number, vpMaxX: number, vpMinY: number, vpMaxY: number
) {
    const baseWidthWorld = param.roads?.baseWidth ?? 80;
    const WORLD_WIDTH_PX = MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE;
    const roadWidthPx = baseWidthWorld * scale * (1000 / WORLD_WIDTH_PX);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const seg of roadSegments) {
        const ax = mesh.x_of_r(seg.r1);
        const ay = mesh.y_of_r(seg.r1);
        const bx = mesh.x_of_r(seg.r2);
        const by = mesh.y_of_r(seg.r2);
        if ((ax < vpMinX && bx < vpMinX) || (ax > vpMaxX && bx > vpMaxX) || (ay < vpMinY && by < vpMinY) || (ay > vpMaxY && by > vpMaxY)) continue;
        ctx.strokeStyle = seg.crossesRiver ? '#5a5a5a' : '#c4a574';
        ctx.lineWidth = Math.max(2, roadWidthPx);
        ctx.beginPath();
        ctx.moveTo((ax - vpX) * scaleX, (ay - vpY) * scaleY);
        ctx.lineTo((bx - vpX) * scaleX, (by - vpY) * scaleY);
        ctx.stroke();
    }
}
