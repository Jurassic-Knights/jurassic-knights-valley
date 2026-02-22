/**
 * UIPanel - Base Class for all UI Modules
 *
 * Provides standard functionality for:
 * - Visibility (Open/Close)
 * - Docking (Mobile Modal vs Desktop Sidebar)
 * - Layout State Management
 */

import { UIManager } from '../../ui/UIManager';
import { Logger } from '@core/Logger';
import { GameState } from '@core/State';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { UIPanelOptions } from '../../types/ui';

class UIPanel {
    // Property declarations
    id: string;
    config: UIPanelOptions;
    el: HTMLElement | null;
    isOpen: boolean;
    isDocked: boolean;

    /**
     * @param {string} id - DOM Element ID
     * @param {UIPanelOptions} config - Configuration options
     */
    constructor(id: string, config: Partial<UIPanelOptions> = {}) {
        this.id = id;
        this.config = Object.assign(
            {
                id: id,
                visible: false,
                dockable: true,
                defaultDock: 'ui-hud-right',
                modalClass: 'modal-panel',
                dockedClass: 'docked-panel',
                isOpen: false
            } as UIPanelOptions,
            config
        );

        this.el = document.getElementById(this.id);
        this.isOpen = false;
        this.isDocked = false;

        // Register with Manager if it exists
        if (UIManager && UIManager.registerPanel) {
            UIManager.registerPanel(this);
        } else {
            // Fallback retry if UIManager loads later
            setTimeout(() => {
                if (UIManager && UIManager.registerPanel) UIManager.registerPanel(this);
            }, GameConstants.Timing.UI_PANEL_DEBOUNCE_MS);
        }
    }

    /**
     * Initialize logic (override in subclass)
     */
    init() {
        Logger.info(`[UIPanel] Init ${this.id}`);
    }

    /**
     * Toggle visibility
     */
    toggle() {
        if (this.isOpen) this.close();
        else this.open();
    }

    /**
     * Open the panel
     */
    open() {
        if (!this.el) this.el = document.getElementById(this.id);
        if (!this.el) return;

        if (EventBus && GameConstants?.Events) {
            EventBus.emit(GameConstants.Events.UI_FULLSCREEN_OPENED, { source: this });
        }

        // If docked, we might need to close other docked panels (Accordion)
        if (this.isDocked && UIManager) {
            UIManager.handleAccordion(this);
        }

        this.el.style.display = 'flex';
        this.isOpen = true;
        this.onOpen();
    }

    /**
     * Close the panel
     */
    close() {
        if (!this.el) this.el = document.getElementById(this.id);
        if (!this.el) return;

        this.el.style.display = 'none';
        this.isOpen = false;
        this.onClose();
    }

    /**
     * Lifecycle hooks
     */
    onOpen() {}
    onClose() {}

    /**
     * Apply a layout mode (called by LayoutStrategies)
     * @param {string} mode 'mobile' | 'desktop'
     */
    applyLayout(mode: string) {
        if (!this.config.dockable) return;

        if (mode === 'desktop') {
            this.dock();
        } else {
            this.undock();
        }
    }

    /**
     * Dock to sidebar (PC Mode)
     */
    dock() {
        if (this.isDocked) return;

        const target = document.getElementById(this.config.defaultDock);
        if (!target) return;

        if (!this.el) this.el = document.getElementById(this.id);
        if (this.el && this.el.parentElement !== target) {
            target.appendChild(this.el);
            this.el.classList.remove(this.config.modalClass);
            this.el.classList.add(this.config.dockedClass);

            // Hide by default when switching to dock to prevent visual clutter
            // unless it was already maintaining state? Better to close to be safe.
            this.close();

            this.isDocked = true;
        }
    }

    /**
     * Undock to modal layer (Mobile Mode)
     */
    undock() {
        if (!this.isDocked) return;

        const target = document.getElementById('modal-layer');
        if (!target) {
            Logger.error('[UIPanel] Undock Failed: modal-layer not found!');
            return;
        }

        if (!this.el) this.el = document.getElementById(this.id);

        Logger.info(`[UIPanel] Undocking ${this.id} to modal-layer...`);

        if (this.el && this.el.parentElement !== target) {
            target.appendChild(this.el);
            this.el.classList.remove(this.config.dockedClass);
            this.el.classList.add(this.config.modalClass);

            this.close(); // Reset state
            this.isDocked = false;
            Logger.info(`[UIPanel] ${this.id} Undocked Successfully.`);
        }
    }
}

// ES6 Module Export
export { UIPanel };
