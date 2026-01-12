/**
 * BaseBoss - Default configuration for boss enemies
 * 
 * Bosses are powerful unique enemies with phases.
 * Extends BaseEnemy with additional boss-specific properties.
 */

const BaseBoss = {
    entityType: 'Boss',

    // Size (bigger than normal)
    gridSize: 3,
    width: 384,
    height: 384,

    // Stats (scaled up)
    health: 1000,
    maxHealth: 1000,
    speed: 60,
    damage: 50,
    defense: 20,

    // Combat
    attackRange: 100,
    attackRate: 0.8,
    aggroRange: 400,

    // Phases
    phases: [
        { healthPercent: 100, abilities: [] },
        { healthPercent: 50, abilities: [], enraged: true }
    ],
    currentPhase: 0,

    // Spawning
    respawnTime: 300,
    spawnBiomes: [],
    unique: true,

    // AI
    aiType: 'boss',

    // Visual
    sprite: 'boss_base',

    // Audio
    sfx: {
        spawn: 'sfx_boss_spawn',
        roar: 'sfx_boss_roar',
        attack: 'sfx_boss_attack',
        phaseChange: 'sfx_boss_enrage',
        death: 'sfx_boss_death'
    },

    // VFX
    vfx: {
        spawn: 'vfx_boss_spawn',
        attack: 'vfx_boss_slam',
        phaseChange: 'vfx_boss_enrage',
        death: 'vfx_boss_death'
    },

    // Loot
    lootTable: [],
    guaranteedDrops: [],
    xpReward: 500
};

window.BaseBoss = BaseBoss;
