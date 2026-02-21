/** Interaction radii and time/weather config. */
export const Interaction = {
    REST_AREA_RADIUS: 400,
    FORGE_AREA_RADIUS: 200,
    MERCHANT_RADIUS: 140,
    RESOURCE_PICKUP_RADIUS: 145,
    DROPPED_ITEM_PICKUP_RADIUS: 140
};

export const Time = {
    REAL_SECONDS_PER_GAME_DAY: 300,
    PHASES: {
        DAWN: 0.05,
        DAY: 0.15,
        DUSK: 0.75,
        NIGHT: 0.9
    },
    DEBUG_PHASE_OVERRIDES: {
        dawn: 0.22,
        day: 0.5,
        dusk: 0.77,
        night: 0.05
    },
    SEASONS: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
    DAYS_PER_SEASON: 2,
    WEATHER_DECAY_RATE: 5000
};

export const Weather = {
    TYPES: {
        CLEAR: 'CLEAR',
        RAIN: 'RAIN',
        STORM: 'STORM',
        SNOW: 'SNOW'
    },
    PROBABILITIES: {
        SPRING: { CLEAR: 0.65, RAIN: 0.3, STORM: 0.05, FOG: 0, SNOW: 0 },
        SUMMER: { CLEAR: 0.8, RAIN: 0.1, STORM: 0.1, FOG: 0, SNOW: 0 },
        AUTUMN: { CLEAR: 0.5, RAIN: 0.4, STORM: 0.1, FOG: 0, SNOW: 0 },
        WINTER: { CLEAR: 0.4, RAIN: 0, STORM: 0.05, FOG: 0, SNOW: 0.55 }
    },
    CHANGE_INTERVAL: 3
};
