/**
 * CraftingManager - Manages recipes, slots, and production logic
 *
 * Logic:
 * - 12 Slots total (only #1 unlocked initially)
 * - Crafting consumes resources immediately
 * - Production takes time
 * - Finished items must be claimed (or auto-added, for now auto-add/notify)
 */

import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';
import { EventBus } from '@core/EventBus';
import { GameState } from '@core/State';
import { GameInstance } from '@core/Game';
// import removed
import { spawnCraftedItem } from './SpawnHelper';
import { WorldManager } from '../world/WorldManager';

import { GameConstants } from '@data/GameConstants';
import { economySystem as EconomySystem } from '@systems/EconomySystem';

export interface CraftingRecipe {
    id: string;
    name: string;
    description: string;
    type: string;
    fuelCost: number;
    ingredients: Record<string, number>;
    duration: number; // in seconds
    sellPrice: number;
    outputIcon: string;
}

export interface CraftingSlot {
    id: number;
    unlocked: boolean;
    status: 'idle' | 'crafting' | 'complete';
    recipeId: string | null;
    quantity: number;
    startTime: number;
    duration: number;
    item: unknown | null; // Placeholder for future item object
}

const CraftingManager = {
    // Configuration
    maxSlots: 12,
    unlockedSlots: 1, // Start with 1, others purchased

    // State
    slots: [] as CraftingSlot[],

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
    ] as CraftingRecipe[],

    init() {
        // Load from GameState
        if (GameState) {
            this.unlockedSlots = GameState.get('forge_unlocked_slots') || 1;
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

    getRecipe(id: string): CraftingRecipe | undefined {
        return this.recipes.find((r) => r.id === id);
    },

    /**
     * Unlock a specific slot
     */
    unlockSlot(slotId: number): boolean {
        if (slotId < 0 || slotId >= this.maxSlots) return false;

        const cost = GameConstants.Crafting.FORGE_SLOT_UNLOCK_COST;

        if (!GameState) return false;
        const gold = (GameState.get('gold') as number) || 0;

        if (gold < cost) return false;

        // Deduct Gold
        // Deduct Gold
        if (EconomySystem) {
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
     */
    startCrafting(slotId: number, recipeId: string, quantity: number): boolean {
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
        const ms = GameConstants.Timing.MS_PER_SECOND;
        slot.duration = recipe.duration * ms; // Duration PER ITEM
        slot.startTime = Date.now();

        Logger.info(`[Crafting] Started queue of ${quantity}x ${recipe.name} in Slot ${slotId}`);
        return true;
    },

    /**
     * Update loop (called by Game.js)
     * Handles timer completion
     */
    update(_dt: number) {
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

    completeCrafting(slot: CraftingSlot) {
        if (!slot.recipeId) return;
        const recipe = this.getRecipe(slot.recipeId);
        if (!recipe) return;

        // 1. Logic: Add item to inventory
        if (GameInstance && GameInstance.hero) {
            const inv = GameInstance.hero.inventory;
            inv[recipe.id] = (inv[recipe.id] || 0) + 1;

            // Update UI via EventBus
            if (EventBus) {
                EventBus.emit('INVENTORY_UPDATED', inv);
            }
        }

        Logger.info(`[Crafting] Crafted 1x ${recipe.name}, Remaining: ${slot.quantity - 1}`);

        // 2. Visuals: Spawn via SpawnHelper
        let spawnX = 0;
        let spawnY = 0;
        if (WorldManager) {
            const spawn = WorldManager.getHeroSpawnPosition();
            spawnX = spawn ? spawn.x + 100 : 80000;
            spawnY = spawn ? spawn.y + 100 : 80000;
        } else {
            spawnX = 80000;
            spawnY = 80000;
        }
        spawnCraftedItem(spawnX, spawnY, recipe.id, {
            amount: 1,
            icon: recipe.outputIcon
        });

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

    canAfford(recipe: CraftingRecipe, quantity: number): boolean {
        // Dependencies
        if (!GameInstance || !GameInstance.hero || !GameInstance.hero.inventory) {
            // Fallback
            return false;
        }

        const inv = GameInstance.hero.inventory;

        const woodNeeded = recipe.fuelCost * quantity;
        const woodHave = inv['wood_t1_01'] || 0;
        if (woodHave < woodNeeded) return false;

        for (const [ingId, count] of Object.entries(recipe.ingredients) as [string, number][]) {
            const needed = count * quantity;
            const have = inv[ingId] || 0;
            if (have < needed) return false;
        }

        return true;
    },

    consumeResources(recipe: CraftingRecipe, quantity: number) {
        if (!GameInstance || !GameInstance.hero || !GameInstance.hero.inventory) return;

        const inv = GameInstance.hero.inventory;

        // Remove Fuel
        inv['wood_t1_01'] -= recipe.fuelCost * quantity;

        // Remove Ingredients
        for (const [ingId, count] of Object.entries(recipe.ingredients) as [string, number][]) {
            inv[ingId] -= count * quantity;
        }

        // Refresh UI via event (InventoryUI listens to this)
        if (EventBus) {
            EventBus.emit('INVENTORY_UPDATED', inv);
        }
    },

    getMaxCraftable(recipe: CraftingRecipe): number {
        if (!GameInstance || !GameInstance.hero || !GameInstance.hero.inventory) return 0;

        const inv = GameInstance.hero.inventory;

        // Limit by wood
        let max = Math.floor((inv['wood_t1_01'] || 0) / recipe.fuelCost);

        // Limit by ingredients
        for (const [ingId, count] of Object.entries(recipe.ingredients) as [string, number][]) {
            const possible = Math.floor((inv[ingId] || 0) / count);
            max = Math.min(max, possible);
        }

        return max;
    }
};

// Export
if (Registry) Registry.register('CraftingManager', CraftingManager);

// ES6 Module Export
export { CraftingManager };
