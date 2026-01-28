/**
 * Theme Manager
 * Applies the persistence configuration from UI_THEME and LocalStorage
 * to the UI elements at runtime.
 */

import { Logger } from '@core/Logger';

// UI_THEME is optional config - default to empty object
const UI_THEME: any = {};
// Runtime variable for TextureAligner access
let UI_THEME_RUNTIME: any = {};

class ThemeManagerService {
    // Property declarations
    targets: Record<string, string>;
    observer: MutationObserver | null = null;
    config: any = {};

    constructor() {
        this.targets = {
            footer: '#ui-footer-zone .footer-bar',
            quest: '.quest-frame',
            resolve: '#ui-resolve-bar',
            resources: '.resource-counter',
            status: '#ui-hud-left',
            char_frame: '.character-frame',
            gauge_health: '.health-gauge',
            gauge_stamina: '.stamina-gauge',
            gauge_track: '.gauge-track',
            btn_main: '.action-btn',
            btn_center: '.center-slot'
        };

        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.loadOverrides();
        this.applyAll();
        this.observeDOM();
    }

    observeDOM() {
        if (this.observer) return;

        let debounceTimer;
        this.observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldUpdate = true;
                    break;
                }
            }

            if (shouldUpdate) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.applyAll();
                }, 50); // 50ms buffer
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    loadOverrides() {
        // 1. Start with File Config
        let config = UI_THEME || {};

        // 2. Overlay LocalStorage (Dev overrides)
        const saved = localStorage.getItem('JURASSIC_UI_THEME');
        if (saved) {
            try {
                const locals = JSON.parse(saved);
                // Deep merge or simple assign
                config = { ...config, ...locals };
                Logger.info('[ThemeManager] Loaded local overrides');
            } catch (e) {
                Logger.warn('[ThemeManager] Corrupt local storage', e);
            }
        }

        this.config = config;
        // Expose for TextureAligner
        UI_THEME_RUNTIME = this.config;
    }

    applyAll() {
        // DISABLED: Comment out this line to re-enable texture overlays
        return; // <-- TEMPORARILY DISABLED

        for (const [id, def] of Object.entries(this.config)) {
            if (!def) continue;
            this.applyToTarget(id, def);
        }
    }

    applyToTarget(id, def) {
        const selector = this.targets[id];
        if (!selector) return;

        const specificSelector = def.useInner ? `${selector} .inner-frame` : selector; // potential logic extension

        const els = document.querySelectorAll(selector);
        els.forEach((element) => {
            const el = element as HTMLElement;
            if (def.img) {
                el.style.backgroundImage = `url("assets/ui/${def.img}")`;
                el.style.backgroundRepeat = 'no-repeat';
                el.style.backgroundColor = 'transparent'; // Override default colors
                el.style.border = 'none';
                el.style.boxShadow = 'none';
            }

            if (def.x !== undefined && def.y !== undefined) {
                el.style.backgroundPosition = `${def.x}% ${def.y}%`;
            }

            if (def.x !== undefined && def.y !== undefined) {
                el.style.backgroundPosition = `${def.x}% ${def.y}%`;
            }

            // Support legacy scale or ScaleX/ScaleY
            const master = def.scale !== undefined ? def.scale : 500;
            const sxRaw = def.scaleX !== undefined ? def.scaleX : 500;
            const syRaw = def.scaleY !== undefined ? def.scaleY : 500;

            const finalX = sxRaw * (master / 500);
            const finalY = syRaw * (master / 500);

            el.style.backgroundSize = `${finalX}% ${finalY}%`;
        });
    }
}

// Create singleton and export
const ThemeManager = new ThemeManagerService();

export { ThemeManagerService, ThemeManager };
