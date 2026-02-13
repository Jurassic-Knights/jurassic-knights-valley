/**
 * Mapgen4PreviewRenderer — Draw mapgen4 mesh to canvas for preview and sidebar.
 * Polygons, rivers, roads, railroads.
 */

import { MapEditorConfig } from './MapEditorConfig';
import { EditorContext } from './EditorContext';
import { mapgen4ToZones, polygonPreviewColor } from './Mapgen4ZoneMapping';
import { RAILROAD_TILE_WORLD_PX } from './Mapgen4SplineUtils';
import { drawRailroadSpline } from './Mapgen4RailroadPreview';
import type { Mesh } from './mapgen4/types';
import type Mapgen4Map from './mapgen4/map';
import type { Mapgen4Param, TownSite, RoadSegment, RailroadCrossing } from './Mapgen4Param';
import { runTownGenerator } from './TownGenerator';
import { runRoadGenerator } from './RoadGenerator';
import { runRailroadGenerator } from './RailroadGenerator';

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
    hiddenZoneIds?: Set<string>,
    skipRailroad?: boolean
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
    const towns =
        cachedTowns ??
        (townsParam?.enabled && townsParam
            ? runTownGenerator(mesh, map, townsParam, param.rivers, param.meshSeed)
            : []);
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

    const railroadsParam = param.railroads;
    const railroadsOk =
        railroadsParam?.enabled && railroadsParam && towns.length >= 2;
    const { railroadPath, railroadCrossings } =
        cachedRailroadPath != null && cachedRailroadCrossings != null
            ? { railroadPath: cachedRailroadPath, railroadCrossings: cachedRailroadCrossings }
            : railroadsOk
                ? runRailroadGenerator(
                      mesh,
                      map,
                      towns.map((t) => t.regionId),
                      roadSegments,
                      {
                          slopeWeight: railroadsParam.slopeWeight ?? 12,
                          turnWeight: railroadsParam.turnWeight ?? 8,
                          riverCrossingCost: railroadsParam.riverCrossingCost ?? 1.5,
                          seed: railroadsParam.seed ?? param.meshSeed
                      },
                      param.rivers,
                      townsParam?.townRadius ?? 30
                  )
                : { railroadPath: [], railroadCrossings: [] };

    const margin = 80;
    const vpMinX = vpX - margin;
    const vpMaxX = vpX + vpW + margin;
    const vpMinY = vpY - margin;
    const vpMaxY = vpY + vpH + margin;

    const tOut: number[] = [];
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const rx = mesh.x_of_r(r);
        const ry = mesh.y_of_r(r);
        if (rx < vpMinX || rx > vpMaxX || ry < vpMinY || ry > vpMaxY) continue;
        mesh.t_around_r(r, tOut);
        if (tOut.length < 3) continue;
        const elev = map.elevation_r[r];
        const rain = map.rainfall_r[r];
        const zones = mapgen4ToZones(elev, rain, false, rx, ry, param.meshSeed);
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
        const first = toCanvas(mesh.x_of_t(tOut[0]), mesh.y_of_t(tOut[0]));
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < tOut.length; i++) {
            const p = toCanvas(mesh.x_of_t(tOut[i]), mesh.y_of_t(tOut[i]));
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = polygonPreviewColor(elev, filteredZones);
        ctx.fill();
    }

    const MIN_FLOW = Math.exp(param.rivers.lg_min_flow);
    const RIVER_WIDTH = Math.exp(param.rivers.lg_river_width);
    const scale = Math.min(scaleX, scaleY);
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
        if (
            (ax < vpMinX && bx < vpMinX) ||
            (ax > vpMaxX && bx > vpMaxX) ||
            (ay < vpMinY && by < vpMinY) ||
            (ay > vpMaxY && by > vpMaxY)
        )
            continue;
        const widthMesh = Math.sqrt(flow - MIN_FLOW) * param.spacing * RIVER_WIDTH;
        ctx.lineWidth = Math.max(1, widthMesh * scale);
        const a = toCanvas(ax, ay);
        const b = toCanvas(bx, by);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }

    const baseWidthWorld = roadsParam?.baseWidth ?? 80;
    const WORLD_WIDTH_PX = MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE;
    const roadWidthPx = baseWidthWorld * scale * (1000 / WORLD_WIDTH_PX);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const seg of roadSegments) {
        const ax = mesh.x_of_r(seg.r1);
        const ay = mesh.y_of_r(seg.r1);
        const bx = mesh.x_of_r(seg.r2);
        const by = mesh.y_of_r(seg.r2);
        if (
            (ax < vpMinX && bx < vpMinX) ||
            (ax > vpMaxX && bx > vpMaxX) ||
            (ay < vpMinY && by < vpMinY) ||
            (ay > vpMaxY && by > vpMaxY)
        )
            continue;
        ctx.strokeStyle = seg.crossesRiver ? '#5a5a5a' : '#c4a574';
        ctx.lineWidth = Math.max(2, roadWidthPx);
        const a = toCanvas(ax, ay);
        const b = toCanvas(bx, by);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }

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
            vpMaxY
        );
    }
}
