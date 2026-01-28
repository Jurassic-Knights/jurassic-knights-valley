/**
 * Entity: enemy_human_t3_01
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_human_t3_01',
    name: 'Machine Gunner',
    sourceCategory: 'enemies',
    sourceFile: 'human',
    sprite: 'human_t3_01',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/human_t3_01_original.png'
    },
    tier: 3,
    biome: 'desert',
    stats: {
        health: 100,
        damage: 8,
        speed: 40,
        defense: 0
    },
    combat: {
        attackRange: 400,
        attackRate: 3,
        aggroRange: 300,
        packAggro: false,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t3_01',
        death: 'sfx_death_human_t3_01',
        hurt: 'sfx_hurt_human_t3_01',
        aggro: 'sfx_aggro_human_t3_01'
    },
    spawning: {
        biomes: ['desert'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'salvage_t1_02',
            chance: 0.7,
            amount: [2, 3]
        },
        {
            item: 'minerals_t2_02',
            chance: 0.5,
            amount: [1, 1]
        },
        {
            item: 'webley_revolver',
            chance: 0.1,
            amount: [1, 1]
        }
    ],
    xpReward: 45,
    species: 'Lieutenant',
    weaponType: 'machine_gun',
    role: 'heavy'
};
