/**
 * State - Centralized state management with reactivity
 *
 * Owner: Director
 */
import { Logger } from './Logger';

type StateCallback<T = unknown> = (newValue: T, oldValue?: T) => void;
type GlobalStateCallback<T = unknown> = (key: string, newValue: T, oldValue?: T) => void;

class State {
    data: Record<string, unknown>;
    listeners: Record<string, (StateCallback | GlobalStateCallback)[]>;
    saveKey: string;

    constructor() {
        this.data = {};
        this.listeners = {};
        this.saveKey = 'jkv_save';
    }

    /**
     * Initialize state with default values
     */
    init(defaults: Record<string, unknown> = {}) {
        // Try to load from localStorage
        const saved = this.load();
        this.data = saved ? { ...defaults, ...saved } : { ...defaults };
        Logger.info('[State] Initialized');
    }

    /**
     * Get a value from state
     */
    get<T = unknown>(key: string): T {
        return this.data[key] as T;
    }

    /**
     * Set a value and notify listeners
     */
    set<T = unknown>(key: string, value: T) {
        const oldValue = this.data[key];
        this.data[key] = value;
        this.emit(key, value, oldValue);
    }

    /**
     * Update multiple values at once
     */
    update(updates: Record<string, unknown>) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Subscribe to state changes
     */
    on<T = unknown>(key: string, callback: StateCallback<T>) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    /**
     * Emit change event
     */
    emit<T = unknown>(key: string, newValue: T, oldValue?: T) {
        if (this.listeners[key]) {
            this.listeners[key].forEach((cb) => (cb as StateCallback<T>)(newValue, oldValue));
        }
        // Global listener for any change
        if (this.listeners['*']) {
            this.listeners['*'].forEach((cb) =>
                (cb as GlobalStateCallback<T>)(key, newValue, oldValue)
            );
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
    load(): Record<string, unknown> | null {
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
    reset(defaults: Record<string, unknown> = {}) {
        localStorage.removeItem(this.saveKey);
        this.data = { ...defaults };
    }
}

// Create singleton
const GameState = new State();

import { Registry } from './Registry';
Registry.register('GameState', GameState);

// ES6 Module Export
export { State, GameState };
