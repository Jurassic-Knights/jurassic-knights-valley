/**
 * GroundSystemSplat - Splat weight sampling and paint operations
 */
import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';

/** Sample splat weight; reads from neighbor chunk when at boundaries. */
export function getSplatWeight(
    chunkKey: string,
    sampleX: number,
    sampleY: number,
    data: ChunkData,
    worldData?: Map<string, ChunkData>
): number {
    const { CHUNK_SIZE } = MapEditorConfig;
    const SPLAT_RES = CHUNK_SIZE * 4;

    if (sampleX >= 0 && sampleX < SPLAT_RES && sampleY >= 0 && sampleY < SPLAT_RES) {
        const idx = sampleY * SPLAT_RES + sampleX;
        const arr = data.splatMap;
        return (arr && idx < arr.length ? arr[idx] : 0) ?? 0;
    }
    if (!worldData) return 0;

    const [cx, cy] = chunkKey.split(',').map(Number);
    const nCx = cx + Math.floor(sampleX / SPLAT_RES);
    const nCy = cy + Math.floor(sampleY / SPLAT_RES);
    const nKey = `${nCx},${nCy}`;
    const nData = worldData.get(nKey);

    if (nData?.splatMap && nData.splatMap.length > 0) {
        const nLx = ((sampleX % SPLAT_RES) + SPLAT_RES) % SPLAT_RES;
        const nLy = ((sampleY % SPLAT_RES) + SPLAT_RES) % SPLAT_RES;
        const idx = nLy * SPLAT_RES + nLx;
        if (idx < nData.splatMap!.length) return nData.splatMap![idx];
    }

    return 0;
}

export type PaintOp = { x: number; y: number; radius: number; intensity: number };

export type GroundSystemUpdateTile = (
    chunkKey: string,
    lx: number,
    ly: number,
    data: ChunkData,
    groundLayer: PIXI.Container,
    resolvedPaletteId?: string | null,
    splatDataOverride?: Uint8ClampedArray,
    preloadedAssets?: Map<string, unknown>,
    worldData?: Map<string, ChunkData>
) => Promise<void>;

export function applyPaintOps(
    ops: PaintOp[],
    soft: boolean,
    worldData: Map<string, ChunkData>
): { changeMap: Map<string, { chunkKey: string; idx: number; oldVal: number; newVal: number }>; dirtyTiles: Map<string, Set<string>> } {
    const changeMap = new Map<string, { chunkKey: string; idx: number; oldVal: number; newVal: number }>();
    const dirtyTiles = new Map<string, Set<string>>();
    const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
    const SPLAT_CELL_SIZE = TILE_SIZE / 4;
    const SPLATS_PER_CHUNK = CHUNK_SIZE * 4;

    for (const op of ops) {
        const centerSplatX = Math.floor(op.x / SPLAT_CELL_SIZE);
        const centerSplatY = Math.floor(op.y / SPLAT_CELL_SIZE);
        const rCeil = Math.ceil(op.radius);

        for (let dx = -rCeil; dx <= rCeil; dx++) {
            for (let dy = -rCeil; dy <= rCeil; dy++) {
                const distSq = dx * dx + dy * dy;
                if (distSq > op.radius * op.radius) continue;
                let factor = 1;
                if (soft && op.radius > 1.5) {
                    const dist = Math.sqrt(distSq);
                    factor = Math.max(0, 1 - dist / op.radius);
                    factor = factor * factor * (3 - 2 * factor);
                }
                const sx = centerSplatX + dx;
                const sy = centerSplatY + dy;
                const chunkX = Math.floor(sx / SPLATS_PER_CHUNK);
                const chunkY = Math.floor(sy / SPLATS_PER_CHUNK);
                const chunkKey = `${chunkX},${chunkY}`;

                let data = worldData.get(chunkKey);
                if (!data) {
                    data = {
                        id: chunkKey,
                        objects: [],
                        zones: {},
                        splatMap: Array.from(new Uint8ClampedArray(SPLATS_PER_CHUNK * SPLATS_PER_CHUNK))
                    };
                    worldData.set(chunkKey, data);
                }
                if (!data.splatMap?.length) {
                    data.splatMap = Array.from(new Uint8ClampedArray(SPLATS_PER_CHUNK * SPLATS_PER_CHUNK));
                }
                const localSx = ((sx % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                const localSy = ((sy % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                const idx = localSy * SPLATS_PER_CHUNK + localSx;
                const cellKey = `${chunkKey}:${idx}`;
                const val = data.splatMap[idx] || 0;
                const newVal = Math.min(255, Math.max(0, val + op.intensity * factor));
                if (Math.abs(val - newVal) > 0.5) {
                    const existing = changeMap.get(cellKey);
                    changeMap.set(cellKey, {
                        chunkKey,
                        idx,
                        oldVal: existing?.oldVal ?? val,
                        newVal
                    });
                    data.splatMap[idx] = newVal;
                    const tileX = Math.floor(localSx / 4);
                    const tileY = Math.floor(localSy / 4);
                    if (!dirtyTiles.has(chunkKey)) dirtyTiles.set(chunkKey, new Set());
                    dirtyTiles.get(chunkKey)!.add(`${tileX},${tileY}`);
                }
            }
        }
    }
    return { changeMap, dirtyTiles };
}

export function applyRestoreSplat(
    changesByChunk: Map<string, { idx: number; oldVal: number; newVal: number }[]>,
    undo: boolean,
    worldData: Map<string, ChunkData>
): Map<string, Set<string>> {
    const dirtyTiles = new Map<string, Set<string>>();
    const SPLATS_PER_CHUNK = MapEditorConfig.CHUNK_SIZE * 4;

    for (const [chunkKey, changes] of changesByChunk) {
        const data = worldData.get(chunkKey);
        if (!data || !data.splatMap) continue;

        changes.forEach((c) => {
            const val = undo ? c.oldVal : c.newVal;
            data.splatMap![c.idx] = val;

            const localSy = Math.floor(c.idx / SPLATS_PER_CHUNK);
            const localSx = c.idx % SPLATS_PER_CHUNK;
            const tileX = Math.floor(localSx / 4);
            const tileY = Math.floor(localSy / 4);
            const tKey = `${tileX},${tileY}`;

            if (!dirtyTiles.has(chunkKey)) dirtyTiles.set(chunkKey, new Set());
            dirtyTiles.get(chunkKey)!.add(tKey);
        });
    }
    return dirtyTiles;
}
