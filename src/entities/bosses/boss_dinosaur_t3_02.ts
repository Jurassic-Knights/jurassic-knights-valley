/**
 * Entity: boss_dinosaur_t3_02
 * Auto-generated from JSON.
 */

export default {
    id: 'boss_dinosaur_t3_02',
    name: 'Desert Stalker',
    sourceCategory: 'bosses',
    sourceFile: 'dinosaur',
    sprite: 'dinosaur_t3_02',
    status: 'pending',
    files: {
        original: 'images/bosses/boss_dinosaur_t3_02_original.png'
    },
    tier: 3,
    biome: 'desert',
    stats: {
        health: 300,
        damage: 28,
        speed: 100,
        defense: 0
    },
    combat: {
        attackRange: 130,
        attackRate: 1.3,
        aggroRange: 280,
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
            item: 'bone_t2_01',
            chance: 1.0,
            amount: [4, 6]
        },
        {
            item: 'minerals_t3_01',
            chance: 1.0,
            amount: [2, 3]
        },
        {
            item: 'winchester_m1897',
            chance: 0.5,
            amount: [1, 1]
        }
    ],
    xpReward: 120,
    isBoss: true,
    sourceDescription:
        'Allosaurus, sand tan and bronze coloring, ornate barding with painted war markings, massive muscular build, battle scars visible',
    species: 'Allosaurus',
    description:
        "The Desert Stalker has perfected the ambush - a second Allosaurus apex predator that has carved territory adjacent to the Tyrant's domain. This creature favors cunning over direct confrontation, disappearing into sandstorms to strike when targets are most vulnerable. Its tracking capabilities border on supernatural.\n\nIron barding covers its lean frame, the armor designed for mobility rather than direct combat. Sand and tan patterns have been painted over natural coloring, suggesting either intelligence or handlers who understood camouflage. Bronze clasps secure armor that rattles in warning just before attacks.\n\nSwift legs carry this creature in bursts of terrifying speed, closing distance before prey can react. The long tail sweeps to maintain balance during direction changes that would topple lesser predators. The Desert Stalker doesn't hunt for food alone - it seems to enjoy the chase."
};
