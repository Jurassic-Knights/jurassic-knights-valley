/**
 * Mapgen4CurveUtils — Path manipulations (curves, loop fixers, smoothing)
 */

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
                const _loop2Len = m - j + i;
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
                            [...preserved]
                                .filter((idx) => idx > i && idx <= j)
                                .map((idx) => idx - (i + 1))
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
        const next = current.map((p, _i) => ({ x: p.x, y: p.y }));
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
