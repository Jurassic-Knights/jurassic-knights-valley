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

    // Magnet Completion (Electromagnetic Field Collapse)
    MAGNET: {
        // Electric arc sparks converging toward center
        ELECTRIC_ARCS: {
            type: 'spark',
            color: '#88CCFF',
            count: 100,
            speed: 30,
            lifetime: 300,
            size: 8,
            bias: 'inward',
            drag: 0.85,
            blendMode: 'lighter'
        },
        // Brief magnetic field pulse
        FIELD_PULSE: {
            type: 'ring',
            color: '#4488CC',
            sizeOverLifetime: [80, 480],
            lifetime: 500,
            alpha: 0.6,
            width: 12,
            blendMode: 'lighter'
        },
        // Static discharge flash
        STATIC_FLASH: {
            type: 'glow',
            color: '#AADDFF',
            count: 1,
            size: 240,
            lifetime: 200,
            alpha: 0.8,
            blendMode: 'lighter'
        },
        // Metal debris pulled inward
        METAL_DEBRIS: {
            type: 'debris',
            count: 48,
            speed: 10,
            gravity: 0,
            bias: 'inward',
            lifetime: 600,
            size: 12,
            color: '#888888',
            drag: 0.92
        },
        // Secondary sparks on impact
        IMPACT_SPARKS: {
            type: 'spark',
            count: 80,
            speed: 18,
            drag: 0.88,
            lifetime: 500,
            size: 8,
            colorOverLifetime: ['#FFFFFF', '#88CCFF'],
            blendMode: 'lighter'
        },
        // Dust kicked up by magnetic force
        DUST_CLOUD: {
            type: 'glow',
            count: 24,
            speed: 5,
            lifetime: 1000,
            drag: 0.96,
            color: '#8B7355',
            sizeOverLifetime: [32, 100],
            alpha: 0.5
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
        },
        HIT: {
            type: 'burst',
            color: '#FF0000',
            count: 8,
            speed: 6,
            lifetime: 300,
            size: 4,
            drag: 0.9
        }
    },

    // Dinosaur Effects
    DINO: {
        // Primary blood spray - directional splatter from impact
        BLOOD_SPLATTER: {
            type: 'debris',
            color: '#8B0000',
            count: 20,
            speed: 12,
            gravity: 0.6,
            lifetime: 400,
            size: 6,
            drag: 0.92,
            spread: 0.8
        },
        // Secondary blood mist - fine particles
        BLOOD_MIST: {
            type: 'glow',
            color: '#660000',
            count: 8,
            speed: 4,
            lifetime: 300,
            size: 15,
            alpha: 0.4,
            drag: 0.95
        },
        // Blood droplets - larger falling drops
        BLOOD_DROPS: {
            type: 'circle',
            color: '#990000',
            count: 12,
            speed: 8,
            gravity: 0.8,
            lifetime: 600,
            size: 4,
            drag: 0.88
        },
        // Meat/gore chunks
        MEAT_CHUNKS: {
            type: 'debris',
            color: '#8B4513',
            count: 6,
            speed: 8,
            gravity: 0.5,
            lifetime: 700,
            size: 10,
            drag: 0.85
        },
        // Bone fragments (for death)
        BONE_FRAGMENTS: {
            type: 'debris',
            color: '#E8DCC8',
            count: 4,
            speed: 10,
            gravity: 0.4,
            lifetime: 800,
            size: 5,
            drag: 0.9
        },
        // Death effects
        DEATH_GLOW: {
            type: 'glow',
            color: '#FFFFFF',
            size: 150,
            lifetime: 700,
            blendMode: 'lighter'
        },
        DEATH_RING: {
            type: 'ring',
            color: '#2ECC71',
            size: 30,
            lifetime: 600,
            blendMode: 'lighter'
        },
        DEATH_SPARKS: {
            type: 'spark',
            color: '#2ECC71',
            count: 30,
            speed: 12,
            size: 5,
            lifetime: 900
        },
        RESPAWN: {
            type: 'circle',
            color: '#A2F2B4',
            count: 15,
            speed: 5,
            bias: 'up',
            gravity: -0.03
        }
    },

    // Resource Effects
    RESOURCE: {
        RESPAWN: {
            FLASH: {
                type: 'glow',
                color: '#FFFFFF',
                size: 120,
                lifetime: 600,
                alpha: 0.6,
                blendMode: 'lighter'
            },
            RING: {
                type: 'ring',
                color: '#FFFFFF',
                size: 20,
                lifetime: 600,
                alpha: 0.8,
                blendMode: 'lighter'
            },
            SPARKS: {
                type: 'spark',
                color: '#FFFFFF',
                count: 25,
                speed: 10,
                size: 4,
                lifetime: 800,
                gravity: 0.2
            }
        }
    },



    // === PROJECTILES ===
    // Maps weapon types to their projectile VFX template keys
    PROJECTILES: {
        // Weapon type to template mapping (matches WEAPON_TYPES from dashboard state.js)
        WEAPON_MAP: {
            // Ranged subtypes
            'pistol': 'PROJECTILE_PISTOL',
            'rifle': 'PROJECTILE_RIFLE',
            'sniper_rifle': 'PROJECTILE_MARKSMAN',
            'sniperrifle': 'PROJECTILE_MARKSMAN',
            'shotgun': 'PROJECTILE_SHOTGUN',
            'machine_gun': 'PROJECTILE_MACHINEGUN',
            'submachine_gun': 'PROJECTILE_MACHINEGUN',
            'flamethrower': 'PROJECTILE_RIFLE', // TODO: Add flame VFX
            'bazooka': 'PROJECTILE_MARKSMAN', // TODO: Add explosion VFX
            // Melee subtypes (no projectile, but can be mapped for future swing VFX)
            'sword': null,
            'longsword': null,
            'greatsword': null,
            'axe': null,
            'war_axe': null,
            'mace': null,
            'war_hammer': null,
            'lance': null,
            'halberd': null,
            'spear': null,
            'flail': null,
            'knife': null,
            // Legacy/fallback naming
            'revolver': 'PROJECTILE_PISTOL',
            'marksman': 'PROJECTILE_MARKSMAN',
            'sniper': 'PROJECTILE_MARKSMAN',
            'machinegun': 'PROJECTILE_MACHINEGUN',
            'smg': 'PROJECTILE_MACHINEGUN',
            'default': 'PROJECTILE_PISTOL'
        } as Record<string, string | null>, // Explicit type for index access

        // Get template key for a weapon type
        getTemplateForWeapon(weaponType: string) {
            return this.WEAPON_MAP[weaponType?.toLowerCase()] || this.WEAPON_MAP.default;
        },

        // Muzzle flash configs by weapon type (uses underscore naming from dashboard)
        MUZZLE_FLASH: {
            // Ranged
            'pistol': { distance: 140, size: 40, spread: 0.3 },
            'rifle': { distance: 190, size: 60, spread: 0.2 },
            'sniper_rifle': { distance: 250, size: 80, spread: 0.1 },
            'sniperrifle': { distance: 250, size: 80, spread: 0.1 },
            'shotgun': { distance: 160, size: 80, spread: 0.6 },
            'machine_gun': { distance: 180, size: 50, spread: 0.25 },
            'submachine_gun': { distance: 160, size: 45, spread: 0.3 },
            'flamethrower': { distance: 100, size: 100, spread: 0.5 },
            'bazooka': { distance: 200, size: 120, spread: 0.2 },
            // Legacy/fallback
            'revolver': { distance: 150, size: 50, spread: 0.4 },
            'marksman': { distance: 220, size: 70, spread: 0.15 },
            'sniper': { distance: 250, size: 80, spread: 0.1 },
            'machinegun': { distance: 180, size: 50, spread: 0.25 },
            'default': { distance: 150, size: 50, spread: 0.3 }
        } as Record<string, unknown>, // Explicit type for index access

        getMuzzleFlash(weaponType: string) {
            return this.MUZZLE_FLASH[weaponType?.toLowerCase()] || this.MUZZLE_FLASH.default;
        }
    }
} as Record<string, unknown>; // Main object as Record for flexible categorization


// ES6 Module Export
export { VFX_Categories };
