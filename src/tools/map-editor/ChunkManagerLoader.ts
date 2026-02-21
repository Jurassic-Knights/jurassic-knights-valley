/**
 * ChunkManagerLoader — Chunk load/unload and ground rendering helpers.
 */

import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { getTileColorHex } from './ZoneColorHelper';
import type { ChunkData } from './MapEditorTypes';
import type { GroundSystem } from './GroundSystem';
import type { ObjectSystem } from './ObjectSystem';
import type { ZoneSystem } from './ZoneSystem';

export interface ChunkLoaderContext {
    worldData: Map<string, ChunkData>;
    loadedChunks: Map<string, PIXI.Container>;
    pool: PIXI.Container[];
    container: PIXI.Container;
    groundSystem: GroundSystem;
    objectSystem: ObjectSystem;
    zoneSystem: ZoneSystem;
    gridOpacity: number;
}

/** Render chunk as color-block placeholders (no textures). */
export function renderPlaceholderGround(
    chunk: PIXI.Container,
    chunkX: number,
    chunkY: number,
    worldData: Map<string, ChunkData>
): void {
    const chunkKey = `${chunkX},${chunkY}`;
    const data = worldData.get(chunkKey);
    const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
    const groundLayer = new PIXI.Graphics();
    (groundLayer as { label?: string }).label = 'ground_layer';
    chunk.addChildAt(groundLayer, 0);

    if (!data?.zones) {
        groundLayer.rect(0, 0, CHUNK_SIZE * TILE_SIZE, CHUNK_SIZE * TILE_SIZE);
        groundLayer.fill(0x222222);
        return;
    }

    for (let ly = 0; ly < CHUNK_SIZE; ly++) {
        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            const tileKey = `${lx},${ly}`;
            const zones = data.zones[tileKey];
            const color = getTileColorHex(zones);
            const x = lx * TILE_SIZE;
            const y = ly * TILE_SIZE;
            groundLayer.rect(x, y, TILE_SIZE, TILE_SIZE);
            groundLayer.fill(color);
        }
    }
}

/** Reuse or create debug graphics for chunk container. */
export function getDebugGraphics(container: PIXI.Container): PIXI.Graphics {
    let g = container.children.find((c) => c instanceof PIXI.Graphics) as PIXI.Graphics;
    if (!g) {
        g = new PIXI.Graphics();
        container.addChild(g);
    }
    return g;
}

/** Synchronous chunk load for polygon mode (first placement); no async ground render. */
export function loadChunkSync(ctx: ChunkLoaderContext, key: string, x: number, y: number): void {
    const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
    const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

    let chunk = ctx.pool.pop();
    if (!chunk) chunk = new PIXI.Container();

    chunk.x = x * chunkSizePx;
    chunk.y = y * chunkSizePx;
    chunk.visible = true;

    const data = ctx.worldData.get(key);
    if (data) {
        ctx.objectSystem.renderChunkObjects(chunk, data, x, y);
        if (data.zones) ctx.zoneSystem.renderZoneOverlay(chunk, data.zones);
    }

    ctx.container.addChild(chunk);
    ctx.loadedChunks.set(key, chunk);
}

/** Load chunk asynchronously (ground render, objects, zones). */
export async function loadChunk(ctx: ChunkLoaderContext, key: string, x: number, y: number): Promise<void> {
    const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
    const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
    const usePolygonAsGround = MapEditorConfig.USE_POLYGON_MAP_AS_GROUND;

    let chunk = ctx.pool.pop();
    if (!chunk) chunk = new PIXI.Container();

    chunk.x = x * chunkSizePx;
    chunk.y = y * chunkSizePx;
    chunk.visible = true;

    if (!usePolygonAsGround) {
        const debugGraphics = getDebugGraphics(chunk);
        debugGraphics.clear();
        debugGraphics.strokeStyle = {
            width: 32,
            color: MapEditorConfig.Colors.CHUNK_BORDER,
            alpha: 1
        };
        debugGraphics.rect(0, 0, chunkSizePx, chunkSizePx);
        debugGraphics.stroke();
        debugGraphics.alpha = ctx.gridOpacity;

        const text = new PIXI.Text({
            text: key,
            style: { fill: 0xffffff, fontSize: 32 }
        });
        text.x = 10;
        text.y = 10;
        chunk.addChild(text);

        if (MapEditorConfig.USE_PLACEHOLDER_GROUND) {
            renderPlaceholderGround(chunk, x, y, ctx.worldData);
        } else {
            const data = ctx.worldData.get(key);
            if (data) {
                await ctx.groundSystem.renderChunk(chunk, data, x, y, ctx.worldData);
            }
        }
    }

    const data = ctx.worldData.get(key);
    if (data) {
        ctx.objectSystem.renderChunkObjects(chunk, data, x, y);
        if (data.zones) ctx.zoneSystem.renderZoneOverlay(chunk, data.zones);
    }

    ctx.container.addChild(chunk);
    ctx.loadedChunks.set(key, chunk);
}

/** Unload chunk and return container to pool. */
export function unloadChunk(ctx: ChunkLoaderContext, key: string): void {
    const chunk = ctx.loadedChunks.get(key);
    if (chunk) {
        chunk.removeChildren();
        chunk.parent?.removeChild(chunk);
        ctx.pool.push(chunk);
        ctx.loadedChunks.delete(key);
    }
}
