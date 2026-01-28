/**
 * Entity: enemy_dinosaur_t4_01
 * Auto-generated from JSON.
 */

export default {
    id: 'enemy_dinosaur_t4_01',
    name: 'Alpha Raptor',
    sourceCategory: 'enemies',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t4_01',
    status: 'pending',
    tier: 4,
    biome: 'badlands',
    stats: {
        health: 150,
        damage: 20,
        speed: 110,
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
        spawn: 'sfx_spawn_dinosaur_t4_01',
        death: 'sfx_death_dinosaur_t4_01',
        hurt: 'sfx_hurt_dinosaur_t4_01',
        aggro: 'sfx_aggro_dinosaur_t4_01'
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
        'Utahraptor, charred brown and rust coloring, steel barding with trench spikes, razor claws extended',
    description:
        "The Alpha Raptor stands apart from lesser Utahraptors - larger, older, covered in battle scars that lesser creatures could not have survived. Its head rises and falls with each heavy breath, calculating eyes processing threat assessments with unsettling intelligence. The killing claws on each foot have been sharpened to razor keenness by handlers who fear the creature they maintain.\n\nOrnate steel plate barding wraps this apex predator's body, each piece engraved with kill tallies and unit honors. Blackened leather straps secured with iron buckles hold the armor firm against its charcoal-grey hide. Rust-red streaks natural to badlands Utahraptors are visible between armor plates, resembling dried blood.\n\nThose powerful legs can propel the creature thirty feet in a single leap, clawed feet extending forward for devastating landing strikes. The stiff tail provides balance during complex aerial attacks that leave targets shredded. Handlers say this creature doesn't follow commands - it simply agrees to hunt the same prey as its masters, for now.",
    files: {
        original: 'images/enemies/dinosaur_t4_01_original.png'
    },
    weaponType: 'claws'
};
