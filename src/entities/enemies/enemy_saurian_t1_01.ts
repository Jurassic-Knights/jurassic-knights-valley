/**
 * Entity: enemy_saurian_t1_01
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_saurian_t1_01',
    name: 'Velociraptor Rider',
    sourceCategory: 'enemies',
    sourceFile: 'saurian',
    sprite: 'saurian_t1_01',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/saurian_t1_01_original.png'
    },
    tier: 1,
    biome: 'grasslands',
    stats: {
        health: 60,
        damage: 10,
        speed: 100,
        defense: 0
    },
    combat: {
        attackRange: 120,
        attackRate: 1.2,
        aggroRange: 220,
        packAggro: true,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_saurian_t1_01',
        death: 'sfx_death_saurian_t1_01',
        hurt: 'sfx_hurt_saurian_t1_01',
        aggro: 'sfx_aggro_saurian_t1_01'
    },
    spawning: {
        biomes: ['grasslands'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'leather_t1_01',
            chance: 0.7,
            amount: [1, 2]
        },
        {
            item: 'salvage_t1_01',
            chance: 0.4,
            amount: [1, 1]
        },
        {
            item: 'billhook',
            chance: 0.12,
            amount: [1, 1]
        }
    ],
    xpReward: 20,
    species: 'Velociraptor',
    weaponType: 'sword',
    role: 'light'
};
