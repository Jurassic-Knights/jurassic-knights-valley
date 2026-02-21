/**
 * Mapgen4SegmentUtils — Splitting paths into region segments and building dense spline samples
 */

import type { Mesh } from './mapgen4/types';
import { catmullRom } from './Mapgen4MathUtils';

/** Only segments with effectively zero chord use linear (degenerate); all others use Catmull-Rom so bending is consistent. */
const MIN_CHORD_LENGTH_FOR_SPLINE = 1e-6;

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

/** Baseline steps (same as old fixed value); bends get more up to MAX. */
const MIN_STEPS_PER_SEGMENT = 24;
const MAX_STEPS_PER_SEGMENT = 64;

/**
 * Steps for segment p1->p2 from bend at both ends. Uses max bend so segments entering/leaving a corner get more steps.
 * cos=1 (straight) -> MIN, sharp (cos=-1) -> MAX.
 */
function stepsForSegment(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number }
): number {
    const vInX = p1.x - p0.x;
    const vInY = p1.y - p0.y;
    const vMidX = p2.x - p1.x;
    const vMidY = p2.y - p1.y;
    const vOutX = p3.x - p2.x;
    const vOutY = p3.y - p2.y;
    const lenIn = Math.hypot(vInX, vInY) || 1e-10;
    const lenMid = Math.hypot(vMidX, vMidY) || 1e-10;
    const lenOut = Math.hypot(vOutX, vOutY) || 1e-10;
    const cosAtP1 = (vInX * vMidX + vInY * vMidY) / (lenIn * lenMid);
    const cosAtP2 = (vMidX * vOutX + vMidY * vOutY) / (lenMid * lenOut);
    const cos = Math.min(cosAtP1, cosAtP2);
    const t = (1 - Math.max(-1, Math.min(1, cos))) * 0.5;
    const steps = Math.round(MIN_STEPS_PER_SEGMENT + t * (MAX_STEPS_PER_SEGMENT - MIN_STEPS_PER_SEGMENT));
    return Math.max(MIN_STEPS_PER_SEGMENT, Math.min(MAX_STEPS_PER_SEGMENT, steps));
}

/** Tangent at junction p(0) for closed loop: (p(1) - p(n-1)) / 2 from Catmull-Rom. */
function junctionTangent(p: (i: number) => { x: number; y: number }, n: number): number {
    const dx = p(1).x - p(-1).x;
    const dy = p(1).y - p(-1).y;
    return Math.atan2(dy, dx);
}

/** Dense spline samples for CLOSED curve. Wraps last→first; first and last share position and angle for seamless merge. Always uses Catmull-Rom (no linear fallback). */
export function buildSplineFineSamplesClosed(
    points: { x: number; y: number }[],
    stepsPerSegment: number
): { x: number; y: number; angle: number; cumLen: number }[] {
    const n = points.length;
    if (n < 3) return buildSplineFineSamples(points, stepsPerSegment);
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
        const chordLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const useLinear = chordLen < MIN_CHORD_LENGTH_FOR_SPLINE;
        const steps = stepsForSegment(p0, p1, p2, p3);

        for (let k = 1; k <= steps; k++) {
            const t = k / steps;
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

/** Dense spline samples for OPEN curve. Always uses Catmull-Rom (no linear fallback). */
export function buildSplineFineSamples(
    points: { x: number; y: number }[],
    stepsPerSegment: number
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
        const chordLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const useLinear = chordLen < MIN_CHORD_LENGTH_FOR_SPLINE;
        const steps = stepsForSegment(p0, p1, p2, p3);

        for (let k = 1; k <= steps; k++) {
            const t = k / steps;
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
