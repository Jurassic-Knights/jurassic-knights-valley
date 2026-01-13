/**
 * LootSystem - Handles loot generation from enemies
 * 
 * Listens for ENEMY_DIED events and generates drops based on loot tables.
 * Supports:
 * - Guaranteed drops (always drop)
 * - Weighted random drops
 * - Level-based scaling
 * - Elite multipliers (3x drops for elite enemies)
 * 
 * Owner: Economy / Combat
 */

const LootSystem = {
    game: null,

    /**
     * Initialize the loot system
     * @param {Game} game
     */
    init(game) {
        this.game = game;
        this.initListeners();
        Logger.info('[LootSystem] Initialized');
    },

    /**
     * Set up event listeners
     */
    initListeners() {
        if (window.EventBus) {
            // Listen for enemy deaths from Enemy.js
            EventBus.on('ENEMY_DIED', (data) => this.onEnemyDied(data));
        }
    },

    /**
     * Handle enemy death - generate and spawn loot
     * @param {object} data - Death event data
     */
    onEnemyDied(data) {
        const { enemy, lootTableId, lootMultiplier, isElite } = data;

        // Use enemy's loot table or fall back to common
        const tableId = lootTableId || 'common_feral';

        // Elite enemies get multiplied loot
        const multiplier = lootMultiplier || (isElite ?
            (window.EntityConfig?.enemy?.eliteMultipliers?.lootDrops || 3.0) : 1.0);

        // Generate loot from table
        const drops = this.generateLoot(tableId, enemy.level || 1, multiplier);

        // Spawn the drops at enemy position
        if (drops.length > 0) {
            this.spawnDrops(enemy.x, enemy.y, drops);
            Logger.info(`[LootSystem] Dropped ${drops.length} items from ${tableId}`);
        }
    },

    /**
     * Generate loot from a loot table
     * @param {string} tableId - Loot table identifier
     * @param {number} level - Enemy level for scaling
     * @param {number} lootMultiplier - Multiplier for elite enemies
     * @returns {Array<{itemId: string, amount: number}>}
     */
    generateLoot(tableId, level = 1, lootMultiplier = 1) {
        const table = window.EntityConfig?.lootTables?.[tableId];
        if (!table) {
            Logger.warn(`[LootSystem] Unknown loot table: ${tableId}`);
            return [];
        }

        const drops = [];

        // Process guaranteed drops
        if (table.guaranteedDrops) {
            for (const drop of table.guaranteedDrops) {
                const baseAmount = drop.amount || 1;
                const scaledAmount = this.scaleAmount(baseAmount, level);
                const finalAmount = Math.max(1, Math.floor(scaledAmount * lootMultiplier));

                drops.push({
                    itemId: drop.itemId,
                    amount: finalAmount
                });
            }
        }

        // Process random drops
        if (table.randomDrops && table.randomDrops.length > 0) {
            // Determine number of random drops (elite gets more)
            const dropRange = table.dropCount || { min: 1, max: 1 };
            const baseDropCount = this.randomRange(dropRange.min, dropRange.max);
            const dropCount = Math.max(1, Math.floor(baseDropCount * Math.sqrt(lootMultiplier)));

            for (let i = 0; i < dropCount; i++) {
                const drop = this.weightedRandom(table.randomDrops);
                if (drop) {
                    const amountRange = drop.amount || { min: 1, max: 1 };
                    const baseAmount = this.randomRange(amountRange.min, amountRange.max);
                    const scaledAmount = this.scaleAmount(baseAmount, level);
                    const finalAmount = Math.max(1, Math.floor(scaledAmount * lootMultiplier));

                    drops.push({
                        itemId: drop.itemId,
                        amount: finalAmount
                    });
                }
            }
        }

        return drops;
    },

    /**
     * Scale drop amount based on enemy level
     * +10% per level above 1
     * @param {number} baseAmount
     * @param {number} level
     * @returns {number}
     */
    scaleAmount(baseAmount, level) {
        const scaling = 1 + (level - 1) * 0.1;
        return baseAmount * scaling;
    },

    /**
     * Spawn drops at a location in a circular pattern
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {Array} drops - Array of {itemId, amount}
     */
    spawnDrops(x, y, drops) {
        if (!window.SpawnManager) {
            Logger.warn('[LootSystem] SpawnManager not found');
            return;
        }

        const spacing = 40;
        const count = drops.length;

        for (let i = 0; i < count; i++) {
            const drop = drops[i];

            // Arrange in circle around death location
            const angle = (i / count) * Math.PI * 2;
            const offsetX = count > 1 ? Math.cos(angle) * spacing : 0;
            const offsetY = count > 1 ? Math.sin(angle) * spacing : 0;

            SpawnManager.spawnDrop(
                x + offsetX,
                y + offsetY,
                drop.itemId,
                drop.amount
            );
        }

        // Emit loot dropped event
        if (window.EventBus && window.GameConstants?.Events?.LOOT_DROPPED) {
            EventBus.emit(GameConstants.Events.LOOT_DROPPED, {
                x: x,
                y: y,
                drops: drops,
                totalItems: drops.length
            });
        }

        // Play loot drop sound
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_loot_drop');
        }
    },

    /**
     * Select an item from weighted random pool
     * @param {Array} items - Array of {weight, ...} objects
     * @returns {object|null}
     */
    weightedRandom(items) {
        if (!items || items.length === 0) return null;

        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 1), 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= (item.weight || 1);
            if (random <= 0) {
                return item;
            }
        }

        // Fallback to last item
        return items[items.length - 1];
    },

    /**
     * Generate random integer in range (inclusive)
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    randomRange(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    },

    /**
     * Get a specific loot table by ID
     * @param {string} tableId
     * @returns {object|null}
     */
    getTable(tableId) {
        return window.EntityConfig?.lootTables?.[tableId] || null;
    },

    /**
     * Preview drops from a table (for UI/debug)
     * @param {string} tableId
     * @param {number} samples - Number of samples to generate
     * @returns {object} - Statistics about drops
     */
    previewTable(tableId, samples = 100) {
        const results = {};

        for (let i = 0; i < samples; i++) {
            const drops = this.generateLoot(tableId, 1, 1);
            for (const drop of drops) {
                if (!results[drop.itemId]) {
                    results[drop.itemId] = { count: 0, totalAmount: 0 };
                }
                results[drop.itemId].count++;
                results[drop.itemId].totalAmount += drop.amount;
            }
        }

        // Calculate averages
        for (const itemId in results) {
            results[itemId].avgAmount = results[itemId].totalAmount / results[itemId].count;
            results[itemId].dropRate = (results[itemId].count / samples * 100).toFixed(1) + '%';
        }

        return results;
    },

    // Update loop (required for system registration, but not used)
    update(dt) {
        // Event-driven system, no update needed
    }
};

// Global registration
window.LootSystem = LootSystem;

// Auto-register with Registry if available
if (window.Registry) {
    Registry.register('LootSystem', LootSystem);
}
