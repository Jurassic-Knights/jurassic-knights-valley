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

import { Logger } from '../core/Logger';
import { PlatformManager } from '../core/PlatformManager';
import { ResponsiveManager } from '../core/ResponsiveManager';
import { AudioManager } from '../audio/AudioManager';
import { ContextActionUI } from './ContextActionUI';
import { GameConstants } from '../data/GameConstants';
import { EventBus } from '../core/EventBus';
import { GameState } from '../core/State';
import { VFXController } from '../vfx/VFXController';
import { AssetLoader } from '../core/AssetLoader';
import { Registry } from '../core/Registry';
import { UICapture } from './UICapture';
import { GameInstance } from '../core/Game';
import { LayoutStrategies } from './responsive/LayoutStrategies';
import { HUDController } from './controllers/HUDController';
import type { Island } from '../types/world';
import type { UIPanelConfig } from '../types/ui';

class UIManagerService {
    // Property declarations
    initialized: boolean = false;
    currentUnlockTarget: Island | null = null;
    panels: Map<string, UIPanelConfig> = new Map();
    fullscreenUIs: Set<UIPanelConfig> = new Set();
    currentStrategy: { apply?(container: HTMLElement): void; enter?(): void; exit?(): void } | null = null;

    constructor() {
        Logger.debug('[UIManager]', 'Constructed');
    }

    init() {
        Logger.info('[UIManager]', 'Initializing...');
        // Ensure HUDController is loaded
        if (HUDController) Logger.debug('[UIManager] HUDController loaded');

        // Listen for platform changes
        if (PlatformManager) {
            PlatformManager.on('modechange', (config: { mode: string }) => this.onPlatformChange(config));
            this.onPlatformChange(PlatformManager.getConfig());
        } else if (ResponsiveManager) {
            ResponsiveManager.on('change', (data: { breakpoint: string }) => this.onResponsiveChange(data));
        }

        this.createUnlockPrompt();
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
                if ((btnMagnet as any).dataset.footerOverride) return;
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
            EventBus.on(E.UI_FADE_SCREEN, (data: { onMidpoint?: () => void } | null) => this.fadeInOut(data ? data.onMidpoint : null));
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

    // === Unlock Prompt ===
    createUnlockPrompt() {
        const prompt = document.createElement('div');
        prompt.id = 'unlock-prompt';
        prompt.className = 'unlock-prompt hidden';
        prompt.innerHTML = `
            <div class="unlock-prompt-content">
                <div class="unlock-island-name"></div>
                <div class="unlock-cost"><span class="cost-amount"></span> Gold</div>
                <button class="unlock-btn">Unlock</button>
            </div>
        `;
        document.getElementById('app')?.appendChild(prompt);

        prompt.querySelector('.unlock-btn')?.addEventListener('click', () => this.tryUnlock());
    }

    showUnlockPrompt(island: Island) {
        if (this.currentUnlockTarget === island) return;

        this.currentUnlockTarget = island;
        const prompt = document.getElementById('unlock-prompt');
        if (!prompt) return;

        const nameEl = prompt.querySelector('.unlock-island-name');
        const costEl = prompt.querySelector('.cost-amount');
        if (nameEl) nameEl.textContent = island.name;
        if (costEl) costEl.textContent = String(island.unlockCost);

        const gold = GameState ? GameState.get('gold') || 0 : 0;
        const btn = prompt.querySelector('.unlock-btn') as HTMLButtonElement | null;
        if (btn) {
            if (gold >= island.unlockCost) {
                btn.disabled = false;
                btn.textContent = 'Unlock';
            } else {
                btn.disabled = true;
                btn.textContent = `Need ${island.unlockCost - gold} more`;
            }
        }

        prompt.classList.remove('hidden');
    }

    hideUnlockPrompt() {
        this.currentUnlockTarget = null;
        document.getElementById('unlock-prompt')?.classList.add('hidden');
    }

    tryUnlock() {
        if (!this.currentUnlockTarget) return;

        if (EventBus && GameConstants) {
            EventBus.emit(GameConstants.Events.REQUEST_UNLOCK, {
                gridX: this.currentUnlockTarget.gridX,
                gridY: this.currentUnlockTarget.gridY,
                cost: this.currentUnlockTarget.unlockCost
            });
        }
    }

    // === Platform/Layout ===
    onPlatformChange(config) {
        const format = PlatformManager.currentMode === 'pc' ? 'desktop' : 'mobile';
        Logger.debug(
            '[UIManager]',
            `Platform changed: ${PlatformManager.currentMode} -> Layout: ${format}`
        );
        this.applyLayout(format);
    }

    onResponsiveChange(data) {
        if (PlatformManager?.isManualOverride) return;
        Logger.debug('[UIManager]', `Format changed: ${data.format} (${data.orientation})`);
        this.applyLayout(data.format);
    }

    applyLayout(format) {
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
    updateQuest(quest, animate = false) {
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
                VFXController.triggerUIProgressSparks(rect.right, rect.top + rect.height / 2, { color: '#3498DB' });
            }
        }
    }

    hideQuestPanel() {
        const panel = document.getElementById('ui-quest-panel');
        if (panel) panel.style.display = 'none';
    }

    // === Screen Fade ===
    fadeInOut(onMidpoint) {
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
    registerPanel(panel) {
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

    getPanel(id) {
        return this.panels.get(id);
    }

    handleAccordion(openingPanel) {
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
    registerFullscreenUI(ui) {
        this.fullscreenUIs.add(ui);
    }

    /**
     * Close all other fullscreen UIs except the one being opened
     * @param {Object} exceptUI - The UI that should remain open
     */
    closeOtherFullscreenUIs(exceptUI) {
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
    update(dt) {
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
