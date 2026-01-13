/**
 * VFX_Categories - Domain-Specific VFX Configurations
 * 
 * Organized by game system (Hero, Dino, Resource, Purchase, etc).
 * These are tied to specific gameplay contexts.
 */

const VFX_Categories = {
    // Purchase Success (Gold/Store)
    PURCHASE: {
        COIN_FOUNTAIN: {
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
            color: '#32CD32',
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

    // Dinosaur Effects
    DINO: {
        BLOOD_SPLATTER: {
            type: 'circle',
            color: '#8B0000',
            count: 5,
            speed: 3,
            gravity: 0.2,
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

    // Resource Effects
    RESOURCE: {
        RESPAWN: {
            FLASH: { type: 'glow', color: '#FFFFFF', size: 120, lifetime: 600, alpha: 0.6, blendMode: 'lighter' },
            RING: { type: 'ring', color: '#FFFFFF', size: 20, lifetime: 600, alpha: 0.8, blendMode: 'lighter' },
            SPARKS: { type: 'spark', color: '#FFFFFF', count: 25, speed: 10, size: 4, lifetime: 800, gravity: 0.2 }
        }
    }
};

window.VFX_Categories = VFX_Categories;
