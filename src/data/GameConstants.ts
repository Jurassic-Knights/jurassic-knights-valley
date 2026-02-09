/**
 * GameConstants - Centralized configuration for the game
 *
 * Contains magic numbers, configuration settings, and balance values.
 */
const GameConstants = {
    // Grid System
    Grid: {
        CELL_SIZE: 128, // Main gameplay unit (pixels)
        SUB_TILE_SIZE: 32, // Visual detail (4x4 per cell)
        ISLAND_CELLS: 8 // Cells per island (1024/128)
    },

    // World / Island Configuration
    World: {
        // Full world dimensions (30k x 30k for all biomes)
        TOTAL_WIDTH: 30000,
        TOTAL_HEIGHT: 30000,
        /** When IslandManager/gameRenderer unavailable, spawn hero at world center. */
        DEFAULT_SPAWN_X: 15000,
        DEFAULT_SPAWN_Y: 15000,

        // Ironhaven offset (where the island grid starts in world space)
        IRONHAVEN_OFFSET_X: 10000,
        IRONHAVEN_OFFSET_Y: 10000,

        // Existing island grid settings (used within Ironhaven)
        GRID_COLS: 3,
        GRID_ROWS: 3,
        ISLAND_SIZE: 1024, // 8 grid cells (8 * 128)
        WATER_GAP: 256, // 2 grid cells between islands
        BRIDGE_WIDTH: 128, // 1 grid cell wide
        MAP_PADDING: 2048, // 16 grid cells - expanded for open world biomes

        // Wall boundaries for playable area
        WALL_WIDTH: 85, // Horizontal wall thickness
        WALL_PAD_TOP: 50, // Vertical wall thickness (top)
        WALL_PAD_BOTTOM: 135 // Vertical wall thickness (bottom)
    },

    // Unlock Costs (by grid index: row * cols + col)
    UnlockCosts: [
        0, // Home Outpost (0,0) - free
        100, // Quarry Fields (1,0)
        250, // Iron Ridge (2,0)
        100, // Dead Woods (0,1)
        200, // Crossroads (1,1)
        350, // Scrap Yard (2,1)
        250, // Mud Flats (0,2)
        350, // Bone Valley (1,2)
        500 // The Ruins (2,2)
    ],

    // Game Core Settings
    Core: {
        TICK_RATE_MS: 50, // 20 ticks per second
        INITIAL_GOLD: 100000
    },

    // Hero Settings
    Hero: {
        SPEED: 1400,
        MAX_HEALTH: 1000,
        RESPAWN_DELAY_MS: 2000,
        STAMINA_EMIT_THROTTLE: 100
    },

    // Combat Settings
    Combat: {
        DEFAULT_GUN_RANGE: 1000, // Was 500 in some fallbacks
        DEFAULT_MINING_RANGE: 125, // Was 75 in some fallbacks
        DEFAULT_DAMAGE: 10,
        DEFAULT_ATTACK_RATE: 1,
        DEFAULT_ATTACK_RANGE: 100,
        ATTACK_COOLDOWN: 0.5,
        DEFAULT_PATROL_RADIUS: 150,
        ARMOR_FORMULA_DIVISOR: 100,
        DEFAULT_MAX_HEALTH_NPC: 100,
        /** Fallback XP when entity has no xpReward (e.g. enemy death). */
        XP_REWARD_FALLBACK: 10,
        /** Damage amount above which extra VFX (e.g. blood drops) play. */
        DAMAGE_VFX_THRESHOLD: 10
    },

    // Damage / Hit Feedback (floating text, VFX triggers)
    Damage: {
        /** Y offset (pixels above hit position) for floating damage text. */
        FLOATING_TEXT_Y_OFFSET: 20
    },

    // Equipment Configuration (Single Source of Truth)
    Equipment: {
        // Standard armor/accessory slots
        ARMOR_SLOTS: ['head', 'body', 'hands', 'legs', 'accessory', 'accessory2'],
        // Weapon slots (per weapon set)
        WEAPON_SLOTS: ['hand1', 'hand2'],
        // Tool slots
        TOOL_SLOTS: ['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing'],
        // All slots combined
        ALL_SLOTS: ['head', 'body', 'hands', 'legs', 'accessory', 'accessory2', 'hand1', 'hand2'],
        // Slot categories for filtering
        SLOT_CATEGORIES: {
            armor: ['head', 'body', 'hands', 'legs', 'accessory'],
            weapon: ['hand1', 'hand2'],
            tool: ['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing']
        }
    },

    // Weapon Configuration (Single Source of Truth)
    Weapons: {
        RANGED_TYPES: [
            'rifle',
            'pistol',
            'submachine_gun',
            'machine_gun',
            'flamethrower',
            'shotgun',
            'sniper_rifle',
            'bazooka'
        ],
        MELEE_TYPES: [
            'sword',
            'greatsword',
            'axe',
            'war_axe',
            'mace',
            'war_hammer',
            'lance',
            'halberd',
            'spear',
            'flail',
            'knife'
        ],
        // Combined for quick lookup
        ALL_TYPES: [
            'rifle',
            'pistol',
            'submachine_gun',
            'machine_gun',
            'flamethrower',
            'shotgun',
            'sniper_rifle',
            'bazooka',
            'sword',
            'greatsword',
            'axe',
            'war_axe',
            'mace',
            'war_hammer',
            'lance',
            'halberd',
            'spear',
            'flail',
            'knife'
        ]
    },

    // Interaction Radii
    Interaction: {
        REST_AREA_RADIUS: 400,
        FORGE_AREA_RADIUS: 200,
        MERCHANT_RADIUS: 140,
        RESOURCE_PICKUP_RADIUS: 145,
        DROPPED_ITEM_PICKUP_RADIUS: 140
    },

    // Time Configuration
    Time: {
        REAL_SECONDS_PER_GAME_DAY: 300, // 5 minutes per day cycle
        // Phases as normalized day percentages (0.0 - 1.0)
        // Night is now shortest (~10%), Day is longest (~60%)
        PHASES: {
            DAWN: 0.05, // 1:12 AM - Dawn starts (5% night before this)
            DAY: 0.15, // 3:36 AM - Full day begins (10% dawn)
            DUSK: 0.75, // 6:00 PM - Dusk begins (60% day)
            NIGHT: 0.9 // 9:36 PM - Night begins (15% dusk, 10% night until midnight→dawn)
        },
        /** Debug override dayTime values (e.g. setPhaseOverride). */
        DEBUG_PHASE_OVERRIDES: {
            dawn: 0.22,
            day: 0.5,
            dusk: 0.77,
            night: 0.05
        },
        SEASONS: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'],
        DAYS_PER_SEASON: 2, // 30 seconds per season (TESTING)
        WEATHER_DECAY_RATE: 5000 // Rate at which weather check timer decrements
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
        PROP_SPAWN_PADDING: 70,
        HEALTH_BAR_WIDTH: 120,
        PROGRESS_BAR_WIDTH: 100,
        RESOLVE_PER_PIP: 5,
        ANIMATION_SHATTER_MS: 900
    },

    Rendering: {
        WHITE_BG_THRESHOLD: 250
    },

    /** Collision debug overlay (renderDebug). */
    CollisionDebug: {
        /** Chance per frame to log (0–1) to reduce spam. */
        LOG_SAMPLE_RATE: 0.05,
        /** Scale for direction vector arrow (px per unit input). */
        DIRECTION_VECTOR_SCALE: 20
    },

    /** Component defaults (single source when config omitted). No runtime fallbacks. */
    Components: {
        INVENTORY_CAPACITY: 20,
        COLLISION_IS_TRIGGER: false,
        COLLISION_ENABLED: true
    },

    // AI Behavior
    AI: {
        WANDER_TIMER_MIN: 2000,
        WANDER_TIMER_MAX: 5000,
        PATHFINDING_GRID_SIZE: 64,
        PATHFINDING_MAX_ITERATIONS: 500,
        PATHFINDING_CACHE_TIMEOUT: 2000,
        DROP_SPAWN_DISTANCE: 150,
        DROP_SPAWN_VARIANCE: 100,
        PATROL_AREA_RADIUS: 400,
        PATH_RECALC_INTERVAL_MS: 1000,
        PATH_TARGET_THRESHOLD: 100,
        PATH_ARRIVAL_DIST: 20,
        PATH_WAYPOINT_DIST: 30,
        PATH_LEAD_DIST: 50,
        MOVE_DIRECT_ARRIVAL: 10
    },

    // Timing & Durations (centralized timer values)
    Timing: {
        // UI Feedback
        FLOATING_TEXT_DURATION: 2000,
        FLOATING_TEXT_Y_OFFSET: 50,
        UI_FEEDBACK_DELAY: 1000,
        BUTTON_RESET_DELAY: 1000,
        SCREEN_FADE_DURATION: 500,
        UI_CAPTURE_DELAY: 500,
        BORDER_FLASH_DURATION: 200,

        // VFX Animation Durations
        RIPPLE_DURATION: 600,
        FLASH_DURATION: 300,
        IMPACT_DURATION: 2500,

        // Tween Defaults
        SHAKE_DURATION: 300,
        PULSE_DURATION: 200,

        // System Timeouts
        ELEMENT_REMOVE_DELAY: 1000,
        SCROLL_ANIMATION_MS: 300,
        CACHE_CLEAR_TIMEOUT: 2000,
        ZONE_SECURED_DISPLAY: 3000,
        DEBUG_NOTIFICATION_DURATION: 5000,

        // Conversion Factor
        MS_PER_SECOND: 1000,

        // Boss / Spawn delays
        BOSS_SPAWN_DELAY_MS: 1000,
        /** Magnet completion VFX: delay (ms) before collapse phase. */
        MAGNET_PHASE_DELAY_MS: 150,
        /** Zone secured floating text: Y offset above position. */
        ZONE_SECURED_Y_OFFSET: 80
    },

    // Entity Sizes
    Entities: {
        TILE_SIZE: 128,
        MERCHANT_SIZE: 186,
        CRAFTING_FORGE_SIZE: 250
    },

    // Boss defaults (fallbacks when config missing)
    Boss: {
        /** Default level when biome has no levelRange. */
        DEFAULT_LEVEL: 10,
        /** Fallback spawn offsets from Ironhaven origin (World.IRONHAVEN_OFFSET_* + these). */
        SPAWN_OFFSETS: {
            grasslands: { x: 5500, y: 3000 },
            tundra: { x: 3000, y: 5500 },
            desert: { x: 5500, y: 5500 },
            badlands: { x: 3000, y: 3000 },
            default: { x: 3500, y: 3500 }
        },
        /** Y offset (px above entity) for boss name plate. */
        NAME_PLATE_Y_OFFSET: 35
    },

    // Enemy entity defaults (fallbacks when entity config missing)
    Enemy: {
        DEFAULT_HEALTH: 30,
        DEFAULT_DAMAGE: 5,
        DEFAULT_ATTACK_RANGE: 100,
        DEFAULT_SPEED: 80,
        DEFAULT_XP_REWARD: 10,
        DEFAULT_RESPAWN_TIME: 60,
        FRAME_INTERVAL: 200,
        ELITE_FALLBACK_HEALTH: 50,
        DEFAULT_SIZE: 192,
        WANDER_INTERVAL_MIN: 3000,
        WANDER_INTERVAL_VARIANCE: 2000
    },

    // Dinosaur (herbivore) defaults
    Dinosaur: {
        DEFAULT_SIZE: 150,
        DEFAULT_MAX_HEALTH: 60,
        DEFAULT_RESPAWN_TIME: 30,
        DEFAULT_STAMINA: 100,
        DEFAULT_SPEED: 30,
        DEFAULT_XP_REWARD: 10,
        WANDER_INTERVAL_MIN: 2000,
        WANDER_INTERVAL_MAX: 5000,
        FRAME_INTERVAL: 200
    },

    // Hero defaults (supplement to Hero.*)
    HeroDefaults: {
        XP_TO_NEXT_LEVEL: 100,
        XP_SCALING: 1.5,
        FOOTSTEP_INTERVAL: 0.15,
        DEFAULT_ATTACK: 10,
        MAX_STAMINA_FALLBACK: 100,
        MAX_HEALTH_FALLBACK: 100
    },

    // Resource (nodes) defaults
    Resource: {
        HEALTH_BAR_WIDTH: 100,
        HEALTH_BAR_Y_OFFSET: 18,
        VFX_SPARK_LIFETIME: 300,
        T1_FAST_RESPAWN: 15,
        DEFAULT_BASE_RESPAWN: 30
    },

    // Progression / leveling
    Progression: {
        XP_BASE: 100,
        XP_SCALING: 1.5,
        LEVEL_UP_FLOATING_TEXT_LIFETIME: 1000
    },

    // Crafting / Forge
    Crafting: {
        FORGE_SLOT_UNLOCK_COST: 1000
    },

    // Quest
    Quest: {
        NEXT_QUEST_DELAY_MS: 2000
    },

    // Island upgrades (base costs and caps)
    IslandUpgrades: {
        BASE_COSTS: { resourceSlots: 100, autoChance: 150, respawnTime: 75 },
        CAPS: { resourceSlots: 15, autoChance: 80, respawnTime: 100 },
        DEFAULT_BASE_COST: 100
    },

    // Dropped item magnet
    DroppedItem: {
        MAGNET_SPEED: 100,
        MAGNET_ACCELERATION: 500
    },

    // Enemy render (health bar, elite pulse)
    EnemyRender: {
        HEALTH_BAR_WIDTH: 50,
        HEALTH_BAR_Y_OFFSET: 15,
        ELITE_PULSE_MS: 200,
        ELITE_ALPHA_BASE: 0.3,
        ELITE_ALPHA_AMPLITUDE: 0.1
    },

    // Biome System (Open World)
    Biome: {
        PATROL_AREA_RADIUS: 300, // Default wander radius from spawn
        LEASH_DISTANCE: 500, // Max chase distance before reset
        AGGRO_RANGE: 200, // Player detection range
        BOSS_RESPAWN_DEFAULT: 300, // 5 minutes
        GROUP_SPACING: 50, // Min distance between spawned group members
        PACK_AGGRO_RADIUS: 150, // Range for pack members to join aggro
        /** Distance within spawn point to consider "arrived" (leash return). */
        LEASH_ARRIVAL_THRESHOLD: 10,
        /** Speed multiplier when returning to spawn (leash). */
        LEASH_RETURN_SPEED_MULTIPLIER: 1.5,
        ELITE_SPAWN_CHANCE: 0.05, // 5% chance for elite variant
        TRANSITION_BLEND_WIDTH: 200, // Gradient border width between biomes
        ROAD_SPEED_MULTIPLIER: 1.3 // 30% speed boost on roads
    },

    // Ground Texture System (01-31-2026)
    Ground: {
        CATEGORIES: {
            BASE: ['grass', 'dirt', 'rock', 'gravel', 'sand'],
            OVERGROWN: ['leaves', 'forest_floor', 'moss', 'roots', 'flowers'],
            INTERIOR: ['planks', 'cobblestone', 'flagstone', 'concrete', 'metal_plate'],
            VERTICAL: ['cliff_rock', 'earth_bank'],
            DAMAGE: ['scorched', 'churned', 'cratered']
        },
        // Variance Counts (Max variants per material type)
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
            AMOUNT_RND: 0,
            /** Max rows for grid layout (e.g. ceil(MAX_ROWS / COLS)). */
            MAX_ROWS: 15
        },

        /** Edge spacing for organic spawn patterns (e.g. tree rings). */
        EDGE_SPACING: 100,
        /** Min distance between spawn points (e.g. trees). */
        MIN_SPAWN_DISTANCE: 50,
        /** Max placement attempts per tree before skipping. */
        TREE_PLACEMENT_MAX_ATTEMPTS: 300,
        /** Force placement attempts (higher when close to target count). */
        TREE_PLACEMENT_FORCE_ATTEMPTS: 500,
        /** Buffer (px) beyond rest area radius to avoid spawning too close. */
        REST_AREA_BUFFER: 50,

        /** Home-island tree ring: target tree count. */
        RESOURCE_TREE_TARGET_COUNT: 25,
        /** Home-island tree ring: position jitter (px). */
        RESOURCE_TREE_JITTER: 25,
        /** Home-island tree ring: max random placement attempts. */
        RESOURCE_TREE_MAX_ATTEMPTS: 300,
        /** Home-island tree ring: max force-placement attempts. */
        RESOURCE_TREE_FORCE_ATTEMPTS: 500,

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
            MIN_DIST: 80,
            /** Max attempts to find valid position for a prop cluster/item. */
            FIND_POSITION_MAX_ATTEMPTS: 15,
            /** Bridge padding for scattered items (px). */
            ITEM_BRIDGE_PADDING: 120,
            /** Default prop sprite size (px). */
            DEFAULT_WIDTH: 160,
            DEFAULT_HEIGHT: 160,
            /** Default padding for bridge visual check (px). */
            BRIDGE_PADDING_DEFAULT: 100,
            /** Fallback water/spacing gap when island manager value not available. */
            WATER_GAP_FALLBACK: 50
        },

        /** Drop scatter: base distance (px) + random variance for spawnDrop. */
        DROP_SCATTER_BASE: 40,
        DROP_SCATTER_VARIANCE: 40,

        /** Biome population: padding from bounds edge (px). */
        BIOME_POPULATE_PADDING: 100,
        /** Biome population: spawn weight / this = group count. */
        BIOME_GROUP_WEIGHT_DIVISOR: 20,

        /** Enemy test spawn: offset north of home (px). */
        ENEMY_TEST_OFFSET_NORTH: 200,

        MERCHANT: {
            PADDING: 70,
            DEFAULT_OFFSET: 50
        }
    },

    // Player Inventory Defaults
    PlayerResources: {
        INITIAL_GOLD: 100,
        INITIAL_SCRAPS: 10,
        INITIAL_MINERALS: 10,
        INITIAL_WOOD: 10,
        INITIAL_FOOD: 10
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
        XP_GAINED: 'XP_GAINED', // {hero, amount, total, level}

        // Damage (06-damage-system)
        DAMAGE_DEALT: 'DAMAGE_DEALT', // { attacker, target, baseDamage, finalDamage, killed }
        ENEMY_ATTACK: 'ENEMY_ATTACK', // { attacker, target, damage }
        HERO_DIED: 'HERO_DIED', // { hero }
        HERO_RESPAWNED: 'HERO_RESPAWNED', // { hero }

        // Entity Events
        ENTITY_ADDED: 'ENTITY_ADDED', // { entity }
        ENTITY_REMOVED: 'ENTITY_REMOVED', // { entity }
        ENTITY_MOVE_REQUEST: 'ENTITY_MOVE_REQUEST', // { entity, dx, dy } — CollisionSystem applies
        ENTITY_DAMAGED: 'ENTITY_DAMAGED', // { entity, amount, source, type }
        ENTITY_DIED: 'ENTITY_DIED', // { entity, killer }
        ENTITY_HEALTH_CHANGE: 'ENTITY_HEALTH_CHANGE', // { entity, current, max }

        // Boss (09-boss-system)
        BOSS_SPAWNED: 'BOSS_SPAWNED', // { boss, biomeId, bossType }
        BOSS_KILLED: 'BOSS_KILLED', // { boss, biomeId, bossType, xpReward, respawnIn }
        BIOME_ENTERED: 'BIOME_ENTERED', // { biomeId, hero }

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
        REQUEST_STAMINA_RESTORE: 'REQUEST_STAMINA_RESTORE', // { hero, amount }
        VFX_PLAY_FOREGROUND: 'VFX_PLAY_FOREGROUND', // { x, y, options }
        HOME_BASE_ENTERED: 'HOME_BASE_ENTERED', // null
        HOME_BASE_EXITED: 'HOME_BASE_EXITED', // null
        FORGE_ENTERED: 'FORGE_ENTERED', // null
        FORGE_EXITED: 'FORGE_EXITED', // null
        UI_FADE_SCREEN: 'UI_FADE_SCREEN', // { onMidpoint }

        // Time & Weather
        TIME_TICK: 'TIME_TICK', // { totalTime, dayTime, seasonTime, phase }
        DAY_PHASE_CHANGE: 'DAY_PHASE_CHANGE', // { phase, prevPhase }
        SEASON_CHANGE: 'SEASON_CHANGE', // { season, prevSeason }
        WEATHER_CHANGE: 'WEATHER_CHANGE', // { type, intensity }

        // Combat (Open World Biomes)
        //ENEMY_ATTACK: 'ENEMY_ATTACK', // (duplicate - already defined above)
        ENEMY_DAMAGED: 'ENEMY_DAMAGED', // { enemy, damage, source, remaining }
        ENEMY_DIED: 'ENEMY_DIED', // { enemy, killer, xpReward, lootTableId, ... }
        ENEMY_KILLED: 'ENEMY_KILLED', // { enemy, xpReward, lootTableId } - alias for ENEMY_DIED
        ENEMY_AGGRO: 'ENEMY_AGGRO', // { enemy, target }
        ENEMY_LEASH: 'ENEMY_LEASH', // { enemy }
        ENEMY_RESPAWNED: 'ENEMY_RESPAWNED', // { enemy, biomeId, groupId, waveId }

        // Loot System
        LOOT_DROPPED: 'LOOT_DROPPED', // { x, y, drops, totalItems }

        // Collision Events
        COLLISION_START: 'COLLISION_START', // { a, b }
        COLLISION_END: 'COLLISION_END' // { a, b }

        // Generic Entity Events (used by AI system)
        // ENTITY_DAMAGED & ENTITY_DIED defined above
    }
};

// ES6 Module Export
export { GameConstants };

/**
 * getConfig() - HMR-safe accessor for GameConstants
 *
 * Use this instead of importing GameConstants directly to get
 * hot-reloadable config values that update without page refresh.
 *
 * Usage: const speed = getConfig().Hero.SPEED;
 */
export function getConfig(): typeof GameConstants {
    // Get tunable values directly from GameConfig's HMR-updated window reference
    // FIXED: Properly read the config object (was boolean short-circuit bug)
    const tunables =
        typeof window !== 'undefined' && window.__GAME_CONFIG__
            ? (window as Window & { __GAME_CONFIG__?: Record<string, unknown> }).__GAME_CONFIG__
            : {};
    const base =
        typeof window !== 'undefined' && window.__GAME_CONSTANTS__
            ? window.__GAME_CONSTANTS__
            : GameConstants;

    // Deep merge WeaponDefaults (nested objects)
    const mergedWeaponDefaults = { ...(base as { WeaponDefaults?: Record<string, unknown> }).WeaponDefaults };
    if (tunables.WeaponDefaults) {
        for (const weapon of Object.keys(tunables.WeaponDefaults)) {
            mergedWeaponDefaults[weapon] = {
                ...mergedWeaponDefaults[weapon],
                ...tunables.WeaponDefaults[weapon]
            };
        }
    }

    // Build result with tunable sections reading DIRECTLY from tunables (not merging)
    // This ensures HMR updates are always reflected
    return {
        ...base,
        // For tunable sections: use tunables if they exist, otherwise fall back to base
        Hero: tunables.Hero || base.Hero,
        Combat: tunables.Combat || base.Combat,
        Interaction: tunables.Interaction || base.Interaction,
        AI: tunables.AI || base.AI,
        Spawning: tunables.Spawning || base.Spawning,
        Time: tunables.Time || base.Time,
        BodyTypes: tunables.BodyTypes || (base as { BodyTypes?: Record<string, unknown> }).BodyTypes,
        WeaponDefaults: mergedWeaponDefaults,
        PlayerResources: tunables.PlayerResources || (base as { PlayerResources?: Record<string, unknown> }).PlayerResources
    } as typeof GameConstants;
}

// ============================================
// VITE HMR - Hot reload without full page refresh
// ============================================

// Store GameConstants on window so it persists across HMR updates
declare global {
    interface Window {
        __GAME_CONSTANTS__: typeof GameConstants;
    }
}

// On first load, store reference. On HMR, update the stored reference.
if (typeof window !== 'undefined') {
    if (!window.__GAME_CONSTANTS__) {
        window.__GAME_CONSTANTS__ = GameConstants;
    } else {
        // HMR update - merge new values into the persisted object
        const persisted = window.__GAME_CONSTANTS__;
        for (const key of Object.keys(GameConstants)) {
            const typedKey = key as keyof typeof GameConstants;
            if (
                typeof GameConstants[typedKey] === 'object' &&
                !Array.isArray(GameConstants[typedKey])
            ) {
                // Safe to merge objects
                const target = persisted[typedKey] as Record<string, unknown>;
                const source = GameConstants[typedKey] as Record<string, unknown>;
                Object.assign(target, source);
            } else {
                // Primitives or Arrays: overwrite
                (persisted as Record<string, unknown>)[typedKey] = GameConstants[typedKey];
            }
        }
        console.log('[HMR] GameConstants updated in-place');
    }
}

if (import.meta.hot) {
    import.meta.hot.accept();
}
