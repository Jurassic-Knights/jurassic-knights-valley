/**
 * EventBus - Simple Publish/Sub Pattern for decoupling systems
 *
 * Allows systems to communicate without direct dependencies.
 * usage: EventBus.emit('EVENT_NAME', data)
 *        EventBus.on('EVENT_NAME', (data) => { ... })
 */
import { Logger } from './Logger';
import type { EventCallback } from '../types/core';

class EventBusHub {
    listeners: Record<string, EventCallback[]>;

    constructor() {
        this.listeners = {};
        Logger.info('[EventBus] Initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} eventName
     * @param {function} callback
     */
    on<T = unknown>(eventName: string, callback: EventCallback<T>) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback as EventCallback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName
     * @param {function} callback
     */
    off<T = unknown>(eventName: string, callback: EventCallback<T>) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter((cb) => cb !== callback as EventCallback);
    }

    /**
     * Emit an event
     * @param {string} eventName
     * @param {any} data
     */
    emit<T = unknown>(eventName: string, data?: T) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName].forEach((callback) => {
            try {
                callback(data);
            } catch (err) {
                console.error(`[EventBus] Error in listener for '${eventName}':`, err);
            }
        });
    }
}

// Global Singleton
const EventBus = new EventBusHub();

// ES6 Module Export
export { EventBus };
