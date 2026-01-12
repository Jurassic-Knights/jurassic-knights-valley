/**
 * Grasslands Alpha - Boss
 * 
 * First boss encounter in the grasslands biome.
 */

const GrasslandsAlpha = {
    ...window.BaseBoss,

    id: 'grasslands_alpha',
    name: 'Alpha Pack Leader',
    description: 'Massive raptor commanding the pack.',

    // Size
    gridSize: 2.5,
    width: 320,
    height: 320,

    // Stats
    health: 500,
    maxHealth: 500,
    speed: 90,
    damage: 35,

    // Spawning
    respawnTime: 300,
    spawnBiomes: ['grasslands'],
    unique: true,

    // Phases
    phases: [
        { healthPercent: 100, abilities: ['lunge'] },
        { healthPercent: 50, abilities: ['pack_call', 'lunge'], enraged: true }
    ],

    // Visual
    sprite: 'boss_grasslands_alpha',

    // Audio
    sfx: {
        spawn: 'sfx_boss_spawn',
        roar: 'sfx_alpha_roar',
        attack: 'sfx_raptor_bite_heavy',
        phaseChange: 'sfx_boss_enrage',
        death: 'sfx_boss_death'
    },

    // Loot
    lootTable: [
        { item: 'alpha_fang', chance: 1.0, amount: 1 },
        { item: 'primal_meat', chance: 1.0, amount: 5 },
        { item: 'raptor_claw', chance: 1.0, amount: 3 }
    ],
    xpReward: 200
};

window.EntityRegistry.bosses = window.EntityRegistry.bosses || {};
window.EntityRegistry.bosses.grasslands_alpha = GrasslandsAlpha;
