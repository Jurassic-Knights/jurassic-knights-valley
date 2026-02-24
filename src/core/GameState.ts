/**
 * GameState - Global Reactive Store
 *
 * Centralizes transient game data (Inventory, Gold, Unlocks).
 * Decouples UI from Entities.
 */

import { Logger } from './Logger';
import { EventBus } from './EventBus';
import { GameConstants } from '@data/GameConstants';
import { Registry } from './Registry';

interface IGameStateData {
    gold: number;
    inventory: Record<string, number>;
    unlocks: string[];
    questId: string | null;
    questProgress: number;
}

class GameState {
    data: IGameStateData;

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
     * @param {Partial<IGameStateData> | object} config - Configuration object
     */
    init(config: Partial<IGameStateData> | { constructor?: { name: string } } = {}) {
        // Handle SystemLoader calling init(game)
        // If config is the Game instance, treat as empty config
        if ('constructor' in config && config.constructor && config.constructor.name === 'Game') {
            config = {};
        }

        const safeConfig = config as Partial<IGameStateData>;

        // Load defaults from GameConstants if not provided
        const defaultGold =
            GameConstants && GameConstants.Core ? GameConstants.Core.INITIAL_GOLD : 0;

        const defaults: Partial<IGameStateData> = {
            gold: defaultGold,
            ...safeConfig
        };

        this.data = { ...this.data, ...defaults };
        Logger.info('[GameState] State initialized. Gold:', this.data.gold);
    }

    /**
     * Get a value
     * @param {K} key
     */
    get<K extends keyof IGameStateData>(key: K): IGameStateData[K] {
        return this.data[key];
    }

    /**
     * Set a value and emit change
     * @param {K} key
     * @param {IGameStateData[K]} value
     */
    set<K extends keyof IGameStateData>(key: K, value: IGameStateData[K]) {
        this.data[key] = value;
        this.emitChange(key, value);
    }

    /**
     * Update inventory and emit specific inventory event
     * @param {string} itemId
     * @param {number} qty
     */
    updateInventory(itemId: string, qty: number) {
        this.data.inventory[itemId] = qty;

        if (EventBus) {
            EventBus.emit('INVENTORY_UPDATED', this.data.inventory);
        }
    }

    emitChange<K extends keyof IGameStateData>(key: K, value: IGameStateData[K]) {
        if (EventBus) {
            EventBus.emit('STATE_CHANGED', { key, value });
            // Specific events for convenience
            if (key === 'gold') EventBus.emit('GOLD_CHANGED', value as number);
        }
    }
}

// Create singleton and export
const gameState = new GameState();
if (Registry) Registry.register('GameState', gameState);

export { GameState, gameState };
