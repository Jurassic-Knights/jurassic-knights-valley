/**
 * Entity: enemy_human_t2_03
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_human_t2_03',
    name: 'Halberdier',
    sourceCategory: 'enemies',
    sourceFile: 'human',
    sprite: 'human_t2_03',
    status: 'pending',
    files: {
        original: 'assets/images/enemies/human_t2_03_original.png'
    },
    tier: 2,
    biome: 'tundra',
    stats: {
        health: 85,
        damage: 20,
        speed: 60,
        defense: 0
    },
    combat: {
        attackRange: 150,
        attackRate: 0.7,
        aggroRange: 200,
        packAggro: false,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t2_03',
        death: 'sfx_death_human_t2_03',
        hurt: 'sfx_hurt_human_t2_03',
        aggro: 'sfx_aggro_human_t2_03'
    },
    spawning: {
        biomes: ['tundra'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'salvage_t1_02',
            chance: 0.7,
            amount: [1, 2]
        },
        {
            item: 'bone_t1_01',
            chance: 0.4,
            amount: [1, 1]
        }
    ],
    xpReward: 32,
    species: 'Sergeant',
    weaponType: 'halberd',
    role: 'medium'
};
