/**
 * ChunkManagerViewport — Viewport-based chunk visibility and load/unload logic.
 */

import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import type { ChunkData } from './MapEditorTypes';

export interface ChunkViewportContext {
    worldData: Map<string, ChunkData>;
    loadedChunks: Map<string, PIXI.Container>;
    loadingChunks: Set<string>;
    loadChunk: (key: string, x: number, y: number) => Promise<void>;
    unloadChunk: (key: string) => void;
    getDebugGraphics: (chunk: PIXI.Container) => PIXI.Graphics;
    gridOpacity: number;
}

/**
 * Update observable chunks based on viewport.
 * Loads chunks in view, unloads chunks out of view, updates LOD grid visibility.
 */
export function updateChunkViewport(
    ctx: ChunkViewportContext,
    viewRect: { x: number; y: number; width: number; height: number },
    zoom: number
): void {
    const { TILE_SIZE, CHUNK_SIZE } = MapEditorConfig;
    const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
    const usePolygonAsGround = MapEditorConfig.USE_POLYGON_MAP_AS_GROUND;

    const startX = Math.floor(viewRect.x / chunkSizePx);
    const startY = Math.floor(viewRect.y / chunkSizePx);
    const endX = Math.ceil((viewRect.x + viewRect.width) / chunkSizePx);
    const endY = Math.ceil((viewRect.y + viewRect.height) / chunkSizePx);

    const minX = startX - 1;
    const minY = startY - 1;
    const maxX = endX + 1;
    const maxY = endY + 1;

    const worldWidthChunks = MapEditorConfig.WORLD_WIDTH_TILES / CHUNK_SIZE;
    const worldHeightChunks = MapEditorConfig.WORLD_HEIGHT_TILES / CHUNK_SIZE;

    const visibleKeys = new Set<string>();

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            if (x < 0 || y < 0 || x >= worldWidthChunks || y >= worldHeightChunks) continue;
            const key = `${x},${y}`;
            visibleKeys.add(key);

            if (!ctx.loadedChunks.has(key) && !ctx.loadingChunks.has(key)) {
                ctx.loadingChunks.add(key);
                ctx.loadChunk(key, x, y).finally(() => ctx.loadingChunks.delete(key));
            }
        }
    }

    for (const [key, chunk] of ctx.loadedChunks) {
        if (!visibleKeys.has(key)) {
            ctx.unloadChunk(key);
        } else if (!usePolygonAsGround) {
            const g = ctx.getDebugGraphics(chunk);
            const isVisible = zoom > 0.005;
            g.visible = isVisible;

            if (isVisible) {
                const lineWidth = Math.max(32, 2 / zoom);
                // Basic check to avoid rebuilding geometry every frame if nothing changed
                const currentKey = `${lineWidth}_${ctx.gridOpacity}`;
                if ((g as any).__borderKey !== currentKey) {
                    (g as any).__borderKey = currentKey;
                    g.clear();
                    g.rect(0, 0, chunkSizePx, chunkSizePx);
                    g.stroke({
                        width: lineWidth,
                        color: MapEditorConfig.Colors.CHUNK_BORDER,
                        alpha: ctx.gridOpacity
                    });
                }
            }
        }
    }
}
