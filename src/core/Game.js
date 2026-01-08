/**
 * Game - Main game loop and orchestration
 * 
 * Owner: Director
 */

class Game {
    constructor() {
        this.isRunning = false;
        this.lastTime = 0;
        this.tickRate = GameConstants.Core.TICK_RATE_MS;
        this.accumulator = 0;

        // Game objects
        // Game objects
        this.hero = null;
        // Entities are now managed by EntityManager
        // this.resources = [];
        // this.dinosaurs = [];
        // this.droppedItems = [];

        // Expose instance globally for UI/Manager access
        window.GameInstance = this;

        // Systems list for update loop
        this.systems = [];
    }

    /**
     * Get a registered system
     * @param {string} name 
     */
    getSystem(name) {
        if (window.Registry) {
            const sys = Registry.get(name);
            if (sys) return sys;
        }
        return window[name]; // Fallback if not in registry (or not yet registered)
    }

    /**
     * Initialize the game
     */
    /**
     * Initialize the game
     */
    async init() {
        console.log('[Game] Initializing...');

        // 1. Sort Systems by Priority
        // This ensures AssetLoader (-5) runs before GameRenderer (33)
        if (!window.SystemConfig) {
            console.error('[Game] SystemConfig not found! Critical failure.');
            return false;
        }

        const sortedSystems = [...SystemConfig].sort((a, b) => a.priority - b.priority);

        // 2. Bootloader Loop (Init Phase)
        console.log(`[Game] Booting ${sortedSystems.length} systems...`);

        for (const config of sortedSystems) {
            const name = config.global;
            let sys = window.Registry ? Registry.get(name) : window[name];
            if (!sys) sys = window[name]; // Fallback

            if (!sys) {
                // console.warn(`[Game] System not found: ${name}`);
                continue;
            }

            // Initialization
            if (config.init) {
                if (typeof sys.init === 'function') {
                    // Check for Async
                    if (config.isAsync) {
                        console.log(`[Game] Awaiting async init: ${name}`);
                        await sys.init(this);
                    } else {
                        sys.init(this);
                    }
                    console.log(`[Game] Initialized ${name}`);
                } else {
                    console.warn(`[Game] System ${name} missing init() method`);
                }
            }

            // Register for Update Loop
            if (typeof sys.update === 'function') {
                this.systems.push(sys);
            }
        }

        // 3. Post-Init Phase (Special Cases)

        // Tween (External Lib) verification
        if (window.Tween && !this.systems.includes(Tween)) this.systems.push(Tween);

        // IslandUpgrades (Requires IslandManager data, so init here or in start phase)
        if (window.IslandUpgrades && window.IslandManager) {
            // Check if IslandUpgrades was already init in loop? 
            // Currently SystemConfig says init:false for it because it needs args.
            IslandUpgrades.init(IslandManager.islands);
            console.log('[Game] Initialized IslandUpgrades');
        }

        // Create Hero (Now handled by SpawnManager.start())
        // this.createHero();

        // 4. Start Phase (Logic that needs everything ready)
        console.log('[Game] Starting systems...');
        for (const config of sortedSystems) {
            if (config.start) {
                const sys = window[config.global] || (window.Registry && Registry.get(config.global));
                if (sys && typeof sys.start === 'function') {
                    sys.start();
                    console.log(`[Game] Started ${config.global}`);
                }
            }
        }

        // Merchant UI Init (Could be moved to SystemConfig start phase or init)
        if (window.MerchantUI) MerchantUI.init();

        // 5. Start Phase (Logic that needs everything ready)
        // ... (Already handled above)

        // Event Listeners (Could be moved to a GameEventHandler system)
        // ISLAND_UNLOCKED now handled by SpawnManager directly

        console.log('[Game] Boot Complete.');
        return true;
    }

    // Rest logic migrated to RestSystem.js

    /**
     * Create the player hero
     */


    /**
     * Initialize a newly unlocked island
     */
    // initializeIsland(gridX, gridY) - Handled by SpawnManager via EventBus

    /**
     * Refresh resources on a specific island (e.g. after upgrade)
     */
    // refreshIslandResources(gridX, gridY) - Handled by SpawnManager via EventBus / Direct Call

    /**
     * Update respawn timers for all entities on an island
     */
    // updateIslandRespawnTimers(gridX, gridY) - Handled by SpawnManager via EventBus / Direct Call

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop();
        console.log('[Game] Started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        console.log('[Game] Stopped');
    }

    /**
     * Main game loop
     */
    loop() {
        if (!this.isRunning) return;

        // The original `loop` method was the main game loop.
        // The new structure introduces `gameLoop` as the main recursive loop.
        // This `loop` method now acts as an initializer for the game loop.
        // The `deltaTime` and `currentTime` calculation here seems to be a remnant from the old loop structure
        // and is not used in the new `loop`'s logic before calling `gameLoop`.
        // It's safer to remove it if it's not used, but the instruction includes it.
        // I will keep it as per instruction, even if it's not directly used in this specific block.
        const currentTime = performance.now();
        // Removed redundant CraftingManager.init()

        // These lines (`this.lastTime = performance.now(); this.isRunning = true;`)
        // are typically handled by the `start()` method which calls `loop()`.
        // Including them here might reset `lastTime` unnecessarily or re-set `isRunning` which is already true.
        // However, following the instruction faithfully.
        this.lastTime = performance.now();
        this.isRunning = true;
        this.gameLoop(this.lastTime);
    }

    /**
     * Main game loop
     * @param {number} timestamp
     */
    gameLoop(timestamp) {
        if (!this.isRunning) return;

        // Calculate delta time in milliseconds (compatible with existing systems)
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    /**
     * Update game logic (fixed timestep)
     * @param {number} dt - Delta time in ms
     */
    update(dt) {
        // 1. Update Registered Systems
        for (const system of this.systems) {
            system.update(dt);
        }

        // 2. Update Entities (via EntityManager)
        if (window.EntityManager) {
            EntityManager.update(dt);
        }

        // 3. Update Hero Specifics (Events/Triggers)
        // Handled by HeroSystem now
        // if (this.hero) {
        //    this.handleHeroEvents();
        // }

        // 4. Update Dropped Items (Handled by InteractionSystem)
        // this.updateItemInteractions(dt);

        // 5. UI Specific Checks (Handled by InteractionSystem)
        // this.updateUITriggers();
    }

    /**
     * Render updates (variable timestep)
     */
    render() {
        // 3. Render Game World (includes BG VFX)
        if (window.GameRenderer) {
            GameRenderer.render();
        }

        // 4. Render Foreground VFX (Overlay Layer)
        if (window.VFXController) {
            VFXController.renderForeground();
        }

        // VFX are now rendered INSIDE GameRenderer for true z-layering
    }
}

// Export singleton
window.GameInstance = new Game();
