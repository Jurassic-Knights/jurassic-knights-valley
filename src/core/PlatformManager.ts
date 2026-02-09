/**
 * PlatformManager - Central authority for platform mode (Mobile/PC)
 * Allows manual override independent of viewport detection
 *
 * Owner: Director
 */
import { Logger } from './Logger';

const PlatformManager = {
    // Platform modes
    MODES: {
        MOBILE: 'mobile',
        PC: 'pc'
    },

    // Current state
    currentMode: 'mobile',
    isManualOverride: false,

    // Platform-specific configurations
    configs: {
        mobile: {
            aspectRatio: 9 / 16, // Portrait
            orientation: 'portrait',
            maxWidth: '100%',
            maxHeight: '100vh',
            showJoystick: true,
            uiScale: 1.2, // Larger touch targets
            containerClass: 'platform-mobile'
        },
        pc: {
            aspectRatio: 16 / 9, // Landscape
            orientation: 'landscape',
            maxWidth: '900px',
            maxHeight: '506px', // 900 * 9/16
            showJoystick: false,
            uiScale: 1.0,
            containerClass: 'platform-pc'
        }
    },

    // Event listeners
    listeners: [] as { event: string; callback: (data: unknown) => void }[],

    /**
     * Initialize platform manager
     */
    init() {
        // Default to auto-detect based on device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.currentMode = isTouchDevice ? this.MODES.MOBILE : this.MODES.PC;

        this.applyMode();
        Logger.info(`[PlatformManager] Initialized: ${this.currentMode} (auto-detected)`);

        // Force mobile mode per user request
        this.setMode(this.MODES.MOBILE);
    },

    /**
     * Set platform mode manually
     * @param {string} mode - 'mobile' or 'pc'
     */
    setMode(mode: string) {
        if (mode !== this.MODES.MOBILE && mode !== this.MODES.PC) {
            Logger.error(`[PlatformManager] Invalid mode: ${mode}`);
            return;
        }

        const changed = this.currentMode !== mode;
        this.currentMode = mode;
        this.isManualOverride = true;

        if (changed) {
            this.applyMode();
            this.emit('modechange', this.getConfig());
        }

        Logger.info(`[PlatformManager] Mode set to: ${mode} (manual)`);
    },

    /**
     * Apply current mode to DOM
     */
    applyMode() {
        const config = this.getConfig();
        const app = document.getElementById('app');

        // Update body classes
        document.body.classList.remove('platform-mobile', 'platform-pc');
        document.body.classList.add(config.containerClass);

        // Update app container dimensions
        if (app) {
            if (this.currentMode === this.MODES.PC) {
                app.style.maxWidth = config.maxWidth;
                app.style.maxHeight = config.maxHeight;
                app.style.aspectRatio = '16 / 9';
            } else {
                app.style.maxWidth = '';
                app.style.maxHeight = '';
                app.style.aspectRatio = '9 / 16';
            }
        }

        // Update joystick visibility
        const joystickArea = document.getElementById('joystick-area');
        if (joystickArea) {
            joystickArea.style.display = config.showJoystick ? 'block' : 'none';
        }

        // Update CSS variable for UI scale
        document.documentElement.style.setProperty('--ui-scale', String(config.uiScale));
    },

    /**
     * Get current platform configuration
     * @returns {object}
     */
    getConfig() {
        return this.configs[this.currentMode as keyof typeof this.configs];
    },

    /**
     * Check if current mode is mobile
     * @returns {boolean}
     */
    isMobile() {
        return this.currentMode === this.MODES.MOBILE;
    },

    /**
     * Check if current mode is PC
     * @returns {boolean}
     */
    isPC() {
        return this.currentMode === this.MODES.PC;
    },

    /**
     * Subscribe to mode changes
     * @param {string} event - Event name ('modechange')
     * @param {function} callback - Handler function
     */
    on(event: string, callback: (data: unknown) => void) {
        this.listeners.push({ event, callback });
    },

    /**
     * Emit event to all listeners
     */
    emit(event: string, data: unknown) {
        this.listeners.filter((l) => l.event === event).forEach((l) => l.callback(data));
    }
};

import { Registry } from './Registry';
Registry.register('PlatformManager', PlatformManager);

// ES6 Module Export
export { PlatformManager };
