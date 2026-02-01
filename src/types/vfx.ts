/**
 * VFX Type Definitions
 * Strict typing for the Visual Effects system.
 */


export interface ParticleOptions {
    type?: 'glow' | 'ring' | 'spark' | 'debris' | 'streak' | 'smoke' | 'text' | 'circle' | 'cloud';
    color?: string;
    size?: number;
    lifetime?: number;
    fade?: boolean;
    blendMode?: GlobalCompositeOperation;
    speed?: number;
    count?: number;
    angle?: number;
    drag?: number;
    gravity?: number;
    vx?: number;
    vy?: number;
    bias?: 'up' | 'down' | 'random';
    sizeOverLifetime?: number[];
    colorOverLifetime?: string[];
    alpha?: number;
    width?: number;
    length?: number;
    spread?: number;
    sizeCheckpoints?: number[];
    holdDuration?: number; // for floating text
    floatDuration?: number; // for floating text
    text?: string;
    sprite?: string;
    pulse?: { speed?: number; amplitude?: number };
    warp?: { speed: number; freq?: number; amp?: number };
    drift?: { speed: number; radius: number; yFreq?: number };
    anchor?: { x: number; y: number };
    rotationSpeed?: number;
}

export type ParticleConfig = ParticleOptions;

export interface VFXCue {
    time: number;
    layer?: 'fg' | 'bg';
    template?: string;
    type?: string;
    params?: ParticleOptions;
}

export type VFXSequence = VFXCue[];

export interface MeleeTrailConfig {
    color: string;
    fadeColor: string;
    width: number;
    maxPoints: number;
    lifetime: number;
    style: 'afterimage' | 'arc' | 'heavy' | 'debris' | 'crescent' | 'burst' | 'impact' | 'thrust' | 'sweep' | 'chain';

    // Style-specific options
    glow?: boolean;
    shimmer?: boolean;
    blur?: boolean;
    particles?: boolean;
    sparks?: boolean;
    embers?: boolean;
    shockwave?: boolean;
    flash?: boolean;
    windTrail?: boolean;
    afterimage?: boolean;
    ball?: boolean;
    flickerRate?: number;
}

export interface MeleeTrailPoint {
    x: number;
    y: number;
    age: number;
    config: MeleeTrailConfig;
    subtype: string;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    alpha: number;
    maxAlpha: number;
    lifetime: number;
    age: number;
    type: string;
    size: number;
    gravity: number;
    drag: number;
    rotation: number;
    rotationSpeed?: number;
    blendMode: GlobalCompositeOperation;
    sprite?: string;
    pulse?: { speed?: number; amplitude?: number };
    pulseOffset?: number;
    warp?: { speed: number; freq?: number; amp?: number };
    warpOffset?: number;
    drift?: { speed: number; radius: number; yFreq?: number };
    anchor?: { x: number; y: number };
    driftOffset?: number;
    sizeCheckpoints?: number[];
    colorCheckpoints?: string[];
    blobPoints?: number[];
    trail?: { interval?: number; color?: string; size?: number; lifetime?: number };
    _trailTimer?: number;
    _baseSize?: number;
    _startRgb?: { r: number; g: number; b: number };
    _endRgb?: { r: number; g: number; b: number };
}

export interface AmbientCreatureConfig {
    type?: string;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
}

export interface FogCloud {
    offsetX: number;
    offsetY: number;
    scale: number;
    scalePhase: number;
    scaleSpeed: number;
    scaleAmount: number;
    rotation: number;
    rotationSpeed: number;
    driftPhaseX: number;
    driftPhaseY: number;
    driftSpeedX: number;
    driftSpeedY: number;
    driftAmplitudeX: number;
    driftAmplitudeY: number;
    baseAlpha: number;
    alphaPhase: number;
    disperseVel: { x: number; y: number };
}

export interface FogIslandData {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    time: number;
    alpha: number;
    dispersing: boolean;
    clouds: FogCloud[];
}

export interface FloatingTextConfig {
    color?: string;
    outlineColor?: string;
    fontSize?: number;
    fontWeight?: string;
    floatDuration?: number;
    holdDuration?: number;
    floatDistance?: number;
    shrinkScale?: number;
    offsetY?: number;
    offsetX?: number;
}
