/** Biome system and ground texture constants. */
export const Biome = {
    PATROL_AREA_RADIUS: 300,
    LEASH_DISTANCE: 500,
    AGGRO_RANGE: 200,
    BOSS_RESPAWN_DEFAULT: 300,
    GROUP_SPACING: 50,
    PACK_AGGRO_RADIUS: 150,
    LEASH_ARRIVAL_THRESHOLD: 10,
    LEASH_RETURN_SPEED_MULTIPLIER: 1.5,
    ELITE_SPAWN_CHANCE: 0.05,
    TRANSITION_BLEND_WIDTH: 200,
    ROAD_SPEED_MULTIPLIER: 1.3
};

export const Ground = {
    CATEGORIES: {
        BASE: ['grass', 'dirt', 'rock', 'gravel', 'sand'],
        OVERGROWN: ['leaves', 'forest_floor', 'moss', 'roots', 'flowers'],
        INTERIOR: ['planks', 'cobblestone', 'flagstone', 'concrete', 'metal_plate'],
        VERTICAL: ['cliff_rock', 'earth_bank'],
        DAMAGE: ['scorched', 'churned', 'cratered']
    },
    VARIANCE: {
        grass: 4,
        dirt: 3,
        rock: 3,
        gravel: 2,
        sand: 2,
        leaves: 3,
        forest_floor: 3,
        moss: 2,
        roots: 2,
        flowers: 2,
        planks: 3,
        cobblestone: 2,
        flagstone: 2,
        concrete: 2,
        metal_plate: 2,
        cliff_rock: 3,
        earth_bank: 3,
        scorched: 2,
        churned: 2,
        cratered: 1
    }
};
