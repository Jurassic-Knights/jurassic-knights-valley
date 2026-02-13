/**
 * MapObjectSpawner - Spawns entities from map editor data
 *
 * Listens to BroadcastChannel 'game-map-updates' for real-time sync.
 * Fetches initial map on init when running with dashboard.
 */
import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { EntityRegistry } from '@entities/EntityLoader';
import { Prop } from './Prop';
import { Resource } from '../gameplay/Resource';
import { Enemy } from '../gameplay/EnemyCore';
import { Boss } from '../gameplay/Boss';
import { Registry } from '@core/Registry';
import { fetchMapData, getObjectsFromMapData, getPrefetchedMapData, clearPrefetchedMapData } from './MapDataService';
import type { Mapgen4Param } from '../tools/map-editor/Mapgen4Generator';
import type { MapObject, HeroSpawnPosition } from '../tools/map-editor/MapEditorTypes';
import type { IEntity } from '../types/core';

const CHANNEL_NAME = 'game-map-updates';
const POS_TOLERANCE = 2;

function makeKey(x: number, y: number): string {
    return `${Math.round(x)},${Math.round(y)}`;
}

function findEntityAt(
    map: Map<string, IEntity>,
    x: number,
    y: number,
    id?: string
): { entity: IEntity; key: string } | null {
    const roundX = Math.round(x);
    const roundY = Math.round(y);
    for (const [key, entity] of map) {
        const [kx, ky] = key.split(',').map(Number);
        if (Math.abs(kx - roundX) <= POS_TOLERANCE && Math.abs(ky - roundY) <= POS_TOLERANCE) {
            if (!id || (entity as { resourceType?: string; registryId?: string }).resourceType === id || (entity as { registryId?: string }).registryId === id) {
                return { entity, key };
            }
        }
    }
    return null;
}

function spawnEntityForMapObject(obj: MapObject): IEntity | null {
    const { id, x, y } = obj;

    if (EntityRegistry.environment?.[id]) {
        const prop = new Prop({ x, y, registryId: id });
        entityManager.add(prop);
        return prop;
    }

    if (EntityRegistry.nodes?.[id] || EntityRegistry.resources?.[id]) {
        const resource = new Resource({ x, y, resourceType: id, isMapPlaced: true });
        entityManager.add(resource);
        return resource;
    }

    if (EntityRegistry.enemies?.[id]) {
        const enemy = new Enemy({ x, y, enemyType: id });
        entityManager.add(enemy);
        return enemy;
    }

    if (EntityRegistry.bosses?.[id]) {
        const boss = new Boss({ x, y, bossType: id });
        entityManager.add(boss);
        return boss;
    }

    Logger.warn(`[MapObjectSpawner] Unknown asset id: ${id}`);
    return null;
}

function clearMapSpawnedEntities(map: Map<string, IEntity>): void {
    for (const entity of map.values()) {
        entityManager.remove(entity);
    }
    map.clear();
}

const MapObjectSpawner = {
    _entityMap: new Map<string, IEntity>(),
    _initialized: false,

    async init(_game?: unknown): Promise<void> {
        if (this._initialized) return;

        this._setupChannel();
        await this._loadInitialMap();
        this._initialized = true;
        Logger.info('[MapObjectSpawner] Initialized');
    },

    _setupChannel(): void {
        if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.onmessage = (event: MessageEvent) => {
            const { type, id, x, y, oldX, oldY, newX, newY, data } = event.data || {};

            switch (type) {
                case 'MAP_FULL':
                    this._applyFullMap(data);
                    break;
                case 'MAP_HERO_SPAWN':
                    if (typeof x === 'number' && typeof y === 'number') {
                        const wm = Registry?.get<{ setHeroSpawn: (x: number, y: number) => void }>('IslandManager');
                        wm?.setHeroSpawn(x, y);
                    }
                    break;
                case 'MAP_OBJECT_ADD':
                    if (id != null && x != null && y != null) {
                        this._addOne({ id, x, y });
                    }
                    break;
                case 'MAP_OBJECT_REMOVE':
                    if (x != null && y != null) {
                        this._removeOne(x, y, id);
                    }
                    break;
                case 'MAP_OBJECT_MOVE':
                    if (id != null && oldX != null && oldY != null && newX != null && newY != null) {
                        this._moveOne(id, oldX, oldY, newX, newY);
                    }
                    break;
            }
        };
        Logger.info('[MapObjectSpawner] Listening for map updates');
    },

    async _loadInitialMap(): Promise<void> {
        const data = getPrefetchedMapData() ?? (await fetchMapData());
        if (data) {
            this._applyFullMap(data);
        }
        clearPrefetchedMapData();
    },

    _applyFullMap(data: {
        version?: number;
        chunks?: Array<{ id: string; objects?: MapObject[] }>;
        mapgen4Param?: Mapgen4Param;
        heroSpawn?: HeroSpawnPosition;
    } | null): void {
        if (data?.mapgen4Param) {
            const worldManager = Registry?.get<{ setMapgen4ParamAndRebuild: (p: Mapgen4Param) => void }>('IslandManager');
            worldManager?.setMapgen4ParamAndRebuild(data.mapgen4Param);
        }
        const worldManager = Registry?.get<{ setHeroSpawn: (x: number, y: number) => void; clearHeroSpawn: () => void }>('IslandManager');
        if (data?.heroSpawn && typeof data.heroSpawn.x === 'number' && typeof data.heroSpawn.y === 'number') {
            worldManager?.setHeroSpawn(data.heroSpawn.x, data.heroSpawn.y);
        } else {
            worldManager?.clearHeroSpawn();
        }
        clearMapSpawnedEntities(this._entityMap);
        const objects = getObjectsFromMapData(data);
        for (const obj of objects) {
            const entity = spawnEntityForMapObject(obj);
            if (entity) {
                this._entityMap.set(makeKey(obj.x, obj.y), entity);
            }
        }
        Logger.info(`[MapObjectSpawner] Loaded ${objects.length} objects from map`);
    },

    _addOne(obj: MapObject): void {
        const existing = findEntityAt(this._entityMap, obj.x, obj.y);
        if (existing) return;

        const entity = spawnEntityForMapObject(obj);
        if (entity) {
            this._entityMap.set(makeKey(obj.x, obj.y), entity);
        }
    },

    _removeOne(x: number, y: number, id?: string): void {
        const found = findEntityAt(this._entityMap, x, y, id);
        if (found) {
            entityManager.remove(found.entity);
            this._entityMap.delete(found.key);
        }
    },

    _moveOne(id: string, oldX: number, oldY: number, newX: number, newY: number): void {
        const found = findEntityAt(this._entityMap, oldX, oldY, id);
        if (found) {
            found.entity.x = newX;
            found.entity.y = newY;
            this._entityMap.delete(found.key);
            this._entityMap.set(makeKey(newX, newY), found.entity);
        }
    }
};

if (typeof window !== 'undefined') {
    (window as unknown as { MapObjectSpawner: typeof MapObjectSpawner }).MapObjectSpawner = MapObjectSpawner;
}

export { MapObjectSpawner };
