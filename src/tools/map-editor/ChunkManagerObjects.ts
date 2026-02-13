/**
 * ChunkManagerObjects — Object add/remove/query helpers for ChunkManager.
 */

import { MapEditorConfig } from './MapEditorConfig';
import type { ChunkData, MapObject } from './MapEditorTypes';
import type { ObjectSystem } from './ObjectSystem';

export function getAllObjects(worldData: Map<string, ChunkData>): MapObject[] {
    const out: MapObject[] = [];
    for (const data of worldData.values()) {
        if (data.objects) out.push(...data.objects);
    }
    return out;
}

export function getObjectAt(worldData: Map<string, ChunkData>, x: number, y: number): MapObject | null {
    for (const data of worldData.values()) {
        if (!data.objects) continue;
        const obj = data.objects.find((o) => Math.abs(o.x - x) < 1 && Math.abs(o.y - y) < 1);
        if (obj) return obj;
    }
    return null;
}

export interface AddObjectContext {
    worldData: Map<string, ChunkData>;
    loadedChunks: Map<string, unknown>;
    loadingChunks: Set<string>;
    container: { visible: boolean };
    objectSystem: ObjectSystem;
    loadChunkSync: (key: string, x: number, y: number) => void;
    loadChunk: (key: string, x: number, y: number) => Promise<void>;
    onMapEdit: ((type: string, payload: unknown) => void) | null;
    skipEditCallback: boolean;
}

export function addObject(ctx: AddObjectContext, x: number, y: number, assetId: string): void {
    const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
    const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
    const chunkX = Math.floor(x / chunkSizePx);
    const chunkY = Math.floor(y / chunkSizePx);
    const chunkKey = `${chunkX},${chunkY}`;

    let data = ctx.worldData.get(chunkKey);
    if (!data) {
        data = { id: chunkKey, objects: [], zones: {} };
        ctx.worldData.set(chunkKey, data);
    }
    ctx.objectSystem.addObject(data, assetId, x, y);

    if (!ctx.skipEditCallback) ctx.onMapEdit?.('MAP_OBJECT_ADD', { id: assetId, x, y });

    const chunkContainer = ctx.loadedChunks.get(chunkKey);
    if (chunkContainer) {
        ctx.objectSystem.renderObject(
            chunkContainer as Parameters<ObjectSystem['renderObject']>[0],
            assetId,
            x,
            y,
            chunkX,
            chunkY
        );
    } else if (!ctx.loadingChunks.has(chunkKey)) {
        ctx.container.visible = true;
        ctx.loadingChunks.add(chunkKey);
        if (MapEditorConfig.USE_POLYGON_MAP_AS_GROUND) {
            ctx.loadChunkSync(chunkKey, chunkX, chunkY);
            ctx.loadingChunks.delete(chunkKey);
        } else {
            ctx.loadChunk(chunkKey, chunkX, chunkY).finally(() => ctx.loadingChunks.delete(chunkKey));
        }
    }
}

export interface RemoveObjectContext {
    worldData: Map<string, ChunkData>;
    loadedChunks: Map<string, unknown>;
    objectSystem: ObjectSystem;
    getObjectAt: (x: number, y: number) => MapObject | null;
    onMapEdit: ((type: string, payload: unknown) => void) | null;
    skipEditCallback: boolean;
}

export function removeObjectAt(ctx: RemoveObjectContext, x: number, y: number): void {
    const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
    const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
    const chunkX = Math.floor(x / chunkSizePx);
    const chunkY = Math.floor(y / chunkSizePx);
    const chunkKey = `${chunkX},${chunkY}`;

    const data = ctx.worldData.get(chunkKey);
    const chunkContainer = (ctx.loadedChunks.get(chunkKey) ?? null) as Parameters<
        ObjectSystem['removeObject']
    >[0];

    if (data) {
        const obj = ctx.getObjectAt(x, y);
        ctx.objectSystem.removeObject(chunkContainer, data, x, y, chunkX, chunkY);
        if (obj && !ctx.skipEditCallback) ctx.onMapEdit?.('MAP_OBJECT_REMOVE', { id: obj.id, x, y });
    }
}
