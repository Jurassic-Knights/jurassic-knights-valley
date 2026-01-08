/**
 * EconomySystem
 * Manages game currency, transactions, and resource validation.
 * 
 * Replaces the legacy Economy.js object literal.
 */
class EconomySystem {
    constructor() {
        this.game = null;
        console.log('[EconomySystem] Constructed');
    }

    init(game) {
        this.game = game;
        this.initListeners();
        console.log('[EconomySystem] Initialized');
    }

    initListeners() {
        if (!window.EventBus) return;

        // Listen for transaction requests
        EventBus.on(GameConstants.Events.REQUEST_UNLOCK, (data) => this.handleUnlockRequest(data));

        // Listen for direct gold modification requests (e.g. from debug or cheats)
        EventBus.on(GameConstants.Events.ADD_GOLD, (amount) => this.addGold(amount));

        // Listen for upgrade requests
        EventBus.on(GameConstants.Events.REQUEST_UPGRADE, (data) => this.handleUpgradeRequest(data));
    }

    update(dt) {
        // No per-frame logic needed currently
    }

    /**
     * Get current gold amount
     */
    getGold() {
        const hero = this.game?.hero;
        if (hero && hero.inventory) {
            return hero.inventory.gold || 0;
        }
        return window.GameState ? (window.GameState.get('gold') || 0) : 0;
    }

    /**
     * Internal method to deduct gold
     * @param {number} amount 
     */
    spendGold(amount) {
        const currentGold = this.getGold();
        if (currentGold < amount) return false;

        const newGold = currentGold - amount;

        // Update Hero
        const hero = this.game?.hero;
        if (hero && hero.inventory) {
            hero.inventory.gold = newGold;
        }

        // Update Persistence
        if (window.GameState) {
            window.GameState.set('gold', newGold);
        }

        // Emit Update
        if (window.EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, hero.inventory);
        }

        console.log(`[EconomySystem] Spent ${amount}. New Balance: ${newGold}`);
        return true;
    }

    /**
     * Internal method to add gold
     * @param {number} amount 
     */
    addGold(amount) {
        const currentGold = this.getGold();
        const newGold = currentGold + amount;

        // Update Hero
        const hero = this.game?.hero;
        if (hero && hero.inventory) {
            hero.inventory.gold = newGold;
        }

        // Update Persistence
        if (window.GameState) {
            window.GameState.set('gold', newGold);
        }

        // Emit Update
        if (window.EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, hero.inventory);
        }

        console.log(`[EconomySystem] Added ${amount}. New Balance: ${newGold}`);
    }

    /**
     * Handle a request to unlock an island
     * @param {object} data - { gridX, gridY, cost }
     */
    handleUnlockRequest(data) {
        const { gridX, gridY, cost } = data;

        if (this.spendGold(cost)) {
            // Success
            if (window.IslandManager) {
                const success = IslandManager.unlockIsland(gridX, gridY);
                if (success) {
                    // Trigger Unlock VFX at center of new zone
                    // Note: IslandManager already emits 'ISLAND_UNLOCKED' which UIManager listens to
                    // But triggering VFX via GameInstance logic? 
                    // Let's keep it simple: IslandManager handles the "Logic" of unlocking
                    if (window.AudioManager) AudioManager.playSFX('sfx_ui_unlock');

                    // We can emit a specific APPROVED event if needed, but IslandManager action is enough
                }
            }
        } else {
            // Failed
            console.log('[EconomySystem] Insufficient funds for unlock');
            if (window.AudioManager) AudioManager.playSFX('sfx_ui_error');
            // Optional: Emit TRANSACTION_FAILED for UI feedback
        }
    }

    /**
     * Handle upgrade purchase request
     * @param {object} data - { gridX, gridY, type, cost }
     */
    handleUpgradeRequest(data) {
        const { gridX, gridY, type, cost } = data;

        if (this.spendGold(cost)) {
            // Apply Upgrade Logic
            if (window.IslandUpgrades) {
                const success = IslandUpgrades.applyUpgrade(gridX, gridY, type);

                if (success) {
                    if (window.AudioManager) AudioManager.playSFX('sfx_ui_buy');

                    // Trigger Logic Updates based on upgrade type
                    // VFX
                    const hero = this.game.hero;
                    if (hero && window.VFXTriggerService) {
                        VFXTriggerService.triggerPurchaseVFX(hero.x, hero.y);
                    }

                    // Logic
                    if (window.SpawnManager) {
                        if (type === 'resourceSlots') {
                            SpawnManager.refreshIslandResources(gridX, gridY);
                        } else if (type === 'respawnTime') {
                            SpawnManager.updateIslandRespawnTimers(gridX, gridY);
                        }
                    }

                    // Emit Success for UI to re-render
                    if (window.EventBus) {
                        EventBus.emit(GameConstants.Events.UPGRADE_PURCHASED, { gridX, gridY, type });
                    }
                }
            }
        } else {
            if (window.AudioManager) AudioManager.playSFX('sfx_ui_error');
            console.log('[EconomySystem] Insufficient funds for upgrade');
        }
    }
}

// Global & Register
window.EconomySystem = new EconomySystem();
if (window.Registry) Registry.register('EconomySystem', window.EconomySystem);
