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

class UIManagerService {
    constructor() {
        this.initialized = false;
        this.currentUnlockTarget = null;
        this.panels = new Map();
        Logger.debug('[UIManager]', 'Constructed');
    }

    init() {
        Logger.info('[UIManager]', 'Initializing...');

        // Listen for platform changes
        if (window.PlatformManager) {
            PlatformManager.on('modechange', (config) => this.onPlatformChange(config));
            this.onPlatformChange(PlatformManager.getConfig());
        } else if (window.ResponsiveManager) {
            ResponsiveManager.on('change', (data) => this.onResponsiveChange(data));
        }

        this.createUnlockPrompt();
        this.loadIcons();

        // Global click sound
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .clickable, .icon-btn, .shop-item, .upgrade-card') ||
                e.target.closest('button, .clickable, .icon-btn, .shop-item, .upgrade-card')) {
                if (window.AudioManager) AudioManager.playSFX('sfx_ui_click');
            }
        });

        // Escape to exit Capture Mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('ui-capture-mode')) {
                if (window.UICapture) UICapture.toggleMode();
            }
        });

        // Init ContextActionUI
        if (window.ContextActionUI) ContextActionUI.init();

        // Magnet Button
        const btnMagnet = document.getElementById('btn-magnet');
        if (btnMagnet) {
            btnMagnet.addEventListener('click', () => {
                const eventName = (window.GameConstants && GameConstants.Events) ? GameConstants.Events.REQUEST_MAGNET : 'REQUEST_MAGNET';
                if (window.EventBus) EventBus.emit(eventName);
            });
        }

        // EventBus Listeners
        if (window.EventBus && window.GameConstants) {
            const E = GameConstants.Events;
            EventBus.on(E.UI_FADE_SCREEN, (data) => this.fadeInOut(data ? data.onMidpoint : null));
        }

        this.initialized = true;
        Logger.info('[UIManager]', 'Initialized');
    }

    // === Icon Loading ===
    loadIcons() {
        if (!window.AssetLoader || !AssetLoader.registries?.images) return;

        const elements = document.querySelectorAll('[data-icon-id]');
        Logger.debug('[UIManager]', `Loading icons for ${elements.length} elements`);

        elements.forEach(el => {
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

    showUnlockPrompt(island) {
        if (this.currentUnlockTarget === island) return;

        this.currentUnlockTarget = island;
        const prompt = document.getElementById('unlock-prompt');
        if (!prompt) return;

        prompt.querySelector('.unlock-island-name').textContent = island.name;
        prompt.querySelector('.cost-amount').textContent = island.unlockCost;

        const gold = window.GameState ? (window.GameState.get('gold') || 0) : 0;
        const btn = prompt.querySelector('.unlock-btn');
        if (gold >= island.unlockCost) {
            btn.disabled = false;
            btn.textContent = 'Unlock';
        } else {
            btn.disabled = true;
            btn.textContent = `Need ${island.unlockCost - gold} more`;
        }

        prompt.classList.remove('hidden');
    }

    hideUnlockPrompt() {
        this.currentUnlockTarget = null;
        document.getElementById('unlock-prompt')?.classList.add('hidden');
    }

    tryUnlock() {
        if (!this.currentUnlockTarget) return;

        if (window.EventBus && window.GameConstants) {
            EventBus.emit(GameConstants.Events.REQUEST_UNLOCK, {
                gridX: this.currentUnlockTarget.gridX,
                gridY: this.currentUnlockTarget.gridY,
                cost: this.currentUnlockTarget.unlockCost
            });
        }
    }

    // === Platform/Layout ===
    onPlatformChange(config) {
        const format = (PlatformManager.currentMode === 'pc') ? 'desktop' : 'mobile';
        Logger.debug('[UIManager]', `Platform changed: ${PlatformManager.currentMode} -> Layout: ${format}`);
        this.applyLayout(format);
    }

    onResponsiveChange(data) {
        if (window.PlatformManager?.isManualOverride) return;
        Logger.debug('[UIManager]', `Format changed: ${data.format} (${data.orientation})`);
        this.applyLayout(data.format);
    }

    applyLayout(format) {
        if (!window.LayoutStrategies) return;

        const StrategyClass = format === 'desktop' ? LayoutStrategies.Desktop : LayoutStrategies.Mobile;

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

            if (animate && window.VFXController?.triggerUIProgressSparks) {
                VFXController.triggerUIProgressSparks(bar, '#3498DB');
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
                const mode = (this.currentStrategy.constructor.name === 'DesktopLayout') ? 'desktop' : 'mobile';
                panel.applyLayout(mode);
            }
        }
    }

    getPanel(id) {
        return this.panels.get(id);
    }

    handleAccordion(openingPanel) {
        this.panels.forEach(panel => {
            if (panel !== openingPanel && panel.isDocked && panel.isOpen &&
                panel.config.defaultDock === openingPanel.config.defaultDock) {
                panel.close();
            }
        });
    }

    // === Update Loop ===
    update(dt) {
        // UI mostly event-driven
    }

    // === Backward Compatibility Delegates ===
    toggleDebugCapture() { return window.UICapture?.toggleMode(); }
    async autoCapture() { return window.UICapture?.autoCapture(); }
    async captureElement(s, f) { return window.UICapture?.captureElement(s, f); }
    async captureAllZones() { return window.UICapture?.captureAllZones(); }

    showContextAction(type, data) { window.ContextActionUI?.show(type, data); }
    hideContextAction(type) { window.ContextActionUI?.hide(type); }
    executeContextAction() { window.ContextActionUI?.execute(); }
}

window.UIManager = new UIManagerService();
window.debugUICapture = () => window.UICapture?.captureAllZones();
if (window.Registry) Registry.register('UIManager', window.UIManager);
