/**
 * Mapgen4BiomeConfig unit tests.
 * Tests radial biome assignment and deterministic sector permutation.
 */
import { describe, it, expect } from 'vitest';
import {
    positionToBiome,
    BIOME_PREVIEW_PALETTE,
    MAPGEN4_CENTER_X,
    MAPGEN4_CENTER_Y,
    MAPGEN4_INNER_RADIUS
} from '../../src/tools/map-editor/Mapgen4BiomeConfig';

describe('Mapgen4BiomeConfig', () => {
    describe('positionToBiome', () => {
        it('returns grasslands for center position', () => {
            expect(positionToBiome(MAPGEN4_CENTER_X, MAPGEN4_CENTER_Y, 12345)).toBe('grasslands');
        });

        it('returns grasslands within inner radius (well inside, noise-safe)', () => {
            expect(positionToBiome(MAPGEN4_CENTER_X + 50, MAPGEN4_CENTER_Y, 12345)).toBe(
                'grasslands'
            );
            expect(positionToBiome(MAPGEN4_CENTER_X, MAPGEN4_CENTER_Y + 80, 999)).toBe(
                'grasslands'
            );
        });

        it('returns outer biome beyond inner radius', () => {
            const x = MAPGEN4_CENTER_X + MAPGEN4_INNER_RADIUS + 50;
            const y = MAPGEN4_CENTER_Y;
            const biome = positionToBiome(x, y, 12345);
            expect(['tundra', 'desert', 'badlands']).toContain(biome);
        });

        it('produces deterministic output for same seed', () => {
            const x = MAPGEN4_CENTER_X + 400;
            const y = MAPGEN4_CENTER_Y + 400;
            expect(positionToBiome(x, y, 42)).toBe(positionToBiome(x, y, 42));
        });

        it('can produce different sector mappings for different seeds', () => {
            const x = MAPGEN4_CENTER_X + 400;
            const y = MAPGEN4_CENTER_Y + 400;
            const a = positionToBiome(x, y, 1);
            const b = positionToBiome(x, y, 99999);
            expect(['tundra', 'desert', 'badlands']).toContain(a);
            expect(['tundra', 'desert', 'badlands']).toContain(b);
        });
    });

    describe('BIOME_PREVIEW_PALETTE', () => {
        it('has terrain-specific palette for all four biomes', () => {
            expect(BIOME_PREVIEW_PALETTE.grasslands).toBeDefined();
            expect(BIOME_PREVIEW_PALETTE.tundra).toBeDefined();
            expect(BIOME_PREVIEW_PALETTE.desert).toBeDefined();
            expect(BIOME_PREVIEW_PALETTE.badlands).toBeDefined();
        });

        it('each biome has colors for water, coast, river, and land terrain zones', () => {
            const terrainZones = [
                'terrain_deep_water',
                'terrain_water',
                'terrain_coast',
                'terrain_river',
                'terrain_dirtbank',
                'terrain_lowland',
                'terrain_land',
                'terrain_highland',
                'terrain_hill',
                'terrain_midmountain',
                'terrain_mountain'
            ];
            for (const biome of Object.keys(BIOME_PREVIEW_PALETTE)) {
                const p = BIOME_PREVIEW_PALETTE[biome];
                for (const t of terrainZones) {
                    expect(p[t]).toBeDefined();
                    expect(p[t]).toMatch(/^#[0-9a-fA-F]{6}$/);
                }
            }
        });
    });
});
