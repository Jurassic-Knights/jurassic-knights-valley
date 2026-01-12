/**
 * Feral Soldier - Enemy
 * 
 * Basic human melee enemy.
 */

const FeralSoldier = {
    ...window.BaseEnemy,

    id: 'feral_soldier',
    name: 'Feral Soldier',
    description: 'Deserter turned savage.',

    // Stats
    health: 80,
    speed: 70,
    damage: 15,

    // Combat
    attackType: 'melee',

    // Spawning
    spawnBiomes: ['grasslands', 'crossroads'],
    groupSize: { min: 1, max: 2 },
    spawnWeight: 40,

    // Visual
    sprite: 'enemy_feral_soldier',

    // Loot
    lootTable: [
        { item: 'scrap_metal', chance: 0.5, amount: 1 },
        { item: 'iron_ore', chance: 0.2, amount: 1 }
    ],
    xpReward: 15
};

window.EntityRegistry.enemies = window.EntityRegistry.enemies || {};
window.EntityRegistry.enemies.feral_soldier = FeralSoldier;
