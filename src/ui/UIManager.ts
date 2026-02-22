/**
 * UI Manager
 * Orchestrates UI rendering and updates
 *
 * REFACTOR NOTICE: Split into focused files:
 * - ContextActionUI.js: Context-sensitive action button
 * - UICapture.js: Debug screenshot utilities
 *
 * Owner: UI Artist
 */

import { Logger } from '@core/Logger';
import { PlatformManager } from '@core/PlatformManager';
import { ResponsiveManager } from '@core/ResponsiveManager';
import { AudioManager } from '../audio/AudioManager';
import { ContextActionUI } from './ContextActionUI';
import { GameConstants } from '@data/GameConstants';
import { EventBus } from '@core/EventBus';
import { VFXController } from '@vfx/VFXController';
import { AssetLoader } from '@core/AssetLoader';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import { UICapture } from './UICapture';
import { GameInstance } from '@core/Game';
import { LayoutStrategies } from './responsive/LayoutStrategies';
import { HUDController } from './controllers/HUDController';
import type { IUIPanel, IQuest } from '../types/ui';

interface IFullscreenUI {
    isOpen: boolean;
    close(): void;
}

class UIManagerService {
    initialized: boolean = false;
    panels: Map<string, IUIPanel> = new Map();
    fullscreenUIs: Set<IFullscreenUI> = new Set();
    currentStrategy: {
        apply?(container: HTMLElement): void;
        enter?(): void;
        exit?(): void;
    } | null = null;
    isFooterOverridden: boolean = false;

    constructor() {
        Logger.debug('[UIManager]', 'Constructed');
    }

    init() {
        Logger.info('[UIManager]', 'Initializing...');
        // Ensure HUDController is loaded
        if (HUDController) Logger.debug('[UIManager] HUDController loaded');

        // Listen for platform changes
        if (PlatformManager) {
            PlatformManager.on('modechange', (config: unknown) => this.onPlatformChange(config));
            this.onPlatformChange(PlatformManager.getConfig());
        } else if (ResponsiveManager) {
            ResponsiveManager.on('change', (data: unknown) =>
                this.onResponsiveChange(
                    data as { format: string; orientation?: string; breakpoint?: string }
                )
            );
        }

        this.loadIcons();

        // Global click sound
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (
                target.matches('button, .clickable, .icon-btn, .shop-item, .upgrade-card') ||
                target.closest('button, .clickable, .icon-btn, .shop-item, .upgrade-card')
            ) {
                if (AudioManager) AudioManager.playSFX('sfx_ui_click');
            }

            // Action button click animation - add class so animation plays fully
            const actionBtn = target.closest('.action-btn') as HTMLElement | null;
            if (actionBtn && !actionBtn.classList.contains('clicked')) {
                actionBtn.classList.add('clicked');
                setTimeout(() => actionBtn.classList.remove('clicked'), 350);
            }
        });

        // Escape to exit Capture Mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('ui-capture-mode')) {
                if (UICapture) UICapture.toggleMode();
            }
        });

        // Init ContextActionUI
        if (ContextActionUI) ContextActionUI.init();

        // Magnet Button
        const btnMagnet = document.getElementById('btn-magnet');
        if (btnMagnet) {
            btnMagnet.addEventListener('click', () => {
                // Skip if footer is in override mode (equipment/inventory screen has taken over)
                if (this.isFooterOverridden) return;
                const eventName =
                    GameConstants && GameConstants.Events
                        ? GameConstants.Events.REQUEST_MAGNET
                        : 'REQUEST_MAGNET';
                if (EventBus) EventBus.emit(eventName);
            });
        }

        // Weapon Set Swap Button
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) {
            btnSwap.addEventListener('click', () => {
                const hero = GameInstance?.hero;
                if (hero?.equipment?.swapWeaponSet) {
                    const activeSet = hero.equipment.swapWeaponSet();
                    Logger.info(`[UIManager] Weapon set swapped to Set ${activeSet}`);
                    if (AudioManager) AudioManager.playSFX('sfx_ui_click');
                }
            });
        }

        // EventBus Listeners
        if (EventBus && GameConstants) {
            const E = GameConstants.Events;
            EventBus.on(E.UI_FADE_SCREEN, (data: { onMidpoint?: () => void } | null) =>
                this.fadeInOut(data ? data.onMidpoint : null)
            );
            EventBus.on(E.QUEST_UPDATED, (data: { quest: IQuest | null; animate?: boolean }) =>
                this.updateQuest(data.quest ?? null, data.animate ?? false)
            );
            EventBus.on(E.UI_FULLSCREEN_OPENED, (data: { source: IFullscreenUI } | null) => {
                if (data?.source) this.closeOtherFullscreenUIs(data.source);
            });

            // Track when main UI panels override the footer
            EventBus.on('UI_PANEL_OPENED', (data: { panelId: string }) => {
                // Determine if this panel should override the footer (e.g., inventory/equipment)
                if (data && ['inventory', 'equipment', 'crafting'].includes(data.panelId)) {
                    this.isFooterOverridden = true;
                }
            });
            EventBus.on('UI_PANEL_CLOSED', (data: { panelId: string }) => {
                if (data && ['inventory', 'equipment', 'crafting'].includes(data.panelId)) {
                    this.isFooterOverridden = false;
                }
            });
        }

        this.initialized = true;
        Logger.info('[UIManager]', 'Initialized');
    }

    // === Icon Loading ===
    loadIcons() {
        if (!AssetLoader) return;

        const elements = document.querySelectorAll('[data-icon-id]');
        Logger.debug('[UIManager]', `Loading icons for ${elements.length} elements`);

        elements.forEach((element) => {
            const el = element as HTMLElement;
            const id = el.dataset.iconId;
            const path = AssetLoader.getImagePath(id);
            if (path) {
                el.style.backgroundImage = `url('${path}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            }
        });
    }

    // === Platform/Layout ===
    onPlatformChange(_config: unknown) {
        this.applyLayout(PlatformManager.currentMode === 'pc' ? 'desktop' : 'mobile');
    }

    onResponsiveChange(data: { format: string; orientation?: string; breakpoint?: string }) {
        if (PlatformManager?.isManualOverride) return;
        this.applyLayout(data.format);
    }

    applyLayout(format: string) {
        if (!LayoutStrategies) return;

        const StrategyClass =
            format === 'desktop' ? LayoutStrategies.Desktop : LayoutStrategies.Mobile;

        if (!this.currentStrategy || !(this.currentStrategy instanceof StrategyClass)) {
            this.currentStrategy?.exit();
            this.currentStrategy = new StrategyClass(this);
            this.currentStrategy.enter();
        }
    }

    // === Quest Panel ===
    updateQuest(quest: IQuest | null, animate = false) {
        if (!quest) {
            this.hideQuestPanel();
            return;
        }

        const panel = document.getElementById('ui-quest-panel');
        if (panel) panel.style.display = 'block';

        const desc = document.getElementById('quest-description');
        const progress = document.getElementById('quest-progress');
        const bar = document.getElementById('quest-progress-bar');

        if (desc) desc.textContent = quest.description;
        if (progress) progress.textContent = `(${quest.current}/${quest.target})`;

        if (bar) {
            const pct = Math.min(100, (quest.current / quest.target) * 100);
            bar.style.width = `${pct}%`;

            if (animate && VFXController?.triggerUIProgressSparks) {
                // Get position from bar element for VFX
                const rect = bar.getBoundingClientRect();
                VFXController.triggerUIProgressSparks(rect.right, rect.top + rect.height / 2, {
                    color: '#3498DB'
                });
            }
        }
    }

    hideQuestPanel() {
        const panel = document.getElementById('ui-quest-panel');
        if (panel) panel.style.display = 'none';
    }

    // === Screen Fade ===
    fadeInOut(onMidpoint: (() => void) | null) {
        const overlay = document.getElementById('fade-overlay');
        if (!overlay) {
            if (onMidpoint) onMidpoint();
            return;
        }

        if (overlay.classList.contains('fade-active')) return;

        overlay.classList.add('fade-active');
        setTimeout(() => {
            if (onMidpoint) onMidpoint();
            overlay.classList.remove('fade-active');
        }, 1000);
    }

    // === Panel Registry ===
    registerPanel(panel: IUIPanel) {
        if (!this.panels.has(panel.id)) {
            this.panels.set(panel.id, panel);
            Logger.debug('[UIManager]', `Registered panel: ${panel.id}`);

            if (this.currentStrategy) {
                const mode =
                    this.currentStrategy.constructor.name === 'DesktopLayout'
                        ? 'desktop'
                        : 'mobile';
                panel.applyLayout(mode);
            }
        }
    }

    getPanel(id: string): IUIPanel | undefined {
        return this.panels.get(id);
    }

    handleAccordion(openingPanel: IUIPanel) {
        this.panels.forEach((panel) => {
            if (
                panel !== openingPanel &&
                panel.isDocked &&
                panel.isOpen &&
                panel.config.defaultDock === openingPanel.config.defaultDock
            ) {
                panel.close();
            }
        });
    }

    // === Fullscreen UI Management ===
    /**
     * Register a fullscreen UI (call in the UI's constructor)
     * @param {Object} ui - UI object with isOpen and close() method
     */
    registerFullscreenUI(ui: IFullscreenUI) {
        this.fullscreenUIs.add(ui);
    }

    /**
     * Close all other fullscreen UIs except the one being opened
     * @param {Object} exceptUI - The UI that should remain open
     */
    closeOtherFullscreenUIs(exceptUI: IFullscreenUI) {
        this.fullscreenUIs.forEach((ui) => {
            if (ui !== exceptUI && ui.isOpen && typeof ui.close === 'function') {
                ui.close();
            }
        });
        // Also close registered panels
        this.panels.forEach((panel) => {
            if (panel.isOpen) {
                panel.close();
            }
        });
    }

    // === Update Loop ===
    update(_dt: number) {
        // UI mostly event-driven
    }

    toggleDebugCapture() {
        return UICapture?.toggleMode();
    }
    async autoCapture() {
        return UICapture?.autoCapture();
    }
    async captureElement(s: string, f: string) {
        return UICapture?.captureElement(s, f);
    }
    async captureAllZones() {
        return UICapture?.captureAllZones();
    }

    showContextAction(type: string, data: Record<string, unknown>) {
        ContextActionUI?.show(type, data);
    }
    hideContextAction(type: string) {
        ContextActionUI?.hide(type);
    }
    executeContextAction() {
        ContextActionUI?.execute();
    }
}

// Create singleton and export
const UIManager = new UIManagerService();
const debugUICapture = () => UICapture?.captureAllZones();
if (Registry) Registry.register('UIManager', UIManager);

export { UIManagerService, UIManager, debugUICapture };
