/**
 * Ankylosaurus - Passive creature
 * 
 * Heavily armored herbivore. Very tough, slow.
 * Drops scrap metal when killed.
 */

const Ankylosaurus = {
    ...window.BaseCreature,

    id: 'ankylosaurus',
    name: 'Ankylosaurus',
    description: 'Armored tank. Hard to kill, rich rewards.',

    // Behavior
    hostile: false,  // Passive

    // Size
    gridSize: 1.5,
    width: 192,
    height: 192,

    // Stats (high HP, very slow)
    health: 200,
    maxHealth: 200,
    speed: 40,
    damage: 0,

    // Spawning
    respawnTime: 45,
    spawnBiomes: ['scrap_yard', 'iron_ridge'],
    groupSize: { min: 1, max: 2 },
    spawnWeight: 30,

    // Visual
    sprite: 'dino_ankylosaurus_base',

    // Audio
    sfx: {
        ...window.BaseCreature.sfx,
        idle: 'sfx_anky_idle',
        hurt: 'sfx_anky_hurt',
        death: 'sfx_anky_death'
    },

    // Loot
    lootTable: [
        { item: 'scrap_metal', chance: 1.0, amount: 3 },
        { item: 'thick_hide', chance: 0.4, amount: 1 }
    ],
    xpReward: 25
};

window.EntityRegistry.creatures.passive.ankylosaurus = Ankylosaurus;
