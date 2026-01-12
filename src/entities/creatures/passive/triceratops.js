/**
 * Triceratops - Passive creature
 * 
 * Herbivore that flees when attacked. Good for resource gathering.
 * Extends BaseCreature.
 */

const Triceratops = {
    ...window.BaseCreature,

    id: 'triceratops',
    name: 'Triceratops',
    description: 'Armored herbivore. Flees when threatened.',

    // Behavior
    hostile: false,  // Passive - runs away

    // Size
    gridSize: 2,
    width: 256,
    height: 256,

    // Stats (tough but slow)
    health: 150,
    maxHealth: 150,
    speed: 60,
    damage: 0,

    // Spawning
    respawnTime: 30,
    spawnBiomes: ['grasslands', 'quarry_fields'],
    groupSize: { min: 1, max: 3 },
    spawnWeight: 40,

    // Visual
    sprite: 'dino_triceratops_base',

    // Audio
    sfx: {
        ...window.BaseCreature.sfx,
        idle: 'sfx_trike_idle',
        hurt: 'sfx_trike_hurt',
        death: 'sfx_trike_death'
    },

    // Loot
    lootTable: [
        { item: 'fossil_fuel', chance: 0.8, amount: 2 },
        { item: 'thick_hide', chance: 0.5, amount: 1 }
    ],
    xpReward: 20
};

// Register with EntityRegistry
window.EntityRegistry = window.EntityRegistry || { creatures: { hostile: {}, passive: {} } };
window.EntityRegistry.creatures = window.EntityRegistry.creatures || { hostile: {}, passive: {} };
window.EntityRegistry.creatures.passive = window.EntityRegistry.creatures.passive || {};
window.EntityRegistry.creatures.passive.triceratops = Triceratops;
