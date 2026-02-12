/**
 * GroundSystemPalette - Palette resolution for ground blending
 */
import { GroundPalette } from '@data/ZonePalette';
import { ChunkData } from './MapEditorTypes';
import { ZoneCategory } from '@data/ZoneConfig';

export interface ResolvePaletteCtx {
    chunkKey: string;
    lx: number;
    ly: number;
    data: ChunkData;
    worldData: Map<string, ChunkData>;
}

/**
 * Resolves the Palette ID from biome and modifier.

 * Weight alone drives the visual (3-layer blend);
 * no neighbor-aware or terrain-specific overrides (terrain_coast, terrain_water, etc.).
 */
export function resolvePaletteId(
    biomeId: string | undefined,
    modifierId: string | null,
    _ctx?: ResolvePaletteCtx
): string | null {
    if (!biomeId) return null;

    const normalizedBiome = GroundPalette[biomeId]
        ? biomeId
        : biomeId.startsWith('biome_')
          ? biomeId
          : `biome_${biomeId}`;

    if (!modifierId) return normalizedBiome;
    const compositeId = `${normalizedBiome}_${modifierId}`;
    return GroundPalette[compositeId] ? compositeId : normalizedBiome;
}
