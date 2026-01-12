/**
 * Velociraptor - Hostile creature
 * 
 * Fast pack hunter that chases and attacks the player.
 * Extends BaseCreature.
 */

const Velociraptor = {
    ...window.BaseCreature,

    id: 'velociraptor',
    name: 'Velociraptor',
    description: 'Swift pack hunter. Dangerous in groups.',

    // Behavior
    hostile: true,

    // Size
    gridSize: 1.5,
    width: 192,
    height: 192,

    // Stats (overrides)
    health: 40,
    maxHealth: 40,
    speed: 120,
    damage: 15,

    // Combat
    attackRange: 50,
    attackRate: 1.5,
    aggroRange: 250,

    // Pack behavior
    packAggro: true,
    packAggroRadius: 200,

    // Spawning
    respawnTime: 15,
    spawnBiomes: ['grasslands', 'dead_woods'],
    groupSize: { min: 2, max: 4 },
    spawnWeight: 60,

    // AI
    aiType: 'pack_hunter',

    // Visual
    sprite: 'dino_velociraptor_base',

    // Audio
    sfx: {
        ...window.BaseCreature.sfx,
        idle: 'sfx_raptor_idle',
        aggro: 'sfx_raptor_screech',
        attack: 'sfx_raptor_bite',
        death: 'sfx_raptor_death'
    },

    // VFX
    vfx: {
        attack: 'vfx_claw_slash',
        death: 'vfx_blood_splatter'
    },

    // Loot
    lootTable: [
        { item: 'raptor_claw', chance: 0.3, amount: 1 },
        { item: 'primal_meat', chance: 1.0, amount: 1 }
    ],
    xpReward: 15
};

// Register with EntityRegistry
window.EntityRegistry = window.EntityRegistry || { creatures: { hostile: {}, passive: {} } };
window.EntityRegistry.creatures = window.EntityRegistry.creatures || { hostile: {}, passive: {} };
window.EntityRegistry.creatures.hostile = window.EntityRegistry.creatures.hostile || {};
window.EntityRegistry.creatures.hostile.velociraptor = Velociraptor;
