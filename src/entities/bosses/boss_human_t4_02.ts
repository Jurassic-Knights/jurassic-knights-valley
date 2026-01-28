/**
 * Entity: boss_human_t4_02
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_human_t4_02',
    name: 'Leutnant',
    sourceCategory: 'bosses',
    sourceFile: 'human',
    sprite: 'human_t4_02',
    status: 'pending',
    files: {
        original: 'images/bosses/boss_human_t4_02_original.png'
    },
    tier: 4,
    biome: 'all',
    stats: {
        health: 200,
        damage: 25,
        speed: 80,
        defense: 0
    },
    combat: {
        attackRange: 350,
        attackRate: 1.5,
        aggroRange: 300,
        packAggro: true,
        attackType: 'ranged'
    },
    sfx: {
        spawn: 'sfx_spawn_human_t4_02',
        death: 'sfx_death_human_t4_02',
        hurt: 'sfx_hurt_human_t4_02',
        aggro: 'sfx_aggro_human_t4_02'
    },
    spawning: {
        biomes: ['all'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'mechanical_t1_01',
            chance: 0.8,
            amount: [1, 2]
        },
        {
            item: 'mechanical_t3_01',
            chance: 0.4,
            amount: [1, 1]
        },
        {
            item: 'lee_enfield',
            chance: 0.25,
            amount: [1, 1]
        }
    ],
    xpReward: 100,
    isBoss: true,
    sourceDescription:
        'male commander, muscle build, battle-worn colors uniform, gilded ornate armor, ceremonial mask, sniper rifle',
    weaponType: 'sniper_rifle',
    role: 'special',
    description:
        "The Leutnant's helmet has been customized for precision operations - narrow eye slits fitted with optical enhancement, the face guard smooth and featureless. This sniper-commander has eliminated high-value targets across every biome, earning the all-theater deployment that fears no environment. The mask's anonymity is their most valuable weapon.\n\nOrnate commander armor balances protection and mobility - gilded plates positioned to protect vital areas while allowing the steady positioning required for long-range elimination. A charcoal grey cloak provides concealment while lying in wait. The special-role designation marks this officer as strategic asset.\n\nSoft-soled boots designed for silent movement through any terrain make no sound on volcanic rock. That scoped sniper rifle has ended enemy officers, war-beast handlers, and other priority targets from distances they believed safe. The Leutnant is dispatched when conventional solutions fail.",
    bodyType: 'medium'
};
