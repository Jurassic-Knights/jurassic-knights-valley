/**
 * Entity: enemy_saurian_t1_03
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_saurian_t1_03',
    name: 'Triceratops Shieldbearer',
    sourceCategory: 'enemies',
    sourceFile: 'saurian',
    sprite: 'saurian_t1_03',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/saurian_t1_03_original.png'
    },
    tier: 1,
    biome: 'grasslands',
    stats: {
        health: 80,
        damage: 6,
        speed: 60,
        defense: 0
    },
    combat: {
        attackRange: 80,
        attackRate: 0.8,
        aggroRange: 180,
        packAggro: true,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_saurian_t1_03',
        death: 'sfx_death_saurian_t1_03',
        hurt: 'sfx_hurt_saurian_t1_03',
        aggro: 'sfx_aggro_saurian_t1_03'
    },
    spawning: {
        biomes: ['grasslands'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'bone_t1_01',
            chance: 0.7,
            amount: [1, 2]
        },
        {
            item: 'salvage_t1_01',
            chance: 0.5,
            amount: [1, 1]
        }
    ],
    xpReward: 18,
    species: 'Triceratops',
    weaponType: 'mace',
    role: 'heavy'
};
