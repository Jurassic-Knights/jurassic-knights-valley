/**
 * GameConstants - Centralized configuration for the game
 * 
 * Contains magic numbers, configuration settings, and balance values.
 */
const GameConstants = {
    // Grid System
    Grid: {
        CELL_SIZE: 128,         // Main gameplay unit (pixels)
        SUB_TILE_SIZE: 32,      // Visual detail (4x4 per cell)
        ISLAND_CELLS: 8         // Cells per island (1024/128)
    },

    // World / Island Configuration
    World: {
        GRID_COLS: 3,
        GRID_ROWS: 3,
        ISLAND_SIZE: 1024,
        WATER_GAP: 170,
        BRIDGE_WIDTH: 140,
        MAP_PADDING: 512,

        // Wall boundaries for playable area
        WALL_WIDTH: 85,      // Horizontal wall thickness
        WALL_PAD_TOP: 50,    // Vertical wall thickness (top)
        WALL_PAD_BOTTOM: 135 // Vertical wall thickness (bottom)
    },

    // Unlock Costs (by grid index: row * cols + col)
    UnlockCosts: [
        0,    // Home Outpost (0,0) - free
        100,  // Quarry Fields (1,0)
        250,  // Iron Ridge (2,0)
        100,  // Dead Woods (0,1)
        200,  // Crossroads (1,1)
        350,  // Scrap Yard (2,1)
        250,  // Mud Flats (0,2)
        350,  // Bone Valley (1,2)
        500   // The Ruins (2,2)
    ],

    // Game Core Settings
    Core: {
        TICK_RATE_MS: 50, // 20 ticks per second
        INITIAL_GOLD: 100000
    },

    // Combat Settings
    Combat: {
        DEFAULT_GUN_RANGE: 450,
        DEFAULT_MINING_RANGE: 125,
        DEFAULT_DAMAGE: 10,
        ATTACK_COOLDOWN: 0.5
    },

    // Time Configuration
    Time: {
        REAL_SECONDS_PER_GAME_DAY: 300, // 5 minutes per day cycle
        // Phases as normalized day percentages (0.0 - 1.0)
        PHASES: {
            DAWN: 0.2,  // 4:48 AM
            DAY: 0.25,  // 6:00 AM
            DUSK: 0.75, // 6:00 PM
            NIGHT: 0.8  // 7:12 PM
        },
        SEASONS: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
        DAYS_PER_SEASON: 2 // 30 seconds per season (TESTING)
    },

    // Weather Configuration
    Weather: {
        TYPES: {
            CLEAR: 'CLEAR',
            RAIN: 'RAIN',
            STORM: 'STORM',
            SNOW: 'SNOW'
        },
        // Base probabilities per season (0-1)
        PROBABILITIES: {
            SPRING: { CLEAR: 0.65, RAIN: 0.3, STORM: 0.05, FOG: 0, SNOW: 0 },
            SUMMER: { CLEAR: 0.8, RAIN: 0.1, STORM: 0.1, FOG: 0, SNOW: 0 },
            AUTUMN: { CLEAR: 0.5, RAIN: 0.4, STORM: 0.1, FOG: 0, SNOW: 0 },
            WINTER: { CLEAR: 0.4, RAIN: 0, STORM: 0.05, FOG: 0, SNOW: 0.55 }
        },
        CHANGE_INTERVAL: 3 // Check for weather change every 3 seconds (TESTING)
    },

    // VFX Settings
    // VFX Settings (Moved to VFXConfig.js)
    VFX: {},

    // UI & Visuals
    UI: {
        BRIDGE_VISUAL_PADDING: 100,
        PROP_SPAWN_PADDING: 70
    },

    // Spawning & Population
    Spawning: {
        HOME_GOLD_COUNT: 5,
        HOME_GOLD_AMOUNT_MIN: 20,
        HOME_GOLD_AMOUNT_RND: 30, // + 0-30

        RESOURCE_GRID: {
            COLS: 4,
            SPACING: 170,
            AMOUNT_MIN: 1,
            AMOUNT_RND: 0
        },

        DINOSAUR: {
            AMOUNT_MIN: 1,
            AMOUNT_RND: 0
        },

        PROPS: {
            CLUSTER_COUNT_MIN: 4,
            CLUSTER_COUNT_RND: 3,
            PROPS_PER_CLUSTER_MIN: 3,
            PROPS_PER_CLUSTER_RND: 3,
            CLUSTER_RADIUS: 120,
            ITEM_COUNT_MIN: 2,
            ITEM_COUNT_RND: 3,
            MIN_DIST: 80
        },

        MERCHANT: {
            PADDING: 70
        }
    },

    // Centralized Event Keys (Data Principle: No String Literals)
    Events: {
        // Input
        INPUT_MOVE: 'INPUT_MOVE', // {x, y}
        INPUT_INTENT: 'INPUT_INTENT', // {intent, phase}
        INPUT_ACTION: 'INPUT_ACTION', // null (Legacy)

        // Hero
        HERO_MOVE: 'HERO_MOVE', // {x, y}
        HERO_ATTACK: 'HERO_ATTACK', // {target}
        HERO_HEALTH_CHANGE: 'HERO_HEALTH_CHANGE', // {current, max}
        HERO_STAMINA_CHANGE: 'HERO_STAMINA_CHANGE', // {current, max}
        HERO_HOME_STATE_CHANGE: 'HERO_HOME_STATE_CHANGE', // {isHome}

        // Inventory / Items
        INVENTORY_UPDATED: 'INVENTORY_UPDATED', // {items}
        ITEM_COLLECTED: 'ITEM_COLLECTED', // {type, amount}
        REQUEST_MAGNET: 'REQUEST_MAGNET', // null

        // World / Island
        ISLAND_UNLOCKED: 'ISLAND_UNLOCKED', // {gridX, gridY}
        UI_UNLOCK_PROMPT: 'UI_UNLOCK_PROMPT', // {island}
        UI_HIDE_UNLOCK_PROMPT: 'UI_HIDE_UNLOCK_PROMPT', // null
        INTERACTION_OPPORTUNITY: 'INTERACTION_OPPORTUNITY', // {type, target, visible}

        // Economy / Upgrades
        REQUEST_UNLOCK: 'REQUEST_UNLOCK', // {gridX, gridY, cost}
        REQUEST_UPGRADE: 'REQUEST_UPGRADE', // {gridX, gridY, type, cost}
        UPGRADE_PURCHASED: 'UPGRADE_PURCHASED', // {gridX, gridY, type}
        ADD_GOLD: 'ADD_GOLD', // amount
        TRANSACTION_FAILED: 'TRANSACTION_FAILED', // reason

        // UI / System Requests
        REQUEST_REST: 'REQUEST_REST', // null
        HOME_BASE_ENTERED: 'HOME_BASE_ENTERED', // null
        HOME_BASE_EXITED: 'HOME_BASE_EXITED', // null
        FORGE_ENTERED: 'FORGE_ENTERED', // null
        FORGE_EXITED: 'FORGE_EXITED', // null
        UI_FADE_SCREEN: 'UI_FADE_SCREEN', // { onMidpoint }

        // Time & Weather
        TIME_TICK: 'TIME_TICK',           // { totalTime, dayTime, seasonTime, phase }
        DAY_PHASE_CHANGE: 'DAY_PHASE_CHANGE', // { phase, prevPhase }
        SEASON_CHANGE: 'SEASON_CHANGE',   // { season, prevSeason }
        WEATHER_CHANGE: 'WEATHER_CHANGE'  // { type, intensity }
    }
};

window.GameConstants = GameConstants;
