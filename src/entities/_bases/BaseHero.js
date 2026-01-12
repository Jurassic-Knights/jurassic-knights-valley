/**
 * BaseHero - Default configuration for player character
 * 
 * The hero is unique - only one instance exists.
 * Extended by hero/hero.js
 */

const BaseHero = {
    entityType: 'Hero',

    // Size
    gridSize: 1.5,
    width: 192,
    height: 192,

    // Stats
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    speed: 1400,

    // Combat
    attack: {
        damage: 10,
        rate: 2,
        staminaCost: 1,
        range: {
            default: 125,
            gun: 450
        }
    },

    // Progression
    level: 1,
    xp: 0,
    defense: 0,
    critChance: 0.05,
    critMultiplier: 1.5,
    xpToNextLevel: 100,
    xpScaling: 1.5,

    // Visual
    sprite: 'hero_base',
    color: '#D4AF37',

    // Audio
    sfx: {
        attack: 'sfx_hero_attack',
        hurt: 'sfx_hero_hurt',
        death: 'sfx_hero_death',
        levelUp: 'sfx_level_up'
    },

    // VFX
    vfx: {
        attack: 'vfx_sword_slash',
        levelUp: 'vfx_level_up'
    }
};

window.BaseHero = BaseHero;
