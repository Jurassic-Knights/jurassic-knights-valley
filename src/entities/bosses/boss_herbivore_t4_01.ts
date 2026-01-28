/**
 * Entity: boss_herbivore_t4_01
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_herbivore_t4_01',
    name: 'Diplodocus',
    sourceCategory: 'bosses',
    sourceFile: 'herbivore',
    sprite: 'herbivore_t4_01',
    status: 'pending',
    files: {
        original: 'images/bosses/boss_herbivore_t4_01_original.png'
    },
    tier: 4,
    biome: 'badlands',
    stats: {
        health: 500,
        damage: 40,
        speed: 25,
        defense: 0
    },
    combat: {
        attackRange: 250,
        attackRate: 0.4,
        aggroRange: 300,
        packAggro: false,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_herbivore_t4_01',
        death: 'sfx_death_herbivore_t4_01',
        hurt: 'sfx_hurt_herbivore_t4_01',
        aggro: 'sfx_aggro_herbivore_t4_01'
    },
    spawning: {
        biomes: ['badlands'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'food_t2_02',
            chance: 1.0,
            amount: [4, 6]
        },
        {
            item: 'bone_t3_01',
            chance: 0.4,
            amount: [1, 1]
        }
    ],
    xpReward: 150,
    isBoss: true,
    sourceDescription: 'Diplodocus, grey and dark brown tones, massive towering build',
    species: 'Diplodocus',
    description:
        "This Diplodocus is a living mountain rising from the volcanic plain, its impossibly long neck stretching toward ash-choked skies. The head at that neck's end is small but ancient, eyes that have watched badlands form over geological time. Its peaceful demeanor belies the devastation it causes simply by existing in a space.\n\nNo armor adorns this colossal creature - none could be forged at sufficient scale. The ash-grey hide blends with volcanic terrain, darker patches where minerals have stained the skin over decades. Its natural coloring adapted through generations of badlands existence.\n\nThose column-like legs could crush fortifications simply by walking through them. The whip-like tail spans longer than most structures, capable of clearing entire formations with a single sweep. This ancient giant asks only to be left alone - and punishes intrusion with extinction-level force."
};
