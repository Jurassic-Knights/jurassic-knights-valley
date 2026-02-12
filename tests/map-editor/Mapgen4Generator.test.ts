/**
 * Mapgen4Generator unit tests.
 * Tests deterministic mesh generation and drawCachedMeshToCanvas behavior.
 */
import { describe, it, expect } from 'vitest';
import {
    buildMeshAndMap,
    drawCachedMeshToCanvas,
    DEFAULT_MAPGEN4_PARAM,
    type Mapgen4Param
} from '../../src/tools/map-editor/Mapgen4Generator';

function makeParam(overrides: Partial<Mapgen4Param> = {}): Mapgen4Param {
    return { ...DEFAULT_MAPGEN4_PARAM, ...overrides };
}

describe('Mapgen4Generator', () => {
    describe('buildMeshAndMap', () => {
        it('returns mesh and map with expected structure', () => {
            const { mesh, map } = buildMeshAndMap(DEFAULT_MAPGEN4_PARAM);

            expect(mesh).toBeDefined();
            expect(map).toBeDefined();
            expect(mesh.numSolidRegions).toBeGreaterThan(0);
            expect(mesh.numSolidSides).toBeGreaterThan(0);
            expect(map.elevation_r).toBeInstanceOf(Float32Array);
            expect(map.rainfall_r).toBeInstanceOf(Float32Array);
            expect(map.flow_s).toBeInstanceOf(Float32Array);
            expect(map.elevation_r.length).toBeGreaterThanOrEqual(mesh.numSolidRegions);
        });

        it('produces deterministic output for same params', () => {
            const param = makeParam({ meshSeed: 99999 });
            const a = buildMeshAndMap(param);
            const b = buildMeshAndMap(param);

            expect(a.mesh.numSolidRegions).toBe(b.mesh.numSolidRegions);
            expect(a.mesh.numSolidSides).toBe(b.mesh.numSolidSides);

            const n = Math.min(10, a.mesh.numSolidRegions);
            for (let r = 0; r < n; r++) {
                expect(a.map.elevation_r[r]).toBe(b.map.elevation_r[r]);
                expect(a.map.rainfall_r[r]).toBe(b.map.rainfall_r[r]);
            }
        });

        it('produces different output for different meshSeed', () => {
            const a = buildMeshAndMap(makeParam({ meshSeed: 111 }));
            const b = buildMeshAndMap(makeParam({ meshSeed: 222 }));

            // Different seeds produce different mesh structure or different elevation/rainfall
            const structureDiffers = a.mesh.numSolidRegions !== b.mesh.numSolidRegions;
            const n = Math.min(50, a.mesh.numSolidRegions, b.mesh.numSolidRegions);
            const elevationDiffers = Array.from({ length: n }).some(
                (_, r) => a.map.elevation_r[r] !== b.map.elevation_r[r]
            );
            expect(structureDiffers || elevationDiffers).toBe(true);
        });
    });

    describe('drawCachedMeshToCanvas', () => {
        it('draws without throwing when given valid inputs', () => {
            const { mesh, map } = buildMeshAndMap(DEFAULT_MAPGEN4_PARAM);
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;

            expect(() => {
                drawCachedMeshToCanvas(canvas, mesh, map, DEFAULT_MAPGEN4_PARAM, 0, 0, 1000, 1000);
            }).not.toThrow();
        });

        it('handles viewport clipping (partial viewport)', () => {
            const { mesh, map } = buildMeshAndMap(DEFAULT_MAPGEN4_PARAM);
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;

            expect(() => {
                drawCachedMeshToCanvas(canvas, mesh, map, DEFAULT_MAPGEN4_PARAM, 200, 300, 400, 400);
            }).not.toThrow();
        });
    });
});
