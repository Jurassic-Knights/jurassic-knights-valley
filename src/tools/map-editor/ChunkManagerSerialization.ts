/**
 * ChunkManagerSerialization — Serialize ChunkData and parse raw payload.
 */

import type { ChunkData, HeroSpawnPosition } from './MapEditorTypes';

export interface SerializedMapPayload {
    version: number;
    chunks: ChunkData[];
    heroSpawn?: HeroSpawnPosition;
}

export function serialize(
    worldData: Map<string, ChunkData>,
    heroSpawn: HeroSpawnPosition | null
): SerializedMapPayload {
    const chunks: ChunkData[] = [];
    worldData.forEach((chunk) => chunks.push(chunk));
    const out: SerializedMapPayload = { version: 1, chunks };
    if (heroSpawn) out.heroSpawn = heroSpawn;
    return out;
}

/** Parse raw chunk payload into ChunkData. SplatMap is regenerated from zones. */
export function parseChunkFromRaw(raw: { id?: string; objects?: unknown; zones?: unknown }): ChunkData {
    return {
        id: raw.id ?? '',
        objects: Array.isArray(raw.objects) ? raw.objects : [],
        zones: raw.zones && typeof raw.zones === 'object' ? (raw.zones as Record<string, Record<string, string>>) : undefined,
        splatMap: undefined
    };
}

export interface DeserializeContext {
    worldData: Map<string, ChunkData>;
    loadingChunks: Set<string>;
    groundSystem: { clearCache(): void };
    zoneSystem: { regenerateSplats(worldData: Map<string, ChunkData>): void };
    setHeroSpawn: (heroSpawn: HeroSpawnPosition | null) => void;
    unloadAll: () => void;
}

/** Load map data into context. Clears current world and repopulates. Splat data regenerated from zones. */
export function deserializeInto(
    data: { version?: number; chunks?: ChunkData[]; heroSpawn?: HeroSpawnPosition },
    ctx: DeserializeContext
): void {
    if (!data.chunks || !Array.isArray(data.chunks)) return;
    if (data.chunks.length === 0 && ctx.worldData.size > 0) return;

    ctx.setHeroSpawn(
        data.heroSpawn && typeof data.heroSpawn.x === 'number' && typeof data.heroSpawn.y === 'number'
            ? { x: data.heroSpawn.x, y: data.heroSpawn.y }
            : null
    );

    ctx.unloadAll();
    ctx.loadingChunks.clear();
    ctx.groundSystem.clearCache();
    ctx.worldData.clear();

    for (const raw of data.chunks) {
        const chunk = parseChunkFromRaw(raw);
        ctx.worldData.set(chunk.id, chunk);
    }
    ctx.zoneSystem.regenerateSplats(ctx.worldData);
}
