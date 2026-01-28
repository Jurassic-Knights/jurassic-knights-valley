/**
 * Entity: boss_dinosaur_t1_01
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_dinosaur_t1_01',
    name: 'Pack Leader',
    sourceCategory: 'bosses',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t1_01',
    status: 'pending',
    tier: 1,
    biome: 'grasslands',
    stats: {
        health: 80,
        damage: 8,
        speed: 100,
        defense: 0
    },
    combat: {
        attackRange: 100,
        attackRate: 1.5,
        aggroRange: 280,
        packAggro: true,
        attackType: 'melee'
    },
    sfx: {
        spawn: 'sfx_spawn_dinosaur_t1_01',
        death: 'sfx_death_dinosaur_t1_01',
        hurt: 'sfx_hurt_dinosaur_t1_01',
        aggro: 'sfx_aggro_dinosaur_t1_01'
    },
    spawning: {
        biomes: ['grasslands'],
        groupSize: [1, 1],
        weight: 25,
        respawnTime: 60
    },
    loot: [
        {
            item: 'minerals_t1_01',
            chance: 1.0,
            amount: [2, 4]
        },
        {
            item: 'leather_t1_01',
            chance: 0.8,
            amount: [1, 2]
        }
    ],
    xpReward: 30,
    isBoss: true,
    species: 'Velociraptor',
    sourceDescription:
        'Velociraptor, brown and tan hide, leather harness with raptor skull trophy, battle-scarred muscular build',
    description:
        "The Pack Leader commands through presence alone - this Velociraptor has fought its way to dominance through dozens of lethal challenges. Its head is scarred from countless territorial disputes, one eye clouded from an old wound that only makes its gaze more unsettling. The crest of feathers is matted with trophies from previous kills.\n\nLight leather strapping marks this war-beast's domestication, but the minimal barding does nothing to diminish its feral majesty. Olive and brown coloring provides natural camouflage, though the prominent scars make identification easy. A brass collar bears the handler's regiment - those who have survived working with this creature.\n\nThose powerful hind legs have chased down fleeing soldiers across miles of grassland, the killing claws on each foot worn sharp from constant use. The tail sweeps low during pack coordination, signaling attack formations to lesser raptors. When the Pack Leader calls, its pack moves as one lethal unit.",
    files: {
        original: 'images/bosses/boss_dinosaur_t1_01_original.png'
    }
};
