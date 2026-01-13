/**
 * SpawnManagerService - Orchestrates entity spawning via specialized spawners
 * 
 * This is the main SpawnManager, now slimmed down to delegate to:
 * - PropSpawner: Decorative props in water gaps
 * - ResourceSpawner: Resources, dinosaurs, trees
 * - EnemySpawner: Enemies in biomes
 * - DropSpawner: Dropped items
 * 
 * Owner: Director / Level Architect
 */

class SpawnManagerService {
    constructor() {
        this.game = null;
        this.merchants = [];

        // Sub-spawners (initialized in init())
        this.propSpawner = null;
        this.resourceSpawner = null;
        this.enemySpawner = null;
        this.dropSpawner = null;

        console.log('[SpawnManager] Initialized Service');
    }

    /**
     * Initialize with game reference
     */
    init(game) {
        this.game = game;

        // Initialize sub-spawners
        if (window.PropSpawner) this.propSpawner = new PropSpawner(this);
        if (window.ResourceSpawner) this.resourceSpawner = new ResourceSpawner(this);
        if (window.EnemySpawner) this.enemySpawner = new EnemySpawner(this);
        if (window.DropSpawner) this.dropSpawner = new DropSpawner(this);

        this.initListeners();
        console.log('[SpawnManager] Initialized');
    }

    initListeners() {
        if (window.EventBus) {
            EventBus.on(GameConstants.Events.ISLAND_UNLOCKED, (data) => this.initializeIsland(data.gridX, data.gridY));
        }
    }

    /**
     * Update loop (required for System registration)
     */
    update(dt) {
        // Mostly event-driven
    }

    /**
     * Start lifecycle hook (called after all systems are initialized)
     */
    start() {
        if (!this.game) return;

        console.log('[SpawnManager] Starting lifecycle...');
        this.spawnHero();

        if (this.resourceSpawner) {
            this.resourceSpawner.spawnHomeIslandTrees();
            this.resourceSpawner.spawnResources();
        }

        this.spawnMerchants();

        // Props disabled for performance
        // if (this.propSpawner) this.propSpawner.spawnProps();

        // Spawn test enemies in biomes
        if (this.enemySpawner) {
            this.enemySpawner.spawnTestEnemies();
        }
    }

    // ============================================
    // HERO SPAWNING
    // ============================================

    spawnHero() {
        if (!window.Hero || !this.game) return;

        let spawnX, spawnY;
        const islandManager = this.game.getSystem('IslandManager');

        if (islandManager) {
            const spawn = islandManager.getHeroSpawnPosition();
            spawnX = spawn.x;
            spawnY = spawn.y;
        } else {
            const gameRenderer = this.game.getSystem('GameRenderer');
            const w = gameRenderer ? gameRenderer.worldWidth : 2000;
            const h = gameRenderer ? gameRenderer.worldHeight : 2000;
            spawnX = w / 2;
            spawnY = h / 2;
        }

        const hero = new Hero({ x: spawnX, y: spawnY });
        this.game.hero = hero;

        const gameRenderer = this.game.getSystem('GameRenderer');
        if (gameRenderer && typeof gameRenderer.setHero === 'function') {
            gameRenderer.setHero(hero);
        }

        if (window.EntityManager) {
            EntityManager.add(hero);
            console.log(`[SpawnManager] Hero added. Total: ${EntityManager.getAll().length}`);
        }

        if (window.GameState) {
            hero.inventory.gold = window.GameState.get('gold') || 0;
        }

        console.log('[SpawnManager] Hero spawned at home island');
    }

    // ============================================
    // MERCHANT SPAWNING
    // ============================================

    spawnMerchants() {
        this.merchants = [];
        if (!window.Merchant) return;

        const islandManager = this.game.getSystem('IslandManager');
        if (!islandManager) return;

        const bridges = islandManager.getBridges();

        for (const island of islandManager.islands) {
            if (island.type === 'home') continue;

            const bounds = islandManager.getPlayableBounds(island);
            if (!bounds) continue;

            const entryBridge = bridges.find(b => b.to.col === island.gridX && b.to.row === island.gridY);

            let merchantX = bounds.x + (window.PropConfig ? PropConfig.MERCHANT.DEFAULT_OFFSET : 60);
            let merchantY = bounds.y + (window.PropConfig ? PropConfig.MERCHANT.DEFAULT_OFFSET : 60);
            const padding = (window.PropConfig ? PropConfig.MERCHANT.PADDING : 70);

            if (entryBridge) {
                if (entryBridge.type === 'horizontal') {
                    merchantX = bounds.left + padding;
                    const bridgeCenterY = entryBridge.y + entryBridge.height / 2;
                    merchantY = (bridgeCenterY + bounds.top) / 2;
                } else {
                    const bridgeCenterX = entryBridge.x + entryBridge.width / 2;
                    merchantX = (bridgeCenterX + bounds.left) / 2;
                    merchantY = bounds.top + padding;
                }
            }

            const merchant = new Merchant({
                x: merchantX,
                y: merchantY,
                islandId: `${island.gridX}_${island.gridY}`,
                islandName: island.name
            });

            this.merchants.push(merchant);
            if (window.EntityManager) EntityManager.add(merchant);
        }

        console.log(`[SpawnManager] Spawned ${this.merchants.length} merchants`);
    }

    getMerchantNearHero(hero) {
        if (!hero) return null;

        for (const merchant of this.merchants) {
            if (merchant.isInRange(hero)) {
                const [gridX, gridY] = merchant.islandId.split('_').map(Number);
                const islandManager = this.game.getSystem('IslandManager');
                const island = islandManager ? islandManager.getIslandByGrid(gridX, gridY) : null;
                if (island && island.unlocked) {
                    return merchant;
                }
            }
        }
        return null;
    }

    // ============================================
    // ISLAND MANAGEMENT
    // ============================================

    initializeIsland(gridX, gridY) {
        if (!window.IslandManager) return;

        const island = IslandManager.getIslandByGrid(gridX, gridY);
        if (!island) return;

        const count = window.IslandUpgrades ? IslandUpgrades.getResourceSlots(gridX, gridY) : 1;
        console.log(`[SpawnManager] Initializing ${island.name} (${island.category}), count: ${count}`);

        if (this.resourceSpawner) {
            if (island.category === 'resource') {
                this.resourceSpawner.spawnResourcesGridOnIsland(island, count);
            } else if (island.category === 'dinosaur') {
                this.resourceSpawner.spawnDinosaursOnIsland(island, count);
            }
        }

        console.log(`[SpawnManager] Initialized unlocked island: ${island.name}`);
    }

    refreshIslandResources(gridX, gridY) {
        if (!window.IslandManager || !this.game) return;

        const island = IslandManager.getIslandByGrid(gridX, gridY);
        if (!island) return;

        const targetCount = window.IslandUpgrades ? IslandUpgrades.getResourceSlots(gridX, gridY) : 1;

        if (island.category === 'dinosaur') {
            const allDinos = window.EntityManager ? EntityManager.getByType('Dinosaur') : [];
            const currentCount = allDinos.filter(d =>
                d.islandGridX === gridX && d.islandGridY === gridY
            ).length;
            const needed = targetCount - currentCount;

            if (needed > 0 && this.resourceSpawner) {
                this.resourceSpawner.spawnDinosaursOnIsland(island, needed);
            }
            return;
        }

        const allResources = window.EntityManager ? EntityManager.getByType('Resource') : [];
        const currentResources = allResources.filter(res =>
            res.islandGridX === gridX && res.islandGridY === gridY
        );
        const currentCount = currentResources.length;

        if (targetCount > currentCount && this.resourceSpawner) {
            this.resourceSpawner.spawnResourcesGridOnIsland(island, targetCount, currentCount);
        } else if (targetCount < currentCount) {
            let toRemove = currentCount - targetCount;
            for (let i = currentResources.length - 1; i >= 0; i--) {
                const res = currentResources[i];
                res.active = false;
                if (window.EntityManager) EntityManager.remove(res);
                toRemove--;
                if (toRemove <= 0) break;
            }
        }
    }

    updateIslandRespawnTimers(gridX, gridY) {
        if (!window.EntityManager) return;

        const resources = EntityManager.getByType('Resource');
        for (const res of resources) {
            if (res.islandGridX === gridX && res.islandGridY === gridY) {
                if (typeof res.recalculateRespawnTimer === 'function') {
                    res.recalculateRespawnTimer();
                }
            }
        }

        const dinosaurs = EntityManager.getByType('Dinosaur');
        for (const dino of dinosaurs) {
            if (dino.islandGridX === gridX && dino.islandGridY === gridY) {
                if (typeof dino.recalculateRespawnTimer === 'function') {
                    dino.recalculateRespawnTimer();
                }
            }
        }

        console.log(`[SpawnManager] Updated respawn timers for island ${gridX},${gridY}`);
    }

    // ============================================
    // DELEGATION METHODS (Public API for legacy code)
    // ============================================

    spawnDrop(x, y, resourceType, amount = 1) {
        if (this.dropSpawner) {
            this.dropSpawner.spawnDrop(x, y, resourceType, amount);
        }
    }

    spawnCraftedItem(x, y, type, options = {}) {
        if (this.dropSpawner) {
            this.dropSpawner.spawnCraftedItem(x, y, type, options);
        }
    }

    spawnEnemyGroup(biomeId, x, y, enemyId, count, options = {}) {
        if (this.enemySpawner) {
            return this.enemySpawner.spawnEnemyGroup(biomeId, x, y, enemyId, count, options);
        }
        return [];
    }

    populateBiome(biomeId, bounds, options = {}) {
        if (this.enemySpawner) {
            return this.enemySpawner.populateBiome(biomeId, bounds, options);
        }
    }

    spawnBiomeBoss(biomeId, x, y) {
        if (this.enemySpawner) {
            return this.enemySpawner.spawnBiomeBoss(biomeId, x, y);
        }
        return null;
    }

    getEnemiesInBiome(biomeId) {
        if (this.enemySpawner) {
            return this.enemySpawner.getEnemiesInBiome(biomeId);
        }
        return [];
    }

    clearBiomeEnemies(biomeId) {
        if (this.enemySpawner) {
            this.enemySpawner.clearBiomeEnemies(biomeId);
        }
    }

    spawnProps() {
        if (this.propSpawner) {
            this.propSpawner.spawnProps();
        }
    }

    isOnBridgeVisual(x, y, padding = 100) {
        if (this.propSpawner) {
            return this.propSpawner.isOnBridgeVisual(x, y, padding);
        }
        return false;
    }
}

window.SpawnManager = new SpawnManagerService();
if (window.Registry) Registry.register('SpawnManager', window.SpawnManager);
