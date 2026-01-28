/**
 * Entity: enemy_human_t2_01
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_human_t2_01',
    name: 'Sturmtruppen',
    sourceCategory: 'enemies',
    sourceFile: 'human',
    sprite: 'human_t2_01',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/human_t2_01_original.png'
    },
    tier: 2,
    biome: 'tundra',
    stats: {
        health: 80,
        damage: 15,
        speed: 90,
        defense: 0
    },
    combat: {
        attackRange: 200,
        attackRate: 1.5,
        aggroRange: 220,
        packAggro: true,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t2_01',
        death: 'sfx_death_human_t2_01',
        hurt: 'sfx_hurt_human_t2_01',
        aggro: 'sfx_aggro_human_t2_01'
    },
    spawning: {
        biomes: ['tundra'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'salvage_t1_01',
            chance: 0.6,
            amount: [1, 1]
        },
        {
            item: 'food_t1_03',
            chance: 0.5,
            amount: [1, 1]
        }
    ],
    xpReward: 30,
    species: 'Soldier',
    weaponType: 'rifle',
    role: 'medium'
};
