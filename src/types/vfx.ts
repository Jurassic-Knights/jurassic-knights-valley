/**
 * VFX TypeScript Interfaces
 * 
 * Types for particle systems, effects, and visual feedback.
 */

// ============================================
// PARTICLE OPTIONS
// ============================================

/**
 * Particle emission options
 */
export interface ParticleOptions {
    /** Particle type (e.g., 'spark', 'debris', 'smoke', 'circle', 'burst') */
    type?: string;
    /** Base color (CSS color string) */
    color?: string;
    /** Number of particles to emit */
    count?: number;
    /** Particle speed in pixels per second */
    speed?: number;
    /** Particle lifetime in milliseconds */
    lifetime?: number;
    /** Particle size in pixels */
    size?: number;
    /** Gravity factor (0 = no gravity) */
    gravity?: number;
    /** Spread angle in degrees */
    spread?: number;
    /** Direction angle in degrees */
    direction?: number;
    /** Fade out particles */
    fade?: boolean;
    /** Scale particles over time */
    scale?: number;
    /** Alpha transparency (0-1) */
    alpha?: number;
    /** Drag resistance (0-1) */
    drag?: number;
    /** Size values over lifetime [start, end] */
    sizeOverLifetime?: [number, number];
    /** Blend mode for rendering */
    blendMode?: 'source-over' | 'lighter' | 'multiply';
}

/**
 * Floating text configuration
 */
export interface FloatingTextConfig {
    /** Text color */
    color?: string;
    /** Font size in pixels */
    fontSize?: number;
    /** Font family */
    fontFamily?: string;
    /** Duration in milliseconds */
    duration?: number;
    /** Float speed */
    floatSpeed?: number;
    /** Whether to use outline */
    outline?: boolean;
    /** Outline color */
    outlineColor?: string;
}

/**
 * VFX sequence step
 */
export interface VFXSequenceStep {
    /** Delay before this step (ms) */
    delay?: number;
    /** Particle options for this step */
    particles?: ParticleOptions;
    /** Sound to play */
    sound?: string;
    /** Screen shake intensity */
    shake?: number;
}

/**
 * Complete VFX sequence
 */
export interface VFXSequence {
    /** Sequence name */
    name?: string;
    /** Steps to execute */
    steps: VFXSequenceStep[];
    /** Total duration override */
    duration?: number;
}

// ============================================
// WEATHER VFX
// ============================================

/**
 * Weather particle
 */
export interface WeatherParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    lifetime: number;
    maxLifetime: number;
}
