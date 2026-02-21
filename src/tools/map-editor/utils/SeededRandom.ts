/**
 * SeededRandom — LCG-based deterministic RNG for procedural generation.
 * Same seed produces same sequence; useful for reproducible maps.
 */
export function seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0xffffffff;
    };
}
