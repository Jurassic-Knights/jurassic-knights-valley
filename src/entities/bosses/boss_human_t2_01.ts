/**
 * Entity: boss_human_t2_01
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_human_t2_01',
    name: 'Battalion Commander',
    sourceCategory: 'bosses',
    sourceFile: 'human',
    sprite: 'human_t2_01',
    status: 'pending',
    tier: 2,
    biome: 'tundra',
    stats: {
        health: 140,
        damage: 15,
        speed: 70,
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
        spawn: 'sfx_spawn_human_t2_01',
        death: 'sfx_death_human_t2_01',
        hurt: 'sfx_hurt_human_t2_01',
        aggro: 'sfx_aggro_human_t2_01'
    },
    spawning: {
        biomes: ['tundra'],
        groupSize: [1, 1],
        weight: 25,
        respawnTime: 60
    },
    loot: [
        {
            item: 'minerals_t2_01',
            chance: 1.0,
            amount: [2, 4]
        },
        {
            item: 'leather_t2_01',
            chance: 0.8,
            amount: [1, 2]
        }
    ],
    xpReward: 60,
    isBoss: true,
    gender: 'male',
    bodyType: 'muscle',
    sourceDescription:
        'male commander, muscle build, white fur-lined greatcoat, steel breastplate with rank chevrons, war helm, rifle',
    weaponType: 'rifle',
    role: 'special',
    description:
        "The Battalion Commander issues orders from behind a face plate lined internally with fur against the killing tundra cold. That insulated mask has witnessed battalion-level operations across frozen wastelands, the strategic mind behind it responsible for victories measured in miles of territory. Frost crystals decorate the helmet's exterior.\n\nOrnate commander armor gleams with silver trim over a white-grey fur-lined coat, the luxury materials denoting high rank. A pale leather cape flows from gilded shoulder guards, the fabric embroidered with campaign honors. Tool belts carry strategic equipment - maps, compasses, signal devices.\n\nInsulated boots leave commanding footprints in snow as this officer surveys the frozen battlefield. A mechanical rifle serves as personal weapon - quiet for covert operations, deadly accurate in trained hands. This special-role commander plans victories before the first shot fires.",
    files: {
        original: 'images/bosses/boss_human_t2_01_original.png'
    },
    declineNote: ''
};
