/**
 * EconomySystem
 * Manages game currency, transactions, and resource validation.
 *
 * Replaces the legacy Economy.js object literal.
 */

import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameConstants, getConfig } from '../data/GameConstants';
import { GameState } from '../core/State';
import { IslandManager } from '../world/IslandManager';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { AudioManager } from '../audio/AudioManager';
import { VFXTriggerService } from './VFXTriggerService';
import { spawnManager } from './SpawnManager';
import { Registry } from '../core/Registry';


class EconomySystem {
    game: any = null;

    constructor() {
        Logger.info('[EconomySystem] Constructed');
    }

    init(game: any) {
        this.game = game;
        this.initListeners();
        Logger.info('[EconomySystem] Initialized');
    }

    initListeners() {
        if (!EventBus) return;

        // Listen for transaction requests
        EventBus.on(GameConstants.Events.REQUEST_UNLOCK, (data: any) => this.handleUnlockRequest(data));

        // Listen for direct gold modification requests (e.g. from debug or cheats)
        EventBus.on(GameConstants.Events.ADD_GOLD, (amount: any) => this.addGold(amount));

        // Listen for upgrade requests
        EventBus.on(GameConstants.Events.REQUEST_UPGRADE, (data: any) =>
            this.handleUpgradeRequest(data)
        );
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
        return GameState ? GameState.get('gold') || 0 : 0;
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
        if (GameState) {
            GameState.set('gold', newGold);
        }

        // Emit Update
        if (EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, hero.inventory);
        }

        Logger.info(`[EconomySystem] Spent ${amount}. New Balance: ${newGold}`);
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
        if (GameState) {
            GameState.set('gold', newGold);
        }

        // Emit Update
        if (EventBus) {
            EventBus.emit(GameConstants.Events.INVENTORY_UPDATED, hero.inventory);
        }

        Logger.info(`[EconomySystem] Added ${amount}. New Balance: ${newGold}`);
    }

    /**
     * Handle a request to unlock an island
     * @param {object} data - { gridX, gridY, cost }
     */
    handleUnlockRequest(data) {
        const { gridX, gridY, cost } = data;

        if (this.spendGold(cost)) {
            // Success
            if (IslandManager) {
                const success = IslandManager.unlockIsland(gridX, gridY);
                if (success) {
                    // Trigger Unlock VFX at center of new zone
                    // Note: IslandManager already emits 'ISLAND_UNLOCKED' which UIManager listens to
                    // But triggering VFX via GameInstance logic?
                    // Let's keep it simple: IslandManager handles the "Logic" of unlocking
                    if (AudioManager) AudioManager.playSFX('sfx_ui_unlock');

                    // We can emit a specific APPROVED event if needed, but IslandManager action is enough
                }
            }
        } else {
            // Failed
            Logger.info('[EconomySystem] Insufficient funds for unlock');
            if (AudioManager) AudioManager.playSFX('sfx_ui_error');
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
            if (IslandUpgrades) {
                const success = IslandUpgrades.applyUpgrade(gridX, gridY, type);

                if (success) {
                    if (AudioManager) AudioManager.playSFX('sfx_ui_buy');

                    // Trigger Logic Updates based on upgrade type
                    // VFX
                    const hero = this.game.hero;
                    if (hero && VFXTriggerService) {
                        VFXTriggerService.triggerPurchaseVFX(hero.x, hero.y);
                    }

                    // Logic
                    if (spawnManager) {
                        if (type === 'resourceSlots') {
                            spawnManager.refreshIslandResources(gridX, gridY);
                        } else if (type === 'respawnTime') {
                            spawnManager.updateIslandRespawnTimers(gridX, gridY);
                        }
                    }

                    // Emit Success for UI to re-render
                    if (EventBus) {
                        EventBus.emit(GameConstants.Events.UPGRADE_PURCHASED, {
                            gridX,
                            gridY,
                            type
                        });
                    }
                }
            }
        } else {
            if (AudioManager) AudioManager.playSFX('sfx_ui_error');
            Logger.info('[EconomySystem] Insufficient funds for upgrade');
        }
    }
}

// Create singleton and export
const economySystem = new EconomySystem();
if (Registry) Registry.register('EconomySystem', economySystem);

export { EconomySystem, economySystem };
