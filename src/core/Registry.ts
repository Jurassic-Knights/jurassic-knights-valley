/**
 * Service Registry - Global Dependency Injection Container
 *
 * Replaces global Manager patterns with explicit registration.
 * Allows for safer dependency resolution and initialization order auditing.
 */
import { Logger } from './Logger';

class ServiceRegistry {
    services: Map<string, unknown>;

    constructor() {
        this.services = new Map();
        Logger.info('[Registry] Initialized');
    }

    /**
     * Register a service/manager
     */
    register(name: string, instance: unknown) {
        if (this.services.has(name)) {
            Logger.error(
                `[Registry] CRITICAL: Service ${name} is being overwritten! Check initialization order.`
            );
            throw new Error(`Service ${name} already registered.`);
        }
        this.services.set(name, instance);
        Logger.info(`[Registry] Registered: ${name}`);
    }

    /**
     * Get a registered service (Safe, returns undefined if missing)
     */
    get<T = unknown>(name: string): T | undefined {
        return this.services.get(name) as T | undefined;
    }

    /**
     * assert - Get a service or throw if missing (for critical dependencies)
     */
    assert<T = unknown>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            Logger.error(`[Registry] Missing critical dependency: ${name}`);
            throw new Error(`[Registry] Critical dependency missing: ${name}`);
        }
        return service as T;
    }

    /**
     * Clear all services (for testing/reset)
     */
    clear() {
        this.services.clear();
        Logger.info('[Registry] Cleared');
    }
}

// Global Singleton
const Registry = new ServiceRegistry();

// ES6 Module Export
export { Registry };
