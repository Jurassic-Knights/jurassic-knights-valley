/**
 * Feral Raptor - Enemy
 * 
 * Basic grassland enemy. Fast, attacks in groups.
 */

const FeralRaptor = {
    ...window.BaseEnemy,

    id: 'feral_raptor',
    name: 'Feral Raptor',
    description: 'Pack hunter of the grasslands.',

    // Stats
    health: 60,
    speed: 100,
    damage: 12,

    // Combat
    aggroRange: 250,
    packAggro: true,
    packAggroRadius: 200,

    // Spawning
    spawnBiomes: ['grasslands'],
    groupSize: { min: 2, max: 4 },
    spawnWeight: 60,

    // AI
    aiType: 'pack_hunter',

    // Visual
    sprite: 'enemy_feral_raptor',

    // Audio
    sfx: {
        ...window.BaseEnemy.sfx,
        aggro: 'sfx_raptor_screech',
        attack: 'sfx_raptor_bite'
    },

    // Loot
    lootTable: [
        { item: 'raptor_claw', chance: 0.25, amount: 1 },
        { item: 'primal_meat', chance: 0.8, amount: 1 }
    ],
    xpReward: 12
};

window.EntityRegistry.enemies = window.EntityRegistry.enemies || {};
window.EntityRegistry.enemies.feral_raptor = FeralRaptor;
