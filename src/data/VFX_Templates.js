/**
 * VFX_Templates - Atomic Reusable VFX Components
 * 
 * Contains the building blocks for composed effects.
 * These are single-use, instant particles/effects.
 */

const VFX_Templates = {
    // Core Glows
    GLOW_CORE_WHITE: { type: 'glow', color: '#FFFFFF', size: 50, lifetime: 200, fade: true, blendMode: 'lighter' },
    GLOW_CORE_GOLD: { type: 'glow', color: '#FFD700', size: 50, lifetime: 200, fade: true, blendMode: 'lighter' },

    // Shockwaves
    SHOCKWAVE_FAST_WHITE: { type: 'ring', color: '#FFFFFF', speed: 10, sizeCheckpoints: [10, 200], lifetime: 300, alpha: 0.8, fade: true },
    SHOCKWAVE_SLOW_GOLD: { type: 'ring', color: '#FFD700', sizeCheckpoints: [40, 500], lifetime: 800, alpha: 0.8, width: 8 },

    // Debris / Sparks
    SPARK_BURST: { type: 'spark', color: '#FFFFFF', count: 15, speed: 12, lifetime: 400, drag: 0.9 },
    DEBRIS_BURST_GOLD: { type: 'debris', color: '#FFD700', count: 20, speed: 8, gravity: 0.5, bias: 'up', lifetime: 800, size: 4, drag: 0.95 },

    // Smoke
    SMOKE_PLUME: { type: 'glow', color: '#696969', count: 8, speed: 1.5, lifetime: 1200, drag: 0.95, sizeOverLifetime: [10, 30], alpha: 0.4 },

    // Combat
    MUZZLE_FLASH_FX: {
        type: 'debris',
        color: '#FFFFFF',
        count: 12,
        speed: 12,
        lifetime: 150,
        size: 6,
        drag: 0.85,
        colorOverLifetime: ['#FFF700', '#FF4500'],
        blendMode: 'lighter'
    },

    // Dino Death
    DINO_DEATH_FX: {
        type: 'debris',
        color: '#8B0000',
        count: 60,
        speed: 14,
        gravity: 0.4,
        bias: 'up',
        lifetime: 3000,
        size: 6,
        drag: 0.98,
        colorOverLifetime: ['#8B0000', '#2F0000'],
        blendMode: 'source-over'
    },

    // Resource
    RESOURCE_RESPAWN_FX: {
        type: 'debris',
        count: 25,
        speed: 6,
        gravity: -0.15,
        bias: 'up',
        lifetime: 1200,
        size: 5,
        drag: 0.92,
        colorOverLifetime: ['#FFFFFF', '#00FFFF'],
        blendMode: 'lighter'
    }
};

window.VFX_Templates = VFX_Templates;
