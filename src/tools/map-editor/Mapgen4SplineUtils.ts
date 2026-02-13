/**
 * Mapgen4SplineUtils — Catmull-Rom spline and railroad mesh generation.
 * Used by Mapgen4PreviewRenderer and RailroadMeshRenderer.
 */

import type { Mesh } from './mapgen4/types';

/** Catmull-Rom spline: position and tangent at t in [0,1] for segment between p1 and p2. */
export function catmullRom(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
): { x: number; y: number; tx: number; ty: number } {
    const t2 = t * t;
    const t3 = t2 * t;
    const x =
        0.5 *
        (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
    const y =
        0.5 *
        (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
    const tx =
        0.5 *
        (-p0.x + p2.x +
            2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t +
            3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);
    const ty =
        0.5 *
        (-p0.y + p2.y +
            2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t +
            3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);
    return { x, y, tx, ty };
}

/** Railroad tile size in world pixels — fixed in world space. */
export const RAILROAD_TILE_WORLD_PX = 512;
/** Mesh units per tile (1000 mesh = 160000 world px). */
export const RAILROAD_TILE_MESH = RAILROAD_TILE_WORLD_PX / (160000 / 1000);
/** Plank (sleeper) spacing: more planks per tile. */
export const RAILROAD_PLANK_TILE_MESH = RAILROAD_TILE_MESH / 3;
/** Plank width factor: planks extend only a bit past the metal rails (0..1). */
export const RAILROAD_PLANK_WIDTH_FACTOR = 0.55;

/**
 * Simplify point list for spline: keep key waypoints, drop intermediate polygon vertices.
 * Douglas-Peucker with tolerance. Preserves first and last points for closed loops.
 */
export function simplifyPathForSpline(
    points: { x: number; y: number }[],
    tolerance: number
): { x: number; y: number }[] {
    const n = points.length;
    if (n <= 2) return points;
    if (tolerance <= 0) return points;

    function perpendicularDist(
        p: { x: number; y: number },
        a: { x: number; y: number },
        b: { x: number; y: number }
    ): number {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1e-10;
        const u = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (len * len);
        const closestX = a.x + u * dx;
        const closestY = a.y + u * dy;
        return Math.hypot(p.x - closestX, p.y - closestY);
    }

    function douglasPeucker(start: number, end: number): number[] {
        if (end - start <= 1) return [start];
        const a = points[start];
        const b = points[end];
        let maxD = 0;
        let maxI = start;
        for (let i = start + 1; i < end; i++) {
            const d = perpendicularDist(points[i], a, b);
            if (d > maxD) {
                maxD = d;
                maxI = i;
            }
        }
        if (maxD < tolerance) return [start, end];
        const left = douglasPeucker(start, maxI);
        const right = douglasPeucker(maxI, end);
        return [...left.slice(0, -1), ...right];
    }

    const indices = douglasPeucker(0, n - 1);
    const result = indices.map((i) => ({ x: points[i].x, y: points[i].y }));
    if (result.length < 2) return points;
    return result;
}

/**
 * Insert intermediate waypoints with gentle perpendicular offset for train-track-like curves.
 * Real tracks don't have sharp corners; they use gradual arcs. This adds 1–2 points per segment
 * with a small outward bulge (away from centroid for closed loops).
 */
export function insertGentleCurveWaypoints(
    points: { x: number; y: number }[],
    isClosed: boolean,
    offsetFactor = 0.08
): { x: number; y: number }[] {
    const n = points.length;
    if (n < 2) return points;

    let cx = 0;
    let cy = 0;
    for (const pt of points) {
        cx += pt.x;
        cy += pt.y;
    }
    cx /= n;
    cy /= n;

    const result: { x: number; y: number }[] = [];
    const count = isClosed ? n : n - 1;

    for (let i = 0; i < count; i++) {
        const a = points[i];
        const b = points[(i + 1) % n];
        result.push({ x: a.x, y: a.y });

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const segLen = Math.hypot(dx, dy) || 1e-10;
        const ux = dx / segLen;
        const uy = dy / segLen;
        const perpX = -uy;
        const perpY = ux;

        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const toCentroidX = cx - midX;
        const toCentroidY = cy - midY;
        const outward = perpX * toCentroidX + perpY * toCentroidY < 0;
        const sign = outward ? 1 : -1;

        const offset = segLen * offsetFactor * sign;
        const m1 = {
            x: midX + perpX * offset * 0.6,
            y: midY + perpY * offset * 0.6
        };
        result.push(m1);
    }

    if (!isClosed) result.push({ x: points[n - 1].x, y: points[n - 1].y });
    return result;
}

/** Split path into continuous segments (break when consecutive regions are not adjacent). */
export function splitPathIntoSegments(mesh: Mesh, path: number[]): number[][] {
    const segments: number[][] = [];
    let current: number[] = [];
    for (let i = 0; i < path.length; i++) {
        const r = path[i];
        if (current.length > 0) {
            const prevR = current[current.length - 1];
            const sides: number[] = [];
            mesh.s_around_r(prevR, sides);
            let adjacent = false;
            for (const s of sides) {
                if (s < 0) continue;
                const rNext = mesh.r_begin_s(s) === prevR ? mesh.r_end_s(s) : mesh.r_begin_s(s);
                if (rNext === r) {
                    adjacent = true;
                    break;
                }
            }
            if (!adjacent) {
                if (current.length >= 2) segments.push(current);
                current = [];
            }
        }
        current.push(r);
    }
    if (current.length >= 2) segments.push(current);
    return segments;
}

/** Tangent at junction p(0) for closed loop: (p(1) - p(n-1)) / 2 from Catmull-Rom. */
function junctionTangent(p: (i: number) => { x: number; y: number }, n: number): number {
    const dx = p(1).x - p(-1).x;
    const dy = p(1).y - p(-1).y;
    return Math.atan2(dy, dx);
}

/** Dense spline samples for CLOSED curve. Wraps last→first; first and last share position and angle for seamless merge. */
export function buildSplineFineSamplesClosed(
    points: { x: number; y: number }[],
    stepsPerSegment: number,
    forceLinear = false
): { x: number; y: number; angle: number; cumLen: number }[] {
    const n = points.length;
    if (n < 3) return buildSplineFineSamples(points, stepsPerSegment, forceLinear);
    const p = (i: number) => points[((i % n) + n) % n];
    const junctionAngle = junctionTangent(p, n);

    const result: { x: number; y: number; angle: number; cumLen: number }[] = [];
    let cumLen = 0;
    result.push({ x: p(0).x, y: p(0).y, angle: junctionAngle, cumLen: 0 });
    let prev = { x: p(0).x, y: p(0).y };

    for (let seg = 0; seg < n; seg++) {
        const p0 = p(seg - 1);
        const p1 = p(seg);
        const p2 = p(seg + 1);
        const p3 = p(seg + 2);

        const v1x = p1.x - p0.x;
        const v1y = p1.y - p0.y;
        const v2x = p2.x - p1.x;
        const v2y = p2.y - p1.y;
        const len1 = Math.hypot(v1x, v1y) || 1;
        const len2 = Math.hypot(v2x, v2y) || 1;
        const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
        const useLinear = forceLinear || cos < 0.15;

        for (let k = 1; k <= stepsPerSegment; k++) {
            const t = k / stepsPerSegment;
            let x: number;
            let y: number;
            let tx: number;
            let ty: number;
            if (useLinear) {
                x = p1.x + (p2.x - p1.x) * t;
                y = p1.y + (p2.y - p1.y) * t;
                tx = p2.x - p1.x;
                ty = p2.y - p1.y;
            } else {
                const cr = catmullRom(p0, p1, p2, p3, t);
                x = cr.x;
                y = cr.y;
                tx = cr.tx;
                ty = cr.ty;
            }
            cumLen += Math.hypot(x - prev.x, y - prev.y);
            const angle = Math.atan2(ty, tx);
            result.push({ x, y, angle, cumLen });
            prev = { x, y };
        }
    }

    const totalLen = result[result.length - 1].cumLen;
    result[result.length - 1] = {
        x: p(0).x,
        y: p(0).y,
        angle: junctionAngle,
        cumLen: totalLen
    };
    result[0].angle = junctionAngle;
    return result;
}

/** Dense spline samples for OPEN curve. Falls back to linear for sharp bends. */
export function buildSplineFineSamples(
    points: { x: number; y: number }[],
    stepsPerSegment: number,
    forceLinear = false
): { x: number; y: number; angle: number; cumLen: number }[] {
    const n = points.length;
    if (n < 2) return [];
    const p = (i: number) => points[Math.max(0, Math.min(i, n - 1))];

    const result: { x: number; y: number; angle: number; cumLen: number }[] = [];
    let cumLen = 0;
    result.push({ x: p(0).x, y: p(0).y, angle: 0, cumLen: 0 });
    let prev = { x: p(0).x, y: p(0).y };

    for (let seg = 0; seg < n - 1; seg++) {
        const p0 = seg === 0 ? p(0) : p(seg - 1);
        const p1 = p(seg);
        const p2 = p(seg + 1);
        const p3 = seg === n - 2 ? p(n - 1) : p(seg + 2);

        const v1x = p1.x - p0.x;
        const v1y = p1.y - p0.y;
        const v2x = p2.x - p1.x;
        const v2y = p2.y - p1.y;
        const len1 = Math.hypot(v1x, v1y) || 1;
        const len2 = Math.hypot(v2x, v2y) || 1;
        const cos = (v1x * v2x + v1y * v2y) / (len1 * len2);
        const useLinear = forceLinear || cos < 0.15;

        for (let k = 1; k <= stepsPerSegment; k++) {
            const t = k / stepsPerSegment;
            let x: number;
            let y: number;
            let tx: number;
            let ty: number;
            if (useLinear) {
                x = p1.x + (p2.x - p1.x) * t;
                y = p1.y + (p2.y - p1.y) * t;
                tx = p2.x - p1.x;
                ty = p2.y - p1.y;
            } else {
                const cr = catmullRom(p0, p1, p2, p3, t);
                x = cr.x;
                y = cr.y;
                tx = cr.tx;
                ty = cr.ty;
            }
            cumLen += Math.hypot(x - prev.x, y - prev.y);
            result.push({ x, y, angle: Math.atan2(ty, tx), cumLen });
            prev = { x, y };
        }
    }
    return result;
}

/** Build arc-length parameterized spline. Sample at fixed distance intervals for tiling. */
export function buildSplineArcLengthSamples(
    points: { x: number; y: number }[],
    sampleInterval: number,
    forceLinear = false
): { x: number; y: number; angle: number }[] {
    const n = points.length;
    if (n < 2) return [];
    const p = (i: number) => points[((i % n) + n) % n];

    const fineSamples: { x: number; y: number; angle: number; cumLen: number }[] = [];
    let cumLen = 0;
    fineSamples.push({ x: p(0).x, y: p(0).y, angle: 0, cumLen: 0 });
    let prev = { x: p(0).x, y: p(0).y };

    for (let seg = 0; seg < n; seg++) {
        const p1 = p(seg);
        const p2 = p(seg + 1);
        const steps = 20;
        for (let k = 1; k <= steps; k++) {
            const t = k / steps;
            let x: number;
            let y: number;
            let tx: number;
            let ty: number;
            if (forceLinear) {
                x = p1.x + (p2.x - p1.x) * t;
                y = p1.y + (p2.y - p1.y) * t;
                tx = p2.x - p1.x;
                ty = p2.y - p1.y;
            } else {
                const p0 = p(seg - 1);
                const p3 = p(seg + 2);
                const cr = catmullRom(p0, p1, p2, p3, t);
                x = cr.x;
                y = cr.y;
                tx = cr.tx;
                ty = cr.ty;
            }
            cumLen += Math.hypot(x - prev.x, y - prev.y);
            fineSamples.push({ x, y, angle: Math.atan2(ty, tx), cumLen });
            prev = { x, y };
        }
    }

    if (fineSamples.length < 2) return [];
    const totalLen = fineSamples[fineSamples.length - 1].cumLen;
    const tileCount = Math.max(1, Math.ceil(totalLen / sampleInterval));
    const result: { x: number; y: number; angle: number }[] = [];

    for (let i = 0; i <= tileCount; i++) {
        const targetLen = Math.min(i * sampleInterval, totalLen);
        let idx = 0;
        while (idx < fineSamples.length && fineSamples[idx].cumLen < targetLen) idx++;
        idx = Math.min(idx, fineSamples.length - 1);
        const a = fineSamples[idx];
        const b = idx > 0 ? fineSamples[idx - 1] : a;
        const segLen = a.cumLen - b.cumLen;
        const t = segLen > 1e-6 ? (targetLen - b.cumLen) / segLen : 1;
        result.push({
            x: b.x + (a.x - b.x) * t,
            y: b.y + (a.y - b.y) * t,
            angle: b.angle + (a.angle - b.angle) * t
        });
    }
    return result;
}

const MESH_TO_WORLD = 160000 / 1000;
const STEPS_PER_SEGMENT = 24;

/**
 * Build railroad mesh data: one continuous spline mesh.
 * Uses Catmull-Rom spline samples with gentle curve waypoints.
 * Vertices follow the spline; UVs tile along arc length for seamless texture.
 */
export function buildRailroadSplineMeshData(
    mesh: Mesh,
    path: number[]
): { positions: Float32Array; uvs: Float32Array; indices: Uint32Array }[] {
    if (path.length < 2) return [];

    const pts = path.map((r) => ({ x: mesh.x_of_r(r), y: mesh.y_of_r(r) }));
    const isClosed = path.length >= 3 && path[0] === path[path.length - 1];
    const rawPoints = isClosed ? pts.slice(0, -1) : pts;
    const points = insertGentleCurveWaypoints(rawPoints, isClosed);

    const samples =
        isClosed && points.length >= 3
            ? buildSplineFineSamplesClosed(points, STEPS_PER_SEGMENT, false)
            : buildSplineFineSamples(points, STEPS_PER_SEGMENT, false);

    if (samples.length < 2) return [];

    const halfW = RAILROAD_TILE_MESH / 2;
    const positions: number[] = [];
    const uvs: number[] = [];

    for (const s of samples) {
        const px = Math.cos(s.angle + Math.PI / 2) * halfW;
        const py = Math.sin(s.angle + Math.PI / 2) * halfW;
        const lx = (s.x - px) * MESH_TO_WORLD;
        const ly = (s.y - py) * MESH_TO_WORLD;
        const rx = (s.x + px) * MESH_TO_WORLD;
        const ry = (s.y + py) * MESH_TO_WORLD;
        positions.push(lx, ly);
        positions.push(rx, ry);
        const u = s.cumLen / RAILROAD_TILE_MESH;
        uvs.push(u, 0);
        uvs.push(u, 1);
    }

    const indices: number[] = [];
    for (let i = 0; i < samples.length - 1; i++) {
        const a = 2 * i;
        const b = 2 * (i + 1);
        indices.push(a, a + 1, b + 1);
        indices.push(a, b + 1, b);
    }

    return [{
        positions: new Float32Array(positions),
        uvs: new Float32Array(uvs),
        indices: new Uint32Array(indices)
    }];
}
