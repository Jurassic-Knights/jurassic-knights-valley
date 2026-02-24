/**
 * EconomySystem
 * Manages game currency, transactions, and resource validation.
 *
 * Replaces the legacy Economy.js object literal.
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
// import { GameConstants } from '@data/GameConstants';
import { GameState } from '@core/State';
import { Registry } from '@core/Registry';
import type { IGame } from '../types/core';

class EconomySystem {
    game: IGame | null = null;

    constructor() {
        Logger.info('[EconomySystem] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        this.initListeners();
        Logger.info('[EconomySystem] Initialized');
    }

    initListeners() {
        if (!EventBus) return;

        // Listen for direct gold modification requests (e.g. from debug or cheats)
        EventBus.on('ADD_GOLD', (data: { amount: number }) => this.addGold(data.amount));
    }

    update(_dt: number) {
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
        return GameState ? GameState.get<number>('gold') || 0 : 0;
    }

    /**
     * Internal method to deduct gold
     * @param {number} amount
     */
    spendGold(amount: number) {
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
        if (EventBus && hero && hero.inventory) {
            EventBus.emit('INVENTORY_UPDATED', hero.inventory);
        }

        Logger.info(`[EconomySystem] Spent ${amount}. New Balance: ${newGold}`);
        return true;
    }

    /**
     * Internal method to add gold
     * @param {number} amount
     */
    addGold(amount: number) {
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
        if (EventBus && hero && hero.inventory) {
            EventBus.emit('INVENTORY_UPDATED', hero.inventory);
        }

        Logger.info(`[EconomySystem] Added ${amount}. New Balance: ${newGold}`);
    }
}

// Create singleton and export
const economySystem = new EconomySystem();
if (Registry) Registry.register('EconomySystem', economySystem);

export { EconomySystem, economySystem };
