/**
 * UI Manager
 * Orchestrates UI rendering and updates
 * 
 * Owner: UI Artist
 */

class UIManagerService {
    constructor() {
        this.initialized = false;
        this.currentUnlockTarget = null; // Island being offered for unlock
        this.panels = new Map(); // Registry: ID -> UIPanel
        this.contextBtn = null;
        this.contextIcon = null;
        this.contextLabel = null;
        this.activeContext = null;
        this.contextData = null;
        console.log('[UIManager] Constructed');
    }

    init() {
        console.log('[UIManager] Initializing...');

        // Listen for platform changes (Mobile vs PC)
        if (window.PlatformManager) {
            PlatformManager.on('modechange', (config) => {
                this.onPlatformChange(config);
            });
            // Apply initial
            this.onPlatformChange(PlatformManager.getConfig());
        } else if (window.ResponsiveManager) {
            // Fallback
            ResponsiveManager.on('change', (data) => {
                this.onResponsiveChange(data);
            });
        }

        // Create unlock prompt container
        this.createUnlockPrompt();

        // Load static icons
        this.loadIcons();

        // Global click sound for buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .clickable, .icon-btn, .shop-item, .upgrade-card') ||
                e.target.closest('button, .clickable, .icon-btn, .shop-item, .upgrade-card')) {
                if (window.AudioManager) AudioManager.playSFX('sfx_ui_click');
            }
        });

        // Debug: Escape to exit Capture Mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('ui-capture-mode')) {
                this.toggleDebugCapture();
            }
        });

        // Cache Context Button Elements
        this.cacheContextElements();

        // Magnet Button
        const btnMagnet = document.getElementById('btn-magnet');
        if (btnMagnet) {
            btnMagnet.addEventListener('click', () => {
                const eventName = (window.GameConstants && GameConstants.Events) ? GameConstants.Events.REQUEST_MAGNET : 'REQUEST_MAGNET';
                if (window.EventBus) EventBus.emit(eventName);
            });
        }

        // EventBus Listeners
        if (window.EventBus) {
            const E = GameConstants.Events;
            EventBus.on(E.UI_UNLOCK_PROMPT, (data) => this.showContextAction('unlock', data));
            EventBus.on(E.UI_HIDE_UNLOCK_PROMPT, () => this.hideContextAction('unlock'));
            EventBus.on(E.ISLAND_UNLOCKED, () => this.hideContextAction('unlock'));

            // Rest/Home Interaction
            EventBus.on(E.HOME_BASE_ENTERED, () => this.showContextAction('rest'));
            EventBus.on(E.HOME_BASE_EXITED, () => this.hideContextAction('rest'));

            // Forge Interaction
            EventBus.on(E.FORGE_ENTERED, () => this.showContextAction('forge'));
            EventBus.on(E.FORGE_EXITED, () => this.hideContextAction('forge'));

            // Merchant Interaction
            EventBus.on(E.INTERACTION_OPPORTUNITY, (data) => {
                if (data.type === 'merchant') {
                    if (data.visible) this.showContextAction('merchant', data);
                    else this.hideContextAction('merchant');
                }
            });

            EventBus.on(E.UI_FADE_SCREEN, (data) => this.fadeInOut(data ? data.onMidpoint : null));
        }

        this.initialized = true;
        console.log('[UIManager] Initialized');
    }

    // === Context Action Button ===
    cacheContextElements() {
        this.contextBtn = document.getElementById('btn-context-action');
        this.contextIcon = document.getElementById('context-icon');
        this.contextLabel = document.getElementById('context-label');

        if (this.contextBtn) {
            this.contextBtn.addEventListener('click', () => this.executeContextAction());
        }
    }

    showContextAction(type, data = null) {
        if (!this.contextBtn) {
            console.warn('[UIManager] Context button not found');
            return;
        }

        this.activeContext = type;
        this.contextData = data;

        let iconId = '';
        let labelText = '';

        switch (type) {
            case 'rest':
                iconId = 'ui_icon_rest';
                labelText = 'REST';
                break;
            case 'forge':
                iconId = 'ui_icon_forge';
                labelText = 'FORGE';
                break;
            case 'unlock':
                iconId = 'ui_icon_lock';
                // Show cost on button label
                const cost = data ? data.unlockCost : 0;
                labelText = `${cost}G`;
                break;
            case 'merchant':
                iconId = 'ui_icon_shop';
                labelText = 'SHOP';
                break;
        }

        // Update Icon
        if (this.contextIcon) {
            const path = window.AssetLoader ? AssetLoader.getImagePath(iconId) : null;
            if (path) {
                this.contextIcon.style.backgroundImage = `url('${path}')`;
                this.contextIcon.style.backgroundSize = 'contain';
            }
        }
        // Update Label
        if (this.contextLabel) this.contextLabel.textContent = labelText;

        // Show Button (using .active class instead of display)
        this.contextBtn.classList.add('active');
        console.log(`[UIManager] Context Action Shown: ${type}`);
    }

    hideContextAction(type) {
        if (this.activeContext === type) {
            this.activeContext = null;
            this.contextData = null;
            if (this.contextBtn) this.contextBtn.classList.remove('active');

            // Clear icon and label
            if (this.contextIcon) {
                this.contextIcon.style.backgroundImage = 'none';
            }
            if (this.contextLabel) {
                this.contextLabel.textContent = '';
            }

            console.log(`[UIManager] Context Action Hidden: ${type}`);
        }
    }

    executeContextAction() {
        if (!this.activeContext) return;

        console.log(`[UIManager] Executing Context Action: ${this.activeContext}`);
        const E = window.GameConstants ? GameConstants.Events : null;
        if (window.AudioManager) AudioManager.playSFX('sfx_ui_click');

        switch (this.activeContext) {
            case 'rest':
                if (E && window.EventBus) EventBus.emit(E.REQUEST_REST);
                break;
            case 'forge':
                // Open crafting UI using ForgeController
                if (window.ForgeController) {
                    ForgeController.render('dashboard');
                    ForgeController.open();
                }
                break;
            case 'unlock':
                // Direct unlock - emit request with stored data
                if (this.contextData && E && window.EventBus) {
                    EventBus.emit(E.REQUEST_UNLOCK, {
                        gridX: this.contextData.gridX,
                        gridY: this.contextData.gridY,
                        cost: this.contextData.unlockCost
                    });
                }
                break;
            case 'merchant':
                // Open merchant UI
                console.log('[UIManager] Merchant interaction requested');
                if (window.MerchantUI) {
                    window.MerchantUI.open();
                }
                break;
        }
    }

    // === Icon Loading ===
    loadIcons() {
        if (!window.AssetLoader) {
            console.warn('[UIManager] AssetLoader not available');
            return;
        }

        if (!AssetLoader.registries.images) {
            console.warn('[UIManager] Image registry not loaded yet');
            return;
        }

        const elements = document.querySelectorAll('[data-icon-id]');
        console.log(`[UIManager] Loading icons for ${elements.length} elements`);

        elements.forEach(el => {
            const id = el.dataset.iconId;
            const path = AssetLoader.getImagePath(id);
            if (path) {
                el.style.backgroundImage = `url('${path}')`;
                el.style.backgroundSize = 'cover';
                el.style.backgroundPosition = 'center';
            } else {
                console.warn(`[UIManager] Icon asset not found: ${id}`);
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
        document.getElementById('app').appendChild(prompt);

        prompt.querySelector('.unlock-btn').addEventListener('click', () => {
            this.tryUnlock();
        });
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
        const prompt = document.getElementById('unlock-prompt');
        if (prompt) {
            prompt.classList.add('hidden');
        }
    }

    tryUnlock() {
        if (!this.currentUnlockTarget) return;

        const cost = this.currentUnlockTarget.unlockCost;
        const gridX = this.currentUnlockTarget.gridX;
        const gridY = this.currentUnlockTarget.gridY;

        if (window.EventBus) {
            EventBus.emit(GameConstants.Events.REQUEST_UNLOCK, {
                gridX: gridX,
                gridY: gridY,
                cost: cost
            });
        }
    }

    // === Platform/Layout ===
    onPlatformChange(config) {
        const format = (PlatformManager.currentMode === 'pc') ? 'desktop' : 'mobile';
        console.log(`[UIManager] Platform changed: ${PlatformManager.currentMode} -> Layout: ${format}`);
        this.applyLayout(format);
    }

    onResponsiveChange(data) {
        if (window.PlatformManager && PlatformManager.isManualOverride) return;
        console.log(`[UIManager] Format changed: ${data.format} (${data.orientation})`);
        this.applyLayout(data.format);
    }

    applyLayout(format) {
        if (!window.LayoutStrategies) return;

        let StrategyClass;
        if (format === 'desktop') {
            StrategyClass = LayoutStrategies.Desktop;
        } else {
            StrategyClass = LayoutStrategies.Mobile;
        }

        if (!this.currentStrategy || !(this.currentStrategy instanceof StrategyClass)) {
            if (this.currentStrategy) {
                this.currentStrategy.exit();
            }
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

            if (animate && window.VFXController && VFXController.triggerUIProgressSparks) {
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
            console.log(`[UIManager] Registered panel: ${panel.id}`);

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
    /**
     * Toggles UI Capture Mode for designing backplates.
     * Hides world, buttons, icons, and text.
     */
    toggleDebugCapture() {
        document.body.classList.toggle('ui-capture-mode');
        const isActive = document.body.classList.contains('ui-capture-mode');
        console.log(`[UIManager] UI Capture Mode: ${isActive ? 'ON' : 'OFF'}`);
        return isActive;
    }

    /**
     * Automates the UI Capture workflow:
     * 1. Enter Capture Mode
     * 2. Wait for Repaint
     * 3. Snapshot UI
     * 4. Save Image
     * 5. Exit Capture Mode
     */
    async autoCapture() {
        await this.captureAllZones();
    }

    /**
     * Captures a specific DOM element as a transparent PNG.
     */
    async captureElement(selector, filename) {
        const el = document.querySelector(selector);
        if (!el) {
            console.warn(`[UIManager] element not found: ${selector}`);
            return;
        }

        try {
            console.log(`[UIManager] Capturing ${selector}...`);
            const canvas = await html2canvas(el, {
                backgroundColor: null, // Transparent background for assets
                scale: 1,
                useCORS: true,
                ignoreElements: (element) => {
                    // Ignore Game Canvas & Media
                    if (element.tagName === 'CANVAS') return true;
                    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') return true;
                    return false;
                }
            });

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
            console.log(`[UIManager] Saved ${filename}`);

        } catch (err) {
            console.error(`[UIManager] Failed to capture ${selector}:`, err);
        }
    }

    /**
     * Batch captures all major UI zones as separate assets.
     */
    async captureAllZones() {
        if (!window.html2canvas) return alert('html2canvas missing');

        // 1. Enter Clean Mode
        let wasActive = document.body.classList.contains('ui-capture-mode');
        if (!wasActive) this.toggleDebugCapture();

        // 2. Wait for settle
        await new Promise(r => setTimeout(r, 500));

        // 3. Batch Capture
        await this.captureElement('#ui-footer-zone', 'ui_plate_footer.png');
        await this.captureElement('#ui-quest-panel', 'ui_plate_quest.png');
        await this.captureElement('#ui-resolve-bar', 'ui_plate_resolve.png');
        await this.captureElement('#ui-hud-left', 'ui_plate_status.png');
        await this.captureElement('#resource-counters', 'ui_plate_resources.png');

        // 4. Restore state (optional, keeping mode on for verification)
        // if (!wasActive) this.toggleDebugCapture();
    }
}

// Export Singleton Instance
window.UIManager = new UIManagerService();
window.debugUICapture = () => window.UIManager.captureAllZones(); // Updated to Zone Batch
if (window.Registry) Registry.register('UIManager', window.UIManager);
