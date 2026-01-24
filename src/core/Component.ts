/**
 * Component - Base class for Entity Components
 *
 * Enables modular logic composition.
 */

import type { IEntity } from '../types/core';

class Component {
    parent: IEntity | null;
    active: boolean;

    constructor(parent: IEntity | null) {
        this.parent = parent; // The Entity this component belongs to
        this.active = true;
    }

    /**
     * Called when component is added to entity
     */
    init() { }

    /**
     * Update loop
     * @param {number} dt
     */
    update(_dt: number) { }

    /**
     * Cleanup
     */
    destroy() {
        this.parent = null;
    }
}

// ES6 Module Export
export { Component };
