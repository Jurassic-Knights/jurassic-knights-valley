/**
 * UIBinder - Component to safely interact with DOM
 *
 * Wraps document.getElementById with logging and safety checks.
 * Prevents system crashes when UI elements are missing (e.g. during A/B testing or loading).
 */

import { Logger } from './Logger';

class UIBinderService {
    private cache: Map<string, HTMLElement | null> = new Map();

    /**
     * Get an element by ID safely.
     * Logs a warning only once per element to avoid console spam.
     * @param {string} id
     * @returns {HTMLElement | null}
     */
    get(id: string): HTMLElement | null {
        if (this.cache.has(id)) {
            return this.cache.get(id) || null;
        }

        const el = document.getElementById(id);
        if (!el) {
            Logger.warn(`[UIBinder] Element not found: #${id}`);
            this.cache.set(id, null); // Cache failure to suppress future warnings during this session
            return null;
        }

        this.cache.set(id, el);
        return el;
    }

    /**
     * Create or retrieve a container inside a parent
     * @param {string} id - ID of container to find/create
     * @param {string} parentId - ID of parent to append to if creating
     * @param {string} tagName - Tag type (default div)
     */
    ensureContainer(id: string, parentId: string, tagName: string = 'div'): HTMLElement | null {
        // Try getting directly
        const existing = document.getElementById(id);
        if (existing) return existing;

        // Parent must exist
        const parent = this.get(parentId);
        if (!parent) return null;

        const newEl = document.createElement(tagName);
        newEl.id = id;
        parent.appendChild(newEl);

        // Cache new element
        this.cache.set(id, newEl);

        return newEl;
    }

    /**
     * Create a new element safely
     * @param {string} tagName - HTML tag (div, span, etc)
     * @param {object} options - { id, className, parent }
     */
    create(
        tagName: string,
        options: { id?: string; className?: string; parent?: HTMLElement } = {}
    ): HTMLElement {
        const el = document.createElement(tagName);
        if (options.id) el.id = options.id;
        if (options.className) el.className = options.className;
        if (options.parent) options.parent.appendChild(el);
        return el;
    }

    /**
     * Clear cache (useful if UI is completely rebuilt/reloaded)
     */
    clearCache() {
        this.cache.clear();
    }
}

export const UIBinder = new UIBinderService();
