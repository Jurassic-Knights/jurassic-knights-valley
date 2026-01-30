/**
 * State - Centralized state management with reactivity
 *
 * Owner: Director
 */
import { Logger } from './Logger';

type StateCallback = (newValue: any, oldValue?: any) => void;
type GlobalStateCallback = (key: string, newValue: any, oldValue?: any) => void;

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
    init(defaults: Record<string, any> = {}) {
        // Try to load from localStorage
        const saved = this.load();
        this.data = saved ? { ...defaults, ...saved } : { ...defaults };
        Logger.info('[State] Initialized');
    }

    /**
     * Get a value from state
     */
    get<T = any>(key: string): T {
        return this.data[key] as T;
    }

    /**
     * Set a value and notify listeners
     */
    set(key: string, value: any) {
        const oldValue = this.data[key];
        this.data[key] = value;
        this.emit(key, value, oldValue);
    }

    /**
     * Update multiple values at once
     */
    update(updates: Record<string, any>) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value);
        });
    }

    /**
     * Subscribe to state changes
     */
    on(key: string, callback: StateCallback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    /**
     * Emit change event
     */
    emit(key: string, newValue: any, oldValue: any) {
        if (this.listeners[key]) {
            this.listeners[key].forEach((cb) => (cb as StateCallback)(newValue, oldValue));
        }
        // Global listener for any change
        if (this.listeners['*']) {
            this.listeners['*'].forEach((cb) =>
                (cb as GlobalStateCallback)(key, newValue, oldValue)
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
    load(): Record<string, any> | null {
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
    reset(defaults: Record<string, any> = {}) {
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
