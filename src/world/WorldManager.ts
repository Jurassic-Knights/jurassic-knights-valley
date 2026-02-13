/**
 * WorldManager - Mapgen4 polygon map integration
 *
 * Replaces IslandManager for the main game. Builds mesh+map from mapgen4,
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
    RailroadCrossing
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
import type { Island, WalkableZoneWithId, CollisionBlockWithMeta } from '../types/world';

const MESH_SIZE = 1000;
const WORLD_SIZE = 160000;
const SCALE = WORLD_SIZE / MESH_SIZE;

class WorldManagerService {
    private meshAndMap: MeshAndMap | null = null;
    private param: Mapgen4Param = DEFAULT_MAPGEN4_PARAM;
    private _pseudoHome: Island | null = null;
    private _heroSpawn: { x: number; y: number } | null = null;
    private _cachedTowns: TownSite[] = [];
    private _cachedRoadSegments: RoadSegment[] = [];
    private _cachedRailroadPath: number[] = [];
    private _cachedRailroadCrossings: RailroadCrossing[] = [];

    constructor() {
        Logger.info('[WorldManager] Constructed');
    }

    private buildMeshAndCacheTownsRoads(): void {
        this.meshAndMap = buildMeshAndMap(this.param);
        const { towns, roadSegments, railroadPath, railroadCrossings } = computeTownsAndRoads(
            this.meshAndMap!.mesh,
            this.meshAndMap!.map,
            this.param
        );
        this._cachedTowns = towns;
        this._cachedRoadSegments = roadSegments;
        this._cachedRailroadPath = railroadPath;
        this._cachedRailroadCrossings = railroadCrossings;

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
        if (prefetched?.mapgen4Param) {
            this.param = mergeMapgen4Param(prefetched.mapgen4Param);
            Logger.info(
                '[WorldManager] Using mapgen4Param from map data, meshSeed:', this.param.meshSeed,
                'towns:', this.param.towns?.numTowns ?? '?',
                'railroads:', this.param.railroads?.enabled ?? false
            );
        } else {
            this.param = DEFAULT_MAPGEN4_PARAM;
            Logger.info('[WorldManager] No mapgen4Param in prefetched data, using DEFAULT_MAPGEN4_PARAM, meshSeed:', this.param.meshSeed);
        }
        this.buildMeshAndCacheTownsRoads();
        this._pseudoHome = this.createPseudoHome();
        if (prefetched?.heroSpawn && typeof prefetched.heroSpawn.x === 'number' && typeof prefetched.heroSpawn.y === 'number') {
            this._heroSpawn = { x: prefetched.heroSpawn.x, y: prefetched.heroSpawn.y };
        }
        Logger.info('[WorldManager] Mesh built, world size:', WORLD_SIZE);
    }

    private createPseudoHome(): Island {
        const half = WORLD_SIZE / 2;
        const homeSize = 2000;
        return {
            gridX: 0,
            gridY: 0,
            type: 'home',
            category: 'home',
            name: 'Home',
            unlocked: true,
            worldX: half - homeSize / 2,
            worldY: half - homeSize / 2,
            width: homeSize,
            height: homeSize
        };
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

    /** Apply mapgen4 params from loaded map and rebuild mesh. Call when map data includes mapgen4Param. */
    setMapgen4ParamAndRebuild(param: Mapgen4Param): void {
        this.param = mergeMapgen4Param(param);
        this.buildMeshAndCacheTownsRoads();
        Logger.info('[WorldManager] Mesh rebuilt with map params, meshSeed:', param.meshSeed);
    }

    /** Cached towns, roads, and railroads for polygon map rendering (avoids recompute every frame). */
    getCachedTownsAndRoads(): {
        towns: TownSite[];
        roadSegments: RoadSegment[];
        railroadPath: number[];
        railroadCrossings: RailroadCrossing[];
    } {
        return {
            towns: this._cachedTowns,
            roadSegments: this._cachedRoadSegments,
            railroadPath: this._cachedRailroadPath,
            railroadCrossings: this._cachedRailroadCrossings
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

    // --- IslandManager compatibility stubs ---
    get islands(): Island[] {
        return this._pseudoHome ? [this._pseudoHome] : [];
    }

    get walkableZones(): WalkableZoneWithId[] {
        return [];
    }

    get collisionBlocks(): CollisionBlockWithMeta[] {
        return [];
    }

    getIslandByGrid(_gridX: number, _gridY: number): Island | undefined {
        return this._pseudoHome ?? undefined;
    }

    getIslandAt(x: number, y: number): Island | null {
        if (!this._pseudoHome) return null;
        const h = this._pseudoHome;
        if (x >= h.worldX && x < h.worldX + h.width && y >= h.worldY && y < h.worldY + h.height) {
            return this._pseudoHome;
        }
        return null;
    }

    getHomeIsland(): Island | undefined {
        return this._pseudoHome ?? undefined;
    }

    getPlayableBounds(island: Island | null | undefined): { x: number; y: number; width: number; height: number; left: number; right: number; top: number; bottom: number } | null {
        if (!island) return null;
        const padding = 50;
        return {
            x: island.worldX + padding,
            y: island.worldY + padding,
            width: island.width - padding * 2,
            height: island.height - padding * 2,
            left: island.worldX + padding,
            right: island.worldX + island.width - padding,
            top: island.worldY + padding,
            bottom: island.worldY + island.height - padding
        };
    }

    clampToPlayableArea(x: number, y: number): { x: number; y: number } {
        const padding = 100;
        return {
            x: Math.max(padding, Math.min(WORLD_SIZE - padding, x)),
            y: Math.max(padding, Math.min(WORLD_SIZE - padding, y))
        };
    }

    getUnlockTrigger(_x: number, _y: number): Island | null {
        return null;
    }

    getBridges() {
        return [];
    }

    isOnBridge(_x: number, _y: number): boolean {
        return false;
    }

    getBridgeAt(_x: number, _y: number) {
        return null;
    }

    worldToGrid(x: number, y: number): { gx: number; gy: number } {
        const cellSize = 64;
        return { gx: Math.floor(x / cellSize), gy: Math.floor(y / cellSize) };
    }

    gridToWorld(gx: number, gy: number): { x: number; y: number } {
        const cellSize = 64;
        return { x: gx * cellSize + cellSize / 2, y: gy * cellSize + cellSize / 2 };
    }

    snapToGrid(x: number, y: number): { x: number; y: number } {
        const cellSize = 64;
        return { x: Math.floor(x / cellSize) * cellSize + cellSize / 2, y: Math.floor(y / cellSize) * cellSize + cellSize / 2 };
    }

    getGridCellBounds(_gx: number, _gy: number) {
        return null;
    }

    isIslandUnlocked(_gridX: number, _gridY: number): boolean {
        return true;
    }

    unlockIsland(_gridX: number, _gridY: number): boolean {
        return false;
    }

    rebuildWalkableZones(): void {
        // No-op
    }

    rebuildCollisionBlocks(): void {
        // No-op
    }
}

const WorldManager = new WorldManagerService();
if (Registry) Registry.register('IslandManager', WorldManager);

export { WorldManager, WorldManagerService };
