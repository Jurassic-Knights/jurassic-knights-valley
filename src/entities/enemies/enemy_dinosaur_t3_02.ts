/**
 * Entity: enemy_dinosaur_t3_02
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_dinosaur_t3_02',
    name: 'Razorclaw',
    sourceCategory: 'enemies',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t3_02',
    status: 'pending',
    tier: 3,
    biome: 'desert',
    stats: {
        health: 100,
        damage: 14,
        speed: 85,
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
        spawn: 'sfx_spawn_dinosaur_t3_02',
        death: 'sfx_death_dinosaur_t3_02',
        hurt: 'sfx_hurt_dinosaur_t3_02',
        aggro: 'sfx_aggro_dinosaur_t3_02'
    },
    spawning: {
        biomes: ['desert'],
        groupSize: [1, 2],
        weight: 50,
        respawnTime: 30
    },
    loot: [
        {
            item: 'minerals_t3_01',
            chance: 0.7,
            amount: [1, 2]
        },
        {
            item: 'salvage_t3_01',
            chance: 0.3,
            amount: [1, 1]
        }
    ],
    xpReward: 45,
    species: 'Allosaurus',
    sourceDescription:
        'Allosaurus, sand tan scales, iron plate barding with ammunition pouches, massive jaws visible',
    description:
        'Razorclaw, as the handlers named this Allosaurus veteran, carries three parallel scars across its muzzle from prey that almost escaped. Its eyes hold the cold patience of an apex predator that has learned to wait for the perfect moment. The massive skull ends in jaws that can crush bone and sever limbs with a single bite.\n\nIron plate barding covers its sides and back, the metal showing dents and scratches from previous engagements. Sun-bleached leather straps are reinforced with bronze clasps, securing the armor to its sand-colored hide. Desert camouflage patterns have been painted across exposed scales in tan and pale brown.\n\nEach step plants a three-toed foot with deliberate weight, the killing claw on each foot curved like a cavalry saber. The long tail sweeps the sand behind it, erasing its tracks from recent kills. This creature hunts by strategy, not just instinct - a fact that makes it far more dangerous than its feral cousins.',
    files: {
        original: 'images/enemies/dinosaur_t3_02_original.png'
    },
    weaponType: 'bite'
};
