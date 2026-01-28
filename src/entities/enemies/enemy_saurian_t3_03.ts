/**
 * Entity: enemy_saurian_t3_03
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_saurian_t3_03',
    name: 'Ankylosaurus Siege',
    sourceCategory: 'enemies',
    sourceFile: 'saurian',
    sprite: 'saurian_t3_03',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/saurian_t3_03_original.png'
    },
    tier: 3,
    biome: 'desert',
    stats: {
        health: 200,
        damage: 15,
        speed: 40,
        defense: 0
    },
    combat: {
        attackRange: 400,
        attackRate: 1.5,
        aggroRange: 350,
        packAggro: false,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_saurian_t3_03',
        death: 'sfx_death_saurian_t3_03',
        hurt: 'sfx_hurt_saurian_t3_03',
        aggro: 'sfx_aggro_saurian_t3_03'
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
    xpReward: 60,
    species: 'Ankylosaurus',
    weaponType: 'axe',
    role: 'heavy'
};
