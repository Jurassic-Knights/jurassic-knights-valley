/**
 * Entity: enemy_saurian_t4_01
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_saurian_t4_01',
    name: 'Raptor Elite',
    sourceCategory: 'enemies',
    sourceFile: 'saurian',
    sprite: 'saurian_t4_01',
    status: 'pending',
    tier: 4,
    biome: 'badlands',
    stats: {
        health: 130,
        damage: 20,
        speed: 100,
        defense: 0
    },
    combat: {
        attackRange: 100,
        attackRate: 1.5,
        aggroRange: 250,
        packAggro: false,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_saurian_t4_01',
        death: 'sfx_death_saurian_t4_01',
        hurt: 'sfx_hurt_saurian_t4_01',
        aggro: 'sfx_aggro_saurian_t4_01'
    },
    spawning: {
        biomes: ['badlands'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'minerals_t4_01',
            chance: 0.7,
            amount: [1, 2]
        },
        {
            item: 'salvage_t4_01',
            chance: 0.3,
            amount: [1, 1]
        }
    ],
    xpReward: 60,
    species: 'Velociraptor',
    sourceDescription:
        'anthropomorphic Velociraptor, charred brown uniform with yellow trim, chain mail vest, combat helmet, broad war axe',
    weaponType: 'war_axe',
    role: 'special',
    description:
        "The Raptor Elite represents the pinnacle of saurian military evolution - a Velociraptor grown to unprecedented size, trained to unprecedented discipline, equipped to unprecedented standards. Those intelligent eyes hold both predatory instinct and tactical analysis in perfect balance. The feathered crest is dyed with rank markings in charcoal and rust.\n\nBrass pauldrons and chainmail cover a muscular torso beneath the charcoal grey combat coat, the armor fitted precisely for the medium-role soldier's balance of protection and mobility. Blackened leather straps secure each piece with minimal noise. Iron clasps bear the worn polish of countless campaigns.\n\nPowerful digitigrade legs end in those famous killing claws, each exposed foot spreading naturally for combat balance. A lance of unusual length grants reach against larger opponents while those claws handle anyone foolish enough to close. This medium-role soldier adapts to any tactical situation - the definition of elite.",
    files: {
        original: 'images/enemies/saurian_t4_01_original.png'
    },
    declineNote: ''
};
