/**
 * Math Utilities
 * Centralized math functions to reduce code duplication and improve readability.
 */

export class MathUtils {
    /**
     * Calculate Euclidean distance between two points
     */
    static distance(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate Squared Euclidean distance (faster, good for comparisons)
     */
    static distanceSq(x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    /**
     * Clamp a number between min and max
     */
    static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Linear interpolation
     */
    static lerp(start: number, end: number, t: number): number {
        return start + (end - start) * MathUtils.clamp(t, 0, 1);
    }

    /**
     * Get a random integer between min and max (inclusive)
     */
    static randomInt(min: number, max: number): number {
        return Math.floor(Math.min(min, max) + Math.random() * (Math.abs(max - min) + 1));
    }

    /**
     * Get a random float between min and max
     */
    static randomRange(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
