/**
 * Entity: enemy_dinosaur_t2_04
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_dinosaur_t2_04',
    name: 'Therizinosaurus',
    sourceCategory: 'enemies',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t2_04',
    status: 'approved',
    files: {
        original: 'assets/images/enemies/dinosaur_t2_04_original.png'
    },
    tier: 2,
    biome: 'tundra',
    stats: {
        health: 120,
        damage: 15,
        speed: 50,
        defense: 0
    },
    combat: {
        attackRange: 150,
        attackRate: 0.6,
        aggroRange: 200,
        packAggro: false,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_dinosaur_t2_04',
        death: 'sfx_death_dinosaur_t2_04',
        hurt: 'sfx_hurt_dinosaur_t2_04',
        aggro: 'sfx_aggro_dinosaur_t2_04'
    },
    spawning: {
        biomes: ['tundra'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'food_t2_01',
            chance: 1.0,
            amount: [2, 3]
        },
        {
            item: 'leather_t2_01',
            chance: 0.7,
            amount: [1, 2]
        }
    ],
    xpReward: 30,
    species: 'Therizinosaurus',
    weaponType: 'claws'
};
