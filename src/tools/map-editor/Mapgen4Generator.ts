/**
 * Mapgen4Generator — Run mapgen4 and rasterize to editor ChunkData.
 * Uses mapgen4 mesh + Map (elevation, rainfall, rivers) then samples to tile grid.
 */

import { MapEditorConfig } from './MapEditorConfig';
import type { ChunkData, MapObject } from './MapEditorTypes';
import { getTileColorHex } from './ZoneColorHelper';
import {
    rainfallToBiomeFromConfig,
    elevationToTerrainFromConfig
} from './Mapgen4BiomeConfig';
import { buildMesh, makeDefaultConstraints } from './mapgen4/buildMesh';
import Mapgen4Map from './mapgen4/map';
import type { ElevationParam, BiomesParam, RiversParam, MapConstraints } from './mapgen4/map';
import type { Mesh } from './mapgen4/types';

export interface Mapgen4Param {
    spacing: number;
    mountainSpacing: number;
    meshSeed: number;
    elevation: ElevationParam;
    biomes: BiomesParam;
    rivers: RiversParam;
}

const MAP_SIZE = 1000;
const GRID_CELL = 20; // 50x50 grid for region lookup
const GRID_N = MAP_SIZE / GRID_CELL;

function findRegionAt(mesh: Mesh, x: number, y: number, cellRegions: number[][]): number {
    const cx = Math.max(0, Math.min(GRID_N - 1, Math.floor(x / GRID_CELL)));
    const cy = Math.max(0, Math.min(GRID_N - 1, Math.floor(y / GRID_CELL)));
    const candidates: number[] = [];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < GRID_N && ny >= 0 && ny < GRID_N) {
                const list = cellRegions[ny * GRID_N + nx];
                if (list) candidates.push(...list);
            }
        }
    }
    if (candidates.length === 0) return 0;
    let bestR = candidates[0];
    let bestD = (mesh.x_of_r(bestR) - x) ** 2 + (mesh.y_of_r(bestR) - y) ** 2;
    for (let i = 1; i < candidates.length; i++) {
        const r = candidates[i];
        if (mesh.is_ghost_r(r)) continue;
        const d = (mesh.x_of_r(r) - x) ** 2 + (mesh.y_of_r(r) - y) ** 2;
        if (d < bestD) {
            bestD = d;
            bestR = r;
        }
    }
    return bestR;
}

function buildCellRegions(mesh: Mesh): number[][] {
    const grid: number[][] = Array.from<number[]>({ length: GRID_N * GRID_N }, () => []);
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        const gx = Math.floor(mesh.x_of_r(r) / GRID_CELL);
        const gy = Math.floor(mesh.y_of_r(r) / GRID_CELL);
        if (gx >= 0 && gx < GRID_N && gy >= 0 && gy < GRID_N) {
            const idx = gy * GRID_N + gx;
            grid[idx].push(r);
        }
    }
    return grid;
}

const DEFAULT_BIOME_FOR_TERRAIN = 'grasslands';

/** Central mapping: mapgen4 elevation/rainfall/river → editor zones. Used by rasterization and preview. */
export function mapgen4ToZones(
    elevation: number,
    rainfall: number,
    isRiver: boolean
): Record<string, string> {
    const zones: Record<string, string> = {};
    if (elevation < -0.1) {
        zones['terrain'] = 'terrain_water';
        zones['biome'] = DEFAULT_BIOME_FOR_TERRAIN;
    } else if (elevation < 0) {
        zones['terrain'] = 'terrain_coast';
        zones['biome'] = DEFAULT_BIOME_FOR_TERRAIN;
    } else if (isRiver) {
        zones['terrain'] = 'terrain_river';
        zones['biome'] = DEFAULT_BIOME_FOR_TERRAIN;
    } else {
        zones['biome'] = rainfallToBiomeFromConfig(rainfall);
        zones['terrain'] = elevationToTerrainFromConfig(elevation);
    }
    return zones;
}

/** Distance from point (px,py) to segment (ax,ay)-(bx,by). */
function pointToSegmentDistance(
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
): number {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    return Math.hypot(px - qx, py - qy);
}

/**
 * Whether tile at (x,y) in region r is on a river, using mapgen4's flow_s and
 * his river width formula: width = sqrt(flow - MIN_FLOW) * spacing * RIVER_WIDTH.
 */
function isTileOnRiver(
    x: number,
    y: number,
    r: number,
    mesh: Mesh,
    flow_s: Float32Array,
    riversParam: { lg_min_flow: number; lg_river_width: number },
    spacing: number
): boolean {
    const MIN_FLOW = Math.exp(riversParam.lg_min_flow);
    const RIVER_WIDTH = Math.exp(riversParam.lg_river_width);
    const sides: number[] = [];
    mesh.s_around_r(r, sides);
    for (let i = 0; i < sides.length; i++) {
        const s = sides[i];
        const flow = flow_s[s];
        if (flow < MIN_FLOW) continue;
        const width = Math.sqrt(flow - MIN_FLOW) * spacing * RIVER_WIDTH;
        const r1 = mesh.r_begin_s(s);
        const r2 = mesh.r_end_s(s);
        const ax = mesh.x_of_r(r1);
        const ay = mesh.y_of_r(r1);
        const bx = mesh.x_of_r(r2);
        const by = mesh.y_of_r(r2);
        if (pointToSegmentDistance(x, y, ax, ay, bx, by) < width) return true;
    }
    return false;
}

const PREVIEW_MAP_SIZE = 1000;

export interface MeshAndMap {
    mesh: Mesh;
    map: Mapgen4Map;
}

/**
 * Build mesh + map from params (expensive). Call once when params change; reuse for drawing.
 */
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

/** Elevation/rainfall to CSS-style fill color for canvas preview (sidebar). */
function previewColor(elevation: number, rainfall: number): string {
    const zones = mapgen4ToZones(elevation, rainfall, false);
    const hex = getTileColorHex(zones);
    return '#' + hex.toString(16).padStart(6, '0');
}

/**
 * Draw cached mesh + map to canvas (cheap). Viewport in mesh coords (0..1000).
 */
export function drawCachedMeshToCanvas(
    canvas: HTMLCanvasElement,
    mesh: Mesh,
    map: Mapgen4Map,
    param: Mapgen4Param,
    vpX: number,
    vpY: number,
    vpW: number,
    vpH: number
): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const scaleX = w / vpW;
    const scaleY = h / vpH;

    const toCanvas = (x: number, y: number) => ({
        x: (x - vpX) * scaleX,
        y: (y - vpY) * scaleY
    });

    const tOut: number[] = [];
    for (let r = 0; r < mesh.numSolidRegions; r++) {
        if (mesh.is_ghost_r(r)) continue;
        mesh.t_around_r(r, tOut);
        if (tOut.length < 3) continue;
        const elev = map.elevation_r[r];
        const rain = map.rainfall_r[r];
        ctx.beginPath();
        const first = toCanvas(mesh.x_of_t(tOut[0]), mesh.y_of_t(tOut[0]));
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < tOut.length; i++) {
            const p = toCanvas(mesh.x_of_t(tOut[i]), mesh.y_of_t(tOut[i]));
            ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
        ctx.fillStyle = previewColor(elev, rain);
        ctx.fill();
    }

    const MIN_FLOW = Math.exp(param.rivers.lg_min_flow);
    ctx.strokeStyle = '#2a5a8a';
    ctx.lineWidth = Math.max(1, 2 * Math.min(scaleX, scaleY));
    ctx.lineCap = 'round';
    for (let s = 0; s < mesh.numSolidSides; s++) {
        const flow = map.flow_s[s];
        if (flow < MIN_FLOW) continue;
        const r1 = mesh.r_begin_s(s);
        const r2 = mesh.r_end_s(s);
        if (mesh.is_ghost_r(r1) || mesh.is_ghost_r(r2)) continue;
        const a = toCanvas(mesh.x_of_r(r1), mesh.y_of_r(r1));
        const b = toCanvas(mesh.x_of_r(r2), mesh.y_of_r(r2));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }
}

/**
 * Run mesh + map only (no rasterization) and draw to canvas for instant preview.
 * Call this on slider changes; use generateMapgen4 + load for "Apply to map".
 */
export function runAndDrawPreview(canvas: HTMLCanvasElement, param: Mapgen4Param): void {
    const { mesh, map } = buildMeshAndMap(param);
    drawCachedMeshToCanvas(canvas, mesh, map, param, 0, 0, PREVIEW_MAP_SIZE, PREVIEW_MAP_SIZE);
}

/**
 * Draw procedural preview with a viewport in mesh coords (0..1000).
 * Used by main view to support pan/zoom.
 */
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

/**
 * Generate world data from mapgen4 params and rasterize to ChunkData map.
 */
export function generateMapgen4(param: Mapgen4Param): Map<string, ChunkData> {
    const { mesh, t_peaks } = buildMesh(param.meshSeed, param.spacing, param.mountainSpacing);
    const constraints: MapConstraints = makeDefaultConstraints(
        param.elevation.seed,
        param.elevation.island
    );
    const map = new Mapgen4Map(mesh, t_peaks, {
        spacing: param.spacing
    });
    map.assignElevation(param.elevation, constraints);
    map.assignRainfall(param.biomes);
    map.assignRivers(param.rivers);

    const cellRegions = buildCellRegions(mesh);
    const worldW = MapEditorConfig.WORLD_WIDTH_TILES;
    const worldH = MapEditorConfig.WORLD_HEIGHT_TILES;
    const CHUNK_SIZE = MapEditorConfig.CHUNK_SIZE;

    const worldData = new Map<string, ChunkData>();

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

            const x = ((tx + 0.5) / worldW) * MAP_SIZE;
            const y = ((ty + 0.5) / worldH) * MAP_SIZE;
            const r = findRegionAt(mesh, x, y, cellRegions);
            const elevation = map.elevation_r[r];
            const rainfall = map.rainfall_r[r];
            const isRiver = isTileOnRiver(x, y, r, mesh, map.flow_s, param.rivers, param.spacing);
            chunk.zones![tileKey] = mapgen4ToZones(elevation, rainfall, isRiver);
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

/** Default mapgen4 params (match mapgen4.ts initialParams). */
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
    }
};
