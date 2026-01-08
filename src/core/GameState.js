/**
 * GameState - Global Reactive Store
 * 
 * Centralizes transient game data (Inventory, Gold, Unlocks).
 * Decouples UI from Entities.
 */
class GameState {
    constructor() {
        this.data = {
            gold: 0,
            inventory: {}, // itemId: qty
            unlocks: [],   // List of unlocked IDs
            questId: null,
            questProgress: 0
        };

        // Ensure global access
        window.GameState = this;
        console.log('[GameState] Initialized');

        if (window.Registry) Registry.register('GameState', this);
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
        const defaultGold = (window.GameConstants && GameConstants.Core) ? GameConstants.Core.INITIAL_GOLD : 0;

        const defaults = {
            gold: defaultGold,
            ...config
        };

        this.data = { ...this.data, ...defaults };
        console.log('[GameState] State initialized. Gold:', this.data.gold);

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

        if (window.EventBus) {
            EventBus.emit('INVENTORY_UPDATED', this.data.inventory);
            // Also emit generic state change if needed?
        }
    }

    emitChange(key, value) {
        if (window.EventBus) {
            EventBus.emit('STATE_CHANGED', { key, value });
            // Specific events for convenience
            if (key === 'gold') EventBus.emit('GOLD_CHANGED', value);
        }
    }
}

// Singleton
new GameState();
