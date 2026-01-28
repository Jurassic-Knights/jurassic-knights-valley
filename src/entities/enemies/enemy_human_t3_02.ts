/**
 * Entity: enemy_human_t3_02
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_human_t3_02',
    name: 'Flametrooper',
    sourceCategory: 'enemies',
    sourceFile: 'human',
    sprite: 'human_t3_02',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/human_t3_02_original.png'
    },
    tier: 3,
    biome: 'desert',
    stats: {
        health: 90,
        damage: 6,
        speed: 50,
        defense: 0
    },
    combat: {
        attackRange: 180,
        attackRate: 4,
        aggroRange: 200,
        packAggro: false,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t3_02',
        death: 'sfx_death_human_t3_02',
        hurt: 'sfx_hurt_human_t3_02',
        aggro: 'sfx_aggro_human_t3_02'
    },
    spawning: {
        biomes: ['desert'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'salvage_t2_01',
            chance: 0.8,
            amount: [2, 3]
        },
        {
            item: 'mechanical_t2_01',
            chance: 0.4,
            amount: [1, 1]
        }
    ],
    xpReward: 50,
    species: 'Captain',
    weaponType: 'pistol',
    role: 'heavy'
};
