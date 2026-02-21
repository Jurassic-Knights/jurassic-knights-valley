/**
 * SystemConfig
 * Defines the load order and initialization requirements for all game systems.
 *
 * priority: Lower numbers load/update first.
 * init: If true, Game will call .init(game) on the system.
 * global: The window object key (e.g. 'HeroSystem' -> HeroSystem)
 * critical: If true, init failure of this system causes Game.init() to return false (game will not start).
 */
export interface SystemConfigEntry {
    global: string;
    priority: number;
    init: boolean;
    isAsync?: boolean;
    start?: boolean;
    /** When true, init failure aborts game start (main.ts shows error UI). */
    critical?: boolean;
}

const SystemConfig: SystemConfigEntry[] = [
    // --- 0. Infrastructure (Pre-Boot) ---
    { global: 'ResponsiveManager', priority: -10, init: true },
    { global: 'EntityLoader', priority: -6, init: true, isAsync: true, critical: true }, // Load entities FIRST
    { global: 'AssetLoader', priority: -5, init: true, isAsync: true, critical: true },  // Then preload images
    { global: 'PlatformManager', priority: -1, init: true },

    // --- 0.5 Time & Environment ---
    { global: 'TimeSystem', priority: 1, init: true }, // Needs to run early to update Global Time
    { global: 'WeatherSystem', priority: 2, init: true }, // Depends on Time (conceptually)

    // --- 1. Inputs & Core ---
    { global: 'InputSystem', priority: 0, init: false }, // Self-init

    // --- 2. Data & Economy ---
    { global: 'GameState', priority: 0, init: true }, // Core Persistence
    { global: 'CollisionSystem', priority: 5, init: true, critical: true }, // Physics (Before AI/Movement)
    { global: 'EntityManager', priority: 5, init: true, critical: true },
    { global: 'EconomySystem', priority: 1, init: true },
    { global: 'CraftingManager', priority: 2, init: true },
    { global: 'QuestManager', priority: 3, init: true },

    // --- 3. World Logic ---
    { global: 'BiomeManager', priority: 9, init: true }, // Biome boundaries & roads
    { global: 'WorldManager', priority: 10, init: true, critical: true }, // WorldManager registered as WorldManager
    { global: 'MapObjectSpawner', priority: 11, init: true, isAsync: true },
    { global: 'DinosaurSystem', priority: 12, init: true }, // Herbivore AI & loot
    { global: 'EnemySystem', priority: 12, init: true }, // Enemy AI
    { global: 'ResourceSystem', priority: 13, init: false }, // Logic only
    { global: 'AmbientSystem', priority: 14, init: false }, // Logic only
    { global: 'InteractionSystem', priority: 15, init: true }, // Pickups/Magnet
    { global: 'RestSystem', priority: 16, init: true }, // Rest Mechanic
    { global: 'DamageSystem', priority: 19, init: true }, // (06-damage-system)
    { global: 'ProgressionSystem', priority: 19, init: true }, // XP/Leveling (08-leveling-system)

    // --- 4. Controllers ---
    { global: 'CombatController', priority: 20, init: true },
    { global: 'ForgeController', priority: 21, init: false },
    { global: 'BossSystem', priority: 23, init: true }, // (09-boss-system)

    // --- 5. Visuals & UI (Pre-Render) ---
    { global: 'HomeBase', priority: 30, init: true },
    { global: 'VFXController', priority: 31, init: true },
    { global: 'FogOfWarSystem', priority: 31, init: true }, // Rolling cloud fog
    { global: 'ProgressBarRenderer', priority: 32, init: false }, // Helper
    { global: 'WorldRenderer', priority: 32, init: true }, // Static World
    { global: 'RoadRenderer', priority: 32, init: true }, // Spline roads
    { global: 'EnvironmentRenderer', priority: 32, init: true }, // Ambient Overlay
    { global: 'LightingSystem', priority: 32, init: true }, // Dynamic Lights
    { global: 'GameRenderer', priority: 33, init: true, critical: true },
    { global: 'UIManager', priority: 40, init: true },
    { global: 'InventoryUI', priority: 41, init: true },
    { global: 'MinimapSystem', priority: 52, init: true }, // After HeroSystem (50) so hero position is current

    // --- 6. Entities ---
    { global: 'HeroSystem', priority: 50, init: true },
    { global: 'HeroVisualsSystem', priority: 51, init: true },

    // --- 7. Debug Utilities ---
    { global: 'DebugUI', priority: 90, init: true }
];

export { SystemConfig };
