/**
 * VFX Configuration
 * Centralized data for particle effects and visual sequences.
 */
/**
 * VFX Configuration
 * Centralized data for particle effects and visual sequences.
 */
const VFXConfig = {
    // -------------------------------------------------------------------------
    // 1. Atomic Parts Library (Reusable components)
    // -------------------------------------------------------------------------
    TEMPLATES: {
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
            lifetime: 150, // Short burst
            size: 6, // Big pixels
            drag: 0.85,
            colorOverLifetime: ['#FFF700', '#FF4500'], // Yellow -> Red
            blendMode: 'lighter'

        },

        // Dino Death
        DINO_DEATH_FX: {
            type: 'debris',
            color: '#8B0000', // Deep Red
            count: 60, // Shower
            speed: 14, // Explosive speed
            gravity: 0.4, // Heavy liquid fall
            bias: 'up', // Starts rising
            lifetime: 3000, // Lasts 3 seconds
            size: 6, // Big pixels
            drag: 0.98, // Air resistance (allows arcs)
            colorOverLifetime: ['#8B0000', '#2F0000'], // Darken over time
            blendMode: 'source-over' // Blood is opaque/dark, not additive shine
        },

        // Resource
        RESOURCE_RESPAWN_FX: {
            type: 'debris',
            count: 25,
            speed: 6,
            gravity: -0.15, // Rise up
            bias: 'up',
            lifetime: 1200,
            size: 5,
            drag: 0.92,
            colorOverLifetime: ['#FFFFFF', '#00FFFF'], // White -> Cyan
            blendMode: 'lighter'
        }
    },

    // -------------------------------------------------------------------------
    // 2. Composed Sequences (Complex Timing)
    // -------------------------------------------------------------------------
    SEQUENCES: {
        // Standard Explosion
        EXPLOSION_GENERIC: [
            { time: 0, layer: 'fg', template: 'GLOW_CORE_WHITE', params: { size: 100 } },
            { time: 50, layer: 'fg', template: 'SHOCKWAVE_FAST_WHITE' },
            { time: 100, layer: 'fg', template: 'DEBRIS_BURST_GOLD', params: { color: '#333333' } }, // Dark debris
            { time: 200, layer: 'fg', template: 'SMOKE_PLUME' }
        ],

        // Artillery Strike
        BOMBARDMENT_SHELL: [
            { time: 0, layer: 'fg', type: 'streak', params: { color: '#FFCC00', size: 40, lifetime: 700, trail: { color: '#FF0000', size: 20 } } }
            // Note: The logic for calculating velocity/target is complex and might need custom handling in Sequencer or params
        ]
    },


    // -------------------------------------------------------------------------
    // 3. Legacy Configs (To be migrated)
    // -------------------------------------------------------------------------
    // Purchase Success (Gold/Store)
    PURCHASE: {
        COIN_FOUNTAIN: {
            type: 'debris',
            color: '#FFD700', // Gold
            count: 20,
            speed: 8,
            gravity: 0.5,
            bias: 'up',
            lifetime: 800,
            size: 4,
            drag: 0.95
        },
        SPARKLE_BURST: {
            type: 'spark',
            color: '#FFFFFF',
            count: 15,
            speed: 12,
            lifetime: 400,
            drag: 0.9
        },
        SUCCESS_AURA: {
            type: 'glow',
            color: '#32CD32', // Lime Green
            count: 1,
            size: 80,
            lifetime: 500,
            alpha: 0.4,
            blendMode: 'lighter'
        }
    },

    // Zone Unlock (Major Event)
    UNLOCK: {
        CORE_FLASH: {
            type: 'glow',
            color: '#FFFFFF',
            count: 1,
            size: 150,
            lifetime: 250,
            alpha: 1.0,
            blendMode: 'lighter'
        },
        SHOCKWAVE_PRIMARY: {
            type: 'ring',
            color: '#FFD700',
            sizeOverLifetime: [40, 500],
            lifetime: 800,
            alpha: 0.8,
            width: 8
        },
        SHOCKWAVE_SECONDARY: {
            type: 'ring',
            color: '#FFFFFF',
            sizeOverLifetime: [20, 350],
            lifetime: 1200,
            alpha: 0.3,
            width: 30
        },
        DIVINE_GLINT: {
            type: 'spark',
            color: '#FFFFFF',
            count: 25,
            speed: 12,
            gravity: -0.1,
            drag: 0.92,
            lifetime: 1500,
            size: 4,
            alpha: 0.8,
            blendMode: 'lighter'
        },
        DEBRIS_COLORS: ['#FFD700', '#C0C0C0', '#DAA520'],
        DEBRIS_BASE: {
            type: 'debris',
            count: 8,
            speed: 14,
            drag: 0.88,
            gravity: 0.4,
            size: 5,
            lifetime: 1000,
            alpha: 1
        }
    },

    // Magnet Completion (The Singularity)
    MAGNET: {
        GATHER_STREAK: {
            type: 'streak',
            color: '#FFD700',
            count: 30,
            speed: 8,
            lifetime: 250,
            bias: 'inward'
        },
        GATHER_GLOW: {
            type: 'glow',
            colorOverLifetime: ['#000000', '#FFD700'],
            sizeOverLifetime: [60, 5],
            lifetime: 200,
            count: 1,
            blendMode: 'lighter'
        },
        IMPACT_SHOCKWAVE: {
            type: 'ring',
            color: '#FFD700',
            sizeOverLifetime: [10, 150],
            lifetime: 400,
            alpha: 0.5,
            blendMode: 'lighter'
        },
        GOD_RAYS: {
            type: 'ray',
            color: '#FFEC8B',
            count: 5,
            sizeOverLifetime: [5, 40],
            lifetime: 600,
            rotationSpeed: 0.2,
            blendMode: 'lighter'
        },
        STREAK_SPARKS: {
            type: 'streak',
            count: 40,
            speed: 12,
            drag: 0.9,
            lifetime: 500,
            size: 3,
            colorOverLifetime: ['#FFFFFF', '#FFD700'],
            blendMode: 'lighter'
        },
        COOLING_DEBRIS: {
            type: 'debris',
            count: 15,
            speed: 6,
            gravity: 0.4,
            bias: 'up',
            lifetime: 800,
            size: 5,
            colorOverLifetime: ['#FFD700', '#8B0000']
        },
        SMOKE: {
            type: 'glow',
            count: 8,
            speed: 1.5,
            lifetime: 1200,
            drag: 0.95,
            colorOverLifetime: ['#FFA500', '#696969'],
            sizeOverLifetime: [10, 30],
            alpha: 0.4
        }
    },

    // Hero / Combat
    HERO: {
        DUST: {
            DENSITY: 8,
            OFFSET_X: 45,
            OFFSET_Y: 15,
            COLOR: '#8D6E63',
            LIFETIME_BASE: 800,
            LIFETIME_RND: 400
        },
        MUZZLE_FLASH: {
            DISTANCE: 190,
            SIZE_BASE: 60,
            SIZE_RND: 20
        }
    },

    DINO: {
        BLOOD_SPLATTER: {
            type: 'circle',
            color: '#8B0000',
            count: 5,
            speed: 3,
            gravity: 0.2, // Heavy liquid
            lifetime: 500,
            size: 4
        },
        MEAT_CHUNKS: {
            type: 'debris',
            color: '#A52A2A',
            count: 3,
            speed: 4,
            gravity: 0.3,
            lifetime: 600,
            size: 5
        },
        DEATH_GLOW: {
            type: 'glow', color: '#FFFFFF', size: 150, lifetime: 700, blendMode: 'lighter'
        },
        DEATH_RING: {
            type: 'ring', color: '#2ECC71', size: 30, lifetime: 600, blendMode: 'lighter'
        },
        DEATH_SPARKS: {
            type: 'spark', color: '#2ECC71', count: 30, speed: 12, size: 5, lifetime: 900
        },
        RESPAWN: {
            type: 'circle', color: '#A2F2B4', count: 15, speed: 5, bias: 'up', gravity: -0.03
        }
    },

    RESOURCE: {
        RESPAWN: {
            FLASH: { type: 'glow', color: '#FFFFFF', size: 120, lifetime: 600, alpha: 0.6, blendMode: 'lighter' },
            RING: { type: 'ring', color: '#FFFFFF', size: 20, lifetime: 600, alpha: 0.8, blendMode: 'lighter' },
            SPARKS: { type: 'spark', color: '#FFFFFF', count: 25, speed: 10, size: 4, lifetime: 800, gravity: 0.2 }
        }
    }
}


window.VFXConfig = VFXConfig;
