/*
 * From https://www.redblobgames.com/maps/mapgen4/
 * License: Apache v2.0
 */
export function clamp(x: number, lo: number, hi: number): number {
    if (x < lo) return lo;
    if (x > hi) return hi;
    return x;
}
