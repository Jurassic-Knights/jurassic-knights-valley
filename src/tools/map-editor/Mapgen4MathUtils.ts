/**
 * Mapgen4MathUtils — Core mathematical functions for spline logic
 */

/**
 * Cardinal spline (tensioned Catmull-Rom): position and tangent at t in [0,1] for segment p1->p2.
 * Tension in [0,1]: 0 = loosest (can overshoot/loop), 0.5 = standard CR, 1 = linear. Use ~0.5 to avoid self-overlap.
 */
const CARDINAL_TENSION = 0.5;

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
