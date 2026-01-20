/**
 * ResourceSpawner - Handles resource and dinosaur spawning on islands
 *
 * Extracted from SpawnManager.js for modularity.
 * Manages resources, dinosaurs, and home island trees.
 *
 * Owner: Level Architect
 */

class ResourceSpawner {
    constructor(spawnManager) {
        this.spawnManager = spawnManager;
    }

    /**
     * Spawn initial resources on islands (not in water)
     */
    spawnResources() {
        if (!window.Resource || !window.GameRenderer || !this.spawnManager.game) return;

        const islandManager = this.spawnManager.game.getSystem('IslandManager');

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
                    });

                    if (window.EntityManager) EntityManager.add(gold);
                }
                Logger.info(`[ResourceSpawner] Spawned ${goldCount} gold on home island`);
            }
        }

        // Get all unlocked islands (excluding home)
        const islands = islandManager
            ? islandManager.islands.filter((i) => i.type !== 'home' && i.unlocked)
            : [];

        if (islands.length === 0) {
            Logger.info('[ResourceSpawner] No other unlocked islands for spawning');
            return;
        }

        // Spawn based on island category
        for (const island of islands) {
            const count = window.IslandUpgrades
                ? IslandUpgrades.getResourceSlots(island.gridX, island.gridY)
                : 1;

            if (island.category === 'resource') {
                this.spawnResourcesGridOnIsland(island, count);
            } else if (island.category === 'dinosaur') {
                this.spawnDinosaursOnIsland(island, count);
            }
        }
    }

    /**
     * Spawn resources in a grid pattern on a zone
     */
    spawnResourcesGridOnIsland(island, count, startIndex = 0) {
        if (!this.spawnManager.game || island.type === 'home') return;

        const type = island.resourceType || 'node_mining_t1_02'; // Default to Stone Pile
        const cols = GameConstants.Spawning.RESOURCE_GRID.COLS;
        const spacing = GameConstants.Grid.CELL_SIZE;

        const gridWidth = (cols - 1) * spacing;
        const maxRows = Math.ceil(15 / cols);
        const gridHeight = (maxRows - 1) * spacing;

        const islandManager = this.spawnManager.game.getSystem('IslandManager');
        const bounds = islandManager ? islandManager.getPlayableBounds(island) : null;
        if (!bounds) return;

        let startX = bounds.x + (bounds.width - gridWidth) / 2;
        let startY = bounds.y + (bounds.height - gridHeight) / 2;

        if (islandManager && islandManager.snapToGrid) {
            const snapped = islandManager.snapToGrid(startX, startY);
            startX = snapped.x;
            startY = snapped.y;
        }

        for (let i = startIndex; i < count; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);

            const x = startX + col * spacing;
            const y = startY + row * spacing;

            const resource = new Resource({
                resourceType: type,
                x: x,
                y: y,
                islandGridX: island.gridX,
                islandGridY: island.gridY
            });

            if (window.EntityManager) EntityManager.add(resource);
        }

        Logger.info(
            `[ResourceSpawner] Spawned ${count - startIndex} ${type} in ${island.name} (grid-aligned)`
        );
    }

    /**
     * Spawn dinosaurs randomly on an island
     */
    spawnDinosaursOnIsland(island, count) {
        if (!window.Dinosaur || !this.spawnManager.game) return;

        const islandManager = this.spawnManager.game.getSystem('IslandManager');
        const padding = GameConstants.UI.PROP_SPAWN_PADDING || 70;
        const bounds = islandManager ? islandManager.getPlayableBounds(island) : null;
        if (!bounds) return;

        // Herbivore entity IDs by tier (based on zone difficulty)
        const herbivoreTiers = {
            1: ['enemy_herbivore_t1_01', 'enemy_herbivore_t1_02', 'enemy_herbivore_t1_03'],
            2: ['enemy_herbivore_t2_01', 'enemy_herbivore_t2_02', 'enemy_herbivore_t2_03'],
            3: ['enemy_herbivore_t3_01', 'enemy_herbivore_t3_02']
        };

        // Inline loot definitions matching entity JSON files (bypasses EntityLoader fetch)
        const herbivoreLoot = {
            enemy_herbivore_t1_01: [
                { item: 'food_t1_02', chance: 1.0, amount: [1, 2] },
                { item: 'leather_t1_01', chance: 0.3, amount: [1, 1] }
            ],
            enemy_herbivore_t1_02: [
                { item: 'food_t1_02', chance: 1.0, amount: [1, 1] },
                { item: 'leather_t1_01', chance: 0.2, amount: [1, 1] }
            ],
            enemy_herbivore_t1_03: [
                { item: 'food_t1_02', chance: 1.0, amount: [1, 2] },
                { item: 'leather_t1_01', chance: 0.25, amount: [1, 1] }
            ],
            enemy_herbivore_t2_01: [
                { item: 'food_t2_01', chance: 1.0, amount: [1, 2] },
                { item: 'leather_t2_01', chance: 0.35, amount: [1, 1] }
            ],
            enemy_herbivore_t2_02: [
                { item: 'food_t2_01', chance: 1.0, amount: [1, 2] },
                { item: 'leather_t2_01', chance: 0.3, amount: [1, 1] }
            ],
            enemy_herbivore_t2_03: [
                { item: 'food_t2_01', chance: 1.0, amount: [1, 2] },
                { item: 'leather_t2_01', chance: 0.3, amount: [1, 1] }
            ],
            enemy_herbivore_t3_01: [
                { item: 'food_t3_01', chance: 1.0, amount: [1, 3] },
                { item: 'leather_t3_01', chance: 0.4, amount: [1, 2] }
            ],
            enemy_herbivore_t3_02: [
                { item: 'food_t3_01', chance: 1.0, amount: [1, 3] },
                { item: 'leather_t3_01', chance: 0.35, amount: [1, 1] }
            ]
        };

        // Determine tier based on island position (row 1 = T1, row 2 = T2/T3)
        const tier = Math.min(3, Math.max(1, island.gridY));

        for (let i = 0; i < count; i++) {
            const x = bounds.x + padding + Math.random() * (bounds.width - padding * 2);
            const y = bounds.y + padding + Math.random() * (bounds.height - padding * 2);

            // Select herbivore deterministically based on zone position (same herbivore per zone)
            const tierPool = herbivoreTiers[tier] || herbivoreTiers[1];
            const zoneIndex = (island.gridX + island.gridY) % tierPool.length;
            const dinoType = tierPool[zoneIndex];

            const dino = new Dinosaur({
                x: x,
                y: y,
                dinoType: dinoType,
                lootTable: herbivoreLoot[dinoType] || herbivoreLoot['enemy_herbivore_t1_01'],
                islandBounds: bounds,
                islandGridX: island.gridX,
                islandGridY: island.gridY
            });

            if (window.EntityManager) EntityManager.add(dino);
        }

        Logger.info(`[ResourceSpawner] Spawned ${count} dinosaurs on ${island.name}`);
    }

    /**
     * Spawn tree resources on home island in organic forest pattern
     */
    spawnHomeIslandTrees() {
        if (!window.IslandManager || !window.Resource) return;

        const home = IslandManager.getHomeIsland();
        if (!home) return;

        const bounds = IslandManager.getPlayableBounds(home);
        if (!bounds) return;

        const treeConfig = window.EntityConfig?.resource?.types?.wood || {};
        const treeSize = treeConfig.width || 140;
        const treeHalf = treeSize / 2;
        const inset = treeHalf + 10;

        const minX = bounds.x + inset;
        const maxX = bounds.x + bounds.width - inset;
        const minY = bounds.y + inset;
        const centerY = bounds.y + bounds.height / 2;
        const maxY = centerY;

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
                resourceType: 'node_woodcutting_t1_01', // Dead Tree (has image)
                x: x,
                y: y,
                islandGridX: home.gridX,
                islandGridY: home.gridY
            });
            if (window.EntityManager) EntityManager.add(tree);
            placedTrees.push({ x, y });
        };

        const targetTreeCount = 25;
        const edgeSpacing = 100;
        const jitter = 25;

        // Phase 1: Edge trees (top)
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

        Logger.info(`[ResourceSpawner] Spawned ${placedTrees.length} trees on Home Island`);
    }
}

window.ResourceSpawner = ResourceSpawner;

