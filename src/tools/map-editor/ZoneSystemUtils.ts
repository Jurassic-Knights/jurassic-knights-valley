/**
 * ZoneSystemUtils
 *
 * Shared helpers for zone/chunk coordinate conversion and neighbor marking.
 * Avoids duplication across ZoneSystem.
 *
 * NOTE: Coordinate math has been extracted to `utils/CoordinateTransform`.
 * This file retains proxy exports for backwards compatibility across the Map Editor.
 */
import { MapEditorConfig } from './MapEditorConfig';
import { CoordinateTransform, ChunkTileCoords as CCTileCoords } from './utils/CoordinateTransform';
const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
const CHUNK_SIZE_PX = CHUNK_SIZE * TILE_SIZE;

export type ChunkTileCoords = CCTileCoords;

/** @deprecated Use CoordinateTransform.worldToChunkTile directly */
export function worldToChunkTile(x: number, y: number): ChunkTileCoords {
    return CoordinateTransform.worldToChunkTile(x, y);
}

/**
 * Mark center tile and 3x3 neighbors in dirtyGroundTiles for ground blend seam fixes.
 * Uses world coords for cross-chunk correctness.
 */
export function markTileAndNeighbors(
    centerX: number,
    centerY: number,
    chunkKey: string,
    tileKey: string,
    dirtyGroundTiles: Map<string, Set<string>>
): void {
    if (!dirtyGroundTiles.has(chunkKey)) dirtyGroundTiles.set(chunkKey, new Set());
    dirtyGroundTiles.get(chunkKey)!.add(tileKey);

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const gx = centerX + dx * TILE_SIZE;
            const gy = centerY + dy * TILE_SIZE;
            const nChunkX = Math.floor(gx / CHUNK_SIZE_PX);
            const nChunkY = Math.floor(gy / CHUNK_SIZE_PX);
            const nChunkKey = `${nChunkX},${nChunkY}`;
            if (!dirtyGroundTiles.has(nChunkKey)) dirtyGroundTiles.set(nChunkKey, new Set());
            const nLocalX = Math.floor((gx - nChunkX * CHUNK_SIZE_PX) / TILE_SIZE);
            const nLocalY = Math.floor((gy - nChunkY * CHUNK_SIZE_PX) / TILE_SIZE);
            dirtyGroundTiles.get(nChunkKey)!.add(`${nLocalX},${nLocalY}`);
        }
    }
}
