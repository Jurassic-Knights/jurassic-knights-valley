/*
 * Build mapgen4 mesh from points (no precomputed points file).
 * From https://www.redblobgames.com/maps/mapgen4/ mesh.ts + generate-points.
 */
import Delaunator from 'delaunator';
import { TriangleMesh, type MeshInitializer } from './dual-mesh/index';
import type { Mesh } from './types';
import { choosePoints } from './generate-points';
import { createNoise2D } from 'simplex-noise';
import { makeRandFloat } from './Prng';
import type { MapConstraints } from './map';

export interface BuildMeshResult {
    mesh: Mesh;
    t_peaks: number[];
}

export function buildMesh(seed: number, spacing: number, mountainSpacing: number): BuildMeshResult {
    const { points, numExteriorBoundaryPoints, numInteriorBoundaryPoints, numMountainPoints } =
        choosePoints(seed, spacing, mountainSpacing);

    const numBoundaryPoints = numExteriorBoundaryPoints + numInteriorBoundaryPoints;
    const delaunator = Delaunator.from(
        points,
        (p: unknown) => (p as [number, number])[0],
        (p: unknown) => (p as [number, number])[1]
    );

    const triangles = new Int32Array(delaunator.triangles);
    const halfedges = new Int32Array(delaunator.halfedges);
    let init: MeshInitializer = {
        points,
        delaunator: { triangles, halfedges },
        numBoundaryPoints,
        numSolidSides: triangles.length
    };
    init = TriangleMesh.addGhostStructure(init);
    const mesh = new TriangleMesh(init) as Mesh;

    mesh.is_boundary_t = new Int8Array(mesh.numTriangles);
    for (let t = 0; t < mesh.numTriangles; t++) {
        mesh.is_boundary_t[t] = mesh.r_around_t(t).some((r) => mesh.is_boundary_r(r)) ? 1 : 0;
    }

    mesh.length_s = new Float32Array(mesh.numSides);
    for (let s = 0; s < mesh.numSides; s++) {
        const r1 = mesh.r_begin_s(s);
        const r2 = mesh.r_end_s(s);
        const dx = mesh.x_of_r(r1) - mesh.x_of_r(r2);
        const dy = mesh.y_of_r(r1) - mesh.y_of_r(r2);
        mesh.length_s[s] = Math.sqrt(dx * dx + dy * dy);
    }

    const r_peaks = Array.from(
        { length: numMountainPoints },
        (_, index) => index + numExteriorBoundaryPoints + numInteriorBoundaryPoints
    );
    const t_peaks: number[] = [];
    for (const r of r_peaks) {
        t_peaks.push(mesh.t_inner_s(mesh._s_of_r[r]));
    }

    return { mesh, t_peaks };
}

const CANVAS_SIZE = 128;

/** Generate default elevation constraints from seed + island (mapgen4 painting-style). */
export function makeDefaultConstraints(seed: number, island: number): MapConstraints {
    const elevation = new Float32Array(CANVAS_SIZE * CANVAS_SIZE);
    const noise2D = createNoise2D(makeRandFloat(seed));
    const persistence = 1 / 2;
    const amplitudes = Array.from({ length: 5 }, (_, octave) => Math.pow(persistence, octave));

    function fbmNoise(nx: number, ny: number): number {
        let sum = 0;
        let sumOfAmplitudes = 0;
        for (let octave = 0; octave < amplitudes.length; octave++) {
            const frequency = 1 << octave;
            sum += amplitudes[octave] * noise2D(nx * frequency, ny * frequency);
            sumOfAmplitudes += amplitudes[octave];
        }
        return sum / sumOfAmplitudes;
    }

    for (let y = 0; y < CANVAS_SIZE; y++) {
        for (let x = 0; x < CANVAS_SIZE; x++) {
            const p = y * CANVAS_SIZE + x;
            const nx = (2 * x) / CANVAS_SIZE - 1;
            const ny = (2 * y) / CANVAS_SIZE - 1;
            const distance = Math.max(Math.abs(nx), Math.abs(ny));
            let e = 0.5 * (fbmNoise(nx, ny) + island * (0.75 - 2 * distance * distance));
            if (e < -1.0) e = -1.0;
            if (e > 1.0) e = 1.0;
            elevation[p] = e;
            if (e > 0.0) {
                const m = 0.5 * noise2D(nx + 30, ny + 50) + 0.5 * noise2D(2 * nx + 33, 2 * ny + 55);
                const mountain = Math.min(1.0, e * 5.0) * (1 - Math.abs(m) / 0.5);
                if (mountain > 0.0) {
                    elevation[p] = Math.max(e, Math.min(e * 3, mountain));
                }
            }
        }
    }
    return { size: CANVAS_SIZE, constraints: elevation };
}
