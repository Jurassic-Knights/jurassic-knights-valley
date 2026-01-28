/**
 * Entity: enemy_dinosaur_t2_03
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_dinosaur_t2_03',
    name: 'Pachyrhinosaurus',
    sourceCategory: 'enemies',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t2_03',
    status: 'approved',
    files: {
        original: 'assets/images/enemies/dinosaur_t2_03_original.png'
    },
    tier: 2,
    biome: 'tundra',
    stats: {
        health: 80,
        damage: 8,
        speed: 60,
        defense: 0
    },
    combat: {
        attackRange: 120,
        attackRate: 0.8,
        aggroRange: 200,
        packAggro: true,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_dinosaur_t2_03',
        death: 'sfx_death_dinosaur_t2_03',
        hurt: 'sfx_hurt_dinosaur_t2_03',
        aggro: 'sfx_aggro_dinosaur_t2_03'
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
            amount: [1, 2]
        },
        {
            item: 'leather_t2_01',
            chance: 0.5,
            amount: [1, 1]
        },
        {
            item: 'bone_t1_01',
            chance: 0.3,
            amount: [1, 1]
        }
    ],
    xpReward: 18,
    species: 'Pachyrhinosaurus',
    weaponType: 'tail'
};
