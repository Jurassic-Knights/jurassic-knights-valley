/**
 * Tyrannosaurus - Hostile creature
 * 
 * Massive apex predator. Slow but devastating damage.
 * Drops iron ore when killed.
 */

const Tyrannosaurus = {
    ...window.BaseCreature,

    id: 'tyrannosaurus',
    name: 'Tyrannosaurus Rex',
    description: 'Apex predator. Slow but devastating.',

    // Behavior
    hostile: true,

    // Size (large)
    gridSize: 2.5,
    width: 320,
    height: 320,

    // Stats
    health: 300,
    maxHealth: 300,
    speed: 70,
    damage: 40,

    // Combat
    attackRange: 80,
    attackRate: 0.8,
    aggroRange: 300,

    // Spawning
    respawnTime: 60,
    spawnBiomes: ['iron_ridge', 'bone_valley'],
    groupSize: { min: 1, max: 1 },
    spawnWeight: 20,

    // Visual
    sprite: 'dino_tyrannosaurus_base',

    // Audio
    sfx: {
        ...window.BaseCreature.sfx,
        idle: 'sfx_trex_idle',
        aggro: 'sfx_trex_roar',
        attack: 'sfx_trex_bite',
        death: 'sfx_trex_death'
    },

    // VFX
    vfx: {
        attack: 'vfx_heavy_bite',
        death: 'vfx_blood_splatter_large'
    },

    // Loot
    lootTable: [
        { item: 'iron_ore', chance: 1.0, amount: 3 },
        { item: 'primal_meat', chance: 1.0, amount: 2 },
        { item: 'rex_tooth', chance: 0.2, amount: 1 }
    ],
    xpReward: 50
};

window.EntityRegistry.creatures.hostile.tyrannosaurus = Tyrannosaurus;
