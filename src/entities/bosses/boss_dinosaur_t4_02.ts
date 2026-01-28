/**
 * Entity: boss_dinosaur_t4_02
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_dinosaur_t4_02',
    name: 'Tyrannosaur Matriarch',
    sourceCategory: 'bosses',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t4_02',
    status: 'pending',
    files: {
        original: 'images/bosses/boss_dinosaur_t4_02_original.png'
    },
    tier: 4,
    biome: 'badlands',
    stats: {
        health: 500,
        damage: 45,
        speed: 60,
        defense: 0
    },
    combat: {
        attackRange: 150,
        attackRate: 0.8,
        aggroRange: 350,
        packAggro: false,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_dinosaur_t4_02',
        death: 'sfx_death_dinosaur_t4_02',
        hurt: 'sfx_hurt_dinosaur_t4_02',
        aggro: 'sfx_aggro_dinosaur_t4_02'
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
            chance: 1.0,
            amount: [2, 3]
        },
        {
            item: 'leather_t3_01',
            chance: 1.0,
            amount: [3, 5]
        },
        {
            item: 'kriegsmesser',
            chance: 0.5,
            amount: [1, 1]
        }
    ],
    xpReward: 200,
    isBoss: true,
    sourceDescription:
        'Tyrannosaurus Rex, charred black and rust coloring, reinforced plate barding with commander insignia, imposing physique, weathered scales',
    species: 'Tyrannosaurus Rex',
    description:
        'The Tyrannosaur Matriarch represents the absolute apex of dinosaur evolution - a female Tyrannosaurus Rex of unprecedented size who has dominated badlands territory for decades. Her massive skull rises higher than most fortifications, jaws capable of crushing vehicles as easily as bones. The intelligence behind those ancient eyes has witnessed the rise and fall of military campaigns.\n\nOrnate steel barding covers her colossal form, the armor plates so large they were forged as fortification gates and repurposed. Charcoal grey and rust coloring blends with volcanic terrain, though something this massive can hardly hide. Iron bands reinforce natural armor plates, creating defense that shrugs off artillery.\n\nThose pillar-like legs shake the ground with each step, the footfall weight cracking volcanic basalt. The massive tail could demolish structures with casual sweeps. The Tyrannosaur Matriarch has claimed this territory, and no force yet deployed has succeeded in contesting that claim.'
};
