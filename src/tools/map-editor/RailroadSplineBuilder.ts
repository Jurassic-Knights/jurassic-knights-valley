/**
 * RailroadSplineBuilder — Build railroad spline mesh from region path.
 * Train physics: long straight segments, gentle curves. Pipeline: simplify → arc corners → spline.
 */

import type { Mesh } from './mapgen4/types';
import { simplifyPathForSpline } from './Mapgen4MathUtils';
import { insertArcWaypointsAtCorners, smoothPath } from './Mapgen4CurveUtils';
import { buildSplineFineSamplesClosed, buildSplineFineSamples } from './Mapgen4SegmentUtils';

/** Railroad tile size in world pixels — fixed in world space. */
export const RAILROAD_TILE_WORLD_PX = 1024;
/** Mesh units per tile (1000 mesh = 160000 world px). */
export const RAILROAD_TILE_MESH = RAILROAD_TILE_WORLD_PX / (160000 / 1000);

/** Douglas-Peucker tolerance. Lower = preserve more points so path stays on land. */
const RAILROAD_SIMPLIFY_TOLERANCE = 6;

/** Arc radius for corners. Larger = gentler turns (train is rigid, turns slowly). */
const DEFAULT_ARC_RADIUS_MESH = 28;

const MESH_TO_WORLD = 160000 / 1000;
const STEPS_PER_SEGMENT = 24;

/** Minimum distance (mesh units) between consecutive spline samples; thins dense clusters at bends. */
const MIN_SAMPLE_SPACING_MESH = 3;

/** Subdivisions per segment for the polygon mesh; more = smoother strip, same spline. */
const SUBDIVISIONS_PER_SEGMENT = 4;

/** Cap spline samples to avoid OOM from very long paths. */
const MAX_SPLINE_SAMPLES = 1200;

/** Sample along the spline: { x, y, angle, cumLen } in mesh coords. */
export type RailroadSplineSample = { x: number; y: number; angle: number; cumLen: number };

/**
 * Thin samples so consecutive points are at least minSpacing apart. Reduces dense clusters at bends.
 * Recomputes cumLen for the kept points.
 */
function thinSamplesByMinSpacing(
    samples: RailroadSplineSample[],
    minSpacing: number,
    _isClosed: boolean
): RailroadSplineSample[] {
    if (samples.length < 2) return samples;
    const kept: RailroadSplineSample[] = [{ ...samples[0] }];
    let lastKept = samples[0]!;
    for (let i = 1; i < samples.length; i++) {
        const s = samples[i]!;
        const isLast = i === samples.length - 1;
        const dist = Math.hypot(s.x - lastKept.x, s.y - lastKept.y);
        if (isLast || dist >= minSpacing) {
            kept.push({ x: s.x, y: s.y, angle: s.angle, cumLen: 0 });
            lastKept = s;
        }
    }
    let cumLen = 0;
    kept[0]!.cumLen = 0;
    for (let j = 1; j < kept.length; j++) {
        const a = kept[j - 1]!;
        const b = kept[j]!;
        cumLen += Math.hypot(b.x - a.x, b.y - a.y);
        kept[j] = { ...b, cumLen };
    }
    return kept.length >= 2 ? kept : samples;
}

/**
 * Smooth sample positions (Laplacian: each point averaged with neighbors).
 * Recomputes angle and cumLen from the smoothed path. Closed loops only; no fixed indices.
 */
function smoothSplineSamples(
    samples: RailroadSplineSample[],
    isClosed: boolean,
    iterations = 2,
    lambda = 0.45,
    fixedIndices?: Set<number>
): RailroadSplineSample[] {
    if (samples.length < 3) return samples;
    const points = samples.map((s) => ({ x: s.x, y: s.y }));
    const smoothed = smoothPath(points, isClosed, iterations, lambda, fixedIndices);
    const n = smoothed.length;
    let cumLen = 0;
    const result: RailroadSplineSample[] = [];
    for (let i = 0; i < n; i++) {
        const prev = smoothed[(i - 1 + n) % n]!;
        const curr = smoothed[i]!;
        const next = smoothed[(i + 1) % n]!;
        if (i > 0) cumLen += Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        result.push({ x: curr.x, y: curr.y, angle, cumLen });
    }
    if (isClosed && n >= 2) {
        const totalLen =
            cumLen +
            Math.hypot(smoothed[0]!.x - smoothed[n - 1]!.x, smoothed[0]!.y - smoothed[n - 1]!.y);
        result[n - 1] = {
            x: smoothed[0]!.x,
            y: smoothed[0]!.y,
            angle: result[0]!.angle,
            cumLen: totalLen
        };
    }
    return result;
}

/**
 * Build spline samples from region path. Single source of truth for railroad spline geometry.
 * Pipeline: simplify → arc corners → Catmull-Rom (linear at sharp bends).
 * Used by both mesh builder and canvas preview so texture mesh and spline path match.
 * stationRegionIds: region IDs of towns — these points are never simplified away
 * and arcs never replace them, so the spline passes through each station.
 */
export function buildRailroadSplineSamples(
    mesh: Mesh,
    path: number[],
    stationRegionIds?: number[]
): RailroadSplineSample[] {
    if (path.length < 2) return [];

    const pts = path.map((r) => ({ x: mesh.x_of_r(r), y: mesh.y_of_r(r) }));
    const isClosed = path.length >= 3 && path[0] === path[path.length - 1];
    const rawPoints = isClosed ? pts.slice(0, -1) : pts;
    const stationSet = stationRegionIds ? new Set(stationRegionIds) : undefined;
    const preserveIndices =
        stationSet && stationSet.size > 0
            ? new Set(rawPoints.map((_, i) => i).filter((i) => stationSet!.has(path[i])))
            : undefined;
    const { points: simplified, preservedResultIndices } = simplifyPathForSpline(
        rawPoints,
        RAILROAD_SIMPLIFY_TOLERANCE,
        preserveIndices
    );

    const arcPreserve =
        preservedResultIndices && preservedResultIndices.size > 0
            ? preservedResultIndices
            : undefined;
    const points = insertArcWaypointsAtCorners(
        simplified,
        isClosed,
        DEFAULT_ARC_RADIUS_MESH,
        arcPreserve
    );

    const rawSamples =
        isClosed && points.length >= 3
            ? buildSplineFineSamplesClosed(points, STEPS_PER_SEGMENT)
            : buildSplineFineSamples(points, STEPS_PER_SEGMENT);

    const thinned = thinSamplesByMinSpacing(
        rawSamples,
        MIN_SAMPLE_SPACING_MESH,
        isClosed && points.length >= 3
    );
    const closed = isClosed && points.length >= 3;
    const fixedSamples = new Set<number>();
    if (closed && stationSet && stationSet.size > 0) {
        const stationCoords = Array.from(stationSet).map((r) => ({
            x: mesh.x_of_r(r),
            y: mesh.y_of_r(r)
        }));
        for (let i = 0; i < thinned.length; i++) {
            const s = thinned[i]!;
            for (const sc of stationCoords) {
                if (Math.abs(s.x - sc.x) < 0.1 && Math.abs(s.y - sc.y) < 0.1) {
                    fixedSamples.add(i);
                }
            }
        }
    }
    let samples = closed ? smoothSplineSamples(thinned, true, 2, 0.45, fixedSamples) : thinned;
    if (samples.length > MAX_SPLINE_SAMPLES) {
        const step = (samples.length - 1) / (MAX_SPLINE_SAMPLES - 1);
        const capped: RailroadSplineSample[] = [samples[0]!];
        for (let i = 1; i < MAX_SPLINE_SAMPLES - 1; i++) {
            const idx = Math.round(i * step);
            capped.push(samples[idx]!);
        }
        capped.push(samples[samples.length - 1]!);
        let cumLen = 0;
        capped[0]!.cumLen = 0;
        for (let j = 1; j < capped.length; j++) {
            const a = capped[j - 1]!;
            const b = capped[j]!;
            cumLen += Math.hypot(b.x - a.x, b.y - a.y);
            capped[j] = { ...b, cumLen };
        }
        samples = capped;
    }
    return samples.length >= 2 ? samples : [];
}

/** One ring of the strip: left/right positions (world) and u for UV. */
type Ring = { lx: number; ly: number; rx: number; ry: number; u: number };

/**
 * Build railroad mesh data: one continuous spline mesh.
 * Vertices follow the spline; UVs tile along arc length for seamless texture.
 * Each segment is subdivided (SUBDIVISIONS_PER_SEGMENT) for a smoother polygon strip.
 */
export function buildRailroadSplineMeshData(
    mesh: Mesh,
    path: number[],
    stationRegionIds?: number[]
): { positions: Float32Array; uvs: Float32Array; indices: Uint32Array }[] {
    const samples = buildRailroadSplineSamples(mesh, path, stationRegionIds);
    if (samples.length < 2) return [];

    const isClosed = path.length >= 3 && path[0] === path[path.length - 1];
    const halfW = RAILROAD_TILE_MESH / 2;
    const rings: Ring[] = [];
    for (const s of samples) {
        const px = Math.cos(s.angle + Math.PI / 2) * halfW;
        const py = Math.sin(s.angle + Math.PI / 2) * halfW;
        rings.push({
            lx: (s.x - px) * MESH_TO_WORLD,
            ly: (s.y - py) * MESH_TO_WORLD,
            rx: (s.x + px) * MESH_TO_WORLD,
            ry: (s.y + py) * MESH_TO_WORLD,
            u: s.cumLen / RAILROAD_TILE_MESH
        });
    }

    const sub = Math.max(1, SUBDIVISIONS_PER_SEGMENT);
    const expanded: Ring[] = [rings[0]!];
    for (let i = 0; i < rings.length - 1; i++) {
        const a = rings[i]!;
        const b = rings[i + 1]!;
        for (let k = 1; k <= sub; k++) {
            const t = k / (sub + 1);
            expanded.push({
                lx: (1 - t) * a.lx + t * b.lx,
                ly: (1 - t) * a.ly + t * b.ly,
                rx: (1 - t) * a.rx + t * b.rx,
                ry: (1 - t) * a.ry + t * b.ry,
                u: (1 - t) * a.u + t * b.u
            });
        }
        expanded.push(b);
    }
    if (isClosed && rings.length >= 3) {
        const a = rings[rings.length - 1]!;
        const b = rings[0]!;
        for (let k = 1; k <= sub; k++) {
            const t = k / (sub + 1);
            expanded.push({
                lx: (1 - t) * a.lx + t * b.lx,
                ly: (1 - t) * a.ly + t * b.ly,
                rx: (1 - t) * a.rx + t * b.rx,
                ry: (1 - t) * a.ry + t * b.ry,
                u: (1 - t) * a.u + t * b.u
            });
        }
        expanded.push(b);
    }

    const positions: number[] = [];
    const uvs: number[] = [];
    for (const r of expanded) {
        positions.push(r.lx, r.ly);
        positions.push(r.rx, r.ry);
        uvs.push(r.u, 0);
        uvs.push(r.u, 1);
    }

    const indices: number[] = [];
    const numRings = expanded.length;
    for (let j = 0; j < numRings - 1; j++) {
        const va = 2 * j;
        const vb = 2 * (j + 1);
        indices.push(va, va + 1, vb + 1);
        indices.push(va, vb + 1, vb);
    }

    return [
        {
            positions: new Float32Array(positions),
            uvs: new Float32Array(uvs),
            indices: new Uint32Array(indices)
        }
    ];
}
