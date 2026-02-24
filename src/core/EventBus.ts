/**
 * EventBus - Simple Publish/Sub Pattern for decoupling systems
 *
 * Allows systems to communicate without direct dependencies.
 * usage: EventBus.emit('EVENT_NAME', data)
 *        EventBus.on('EVENT_NAME', (data) => { ... })
 */
import { Logger } from './Logger';
import type { AppEventMap } from '../types/events';

// Map specific callbacks precisely to their defined event payload
export type StrictEventCallback<K extends keyof AppEventMap> = (data: AppEventMap[K]) => void;

class EventBusHub {
    // We must type-cast internally because JS objects can't perfectly hold mapped tuple generic values at runtime
    listeners: { [K in keyof AppEventMap]?: StrictEventCallback<K>[] };

    constructor() {
        this.listeners = {};
        Logger.info('[EventBus] Initialized');
    }

    /**
     * Subscribe to a strictly-typed event
     */
    on<K extends keyof AppEventMap>(eventName: K, callback: StrictEventCallback<K>): void {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        // Force push, as we know the caller provided the correct type
        (this.listeners[eventName] as unknown[]).push(callback as unknown);
    }

    /**
     * Unsubscribe from an event
     */
    off<K extends keyof AppEventMap>(eventName: K, callback: StrictEventCallback<K>): void {
        if (!this.listeners[eventName]) return;

        // Use unknown casting to bypass mapped tuple constraint inference issues
        const listeners = this.listeners[eventName] as unknown as StrictEventCallback<K>[];
        this.listeners[eventName] = listeners.filter((cb) => cb !== callback) as unknown as this["listeners"][K];
    }

    /**
     * Emit an event with type-safe payload enforcement
     */
    emit<K extends keyof AppEventMap>(eventName: K, ...args: AppEventMap[K] extends undefined ? [] : [AppEventMap[K]]): void {
        if (!this.listeners[eventName]) return;

        const data = args[0] as AppEventMap[K];

        this.listeners[eventName]!.forEach((callback) => {
            try {
                callback(data);
            } catch (err) {
                Logger.error(`[EventBus] Error in listener for typeof '${String(eventName)}':`, err);
            }
        });
    }
}

// Global Singleton
const EventBus = new EventBusHub();

// ES6 Module Export
export { EventBus };
