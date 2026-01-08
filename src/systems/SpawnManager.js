/**
 * SpawnManagerService - Handles entity spawning and population on islands
 * 
 * Extracted from Game.js and IslandManager to centralize spawning logic.
 * Manages resources, dinosaurs, merchants, and props.
 * 
 * Owner: Director / Level Architect
 */

class SpawnManagerService {
    constructor() {
        // References
        this.game = null;
        this.merchants = [];
        console.log('[SpawnManager] Initialized Service');
    }

    /**
     * Initialize with game reference
     * @param {Game} game
     */
    init(game) {
        this.game = game;
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
        // Mostly event-driven or reactive, ensuring method exists
    }

    /**
     * Start lifecycle hook (called after all systems are initialized)
     */
    start() {
        if (!this.game) return;

        console.log('[SpawnManager] Starting lifecycle...');
        console.log('[SpawnManager] EntityManager present:', !!window.EntityManager);
        this.spawnHero();
        this.spawnHomeIslandTrees(); // Trees on home island (unified with resource system)
        this.spawnResources();
        this.spawnMerchants();
        this.spawnProps();
    }

    /**
     * Spawn the player hero
     */
    spawnHero() {
        if (!window.Hero || !this.game) return;

        // Spawn hero at center of home island
        let spawnX, spawnY;
        const islandManager = this.game.getSystem('IslandManager'); // Use getSystem for safety

        if (islandManager) {
            const spawn = islandManager.getHeroSpawnPosition();
            spawnX = spawn.x;
            spawnY = spawn.y;
        } else {
            // Fallback to world center
            const gameRenderer = this.game.getSystem('GameRenderer');
            const w = gameRenderer ? gameRenderer.worldWidth : 2000;
            const h = gameRenderer ? gameRenderer.worldHeight : 2000;
            spawnX = w / 2;
            spawnY = h / 2;
        }

        const hero = new Hero({
            x: spawnX,
            y: spawnY
        });

        // Legacy reference (HeroSystem and others still use game.hero)
        this.game.hero = hero;

        // Register with Renderer (Camera Follow)
        const gameRenderer = this.game.getSystem('GameRenderer');
        if (gameRenderer && typeof gameRenderer.setHero === 'function') {
            gameRenderer.setHero(hero);
        }

        // Register with EntityManager
        if (window.EntityManager) {
            EntityManager.add(hero);
            console.log(`[SpawnManager] Hero added to EntityManager. Total Entities: ${EntityManager.getAll().length}`);
        } else {
            console.error('[SpawnManager] EntityManager NOT FOUND during Hero creation!');
        }

        // Sync gold from GameState
        if (window.GameState) {
            hero.inventory.gold = window.GameState.get('gold') || 0;
        }

        console.log('[SpawnManager] Hero spawned at home island');
    }

    /**
     * Spawn initial resources on islands (not in water)
     */
    spawnResources() {
        if (!window.Resource || !window.GameRenderer || !this.game) return;

        // Spawn gold on home island
        const islandManager = this.game.getSystem('IslandManager');
        const gameRenderer = this.game.getSystem('GameRenderer');

        if (islandManager) {
            const home = islandManager.getHomeIsland();
            const bounds = islandManager.getPlayableBounds(home);
            if (home && bounds) {
                const goldCount = GameConstants.Spawning.HOME_GOLD_COUNT;
                const padding = GameConstants.UI.PROP_SPAWN_PADDING;
                for (let i = 0; i < goldCount; i++) {
                    const x = bounds.x + padding + Math.random() * (bounds.width - padding * 2);
                    const y = bounds.y + padding + Math.random() * (bounds.height - padding * 2);
                    const gold = new Resource({
                        resourceType: 'gold',
                        x: x,
                        y: y
                        // amount cascades from EntityConfig.resource.defaults
                    });


                    if (window.EntityManager) EntityManager.add(gold);

                }
                console.log(`[SpawnManager] Spawned ${goldCount} gold on home island`);
            }
        }

        // Get all unlocked islands (excluding home)
        const islands = islandManager ?
            islandManager.islands.filter(i => i.type !== 'home' && i.unlocked) : [];

        if (islands.length === 0) {
            console.log('[SpawnManager] No other unlocked islands for spawning');
            return;
        }

        // Spawn based on island category
        for (const island of islands) {
            const count = window.IslandUpgrades ? IslandUpgrades.getResourceSlots(island.gridX, island.gridY) : 1;

            if (island.category === 'resource') {
                this.spawnResourcesGridOnIsland(island, count);
            } else if (island.category === 'dinosaur') {
                this.spawnDinosaursOnIsland(island, count);
            }
        }
    }

    /**
     * Spawn resources in a grid pattern on a zone
     * @param {object} island
     * @param {number} count
     * @param {number} startIndex - Index to start spawning from (default 0)
     */
    spawnResourcesGridOnIsland(island, count, startIndex = 0) {
        if (!this.game || island.type === 'home') return;

        const type = island.resourceType || 'scrap_metal';

        // Fixed Grid Layout (aligned to 128px grid)
        const cols = GameConstants.Spawning.RESOURCE_GRID.COLS;
        const spacing = GameConstants.Grid.CELL_SIZE; // Use grid cell size

        const gridWidth = (cols - 1) * spacing;
        const maxRows = Math.ceil(15 / cols);
        const gridHeight = (maxRows - 1) * spacing;

        const islandManager = this.game.getSystem('IslandManager');
        const gameRenderer = this.game.getSystem('GameRenderer');

        const bounds = islandManager ? islandManager.getPlayableBounds(island) : null;
        if (!bounds) return;

        // Calculate starting position and snap to grid
        let startX = bounds.x + (bounds.width - gridWidth) / 2;
        let startY = bounds.y + (bounds.height - gridHeight) / 2;

        // Snap the starting position to nearest grid cell
        if (islandManager && islandManager.snapToGrid) {
            const snapped = islandManager.snapToGrid(startX, startY);
            startX = snapped.x;
            startY = snapped.y;
        }

        for (let i = startIndex; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            // Calculate position aligned to grid
            const x = startX + col * spacing;
            const y = startY + row * spacing;

            const resource = new Resource({
                resourceType: type,
                x: x,
                y: y,
                // amount cascades from EntityConfig.resource.defaults
                islandGridX: island.gridX,
                islandGridY: island.gridY
            });

            if (window.EntityManager) EntityManager.add(resource);
        }

        console.log(`[SpawnManager] Spawned ${count - startIndex} ${type} in ${island.name} (grid-aligned)`);
    }

    /**
     * Spawn dinosaurs randomly on an island
     * @param {object} island
     * @param {number} count
     */
    spawnDinosaursOnIsland(island, count) {
        if (!window.Dinosaur || !this.game) return;

        const islandManager = this.game.getSystem('IslandManager');
        const gameRenderer = this.game.getSystem('GameRenderer');

        const padding = GameConstants.UI.PROP_SPAWN_PADDING || 70;
        const bounds = islandManager ? islandManager.getPlayableBounds(island) : null;
        if (!bounds) return;

        for (let i = 0; i < count; i++) {
            const x = bounds.x + padding + Math.random() * (bounds.width - padding * 2);
            const y = bounds.y + padding + Math.random() * (bounds.height - padding * 2);

            // Determine drop type based on island (Data-Driven)
            let dropType = 'fossil_fuel';
            if (window.WorldData && WorldData.DinoDrops) {
                dropType = WorldData.DinoDrops[island.gridY][island.gridX] || 'fossil_fuel';
            }

            const dino = new Dinosaur({
                x: x,
                y: y,
                resourceType: dropType,
                // amount cascades from EntityConfig
                islandBounds: bounds,
                islandGridX: island.gridX,
                islandGridY: island.gridY
            });

            if (window.EntityManager) EntityManager.add(dino);

        }

        console.log(`[SpawnManager] Spawned ${count} dinosaurs on ${island.name}`);
    }

    /**
     * Spawn tree resources on home island in organic forest pattern
     * Unified with resource spawning system - all trees go through EntityManager
     */
    spawnHomeIslandTrees() {
        if (!window.IslandManager || !window.Resource) return;

        const home = IslandManager.getHomeIsland();
        if (!home) return;

        const bounds = IslandManager.getPlayableBounds(home);
        if (!bounds) return;

        // Tree config from EntityConfig
        const treeConfig = window.EntityConfig?.resource?.types?.wood || {};
        const treeSize = treeConfig.width || 140;
        const treeHalf = treeSize / 2;
        const inset = treeHalf + 10;

        // Spawnable area (TOP HALF ONLY)
        const minX = bounds.x + inset;
        const maxX = bounds.x + bounds.width - inset;
        const minY = bounds.y + inset;
        const centerY = bounds.y + bounds.height / 2;
        const maxY = centerY;

        // Rest area exclusion
        const centerX = bounds.x + bounds.width / 2;
        const restAreaRadius = 330;

        const isValidSpawnPoint = (x, y) => {
            const dx = x - centerX;
            const dy = y - centerY;
            return Math.sqrt(dx * dx + dy * dy) >= restAreaRadius;
        };

        const minSpacing = 50;
        const placedTrees = [];

        const hasSpacing = (x, y) => {
            for (const other of placedTrees) {
                const dist = Math.sqrt((x - other.x) ** 2 + (y - other.y) ** 2);
                if (dist < minSpacing) return false;
            }
            return true;
        };

        const spawnTree = (x, y) => {
            const tree = new Resource({
                resourceType: 'wood',
                x: x,
                y: y,
                // amount cascades from EntityConfig.resource.defaults
                islandGridX: home.gridX,
                islandGridY: home.gridY
            });
            if (window.EntityManager) EntityManager.add(tree);
            placedTrees.push({ x, y });
        };

        const targetTreeCount = 25;
        const edgeSpacing = 100;
        const jitter = 25;

        // Phase 1: Edge trees
        for (let x = minX; x <= maxX; x += edgeSpacing) {
            const tx = x + (Math.random() - 0.5) * jitter;
            const ty = minY + Math.random() * jitter;
            if (isValidSpawnPoint(tx, ty) && hasSpacing(tx, ty)) {
                spawnTree(tx, ty);
            }
        }

        // Left edge
        for (let y = minY + edgeSpacing; y < maxY; y += edgeSpacing) {
            const tx = minX + Math.random() * jitter;
            const ty = y + (Math.random() - 0.5) * jitter;
            if (isValidSpawnPoint(tx, ty) && hasSpacing(tx, ty)) {
                spawnTree(tx, ty);
            }
        }

        // Right edge
        for (let y = minY + edgeSpacing; y < maxY; y += edgeSpacing) {
            const tx = maxX - Math.random() * jitter;
            const ty = y + (Math.random() - 0.5) * jitter;
            if (isValidSpawnPoint(tx, ty) && hasSpacing(tx, ty)) {
                spawnTree(tx, ty);
            }
        }

        // Phase 2: Fill interior
        let attempts = 0;
        while (placedTrees.length < targetTreeCount && attempts < 300) {
            attempts++;
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            if (isValidSpawnPoint(x, y) && hasSpacing(x, y)) {
                spawnTree(x, y);
            }
        }

        // Phase 3: Force remaining
        let forceAttempts = 0;
        while (placedTrees.length < targetTreeCount && forceAttempts < 500) {
            forceAttempts++;
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);
            if (isValidSpawnPoint(x, y)) {
                spawnTree(x, y);
            }
        }

        console.log(`[SpawnManager] Spawned ${placedTrees.length} trees on Home Island`);
    }

    /**
     * Initialize a newly unlocked island
     * @param {number} gridX
     * @param {number} gridY
     */
    initializeIsland(gridX, gridY) {
        if (!window.IslandManager) return;

        const island = IslandManager.getIslandByGrid(gridX, gridY);
        if (!island) return;

        const count = window.IslandUpgrades ? IslandUpgrades.getResourceSlots(gridX, gridY) : 1;
        console.log(`[SpawnManager] Initializing ${island.name} (${island.category}), count: ${count}`);

        if (island.category === 'resource') {
            this.spawnResourcesGridOnIsland(island, count);
        } else if (island.category === 'dinosaur') {
            this.spawnDinosaursOnIsland(island, count);
        }

        console.log(`[SpawnManager] Initialized unlocked island: ${island.name}`);
    }

    /**
     * Refresh resources on a specific island (e.g. after upgrade)
     * @param {number} gridX
     * @param {number} gridY
     */
    refreshIslandResources(gridX, gridY) {
        if (!window.IslandManager || !this.game) return;

        const island = IslandManager.getIslandByGrid(gridX, gridY);
        if (!island) return;

        const targetCount = window.IslandUpgrades ? IslandUpgrades.getResourceSlots(gridX, gridY) : 1;

        // Dinosaur Islands
        if (island.category === 'dinosaur') {
            const allDinos = window.EntityManager ? EntityManager.getByType('Dinosaur') : [];
            const currentCount = allDinos.filter(d =>
                d.islandGridX === gridX && d.islandGridY === gridY
            ).length;
            const needed = targetCount - currentCount;

            if (needed > 0) {
                this.spawnDinosaursOnIsland(island, needed);
            }
            return;
        }

        // Resource Islands
        const allResources = window.EntityManager ? EntityManager.getByType('Resource') : [];
        const currentResources = allResources.filter(res =>
            res.islandGridX === gridX && res.islandGridY === gridY
        );
        const currentCount = currentResources.length;

        if (targetCount > currentCount) {
            this.spawnResourcesGridOnIsland(island, targetCount, currentCount);
        } else if (targetCount < currentCount) {
            let toRemove = currentCount - targetCount;
            // Remove from end to avoid index shifts during iteration
            for (let i = currentResources.length - 1; i >= 0; i--) {
                const res = currentResources[i];
                res.active = false;

                if (window.EntityManager) EntityManager.remove(res);
                toRemove--;
                if (toRemove <= 0) break;
            }
        }
    }

    /**
     * Update respawn timers for all entities on an island
     * @param {number} gridX
     * @param {number} gridY
     */
    updateIslandRespawnTimers(gridX, gridY) {
        if (!window.EntityManager) return;

        // Use EntityManager instead of legacy game.resources/dinosaurs
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

    // --- Population (Extracted from IslandManager) ---

    /**
     * Spawn merchants on all islands (except home)
     */
    spawnMerchants() {
        this.merchants = [];
        if (!window.Merchant) return;

        const islandManager = this.game.getSystem('IslandManager');
        const gameRenderer = this.game.getSystem('GameRenderer');
        if (!islandManager) return;

        const bridges = islandManager.getBridges();

        for (const island of islandManager.islands) {
            // Skip home island (no merchant needed there)
            if (island.type === 'home') continue;

            const bounds = islandManager.getPlayableBounds(island);
            if (!bounds) continue;

            // Find the bridge that leads TO this island (Entrance)
            const entryBridge = bridges.find(b => b.to.col === island.gridX && b.to.row === island.gridY);

            let merchantX = bounds.x + (window.BiomeConfig ? BiomeConfig.MERCHANT.DEFAULT_OFFSET : 60);
            let merchantY = bounds.y + (window.BiomeConfig ? BiomeConfig.MERCHANT.DEFAULT_OFFSET : 60);
            const padding = (window.BiomeConfig ? BiomeConfig.MERCHANT.PADDING : 70); // 70px from wall start (safe for 70px entity)

            if (entryBridge) {
                if (entryBridge.type === 'horizontal') {
                    // Entering from Left (bridge connects to left edge)
                    // Offset Y towards the top corner (halfway between bridge center and top of bounds)
                    merchantX = bounds.left + padding;
                    const bridgeCenterY = entryBridge.y + entryBridge.height / 2;
                    merchantY = (bridgeCenterY + bounds.top) / 2;
                } else {
                    // Entering from Top (bridge connects to top edge)
                    // Offset X towards the left corner (halfway between bridge center and left of bounds)
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

    /**
     * Get merchant that hero is near
     * @param {Hero} hero
     * @returns {Merchant|null}
     */
    getMerchantNearHero(hero) {
        if (!hero) return null;

        for (const merchant of this.merchants) {
            if (merchant.isInRange(hero)) {
                // Only allow interaction if the merchant's island is unlocked
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

    /**
     * Check if position is on a bridge (FULL visual bounds + padding, for prop exclusion)
     * @param {number} padding - Extra padding around bridge bounds (default 100px for prop size)
     */
    isOnBridgeVisual(x, y, padding = 100) {
        const islandManager = this.game.getSystem('IslandManager');
        if (!islandManager) return false;

        const bridges = islandManager.getBridges();
        for (const bridge of bridges) {
            // Add padding to all sides
            const bx = bridge.x - padding;
            const by = bridge.y - padding;
            const bw = bridge.width + padding * 2;
            const bh = bridge.height + padding * 2;

            if (x >= bx && x < bx + bw &&
                y >= by && y < by + bh) {
                return true;
            }
        }
        return false;
    }

    /**
     * Spawn decorative props
     * @param {Game} game - Optional, not strictly needed as GameRenderer is global
     */
    spawnProps() {
        if (!window.Prop) {
            console.warn('[SpawnManager] Prop class not found, skipping prop spawn.');
            return;
        }

        const islandManager = this.game.getSystem('IslandManager');
        if (!islandManager) {
            console.warn('[SpawnManager] IslandManager not found.');
            return;
        }

        // Shared tracking for overlap prevention
        const spawnedProps = [];

        for (const island of islandManager.islands) {
            if (island.type === 'home') continue;

            const foliageMap = (window.BiomeConfig && BiomeConfig.FOLIAGE_MAP) ? BiomeConfig.FOLIAGE_MAP : {};
            const itemMap = (window.BiomeConfig && BiomeConfig.ITEM_MAP) ? BiomeConfig.ITEM_MAP : {};
            const foliageList = foliageMap[island.name];
            const itemList = itemMap[island.name];

            // 1. Spawn Foliage Clusters
            if (foliageList) {
                this.spawnFoliage(island, foliageList, spawnedProps);
            }

            // 2. Spawn Scattered Items
            if (itemList) {
                this.spawnScatteredItems(island, itemList, spawnedProps);
            }
        }
        console.log(`[SpawnManager] Spawned ${spawnedProps.length} props.`);
    }

    spawnFoliage(island, foliageList, spawnedProps) {
        const C = GameConstants.Spawning.PROPS; // Alias for brevity
        const gap = this.game.getSystem('IslandManager').waterGap;

        // Count Config
        const clusterCount = C.CLUSTER_COUNT_MIN + Math.floor(Math.random() * C.CLUSTER_COUNT_RND);

        for (let c = 0; c < clusterCount; c++) {
            // Find Cluster Center
            const clusterPos = this.findValidPosition(island, gap, GameConstants.UI.BRIDGE_VISUAL_PADDING, spawnedProps, C.MIN_DIST, 15);
            if (!clusterPos) continue;

            const propsPerCluster = C.PROPS_PER_CLUSTER_MIN + Math.floor(Math.random() * C.PROPS_PER_CLUSTER_RND);

            for (let i = 0; i < propsPerCluster; i++) {
                const propId = foliageList[Math.floor(Math.random() * foliageList.length)];

                // Random point in radius
                let validProp = false;
                for (let k = 0; k < 8; k++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * C.CLUSTER_RADIUS * 0.8 + C.CLUSTER_RADIUS * 0.2;
                    const px = clusterPos.x + Math.cos(angle) * dist;
                    const py = clusterPos.y + Math.sin(angle) * dist;

                    if (this.isValidPropPosition(px, py, island, GameConstants.UI.BRIDGE_VISUAL_PADDING, spawnedProps, C.MIN_DIST)) {
                        this.createProp(px, py, propId, island);
                        spawnedProps.push({ x: px, y: py });
                        validProp = true;
                        break;
                    }
                }
            }
        }
    }

    spawnScatteredItems(island, itemList, spawnedProps) {
        const C = GameConstants.Spawning.PROPS;
        const gap = this.game.getSystem('IslandManager').waterGap;

        const itemCount = C.ITEM_COUNT_MIN + Math.floor(Math.random() * C.ITEM_COUNT_RND);

        for (let i = 0; i < itemCount; i++) {
            const propId = itemList[Math.floor(Math.random() * itemList.length)];

            // Items need more padding from bridges (120 vs 100) and more distance from other props
            const pos = this.findValidPosition(island, gap, 120, spawnedProps, C.MIN_DIST * 1.5, 15);

            if (pos) {
                this.createProp(pos.x, pos.y, propId, island);
                spawnedProps.push({ x: pos.x, y: pos.y });
            }
        }
    }

    findValidPosition(island, gap, bridgePadding, existingProps, minSpacing, maxAttempts) {
        const minX = island.worldX - gap;
        const maxX = island.worldX + island.width + gap;
        const minY = island.worldY - gap;
        const maxY = island.worldY + island.height + gap;

        for (let i = 0; i < maxAttempts; i++) {
            const x = minX + Math.random() * (maxX - minX);
            const y = minY + Math.random() * (maxY - minY);

            if (this.isValidPropPosition(x, y, island, bridgePadding, existingProps, minSpacing)) {
                return { x, y };
            }
        }
        return null;
    }

    isValidPropPosition(x, y, island, bridgePadding, existingProps, minSpacing) {
        // 1. Inside Island Bounds
        if (x > island.worldX && x < island.worldX + island.width &&
            y > island.worldY && y < island.worldY + island.height) return false;

        // 2. Bridge Clearance
        if (this.isOnBridgeVisual(x, y, bridgePadding)) return false;

        // 3. Overlap Check
        const minDistSq = minSpacing * minSpacing;
        for (const p of existingProps) {
            if ((x - p.x) ** 2 + (y - p.y) ** 2 < minDistSq) return false;
        }

        return true;
    }

    createProp(x, y, sprite, island) {
        const prop = new Prop({
            x: x, y: y, sprite: sprite,
            width: 160, height: 160,
            islandGridX: island.gridX, islandGridY: island.gridY
        });
        if (window.EntityManager) EntityManager.add(prop);
    }
    /**
     * Spawn a dropped item at a location
     * @param {number} x
     * @param {number} y
     * @param {string} resourceType
     * @param {number} amount
     */
    spawnDrop(x, y, resourceType, amount = 1) {
        if (!window.DroppedItem) return;

        // Fly animation target (random spread)
        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 40;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        const drop = new DroppedItem({
            x: x,
            y: y,
            resourceType: resourceType,
            amount: amount,
            minPickupTime: 2.0 // Enforce 2s delay (allow animation/appreciation)
        });

        // Trigger flight immediately
        drop.flyTo(targetX, targetY);

        if (window.EntityManager) EntityManager.add(drop);

        console.log(`[SpawnManager] Spawned drop: ${resourceType} x${amount} at ${x},${y}`);
    }

    /**
     * Spawn an item crafted by the player (flying out from Forge)
     * @param {number} x - Spawn origin (Forge)
     * @param {number} y
     * @param {string} type - Item ID
     * @param {object} options - { amount, icon, targetX, targetY }
     */
    spawnCraftedItem(x, y, type, options = {}) {
        if (!window.DroppedItem || !window.EntityManager) return;

        const { amount = 1, icon = null } = options;

        const drop = new DroppedItem({
            x: x,
            y: y,
            resourceType: type,
            amount: amount,
            customIcon: icon,
            minPickupTime: 0.5 // Quick pickup for crafted items
        });

        EntityManager.add(drop);

        // Fly logic
        let tx, ty;

        if (options.targetX !== undefined && options.targetY !== undefined) {
            tx = options.targetX;
            ty = options.targetY;
        } else {
            // Random spread if no target provided
            const angle = Math.random() * Math.PI * 2;
            const dist = 150 + Math.random() * 100;
            tx = x + Math.cos(angle) * dist;
            ty = y + Math.sin(angle) * dist;
        }

        // Clamp logic should technically be here or passed in. 
        // For now, we trust the caller or add clamping if IslandManager is available.
        if (window.IslandManager && IslandManager.clampToPlayableArea) {
            const clamped = IslandManager.clampToPlayableArea(tx, ty);
            tx = clamped.x;
            ty = clamped.y;
        }

        drop.flyTo(tx, ty);
        console.log(`[SpawnManager] Spawned crafted item: ${type}`);
    }
}

window.SpawnManager = new SpawnManagerService();
if (window.Registry) Registry.register('SpawnManager', window.SpawnManager);
