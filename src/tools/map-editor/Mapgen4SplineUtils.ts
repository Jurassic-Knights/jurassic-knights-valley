/**
 * Mapgen4SplineUtils — Catmull-Rom spline math and path utilities.
 * Railroad mesh building is in RailroadSplineBuilder.
 */

import type { Mesh } from './mapgen4/types';

/**
 * Cardinal spline (tensioned Catmull-Rom): position and tangent at t in [0,1] for segment p1->p2.
 * Tension in [0,1]: 0 = loosest (can overshoot/loop), 0.5 = standard CR, 1 = linear. Use ~0.5 to avoid self-overlap.
 */
const CARDINAL_TENSION = 0.5;

/** Only segments with effectively zero chord use linear (degenerate); all others use Catmull-Rom so bending is consistent. */
const MIN_CHORD_LENGTH_FOR_SPLINE = 1e-6;

export function catmullRom(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    t: number
): { x: number; y: number; tx: number; ty: number } {
    const s = (1 - CARDINAL_TENSION) / 2; // tangent scale: smaller = tighter, less overshoot
    const m1x = s * (p2.x - p0.x);
    const m1y = s * (p2.y - p0.y);
    const m2x = s * (p3.x - p1.x);
    const m2y = s * (p3.y - p1.y);
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    const x = p1.x * h00 + m1x * h10 + p2.x * h01 + m2x * h11;
    const y = p1.y * h00 + m1y * h10 + p2.y * h01 + m2y * h11;
    const h00d = 6 * t2 - 6 * t;
    const h10d = 3 * t2 - 4 * t + 1;
    const h01d = -6 * t2 + 6 * t;
    const h11d = 3 * t2 - 2 * t;
    const tx = p1.x * h00d + m1x * h10d + p2.x * h01d + m2x * h11d;
    const ty = p1.y * h00d + m1y * h10d + p2.y * h01d + m2y * h11d;
    return { x, y, tx, ty };
}

/**
 * Simplify point list for spline: keep key waypoints, drop intermediate polygon vertices.
 * Douglas-Peucker with tolerance. Preserves first and last points for closed loops.
 * preserveIndices: indices that must always be kept (e.g. station points).
 */
export type SimplifyResult = { points: { x: number; y: number }[]; preservedResultIndices?: Set<number> };

export function simplifyPathForSpline(
    points: { x: number; y: number }[],
    tolerance: number,
    preserveIndices?: Set<number>
): SimplifyResult {
    const n = points.length;
    if (n <= 2) return { points };
    if (tolerance <= 0) return { points };

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
        if (maxD < tolerance) {
            const preserved = preserveIndices
                ? [...Array.from({ length: end - start - 1 }, (_, k) => start + 1 + k)].filter(k =>
                      preserveIndices.has(k)
                  )
                : [];
            return preserved.length === 0 ? [start, end] : [start, ...preserved.sort((a, b) => a - b), end];
        }
        const left = douglasPeucker(start, maxI);
        const right = douglasPeucker(maxI, end);
        return [...left.slice(0, -1), ...right];
    }

    const indices = douglasPeucker(0, n - 1);
    const result = indices.map((i) => ({ x: points[i].x, y: points[i].y }));
    if (result.length < 2) return { points: result };

    const preservedResultIndices =
        preserveIndices && preserveIndices.size > 0
            ? new Set(
                  indices
                      .map((origIdx, resultIdx) => (preserveIndices.has(origIdx) ? resultIdx : -1))
                      .filter((i): i is number => i >= 0)
              )
            : undefined;

    return { points: result, preservedResultIndices };
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

/** Cos threshold: below this, corner is sharp and gets arc waypoints. cos=0.7 ≈ 45°. */
const ARC_CORNER_COS_THRESHOLD = 0.7;

/** Default arc radius in mesh units for railroad curves. */
const DEFAULT_ARC_RADIUS_MESH = 20;

/**
 * Insert arc waypoints at sharp corners. Replaces sharp vertices with 2–3 points along a circular arc.
 * Produces wide, gradual curves instead of sharp angles.
 */
export function insertArcWaypointsAtCorners(
    points: { x: number; y: number }[],
    isClosed: boolean,
    minRadiusMesh = DEFAULT_ARC_RADIUS_MESH,
    preserveIndices?: Set<number>
): { x: number; y: number }[] {
    const n = points.length;
    if (n < 3) return points;

    const result: { x: number; y: number }[] = [];
    const p = (i: number) => points[((i % n) + n) % n];
    const start = isClosed ? 0 : 1;
    const end = isClosed ? n : n - 1;

    if (!isClosed) result.push({ x: points[0].x, y: points[0].y });

    for (let i = start; i < end; i++) {
        const p1 = p(i);

        if (preserveIndices?.has(i)) {
            result.push({ x: p1.x, y: p1.y });
            continue;
        }

        const p0 = p(i - 1);
        const p2 = p(i + 1);

        const v1x = p1.x - p0.x;
        const v1y = p1.y - p0.y;
        const v2x = p2.x - p1.x;
        const v2y = p2.y - p1.y;
        const len1 = Math.hypot(v1x, v1y) || 1e-10;
        const len2 = Math.hypot(v2x, v2y) || 1e-10;
        const d1x = v1x / len1;
        const d1y = v1y / len1;
        const d2x = v2x / len2;
        const d2y = v2y / len2;
        const cos = d1x * d2x + d1y * d2y;

        if (cos >= ARC_CORNER_COS_THRESHOLD) {
            result.push({ x: p1.x, y: p1.y });
            continue;
        }

        const theta = Math.acos(Math.max(-1, Math.min(1, cos)));
        const halfAngle = theta / 2;
        if (halfAngle < 0.01 || halfAngle > Math.PI / 2 - 0.01) {
            result.push({ x: p1.x, y: p1.y });
            continue;
        }

        const tanHalf = Math.tan(halfAngle);
        let distAlong = minRadiusMesh / tanHalf;
        // Clamp so arc does not extend past segment midpoints — prevents curling into itself at sharp turns
        const maxDistAlong = Math.min(len1, len2) * 0.45;
        distAlong = Math.min(distAlong, maxDistAlong);
        if (distAlong < 1) {
            result.push({ x: p1.x, y: p1.y });
            continue;
        }
        const effectiveRadius = distAlong * tanHalf;
        const a = { x: p1.x - d1x * distAlong, y: p1.y - d1y * distAlong };
        const b = { x: p1.x + d2x * distAlong, y: p1.y + d2y * distAlong };

        const bisectorX = d1x + d2x;
        const bisectorY = d1y + d2y;
        const bisectorLen = Math.hypot(bisectorX, bisectorY) || 1e-10;
        const bx = bisectorX / bisectorLen;
        const by = bisectorY / bisectorLen;
        const distToCenter = effectiveRadius / Math.sin(halfAngle);
        const cx = p1.x + bx * distToCenter;
        const cy = p1.y + by * distToCenter;

        const angleA = Math.atan2(a.y - cy, a.x - cx);
        const angleB = Math.atan2(b.y - cy, b.x - cx);
        let dAngle = angleB - angleA;
        if (dAngle > Math.PI) dAngle -= 2 * Math.PI;
        if (dAngle < -Math.PI) dAngle += 2 * Math.PI;

        result.push(a);
        for (let k = 1; k < 3; k++) {
            const t = k / 3;
            const angle = angleA + t * dAngle;
            result.push({
                x: cx + effectiveRadius * Math.cos(angle),
                y: cy + effectiveRadius * Math.sin(angle)
            });
        }
        result.push(b);
    }

    if (!isClosed) result.push({ x: points[n - 1].x, y: points[n - 1].y });
    return result;
}

/**
 * Remove self-intersections from a closed path. When two non-adjacent segments cross,
 * removes the smaller loop. Prefers removing the loop that does NOT contain preserved indices (stations).
 * preserveIndices: indices in points that are stations — we keep the loop that contains them.
 */
export function removeSelfIntersections(
    points: { x: number; y: number }[],
    isClosed: boolean,
    preserveIndices?: Set<number>
): { x: number; y: number }[] {
    const n = points.length;
    if (n < 4) return points;
    if (!isClosed) return points;

    const eps = 1e-9;

    function segmentsIntersect(
        a: { x: number; y: number },
        b: { x: number; y: number },
        c: { x: number; y: number },
        d: { x: number; y: number }
    ): boolean {
        const denom = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
        if (Math.abs(denom) < eps) return false;
        const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / denom;
        const s = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / denom;
        return t > eps && t < 1 - eps && s > eps && s < 1 - eps;
    }

    function segmentsAdjacent(i: number, j: number, len: number): boolean {
        return (i + 1) % len === j || (j + 1) % len === i;
    }

    function countPreservedInLoop(loopIndices: number[]): number {
        if (!preserveIndices || preserveIndices.size === 0) return 0;
        return loopIndices.filter((idx) => preserveIndices!.has(idx)).length;
    }

    let current = points.slice();
    let preserved = preserveIndices ? new Set(preserveIndices) : undefined;
    let changed = true;

    while (changed) {
        changed = false;
        const m = current.length;
        if (m < 4) break;

        for (let i = 0; i < m && !changed; i++) {
            const a = current[i]!;
            const b = current[(i + 1) % m]!;
            for (let j = i + 2; j < m && !changed; j++) {
                if (segmentsAdjacent(i, j, m)) continue;
                const c = current[j]!;
                const d = current[(j + 1) % m]!;
                if (!segmentsIntersect(a, b, c, d)) continue;

                const loop1Len = j - i;
                const loop2Len = m - j + i;
                const loop1Indices = Array.from({ length: loop1Len }, (_, k) => i + 1 + k);
                const loop2Indices = [
                    ...Array.from({ length: m - j - 1 }, (_, k) => j + 1 + k),
                    ...Array.from({ length: i + 1 }, (_, k) => k)
                ];
                const preserved1 = preserved ? countPreservedInLoop(loop1Indices) : 0;
                const preserved2 = preserved ? countPreservedInLoop(loop2Indices) : 0;

                if (preserved1 > 0 && preserved2 > 0) {
                    continue;
                }

                let removeFirst: boolean;
                if (preserved1 > preserved2) {
                    removeFirst = true;
                } else if (preserved2 > preserved1) {
                    removeFirst = false;
                } else {
                    removeFirst = loop1Indices.length <= loop2Indices.length;
                }

                if (removeFirst) {
                    current = [...current.slice(0, i + 1), ...current.slice(j + 1)];
                    if (preserved) {
                        preserved = new Set(
                            [...preserved]
                                .filter((idx) => idx <= i || idx > j)
                                .map((idx) => (idx > j ? idx - (j - i) : idx))
                        );
                    }
                } else {
                    current = current.slice(i + 1, j + 1);
                    if (preserved) {
                        preserved = new Set(
                            [...preserved].filter((idx) => idx > i && idx <= j).map((idx) => idx - (i + 1))
                        );
                    }
                }
                changed = true;
            }
        }
    }

    return current.length >= 3 ? current : points;
}

/**
 * Smooth a path by moving each point toward its neighbors (Laplacian smoothing).
 * Reduces jaggedness from polygon-by-polygon placement. iterations=2–3, lambda=0.5.
 * fixedIndices: indices that stay fixed (e.g. station points).
 */
export function smoothPath(
    points: { x: number; y: number }[],
    isClosed: boolean,
    iterations = 3,
    lambda = 0.5,
    fixedIndices?: Set<number>
): { x: number; y: number }[] {
    const n = points.length;
    if (n < 3) return points;

    let current = points.map((p) => ({ x: p.x, y: p.y }));

    for (let iter = 0; iter < iterations; iter++) {
        const next = current.map((p, i) => ({ x: p.x, y: p.y }));
        const prev = (i: number) => current[(i - 1 + n) % n]!;
        const succ = (i: number) => current[(i + 1) % n]!;

        for (let i = 0; i < n; i++) {
            if (fixedIndices?.has(i)) continue;
            const p = current[i]!;
            const pPrev = prev(i);
            const pSucc = succ(i);
            const midX = (pPrev.x + pSucc.x) / 2;
            const midY = (pPrev.y + pSucc.y) / 2;
            next[i] = {
                x: (1 - lambda) * p.x + lambda * midX,
                y: (1 - lambda) * p.y + lambda * midY
            };
        }
        current = next;
    }

    return current;
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
