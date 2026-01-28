/**
 * Entity: enemy_herbivore_t4_02
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_herbivore_t4_02',
    name: 'Armored Fury',
    sourceCategory: 'enemies',
    sourceFile: 'herbivore',
    sprite: 'herbivore_t4_02',
    status: 'pending',
    tier: 4,
    biome: 'badlands',
    stats: {
        health: 200,
        damage: 15,
        speed: 50,
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
        spawn: 'sfx_spawn_herbivore_t4_02',
        death: 'sfx_death_herbivore_t4_02',
        hurt: 'sfx_hurt_herbivore_t4_02',
        aggro: 'sfx_aggro_herbivore_t4_02'
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
    species: 'Ankylosaurus',
    sourceDescription: 'Ankylosaurus, smoky grey with black markings, armored hide with tail club',
    description:
        "The Armored Fury presents Ankylosaurus armor evolved to badlands extremes - every plate thickened, every spike lengthened, the tail club grown to battering-ram proportions. Its small head barely peeks from between shoulder armor, eyes glittering with hard-won survival wisdom. This individual has outlived countless predators.\n\nAsh grey and mottled black hide provides perfect badlands camouflage, darker where volcanic dust has settled into crevices. Natural spikes along its flanks are stained with rust-colored mineral deposits. The bony plates overlap seamlessly, creating an impenetrable shell that predators have failed to breach for decades.\n\nThose four sturdy legs carry a walking fortress across any terrain, the footstep weight cracking solidite stone. The massive tail club could demolish fortified positions - and has, according to soldiers who observed this creature defending its territory. Approaching triggers an immediate tail-swing that doesn't distinguish between predator and person.",
    files: {
        original: 'images/enemies/herbivore_t4_02_original.png'
    },
    weaponType: 'tail'
};
