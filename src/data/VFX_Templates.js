/**
 * VFX_Templates - Atomic Reusable VFX Components
 *
 * Contains the building blocks for composed effects.
 * These are single-use, instant particles/effects.
 */

const VFX_Templates = {
    // Core Glows
    GLOW_CORE_WHITE: {
        type: 'glow',
        color: '#FFFFFF',
        size: 50,
        lifetime: 200,
        fade: true,
        blendMode: 'lighter'
    },
    GLOW_CORE_GOLD: {
        type: 'glow',
        color: '#FFD700',
        size: 50,
        lifetime: 200,
        fade: true,
        blendMode: 'lighter'
    },

    // Shockwaves
    SHOCKWAVE_FAST_WHITE: {
        type: 'ring',
        color: '#FFFFFF',
        speed: 10,
        sizeCheckpoints: [10, 200],
        lifetime: 300,
        alpha: 0.8,
        fade: true
    },
    SHOCKWAVE_SLOW_GOLD: {
        type: 'ring',
        color: '#FFD700',
        sizeCheckpoints: [40, 500],
        lifetime: 800,
        alpha: 0.8,
        width: 8
    },

    // Debris / Sparks
    SPARK_BURST: {
        type: 'spark',
        color: '#FFFFFF',
        count: 15,
        speed: 12,
        lifetime: 400,
        drag: 0.9
    },
    DEBRIS_BURST_GOLD: {
        type: 'debris',
        color: '#FFD700',
        count: 20,
        speed: 8,
        gravity: 0.5,
        bias: 'up',
        lifetime: 800,
        size: 4,
        drag: 0.95
    },

    // Smoke
    SMOKE_PLUME: {
        type: 'glow',
        color: '#696969',
        count: 8,
        speed: 1.5,
        lifetime: 1200,
        drag: 0.95,
        sizeOverLifetime: [10, 30],
        alpha: 0.4
    },

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
    },

    // === PROJECTILE TEMPLATES ===
    // Pistol: Small, fast, single round
    PROJECTILE_PISTOL: {
        type: 'streak',
        color: '#FFFFCC',
        count: 1,
        speed: 25,
        lifetime: 80,
        size: 3,
        length: 8,
        drag: 0.98,
        blendMode: 'lighter'
    },

    // Rifle: Larger, faster, tracer-like
    PROJECTILE_RIFLE: {
        type: 'streak',
        color: '#FFD700',
        count: 1,
        speed: 35,
        lifetime: 60,
        size: 4,
        length: 20,
        drag: 0.99,
        colorOverLifetime: ['#FFFFFF', '#FFD700'],
        blendMode: 'lighter'
    },

    // Shotgun: Multiple pellets spreading outward
    PROJECTILE_SHOTGUN: {
        type: 'debris',
        color: '#FFA500',
        count: 8,
        speed: 20,
        lifetime: 100,
        size: 2,
        drag: 0.92,
        spread: 0.4, // Radians spread angle
        blendMode: 'lighter'
    },

    // Marksman/Sniper: Long tracer with glow
    PROJECTILE_MARKSMAN: {
        type: 'streak',
        color: '#00FFFF',
        count: 1,
        speed: 50,
        lifetime: 40,
        size: 5,
        length: 40,
        drag: 0.99,
        colorOverLifetime: ['#FFFFFF', '#00FFFF', '#0088FF'],
        blendMode: 'lighter'
    },

    // Machine Gun: Rapid small rounds
    PROJECTILE_MACHINEGUN: {
        type: 'streak',
        color: '#FFCC00',
        count: 1,
        speed: 30,
        lifetime: 50,
        size: 2,
        length: 10,
        drag: 0.98,
        blendMode: 'lighter'
    }
};

window.VFX_Templates = VFX_Templates;

