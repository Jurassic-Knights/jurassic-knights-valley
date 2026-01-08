/**
 * Service Registry - Global Dependency Injection Container
 * 
 * Replaces global window.Manager patterns with explicit registration.
 * Allows for safer dependency resolution and initialization order auditing.
 */
class ServiceRegistry {
    constructor() {
        this.services = new Map();
        console.log('[Registry] Initialized');

        // Expose globally for now
        window.Registry = this;
    }

    /**
     * Register a service/manager
     * @param {string} name 
     * @param {object} instance 
     */
    register(name, instance) {
        if (this.services.has(name)) {
            console.error(`[Registry] CRITICAL: Service ${name} is being overwritten! Check initialization order.`);
            throw new Error(`Service ${name} already registered.`);
        }
        this.services.set(name, instance);
        console.log(`[Registry] Registered: ${name}`);
    }

    /**
     * Get a registered service (Safe, returns undefined if missing)
     * @param {string} name 
     * @returns {object|undefined}
     */
    get(name) {
        return this.services.get(name);
    }

    /**
     * assert - Get a service or throw if missing (for critical dependencies)
     * @param {string} name 
     */
    assert(name) {
        const service = this.services.get(name);
        if (!service) {
            console.error(`[Registry] Missing critical dependency: ${name}`);
            throw new Error(`[Registry] Critical dependency missing: ${name}`);
        }
        return service;
    }

    /**
     * Clear all services (for testing/reset)
     */
    clear() {
        this.services.clear();
        console.log('[Registry] Cleared');
    }
}

// Global Singleton
// We intentionally do NOT assign to window.Registry separately here, 
// the constructor handles it to ensure `this` context is correct if needed.
new ServiceRegistry();
