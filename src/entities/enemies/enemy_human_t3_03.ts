/**
 * Entity: enemy_human_t3_03
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_human_t3_03',
    name: 'Field Medic',
    sourceCategory: 'enemies',
    sourceFile: 'human',
    sprite: 'human_t3_03',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/human_t3_03_original.png'
    },
    tier: 3,
    biome: 'desert',
    stats: {
        health: 70,
        damage: 8,
        speed: 70,
        defense: 0
    },
    combat: {
        attackRange: 150,
        attackRate: 1.5,
        aggroRange: 250,
        packAggro: true,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t3_03',
        death: 'sfx_death_human_t3_03',
        hurt: 'sfx_hurt_human_t3_03',
        aggro: 'sfx_aggro_human_t3_03'
    },
    spawning: {
        biomes: ['desert'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'food_t2_01',
            chance: 0.8,
            amount: [1, 2]
        },
        {
            item: 'salvage_t1_02',
            chance: 0.5,
            amount: [1, 1]
        }
    ],
    xpReward: 40,
    species: 'Major',
    weaponType: 'sword',
    role: 'utility'
};
