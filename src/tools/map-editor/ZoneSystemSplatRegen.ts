/**
 * ZoneSystemSplatRegen — Regenerate splat data from zone state.
 * Called on map load so saved maps use the latest blending logic.
 */

import { MapEditorConfig } from './MapEditorConfig';
import type { ChunkData } from './MapEditorTypes';
import { ProceduralArchitect } from './ProceduralArchitect';

/**
 * Regenerate all splat data from zone state. Clears existing splatMaps, then paints
 * gradients from water tiles. Doesn't render — chunks aren't loaded yet.
 */
export function regenerateSplats(
    worldData: Map<string, ChunkData>,
    architect: ProceduralArchitect
): void {
    const { CHUNK_SIZE, TILE_SIZE, SPLAT_RES } = MapEditorConfig;

    for (const data of worldData.values()) {
        data.splatMap = Array.from(new Uint8ClampedArray(SPLAT_RES * SPLAT_RES));
    }

    const allTiles: { x: number; y: number }[] = [];
    for (const [chunkKey, data] of worldData) {
        if (!data.zones) continue;
        const [cx, cy] = chunkKey.split(',').map(Number);
        for (const tileKey of Object.keys(data.zones)) {
            const [lx, ly] = tileKey.split(',').map(Number);
            allTiles.push({
                x: (cx * CHUNK_SIZE + lx) * TILE_SIZE,
                y: (cy * CHUNK_SIZE + ly) * TILE_SIZE
            });
        }
    }
    if (allTiles.length === 0) return;

    const splats = architect.evaluateSplats(allTiles, worldData);

    const SPLAT_CELL_SIZE = TILE_SIZE / 4;
    const SPLATS_PER_CHUNK = SPLAT_RES;

    for (const op of splats) {
        const centerSplatX = Math.floor(op.x / SPLAT_CELL_SIZE);
        const centerSplatY = Math.floor(op.y / SPLAT_CELL_SIZE);
        const rCeil = Math.ceil(op.radius);

        for (let dx = -rCeil; dx <= rCeil; dx++) {
            for (let dy = -rCeil; dy <= rCeil; dy++) {
                const distSq = dx * dx + dy * dy;
                if (distSq > op.radius * op.radius) continue;

                let factor = 1;
                if (op.radius > 1.5) {
                    const dist = Math.sqrt(distSq);
                    factor = Math.max(0, 1 - dist / op.radius);
                    factor = factor * factor * (3 - 2 * factor);
                }

                const sx = centerSplatX + dx;
                const sy = centerSplatY + dy;
                const chunkX = Math.floor(sx / SPLATS_PER_CHUNK);
                const chunkY = Math.floor(sy / SPLATS_PER_CHUNK);
                const chunkKey = `${chunkX},${chunkY}`;

                const data = worldData.get(chunkKey);
                if (!data) continue;
                if (!data.splatMap?.length) {
                    data.splatMap = Array.from(
                        new Uint8ClampedArray(SPLATS_PER_CHUNK * SPLATS_PER_CHUNK)
                    );
                }

                const localSx = ((sx % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                const localSy = ((sy % SPLATS_PER_CHUNK) + SPLATS_PER_CHUNK) % SPLATS_PER_CHUNK;
                const idx = localSy * SPLATS_PER_CHUNK + localSx;
                const val = data.splatMap[idx] || 0;
                data.splatMap[idx] = Math.min(255, Math.max(0, val + op.intensity * factor));
            }
        }
    }
}
