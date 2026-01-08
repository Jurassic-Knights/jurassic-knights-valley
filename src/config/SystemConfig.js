/**
 * SystemConfig
 * Defines the load order and initialization requirements for all game systems.
 * 
 * priority: Lower numbers load/update first.
 * init: If true, Game.js will call .init(game) on the system.
 * global: The window object key (e.g. 'HeroSystem' -> window.HeroSystem)
 */
const SystemConfig = [
    // --- 0. Infrastructure (Pre-Boot) ---
    { global: 'ResponsiveManager', priority: -10, init: true },
    { global: 'AssetLoader', priority: -5, init: true, isAsync: true }, // Await this
    { global: 'PlatformManager', priority: -1, init: true },

    // --- 0.5 Time & Environment ---
    { global: 'TimeSystem', priority: 1, init: true }, // Needs to run early to update Global Time
    { global: 'WeatherSystem', priority: 2, init: true }, // Depends on Time (conceptually)

    // --- 1. Inputs & Core ---
    { global: 'InputSystem', priority: 0, init: false }, // Self-init

    // --- 2. Data & Economy ---
    { global: 'GameState', priority: 0, init: true }, // Core Persistence
    { global: 'EntityManager', priority: 5, init: true },
    { global: 'EconomySystem', priority: 1, init: true },
    { global: 'CraftingManager', priority: 2, init: true },
    { global: 'QuestManager', priority: 3, init: true },

    // --- 3. World Logic ---
    { global: 'IslandManager', priority: 10, init: true },
    { global: 'SpawnManager', priority: 11, init: true, start: true },
    { global: 'DinosaurSystem', priority: 12, init: false }, // Logic only? Check init
    { global: 'ResourceSystem', priority: 13, init: false }, // Logic only
    { global: 'AmbientSystem', priority: 14, init: false }, // Logic only
    { global: 'InteractionSystem', priority: 15, init: true }, // Pickups/Magnet
    { global: 'RestSystem', priority: 16, init: true }, // Rest Mechanic
    { global: 'IslandUpgrades', priority: 17, init: false }, // Logic helper (init manually or via valid method?) Check usages.
    // IslandUpgrades.init takes (islands), not (game). We might need a wrapper or handle in start().

    // --- 4. Controllers ---
    { global: 'CombatController', priority: 20, init: true },
    { global: 'ForgeController', priority: 21, init: false },

    // --- 5. Visuals & UI (Pre-Render) ---
    { global: 'HomeBase', priority: 30, init: true },
    { global: 'VFXController', priority: 31, init: true },
    { global: 'FogOfWarSystem', priority: 31, init: true }, // Rolling cloud fog
    { global: 'ProgressBarRenderer', priority: 32, init: false }, // Helper
    { global: 'ProgressBarRenderer', priority: 32, init: false }, // Helper
    { global: 'WorldRenderer', priority: 32, init: true }, // Static World
    { global: 'EnvironmentRenderer', priority: 32, init: true }, // Ambient Overlay
    { global: 'GameRenderer', priority: 33, init: true },
    { global: 'UIManager', priority: 40, init: true },
    { global: 'InventoryUI', priority: 41, init: true },

    // --- 6. Entities ---
    { global: 'HeroSystem', priority: 50, init: true },

    // --- 7. Debug Utilities ---
    { global: 'DebugUI', priority: 90, init: true }
];

// Verify standard export for pure JS environment or attach to window
window.SystemConfig = SystemConfig;
