/**
 * VFX Type Definitions
 * Strict typing for the Visual Effects system.
 */

export interface ParticleOptions {
    type?: 'glow' | 'ring' | 'spark' | 'debris' | 'streak' | 'smoke' | 'text' | 'circle';
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
}

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
