/**
 * LayoutStrategies.js
 * Defines behavior for Mobile vs Desktop layouts
 * Handles DOM reparenting and state management
 */

class BaseLayout {
    constructor(uiManager) {
        this.ui = uiManager;
    }

    enter() {
        Logger.info(`[LayoutStrategy] Entering ${this.constructor.name}`);
    }

    exit() {
        Logger.info(`[LayoutStrategy] Exiting ${this.constructor.name}`);
    }

    // Default implementation: do nothing
    onGridUpdate() {}
}

/**
 * MobileLayout
 * - Modals cover the screen
 * - Inventory Grid: 3 Columns
 */
class MobileLayout extends BaseLayout {
    enter() {
        super.enter();
        document.body.classList.add('ui-mobile');
        document.body.classList.remove('ui-desktop');

        // Apply Layout to all registered panels
        if (this.ui.panels) {
            this.ui.panels.forEach((panel) => panel.applyLayout('mobile'));
        }

        // Update Inventory Grid (Specific Logic can remain or move to panel)
        // Ideally moved to InventoryPanel.applyLayout override
        if (window.InventoryUI && typeof InventoryUI.setGridSize === 'function') {
            InventoryUI.setGridSize(3);
        }
    }
}

/**
 * DesktopLayout
 * - Persistent Side Panels
 * - Inventory Grid: 5 Columns
 */
class DesktopLayout extends BaseLayout {
    enter() {
        super.enter();
        document.body.classList.add('ui-desktop');
        document.body.classList.remove('ui-mobile');

        // Apply Layout to all registered panels
        if (this.ui.panels) {
            this.ui.panels.forEach((panel) => panel.applyLayout('desktop'));
        }

        // Update Inventory Grid
        if (window.InventoryUI && typeof InventoryUI.setGridSize === 'function') {
            InventoryUI.setGridSize(5);
            InventoryUI.render();
        }
    }
}

window.LayoutStrategies = {
    Mobile: MobileLayout,
    Desktop: DesktopLayout
};

