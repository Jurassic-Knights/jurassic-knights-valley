/**
 * MapDataService - Loads map data from API for MapObjectSpawner
 *
 * Used when game starts; MapObjectSpawner applies incremental updates
 * from BroadcastChannel (game-map-updates).
 */
import { Logger } from '@core/Logger';
import type { MapObject, HeroSpawnPosition } from '../tools/map-editor/MapEditorTypes';
import type { Mapgen4Param } from '../tools/map-editor/Mapgen4Generator';

/** Manual station placement: region ID and visit order (1, 2, 3...). */
export interface ManualStation {
    regionId: number;
    order: number;
}

/** Waypoint on a railroad leg. legIndex 0 = between station 1 and 2. */
export interface RailroadWaypointEntry {
    legIndex: number;
    regionId: number;
}

export interface MapData {
    version?: number;
    chunks?: Array<{ id: string; objects?: MapObject[] }>;
    mapgen4Param?: Mapgen4Param;
    heroSpawn?: HeroSpawnPosition;
    /** When non-empty, town centers for roads/railroads (region IDs). */
    manualTowns?: number[];
    /** When non-empty, station order for railroad legs 1→2→3... */
    manualStations?: ManualStation[];
    /** Waypoints per leg for manual railroad shaping. */
    railroadWaypoints?: RailroadWaypointEntry[];
}

const DEFAULT_MAP_FILENAME = 'default';

/** Pre-fetched map data, set by Game.init() before WorldManager builds. Used to avoid flashing default map. */
let _prefetchedMapData: MapData | null = null;

/** Store pre-fetched map data for WorldManager/MapObjectSpawner to use during init. */
export function setPrefetchedMapData(data: MapData | null): void {
    _prefetchedMapData = data;
}

/** Get pre-fetched map data. Used by WorldManager and MapObjectSpawner during init. */
export function getPrefetchedMapData(): MapData | null {
    return _prefetchedMapData;
}

/** Clear pre-fetched map data after use. */
export function clearPrefetchedMapData(): void {
    _prefetchedMapData = null;
}

/**
 * Fetch map data. Tries API first; falls back to static /maps/default.json
 * when API is unavailable (e.g. production build, no dev server).
 */
export async function fetchMapData(
    filename: string = DEFAULT_MAP_FILENAME
): Promise<MapData | null> {
    // 1. Try API (dev server with dashboard)
    try {
        const res = await fetch(
            `/api/load_map?filename=${encodeURIComponent(filename)}&_=${Date.now()}`,
            { cache: 'no-store' }
        );
        const result = await res.json();
        if (result.success && result.data) {
            return result.data as MapData;
        }
    } catch (e) {
        Logger.warn('[MapDataService] API fetch failed (dashboard may not be running):', e);
    }

    // 2. Fallback: static map (production build serves from /maps/default.json)
    if (filename === DEFAULT_MAP_FILENAME || filename === 'default.json') {
        try {
            const res = await fetch(`/maps/default.json?_=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const data = (await res.json()) as MapData;
                return data;
            }
        } catch (e) {
            Logger.warn('[MapDataService] Static map fetch failed:', e);
        }
    }

    return null;
}

/**
 * Extract all objects from map data.
 */
export function getObjectsFromMapData(data: MapData | null): MapObject[] {
    if (!data?.chunks || !Array.isArray(data.chunks)) return [];
    const out: MapObject[] = [];
    for (const chunk of data.chunks) {
        if (Array.isArray(chunk.objects)) {
            out.push(...chunk.objects);
        }
    }
    return out;
}
