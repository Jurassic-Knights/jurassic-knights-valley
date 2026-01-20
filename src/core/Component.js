/**
 * Component - Base class for Entity Components
 *
 * Enables modular logic composition.
 */
class Component {
    constructor(parent) {
        this.parent = parent; // The Entity this component belongs to
        this.active = true;
    }

    /**
     * Called when component is added to entity
     */
    init() {}

    /**
     * Update loop
     * @param {number} dt
     */
    update(dt) {}

    /**
     * Cleanup
     */
    destroy() {
        this.parent = null;
    }
}

window.Component = Component;

