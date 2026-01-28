/**
 * Entity: enemy_dinosaur_t1_03
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_dinosaur_t1_03',
    name: 'Oviraptor',
    sourceCategory: 'enemies',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t1_03',
    status: 'approved',
    files: {
        original: 'assets/images/enemies/dinosaur_t1_03_original.png'
    },
    tier: 1,
    biome: 'grasslands',
    stats: {
        health: 35,
        damage: 5,
        speed: 110,
        defense: 0
    },
    combat: {
        attackRange: 90,
        attackRate: 2,
        aggroRange: 200,
        packAggro: true,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_dinosaur_t1_03',
        death: 'sfx_death_dinosaur_t1_03',
        hurt: 'sfx_hurt_dinosaur_t1_03',
        aggro: 'sfx_aggro_dinosaur_t1_03'
    },
    spawning: {
        biomes: ['grasslands'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'food_t3_01',
            chance: 1.0,
            amount: [1, 2]
        },
        {
            item: 'leather_t1_01',
            chance: 0.5,
            amount: [1, 1]
        }
    ],
    xpReward: 12,
    species: 'Oviraptor',
    weaponType: 'tail'
};
