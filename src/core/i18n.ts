/**
 * i18n - Internationalization System
 * 
 * Simple localization system for Jurassic Knights: Valley.
 * Supports lazy-loading of language files and string interpolation.
 * 
 * Usage:
 *   i18n.t('ui.start_game')           // "Start Game"
 *   i18n.t('combat.damage', { n: 50 }) // "Dealt 50 damage!"
 *   i18n.setLanguage('es')            // Switch to Spanish
 */
import { Logger } from './Logger';
import { EventBus } from './EventBus';

class I18n {
    private currentLocale: string = 'en';
    private translations: Record<string, unknown> = {};
    private fallbackLocale: string = 'en';

    constructor() {
        Logger?.info('[i18n] Initialized');
    }

    /**
     * Load a language file
     * @param {string} locale - Language code (en, es, fr, etc.)
     */
    async load(locale: string) {
        if (this.translations[locale]) {
            return; // Already loaded
        }

        try {
            const response = await fetch(`/locales/${locale}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${locale}.json`);
            }
            this.translations[locale] = await response.json();
            Logger?.info(`[i18n] Loaded ${locale}`);
        } catch (error) {
            Logger?.warn(`[i18n] Could not load ${locale}:`, (error as Error).message);
        }
    }

    /**
     * Set current language
     * @param {string} locale - Language code
     */
    async setLanguage(locale: string) {
        await this.load(locale);
        if (this.translations[locale]) {
            this.currentLocale = locale;
            EventBus?.emit('LANGUAGE_CHANGED', { locale });
        }
    }

    /**
     * Get translated string
     * @param {string} key - Dot-notation key (e.g., 'ui.buttons.start')
     * @param {object} params - Interpolation params (e.g., { n: 5 })
     * @returns {string} Translated string or key if not found
     */
    t(key: string, params: Record<string, unknown> = {}) {
        const value = this._getNestedValue(key, this.currentLocale)
            || this._getNestedValue(key, this.fallbackLocale)
            || key;

        // Interpolate {param} placeholders
        return String(value).replace(/\{(\w+)\}/g, (_: string, name: string) => String(params[name] ?? `{${name}}`));
    }

    /**
     * Get value from nested object using dot notation
     * @private
     */
    _getNestedValue(key: string, locale: string) {
        const trans = this.translations[locale];
        if (!trans) return null;

        return key.split('.').reduce((obj: unknown, k: string) => (obj as Record<string, unknown>)?.[k], trans);
    }

    /**
     * Get available locales
     * @returns {string[]}
     */
    getAvailableLocales() {
        return Object.keys(this.translations);
    }

    /**
     * Get current locale
     * @returns {string}
     */
    getCurrentLocale() {
        return this.currentLocale;
    }
}

// Create and export singleton
const i18n = new I18n();
export { I18n, i18n };
