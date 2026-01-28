/**
 * Entity: boss_human_t3_01
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_human_t3_01',
    name: 'Desert General',
    sourceCategory: 'bosses',
    sourceFile: 'human',
    sprite: 'human_t3_01',
    status: 'pending',
    tier: 3,
    biome: 'desert',
    stats: {
        health: 170,
        damage: 18,
        speed: 60,
        defense: 0
    },
    combat: {
        attackRange: 400,
        attackRate: 1.5,
        aggroRange: 280,
        packAggro: true,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t3_01',
        death: 'sfx_death_human_t3_01',
        hurt: 'sfx_hurt_human_t3_01',
        aggro: 'sfx_aggro_human_t3_01'
    },
    spawning: {
        biomes: ['desert'],
        groupSize: [1, 1],
        weight: 25,
        respawnTime: 60
    },
    loot: [
        {
            item: 'minerals_t3_01',
            chance: 1.0,
            amount: [2, 4]
        },
        {
            item: 'leather_t3_01',
            chance: 0.8,
            amount: [1, 2]
        }
    ],
    xpReward: 90,
    isBoss: true,
    gender: 'male',
    bodyType: 'fat',
    sourceDescription:
        'male commander, fat build, sand tan uniform, full plate armor, combat helmet with visor, shotgun',
    weaponType: 'shotgun',
    role: 'heavy',
    description:
        "The Desert General's helmet rises to a ceremonial point, the welded iron mask below bearing engravings that tell of campaigns across the scorched dunes. That expressionless face has delivered orders that reshaped desert warfare, the tactical mind behind it responsible for doctrines still studied. Sand has permanently etched the metal surface.\n\nFull plate armor bears the weight of command - heavy bronze plates over a sand-colored tabard stained with the evidence of leadership from the front. Sun-bleached leather secures overlapping protection designed for the heaviest combat. The heavy-role designation reflects this commander's aggressive doctrine.\n\nReinforced boots have left footprints across every major desert engagement of the past decade. A combat shotgun provides devastating close-range capability, the weapon engraved with unit honors. This General believes leaders should share every danger their troops face.",
    files: {
        original: 'images/bosses/boss_human_t3_01_original.png'
    }
};
