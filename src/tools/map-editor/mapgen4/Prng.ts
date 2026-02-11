/**
 * Seeded PRNG for deterministic mapgen4 (mulberry32).
 * Replaces @redblobgames/prng for same API: makeRandFloat(seed) -> () => number in [0,1).
 */
export function makeRandFloat(seed: number): () => number {
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6d2b79f5) >>> 0; // mulberry32
        const t = Math.imul(state ^ (state >>> 15), 1 | state);
        return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
}
