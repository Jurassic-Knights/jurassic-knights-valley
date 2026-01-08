/**
 * EventBus - Simple Publish/Sub Pattern for decoupling systems
 * 
 * Allows systems to communicate without direct dependencies.
 * usage: EventBus.emit('EVENT_NAME', data)
 *        EventBus.on('EVENT_NAME', (data) => { ... })
 */
class EventBusHub {
    constructor() {
        this.listeners = {};
        console.log('[EventBus] Initialized');
    }

    /**
     * Subscribe to an event
     * @param {string} eventName 
     * @param {function} callback 
     */
    on(eventName, callback) {
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
    off(eventName, callback) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback);
    }

    /**
     * Emit an event
     * @param {string} eventName 
     * @param {any} data 
     */
    emit(eventName, data) {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName].forEach(callback => callback(data));
    }
}

// Global Singleton
window.EventBus = new EventBusHub();
if (window.Registry) Registry.register('EventBus', window.EventBus);

// Event Constants moved to src/config/Events.js
