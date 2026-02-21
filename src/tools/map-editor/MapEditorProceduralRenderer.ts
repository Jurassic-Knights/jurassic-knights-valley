/**
 * MapEditorProceduralRenderer — Unified canvas-based procedural map rendering.
 *
 * Main view and sidebar both use drawProceduralToCanvas (same code path).
 * Main view: draws current viewport to procedural canvas each frame when viewport changes.
 * Sidebar: draws full map (0..1000) to proc-preview-canvas.
 * Railroad meshes remain PIXI (in worldContainer) when enabled.
 */

import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { AssetLoader } from '@core/AssetLoader';
import { drawCachedMeshToCanvas } from './Mapgen4PreviewRenderer';
import { Logger } from '@core/Logger';
import { createRailroadMeshes } from './RailroadMeshRenderer';
import { buildMeshAndMap, computeTownsAndRoads, type ManualTownsAndRailroads } from './Mapgen4Generator';
import type { Mapgen4Param } from './Mapgen4Param';
import type { MeshAndMap } from './Mapgen4Generator';
import { buildCellRegions, computeRegionDistanceFromWater } from './Mapgen4RegionUtils';
import { COAST_MAX_POLYGON_STEPS } from './Mapgen4ZoneMapping';
import { runMapgenWorker } from './MapgenWorkerClient';

export interface ProceduralCache {
    meshAndMap: MeshAndMap;
    param: Mapgen4Param;
    towns: import('./Mapgen4Generator').TownSite[];
    roadSegments: import('./Mapgen4Generator').RoadSegment[];
    railroadPath: number[];
    railroadCrossings: import('./Mapgen4Generator').RailroadCrossing[];
    railroadStationIds: number[];
    /** For world→region hit-test (context menu, waypoints). */
    cellRegions: number[][];
    /** Cached BFS distance from water (region → distance); avoids per-frame recompute. */
    distanceFromWater: Map<number, number>;
}

export interface RailroadMeshState {
    railroadMeshContainer: PIXI.Container | null;
    railroadMeshes: PIXI.Mesh[];
    cacheKey: string | null;
}

/** Compute viewport in mesh coords (0..1000) from world container and zoom. */
export function worldToMeshViewport(
    worldContainer: PIXI.Container,
    zoom: number,
    canvasW: number,
    canvasH: number
): { vpX: number; vpY: number; vpW: number; vpH: number } {
    const viewX = -worldContainer.x / zoom;
    const viewY = -worldContainer.y / zoom;
    const viewW = canvasW / zoom;
    const viewH = canvasH / zoom;
    const MESH_PER_WORLD = 1000 / (MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE);
    return {
        vpX: viewX * MESH_PER_WORLD,
        vpY: viewY * MESH_PER_WORLD,
        vpW: viewW * MESH_PER_WORLD,
        vpH: viewH * MESH_PER_WORLD
    };
}

/** Update railroad PIXI meshes when cache or visibility changes. */
export function updateRailroadMeshes(
    cache: ProceduralCache,
    worldContainer: PIXI.Container,
    hiddenZoneIds: Set<string>,
    prev: RailroadMeshState,
    usePixiMesh = false
): RailroadMeshState {
    const visKey = [...hiddenZoneIds].sort().join(',');
    const pathKey = cache.railroadPath.join(',');
    const cacheKey = `${cache.param.meshSeed}|${visKey}|${pathKey}`;
    const useRailroadMesh =
        usePixiMesh && cache.param.railroads?.enabled && cache.railroadPath.length >= 2;

    if (!useRailroadMesh) {
        for (const m of prev.railroadMeshes) m.destroy();
        if (prev.railroadMeshContainer) {
            prev.railroadMeshContainer.destroy({ children: true });
        }
        return { railroadMeshContainer: null, railroadMeshes: [], cacheKey: null };
    }

    if (cacheKey === prev.cacheKey && prev.railroadMeshContainer) return prev;

    let railroadMeshContainer = prev.railroadMeshContainer;
    let railroadMeshes = prev.railroadMeshes;

    if (!railroadMeshContainer) {
        railroadMeshContainer = new PIXI.Container();
        railroadMeshContainer.zIndex = -0.9;
        worldContainer.addChild(railroadMeshContainer);
    }
    for (const m of railroadMeshes) m.destroy();
    try {
        railroadMeshes = createRailroadMeshes(
            cache.meshAndMap.mesh,
            cache.meshAndMap.map,
            cache.railroadPath,
            railroadMeshContainer,
            cache.railroadStationIds
        );
    } catch (err) {
        Logger.error('[MapEditorProceduralRenderer] createRailroadMeshes failed (possibly OOM)', err);
        railroadMeshes = [];
    }
    return { railroadMeshContainer, railroadMeshes, cacheKey };
}

/** Build procedural cache from param. Preloads railroad assets when enabled. Optional manual data overrides procedural towns/stations/waypoints. */
export async function buildProceduralCache(
    param: Mapgen4Param,
    manual?: ManualTownsAndRailroads
): Promise<ProceduralCache> {
    const workerResult = await runMapgenWorker(param, manual);
    const { mesh, map, townsAndRoads, cellRegions, distanceFromWater } = workerResult;
    const meshAndMap = { mesh, map };
    const { towns, roadSegments, railroadPath, railroadCrossings, railroadStationIds } = townsAndRoads;

    if (param.railroads?.enabled && railroadPath.length >= 2) {
        const preloads: Promise<unknown>[] = [];
        for (const biome of ['grasslands', 'tundra', 'desert', 'badlands']) {
            preloads.push(AssetLoader.preloadImage(`ground_base_gravel_${biome}_01`));
            preloads.push(AssetLoader.preloadImage(`arch_railtrack_metal_${biome}_clean`));
            preloads.push(AssetLoader.preloadImage(`arch_railtrack_wood_01_${biome}_clean`));
            preloads.push(AssetLoader.preloadImage(`arch_railtrack_wood_02_${biome}_clean`));
            preloads.push(AssetLoader.preloadImage(`arch_railtrack_wood_03_${biome}_clean`));
        }
        await Promise.all(preloads);
    }

    return {
        meshAndMap,
        param,
        towns,
        roadSegments,
        railroadPath,
        railroadCrossings,
        railroadStationIds,
        cellRegions,
        distanceFromWater
    };
}

/** Draw cached procedural map to canvas. Returns true if drawn. */
export function drawProceduralToCanvas(
    cache: ProceduralCache,
    canvas: HTMLCanvasElement,
    viewport?: { x: number; y: number; width: number; height: number },
    hiddenZoneIds?: Set<string>,
    skipRailroad?: boolean
): boolean {
    const vpX = viewport?.x ?? 0;
    const vpY = viewport?.y ?? 0;
    const vpW = viewport?.width ?? 1000;
    const vpH = viewport?.height ?? 1000;
    drawCachedMeshToCanvas(
        canvas,
        cache.meshAndMap.mesh,
        cache.meshAndMap.map,
        cache.param,
        vpX,
        vpY,
        vpW,
        vpH,
        cache.towns,
        cache.roadSegments,
        cache.railroadPath,
        cache.railroadCrossings,
        cache.railroadStationIds,
        hiddenZoneIds ?? new Set(),
        skipRailroad ?? false,
        cache.distanceFromWater
    );
    return true;
}
