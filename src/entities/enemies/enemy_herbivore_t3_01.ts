/**
 * Entity: enemy_herbivore_t3_01
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_herbivore_t3_01',
    name: 'Triceratops',
    sourceCategory: 'enemies',
    sourceFile: 'herbivore',
    sprite: 'herbivore_t3_01',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/herbivore_t3_01_original.png'
    },
    tier: 3,
    biome: 'desert',
    stats: {
        health: 180,
        damage: 25,
        speed: 50,
        defense: 0
    },
    combat: {
        attackRange: 140,
        attackRate: 0.5,
        aggroRange: 200,
        packAggro: true,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_herbivore_t3_01',
        death: 'sfx_death_herbivore_t3_01',
        hurt: 'sfx_hurt_herbivore_t3_01',
        aggro: 'sfx_aggro_herbivore_t3_01'
    },
    spawning: {
        biomes: ['desert'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'food_t3_01',
            chance: 1.0,
            amount: [2, 3]
        },
        {
            item: 'bone_t1_01',
            chance: 0.5,
            amount: [1, 2]
        }
    ],
    xpReward: 50,
    species: 'Triceratops',
    weaponType: 'horns'
};
