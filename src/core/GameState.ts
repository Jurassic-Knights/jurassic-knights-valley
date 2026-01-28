/**
 * GameState - Global Reactive Store
 *
 * Centralizes transient game data (Inventory, Gold, Unlocks).
 * Decouples UI from Entities.
 */

import { Logger } from './Logger';
import { EventBus } from './EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { Registry } from './Registry';

class GameState {
    data: {
        gold: number;
        inventory: Record<string, number>;
        unlocks: string[];
        questId: string | null;
        questProgress: number;
    };

    constructor() {
        this.data = {
            gold: 0,
            inventory: {},
            unlocks: [],
            questId: null,
            questProgress: 0
        };

        Logger.info('[GameState] Initialized');
    }

    /**
     * Initialize state with defaults
     * @param {object} config - Configuration object OR game instance (if called by SystemLoader)
     */
    init(config = {}) {
        // Handle SystemLoader calling init(game)
        // If config is the Game instance, treat as empty config
        if (config && config.constructor && config.constructor.name === 'Game') {
            config = {};
        }

        // Load defaults from GameConstants if not provided
        const defaultGold =
            GameConstants && GameConstants.Core ? GameConstants.Core.INITIAL_GOLD : 0;

        const defaults = {
            gold: defaultGold,
            ...config
        };

        this.data = { ...this.data, ...defaults };
        Logger.info('[GameState] State initialized. Gold:', this.data.gold);

        // Sync back to hero if needed? Or assume Hero is source of truth for some things?
        // For now, simple merge.
    }

    /**
     * Get a value
     * @param {string} key
     */
    get(key) {
        return this.data[key];
    }

    /**
     * Set a value and emit change
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        this.data[key] = value;
        this.emitChange(key, value);
    }

    /**
     * Update inventory and emit specific inventory event
     * @param {string} itemId
     * @param {number} qty
     */
    updateInventory(itemId, qty) {
        this.data.inventory[itemId] = qty;

        if (EventBus) {
            EventBus.emit('INVENTORY_UPDATED', this.data.inventory);
            // Also emit generic state change if needed?
        }
    }

    emitChange(key, value) {
        if (EventBus) {
            EventBus.emit('STATE_CHANGED', { key, value });
            // Specific events for convenience
            if (key === 'gold') EventBus.emit('GOLD_CHANGED', value);
        }
    }
}

// Create singleton and export
const gameState = new GameState();
if (Registry) Registry.register('GameState', gameState);

export { GameState, gameState };
