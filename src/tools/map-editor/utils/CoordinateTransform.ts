/**
 * CoordinateTransform
 *
 * Centralized math utilities for converting between global world pixels,
 * map chunks, tiles (128px), and splat maps (32px).
 */
import { MapEditorConfig } from '../MapEditorConfig';

export interface ChunkTileCoords {
    chunkX: number;
    chunkY: number;
    chunkKey: string;
    localX: number;
    localY: number;
    tileKey: string;
}

export class CoordinateTransform {
    /** Map world coordinates (px) to Chunk and Tile coordinates */
    public static worldToChunkTile(x: number, y: number): ChunkTileCoords {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        const chunkX = Math.floor(x / chunkSizePx);
        const chunkY = Math.floor(y / chunkSizePx);
        const chunkKey = `${chunkX},${chunkY}`;
        
        const localX = Math.floor((x - chunkX * chunkSizePx) / TILE_SIZE);
        const localY = Math.floor((y - chunkY * chunkSizePx) / TILE_SIZE);
        const tileKey = `${localX},${localY}`;
        
        return { chunkX, chunkY, chunkKey, localX, localY, tileKey };
    }

    /** Snap world coordinate to the nearest grid cell */
    public static worldToGrid(x: number, y: number, gridSize: number = MapEditorConfig.TILE_SIZE): { cx: number; cy: number } {
        return {
            cx: Math.floor(x / gridSize) * gridSize,
            cy: Math.floor(y / gridSize) * gridSize
        };
    }

    /** Convert Splat Map index (1D) back to local Splat coordinates (2D) */
    public static indexToSplatLocal(idx: number): { sx: number; sy: number } {
        const { SPLAT_RES } = MapEditorConfig;
        return {
            sx: idx % SPLAT_RES,
            sy: Math.floor(idx / SPLAT_RES)
        };
    }
}
