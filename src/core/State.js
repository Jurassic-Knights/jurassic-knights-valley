/**
 * State - Centralized state management with reactivity
 *
 * Owner: Director
 */

class State {
    constructor() {
        this.data = {};
        this.listeners = {};
        this.saveKey = 'jkv_save';
    }

    /**
     * Initialize state with default values
     */
    init(defaults = {}) {
        // Try to load from localStorage
        const saved = this.load();
        this.data = saved ? { ...defaults, ...saved } : { ...defaults };
        Logger.info('[State] Initialized');
    }

    /**
     * Get a value from state
     * @param {string} key - Property key
     */
    get(key) {
        return this.data[key];
    }

    /**
     * Set a value and notify listeners
     * @param {string} key - Property key
     * @param {*} value - New value
     */
    set(key, value) {
        const oldValue = this.data[key];
        this.data[key] = value;
        this.emit(key, value, oldValue);
    }

    /**
     * Update multiple values at once
     * @param {object} updates - Key-value pairs to update
     */
    update(updates) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Subscribe to state changes
     * @param {string} key - Property key to watch
     * @param {function} callback - Handler function (newValue, oldValue)
     */
    on(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    /**
     * Emit change event
     */
    emit(key, newValue, oldValue) {
        if (this.listeners[key]) {
            this.listeners[key].forEach((cb) => cb(newValue, oldValue));
        }
        // Global listener for any change
        if (this.listeners['*']) {
            this.listeners['*'].forEach((cb) => cb(key, newValue, oldValue));
        }
    }

    /**
     * Save state to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(this.data));
        } catch (e) {
            Logger.error('[State] Save failed:', e);
        }
    }

    /**
     * Load state from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(this.saveKey);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            Logger.error('[State] Load failed:', e);
            return null;
        }
    }

    /**
     * Reset state to defaults
     */
    reset(defaults = {}) {
        localStorage.removeItem(this.saveKey);
        this.data = { ...defaults };
    }
}

// Export singleton
window.GameState = new State();

