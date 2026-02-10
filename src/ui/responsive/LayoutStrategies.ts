/**
 * LayoutStrategies
 * Defines behavior for Mobile vs Desktop layouts
 * Handles DOM reparenting and state management
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import type { UIManagerService } from '../UIManager';
import type { IUIPanel } from '../../types/ui';

class BaseLayout {
    ui: UIManagerService;
    constructor(uiManager: UIManagerService) {
        this.ui = uiManager;
    }

    enter() {
        Logger.info(`[LayoutStrategy] Entering ${this.constructor.name}`);
    }

    exit() {
        Logger.info(`[LayoutStrategy] Exiting ${this.constructor.name}`);
    }

    // Default implementation: do nothing
    onGridUpdate() { }
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
            this.ui.panels.forEach((panel: IUIPanel) => panel.applyLayout('mobile'));
        }

        if (EventBus && GameConstants?.Events) {
            EventBus.emit(GameConstants.Events.UI_LAYOUT_CHANGED, { format: 'mobile' });
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
            this.ui.panels.forEach((panel: IUIPanel) => panel.applyLayout('desktop'));
        }

        if (EventBus && GameConstants?.Events) {
            EventBus.emit(GameConstants.Events.UI_LAYOUT_CHANGED, { format: 'desktop' });
        }
    }
}

const LayoutStrategies = {
    Mobile: MobileLayout,
    Desktop: DesktopLayout
};

export { LayoutStrategies, BaseLayout, MobileLayout, DesktopLayout };
