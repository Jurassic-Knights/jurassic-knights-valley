/**
 * WorldManager - Mapgen4 polygon map integration
 *
 * Replaces WorldManager for the main game. Builds mesh+map from mapgen4,
 * provides world size, hero spawn, and stub isWalkable/isBlocked (walk everywhere).
 * Entity placement is done via map editor.
 *
 * Owner: Director
 */

import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';
import { AssetLoader } from '@core/AssetLoader';
import { getPrefetchedMapData } from './MapDataService';
import { buildMeshAndMap, computeTownsAndRoads, DEFAULT_MAPGEN4_PARAM } from '../tools/map-editor/Mapgen4Generator';
import type {
    MeshAndMap,
    Mapgen4Param,
    TownSite,
    RoadSegment,
    RailroadCrossing,
    ManualTownsAndRailroads
} from '../tools/map-editor/Mapgen4Generator';

/** Deep-merge loaded mapgen4Param with defaults so towns/railroads are never lost. */
function mergeMapgen4Param(loaded: Mapgen4Param | undefined): Mapgen4Param {
    if (!loaded) return DEFAULT_MAPGEN4_PARAM;
    return {
        ...DEFAULT_MAPGEN4_PARAM,
        ...loaded,
        elevation: { ...DEFAULT_MAPGEN4_PARAM.elevation, ...loaded.elevation },
        biomes: { ...DEFAULT_MAPGEN4_PARAM.biomes, ...loaded.biomes },
        rivers: { ...DEFAULT_MAPGEN4_PARAM.rivers, ...loaded.rivers },
        towns: loaded.towns
            ? { ...DEFAULT_MAPGEN4_PARAM.towns!, ...loaded.towns }
            : DEFAULT_MAPGEN4_PARAM.towns,
        roads: loaded.roads
            ? { ...DEFAULT_MAPGEN4_PARAM.roads!, ...loaded.roads }
            : DEFAULT_MAPGEN4_PARAM.roads,
        railroads: loaded.railroads
            ? { ...DEFAULT_MAPGEN4_PARAM.railroads!, ...loaded.railroads }
            : DEFAULT_MAPGEN4_PARAM.railroads
    };
}

const MESH_SIZE = 1000;
const WORLD_SIZE = 160000;
const SCALE = WORLD_SIZE / MESH_SIZE;

class WorldManagerService {
    private meshAndMap: MeshAndMap | null = null;
    private param: Mapgen4Param = DEFAULT_MAPGEN4_PARAM;

    private _heroSpawn: { x: number; y: number } | null = null;
    private _cachedTowns: TownSite[] = [];
    private _cachedRoadSegments: RoadSegment[] = [];
    private _cachedRailroadPath: number[] = [];
    private _cachedRailroadCrossings: RailroadCrossing[] = [];
    private _cachedRailroadStationIds: number[] = [];
    private _manualData?: ManualTownsAndRailroads;

    constructor() {
        Logger.info('[WorldManager] Constructed');
    }

    private buildMeshAndCacheTownsRoads(): void {
        this.meshAndMap = buildMeshAndMap(this.param);
        const { towns, roadSegments, railroadPath, railroadCrossings, railroadStationIds } =
            computeTownsAndRoads(
                this.meshAndMap!.mesh,
                this.meshAndMap!.map,
                this.param,
                this._manualData
            );
        this._cachedTowns = towns;
        this._cachedRoadSegments = roadSegments;
        this._cachedRailroadPath = railroadPath;
        this._cachedRailroadCrossings = railroadCrossings;
        this._cachedRailroadStationIds = railroadStationIds;

        Logger.info(
            '[WorldManager] Generated:',
            towns.length, 'towns,',
            roadSegments.length, 'road segments,',
            railroadPath.length, 'railroad path nodes,',
            railroadCrossings.length, 'crossings.',
            'Railroads enabled:', !!this.param.railroads?.enabled,
            'Towns enabled:', !!this.param.towns?.enabled
        );

        if (railroadPath.length >= 2) {
            for (const biome of ['grasslands', 'tundra', 'desert', 'badlands']) {
                AssetLoader.preloadImage(`ground_base_gravel_${biome}_01`);
                AssetLoader.preloadImage(`arch_railtrack_metal_${biome}_clean`);
                AssetLoader.preloadImage(`arch_railtrack_wood_01_${biome}_clean`);
                AssetLoader.preloadImage(`arch_railtrack_wood_02_${biome}_clean`);
                AssetLoader.preloadImage(`arch_railtrack_wood_03_${biome}_clean`);
            }
        }
    }

    init() {
        Logger.info('[WorldManager] init() called');
        const prefetched = getPrefetchedMapData();
        if (prefetched) {
            if (prefetched.mapgen4Param) {
                this.param = mergeMapgen4Param(prefetched.mapgen4Param);
                Logger.info(
                    '[WorldManager] Using mapgen4Param from map data, meshSeed:', this.param.meshSeed,
                    'towns:', this.param.towns?.numTowns ?? '?',
                    'railroads:', this.param.railroads?.enabled ?? false
                );
            }
            this._manualData = {
                manualTowns: prefetched.manualTowns,
                manualStations: prefetched.manualStations,
                railroadWaypoints: prefetched.railroadWaypoints
            };
        } else {
            this.param = DEFAULT_MAPGEN4_PARAM;
            Logger.info('[WorldManager] No mapgen4Param in prefetched data, using DEFAULT_MAPGEN4_PARAM, meshSeed:', this.param.meshSeed);
        }
        this.buildMeshAndCacheTownsRoads();
    }

    getWorldSize(): { width: number; height: number } {
        return { width: WORLD_SIZE, height: WORLD_SIZE };
    }

    getHeroSpawnPosition(): { x: number; y: number } {
        if (this._heroSpawn) return this._heroSpawn;
        return { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    }

    /** Set hero spawn from map data. Called when map is loaded or hero spawn is moved in editor. */
    setHeroSpawn(x: number, y: number): void {
        this._heroSpawn = { x, y };
    }

    /** Clear hero spawn (revert to map center). Called when loading a map with no hero spawn. */
    clearHeroSpawn(): void {
        this._heroSpawn = null;
    }

    getMesh(): MeshAndMap | null {
        return this.meshAndMap;
    }

    getMapgen4Param(): Mapgen4Param {
        return this.param;
    }

    /** Apply mapgen4 params and manual data from loaded map, then rebuild mesh. */
    setMapgen4ParamAndRebuild(param: Mapgen4Param, manualData?: ManualTownsAndRailroads): void {
        this.param = mergeMapgen4Param(param);
        if (manualData) {
            this._manualData = manualData;
        }
        this.buildMeshAndCacheTownsRoads();
        Logger.info('[WorldManager] Mesh rebuilt with map params, meshSeed:', param.meshSeed);
    }

    /** Cached towns, roads, and railroads for polygon map rendering (avoids recompute every frame). */
    getCachedTownsAndRoads(): {
        towns: TownSite[];
        roadSegments: RoadSegment[];
        railroadPath: number[];
        railroadCrossings: RailroadCrossing[];
        railroadStationIds: number[];
    } {
        return {
            towns: this._cachedTowns,
            roadSegments: this._cachedRoadSegments,
            railroadPath: this._cachedRailroadPath,
            railroadCrossings: this._cachedRailroadCrossings,
            railroadStationIds: this._cachedRailroadStationIds
        };
    }

    /** World coords → mesh coords (0..1000) */
    worldToMesh(x: number, y: number): { x: number; y: number } {
        return { x: (x / WORLD_SIZE) * MESH_SIZE, y: (y / WORLD_SIZE) * MESH_SIZE };
    }

    /** Mesh coords (0..1000) → world coords */
    meshToWorld(mx: number, my: number): { x: number; y: number } {
        return { x: (mx / MESH_SIZE) * WORLD_SIZE, y: (my / MESH_SIZE) * WORLD_SIZE };
    }

    // --- Stub: walk everywhere ---
    isWalkable(_x: number, _y: number): boolean {
        return true;
    }

    isBlocked(_x: number, _y: number): boolean {
        return false;
    }
}

const WorldManager = new WorldManagerService();
if (Registry) Registry.register('WorldManager', WorldManager);

export { WorldManager, WorldManagerService };
