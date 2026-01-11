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
        ISLAND_SIZE: 1024,       // 8 grid cells (8 * 128)
        WATER_GAP: 256,          // 2 grid cells between islands
        BRIDGE_WIDTH: 128,       // 1 grid cell wide
        MAP_PADDING: 2048,       // 16 grid cells - expanded for open world biomes

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
        // Night is now shortest (~10%), Day is longest (~60%)
        PHASES: {
            DAWN: 0.05,  // 1:12 AM - Dawn starts (5% night before this)
            DAY: 0.15,   // 3:36 AM - Full day begins (10% dawn)
            DUSK: 0.75,  // 6:00 PM - Dusk begins (60% day)
            NIGHT: 0.90  // 9:36 PM - Night begins (15% dusk, 10% night until midnight→dawn)
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

    // Biome System (Open World)
    Biome: {
        PATROL_AREA_RADIUS: 300,      // Default wander radius from spawn
        LEASH_DISTANCE: 500,          // Max chase distance before reset
        AGGRO_RANGE: 200,             // Player detection range
        BOSS_RESPAWN_DEFAULT: 300,    // 5 minutes
        GROUP_SPACING: 50,            // Min distance between spawned group members
        PACK_AGGRO_RADIUS: 150,       // Range for pack members to join aggro
        ELITE_SPAWN_CHANCE: 0.05,     // 5% chance for elite variant
        TRANSITION_BLEND_WIDTH: 200   // Gradient border width between biomes
    },

    // Spawning & Population
    Spawning: {
        HOME_GOLD_COUNT: 5,
        HOME_GOLD_AMOUNT_MIN: 20,
        HOME_GOLD_AMOUNT_RND: 30, // + 0-30

        RESOURCE_GRID: {
            COLS: 4,
            SPACING: 128, // Aligned to Grid.CELL_SIZE
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
        HERO_LEVEL_UP: 'HERO_LEVEL_UP', // {level, prevLevel} (03-hero-stats)

        // Damage (06-damage-system)
        DAMAGE_DEALT: 'DAMAGE_DEALT',     // { attacker, target, baseDamage, finalDamage, killed }
        ENEMY_ATTACK: 'ENEMY_ATTACK',     // { attacker, target, damage }
        HERO_DIED: 'HERO_DIED',           // { hero }
        HERO_RESPAWNED: 'HERO_RESPAWNED', // { hero }

        // Boss (09-boss-system)
        BOSS_SPAWNED: 'BOSS_SPAWNED',     // { boss, biomeId, bossType }
        BOSS_KILLED: 'BOSS_KILLED',       // { boss, biomeId, bossType, xpReward, respawnIn }
        BIOME_ENTERED: 'BIOME_ENTERED',   // { biomeId, hero }

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
        WEATHER_CHANGE: 'WEATHER_CHANGE', // { type, intensity }

        // Combat (Open World Biomes)
        ENEMY_ATTACK: 'ENEMY_ATTACK',     // { attacker, target, damage, attackType }
        ENEMY_DAMAGED: 'ENEMY_DAMAGED',   // { enemy, damage, source, remaining }
        ENEMY_DIED: 'ENEMY_DIED',         // { enemy, killer, xpReward, lootTableId, ... }
        ENEMY_RESPAWNED: 'ENEMY_RESPAWNED', // { enemy, biomeId, groupId, waveId }

        // Loot System
        LOOT_DROPPED: 'LOOT_DROPPED'      // { x, y, drops, totalItems }
    }
};

window.GameConstants = GameConstants;
