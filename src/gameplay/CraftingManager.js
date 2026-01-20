/**
 * CraftingManager - Manages recipes, slots, and production logic
 *
 * Logic:
 * - 12 Slots total (only #1 unlocked initially)
 * - Crafting consumes resources immediately
 * - Production takes time
 * - Finished items must be claimed (or auto-added, for now auto-add/notify)
 */

const CraftingManager = {
    // Configuration
    maxSlots: 12,
    unlockedSlots: 1, // Start with 1, others purchased

    // State
    slots: [], // Array of slot objects { id, status: 'idle'|'crafting'|'complete', recipeId, quantity, startTime, duration }

    // Recipe Registry (Using entity IDs from src/entities/)
    recipes: [
        {
            id: 'metal_t1_01',
            name: 'Scrap Plate',
            description: 'Basic armor plating salvaged from debris.',
            type: 'trade_good',
            fuelCost: 1,
            ingredients: { scraps_t1_01: 2 },
            duration: 5,
            sellPrice: 4,
            outputIcon: 'metal_t1_01'
        },
        {
            id: 'metal_t2_01',
            name: 'Iron Ingot',
            description: 'Refined iron, heavy and reliable.',
            type: 'trade_good',
            fuelCost: 3,
            ingredients: { minerals_t1_01: 2 },
            duration: 20,
            sellPrice: 15,
            outputIcon: 'metal_t2_01'
        },
        {
            id: 'mechanical_t1_01',
            name: 'Trench Tool',
            description: 'Standard issue digging implement.',
            type: 'equipment',
            fuelCost: 5,
            ingredients: { scraps_t1_01: 1, minerals_t1_01: 3 },
            duration: 45,
            sellPrice: 40,
            outputIcon: 'mechanical_t1_01'
        }
    ],

    init() {
        // Load from GameState
        if (window.GameState) {
            this.unlockedSlots = window.GameState.get('forge_unlocked_slots') || 1;
        }
        this.initializeSlots();
        Logger.info(`[CraftingManager] Initialized with ${this.unlockedSlots} slots`);
    },

    initializeSlots() {
        this.slots = [];
        for (let i = 0; i < this.maxSlots; i++) {
            this.slots.push({
                id: i,
                unlocked: i < this.unlockedSlots,
                status: 'idle', // idle, crafting
                recipeId: null,
                quantity: 0,
                startTime: 0,
                duration: 0,
                item: null
            });
        }
    },

    getRecipe(id) {
        return this.recipes.find((r) => r.id === id);
    },

    /**
     * Unlock a specific slot
     * @param {number} slotId
     */
    unlockSlot(slotId) {
        if (slotId < 0 || slotId >= this.maxSlots) return false;

        // Cost: 1000 Gold (Fixed for now)
        const cost = 1000;

        if (!window.GameState) return false;
        const gold = GameState.get('gold') || 0;

        if (gold < cost) return false;

        // Deduct Gold
        // Deduct Gold
        if (window.EconomySystem) {
            if (!EconomySystem.spendGold(cost)) return false;
        } else {
            GameState.set('gold', gold - cost);
        }

        // Unlock
        this.unlockedSlots++;
        GameState.set('forge_unlocked_slots', this.unlockedSlots);

        // Update slot object
        const slot = this.slots[slotId];
        if (slot) slot.unlocked = true;

        Logger.info(`[Crafting] Unlocked Slot ${slotId}`);
        return true;
    },

    /**
     * Start crafting process
     * @param {number} slotId
     * @param {string} recipeId
     * @param {number} quantity
     */
    startCrafting(slotId, recipeId, quantity) {
        const slot = this.slots[slotId];
        if (!slot) {
            Logger.error(`[Crafting] Invalid slot ${slotId}`);
            return false;
        }
        if (!slot.unlocked) {
            Logger.error(`[Crafting] Slot ${slotId} is locked`);
            return false;
        }
        if (slot.status !== 'idle') {
            Logger.error(`[Crafting] Slot ${slotId} is busy: ${slot.status}`);
            return false;
        }

        const recipe = this.getRecipe(recipeId);
        if (!recipe) {
            Logger.error(`[Crafting] Unknown recipe ${recipeId}`);
            return false;
        }

        // Check costs
        if (!this.canAfford(recipe, quantity)) {
            Logger.warn(`[Crafting] Cannot afford ${quantity}x ${recipe.id}`);
            return false;
        }

        // Consume resources
        this.consumeResources(recipe, quantity);

        // Update Slot State
        slot.status = 'crafting';
        slot.recipeId = recipeId;
        slot.quantity = quantity;
        slot.duration = recipe.duration * 1000; // Duration PER ITEM
        slot.startTime = Date.now();

        Logger.info(`[Crafting] Started queue of ${quantity}x ${recipe.name} in Slot ${slotId}`);
        return true;
    },

    /**
     * Update loop (called by Game.js)
     * Handles timer completion
     */
    update(dt) {
        const now = Date.now();

        for (const slot of this.slots) {
            if (slot.status === 'crafting') {
                const elapsed = now - slot.startTime;

                if (elapsed >= slot.duration) {
                    this.completeCrafting(slot);
                }
            }
        }
    },

    completeCrafting(slot) {
        const recipe = this.getRecipe(slot.recipeId);
        if (!recipe) return;

        // 1. Logic: Add item to inventory
        if (window.GameInstance && window.GameInstance.hero) {
            const inv = GameInstance.hero.inventory;
            inv[recipe.id] = (inv[recipe.id] || 0) + 1;

            // Update UI immediately if open
            if (window.UIManager && UIManager.updateResources) {
                UIManager.updateResources(inv);
            }
        }

        Logger.info(`[Crafting] Crafted 1x ${recipe.name}, Remaining: ${slot.quantity - 1}`);

        // 2. Visuals: Spawn via SpawnManager
        if (window.SpawnManager) {
            let spawnX = 0,
                spawnY = 0;

            // Calculate Forge Building Position (Matched to HomeBase.js)
            if (window.IslandManager) {
                const home = IslandManager.getHomeIsland();
                if (home) {
                    const bounds = IslandManager.getPlayableBounds(home);
                    if (bounds) {
                        const forgeSize = 250;
                        // Bottom-Left of Safe Area
                        spawnX = bounds.x + forgeSize / 2 + 30;
                        spawnY = bounds.y + bounds.height - forgeSize / 2 - 30;
                    }
                }
            }

            if (spawnX === 0) {
                // Fallback
                const home = IslandManager ? IslandManager.getHomeIsland() : null;
                spawnX = home ? home.worldX + home.width / 2 : 0;
                spawnY = home ? home.worldY + home.height / 2 : 0;
            }

            SpawnManager.spawnCraftedItem(spawnX, spawnY, recipe.id, {
                amount: 1,
                icon: recipe.outputIcon
            });
        }

        // 3. Queue Logic
        slot.quantity--;

        if (slot.quantity > 0) {
            // Next item
            slot.startTime = Date.now(); // Reset timer
            // Keep status 'crafting'
        } else {
            // Done
            slot.status = 'idle';
            slot.recipeId = null;
            slot.quantity = 0;
            slot.startTime = 0;
            slot.duration = 0;
        }
    },

    canAfford(recipe, quantity) {
        // Dependencies
        if (
            !window.GameInstance ||
            !window.GameInstance.hero ||
            !window.GameInstance.hero.inventory
        ) {
            // Fallback
            return false;
        }

        const inv = GameInstance.hero.inventory;

        const woodNeeded = recipe.fuelCost * quantity;
        const woodHave = inv['wood_t1_01'] || 0;
        if (woodHave < woodNeeded) return false;

        for (const [ingId, count] of Object.entries(recipe.ingredients)) {
            const needed = count * quantity;
            const have = inv[ingId] || 0;
            if (have < needed) return false;
        }

        return true;
    },

    consumeResources(recipe, quantity) {
        if (
            !window.GameInstance ||
            !window.GameInstance.hero ||
            !window.GameInstance.hero.inventory
        )
            return;

        const inv = GameInstance.hero.inventory;

        // Remove Fuel
        inv['wood_t1_01'] -= recipe.fuelCost * quantity;

        // Remove Ingredients
        for (const [ingId, count] of Object.entries(recipe.ingredients)) {
            inv[ingId] -= count * quantity;
        }

        // Refresh UI via event (InventoryUI listens to this)
        if (window.EventBus) {
            EventBus.emit('INVENTORY_UPDATED', inv);
        }
    },

    getMaxCraftable(recipe) {
        if (
            !window.GameInstance ||
            !window.GameInstance.hero ||
            !window.GameInstance.hero.inventory
        )
            return 0;

        const inv = GameInstance.hero.inventory;

        // Limit by wood
        let max = Math.floor((inv['wood_t1_01'] || 0) / recipe.fuelCost);

        // Limit by ingredients
        for (const [ingId, count] of Object.entries(recipe.ingredients)) {
            const possible = Math.floor((inv[ingId] || 0) / count);
            max = Math.min(max, possible);
        }

        return max;
    }
};

// Export
window.CraftingManager = CraftingManager;
if (window.Registry) Registry.register('CraftingManager', CraftingManager);

