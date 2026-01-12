/**
 * BaseEnemy - Default configuration for human/soldier enemies
 * 
 * Distinguished from creatures (dinosaurs).
 * These are hostile humans, soldiers, raiders, etc.
 * 
 * All enemy entity files extend this base.
 */

const BaseEnemy = {
    entityType: 'Enemy',

    // Size
    gridSize: 1,
    width: 128,
    height: 128,

    // Stats
    health: 100,
    maxHealth: 100,
    speed: 80,
    damage: 15,
    defense: 0,

    // Combat
    attackRange: 50,
    attackRate: 1.5,
    attackType: 'melee',
    aggroRange: 200,
    leashDistance: 500,

    // Elite variant
    eliteChance: 0.05,
    eliteMultiplier: 2,

    // Pack behavior
    packAggro: false,
    packAggroRadius: 150,

    // Spawning
    respawnTime: 30,
    spawnBiomes: [],
    groupSize: { min: 1, max: 2 },
    spawnWeight: 50,

    // AI
    aiType: 'default',
    patrolRadius: 200,

    // Visual
    sprite: 'enemy_base',

    // Audio
    sfx: {
        aggro: 'sfx_enemy_aggro',
        attack: 'sfx_enemy_attack',
        hurt: 'sfx_enemy_hurt',
        death: 'sfx_enemy_death'
    },

    // VFX
    vfx: {
        attack: 'vfx_slash',
        death: 'vfx_blood_splatter'
    },

    // Loot
    lootTable: [],
    xpReward: 10
};

window.BaseEnemy = BaseEnemy;
