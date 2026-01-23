/**
 * EventBus - Simple Publish/Sub Pattern for decoupling systems
 *
 * Allows systems to communicate without direct dependencies.
 * usage: EventBus.emit('EVENT_NAME', data)
 *        EventBus.on('EVENT_NAME', (data) => { ... })
 */
import { Logger } from './Logger';

class EventBusHub {
    listeners: Record<string, ((data: any) => void)[]>;

    constructor() {
        this.listeners = {};
        Logger.info('[EventBus] Initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} eventName
     * @param {function} callback
     */
    on(eventName: string, callback: (data: any) => void) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName
     * @param {function} callback
     */
    off(eventName: string, callback: (data: any) => void) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter((cb) => cb !== callback);
    }

    /**
     * Emit an event
     * @param {string} eventName
     * @param {any} data
     */
    emit(eventName: string, data?: any) {
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
