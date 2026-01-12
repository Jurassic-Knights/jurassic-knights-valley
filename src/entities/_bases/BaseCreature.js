/**
 * BaseCreature - Default configuration for dinosaur creatures
 * 
 * Hostile creatures attack the player.
 * Passive creatures flee and can be harvested for resources.
 * 
 * All creature entity files extend this base.
 */

const BaseCreature = {
    entityType: 'Creature',

    // Behavior
    hostile: false,           // true = attacks, false = flees

    // Size
    gridSize: 1.5,
    width: 192,
    height: 192,

    // Stats
    health: 60,
    maxHealth: 60,
    speed: 30,
    damage: 10,

    // Combat (hostile only)
    attackRange: 50,
    attackRate: 1,
    aggroRange: 200,

    // Spawning
    respawnTime: 20,
    spawnBiomes: [],
    groupSize: { min: 1, max: 1 },
    spawnWeight: 50,

    // Visual
    sprite: 'dino_base',
    frameInterval: 200,

    // Audio
    sfx: {
        idle: null,
        aggro: 'sfx_creature_aggro',
        attack: 'sfx_creature_attack',
        hurt: 'sfx_creature_hurt',
        death: 'sfx_creature_death'
    },

    // VFX
    vfx: {
        attack: null,
        death: 'vfx_blood_splatter'
    },

    // Loot
    lootTable: [],

    // Interaction
    interactionRange: 120,
    boundsPadding: 30
};

window.BaseCreature = BaseCreature;
