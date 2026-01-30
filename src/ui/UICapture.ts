/**
 * UICapture - Debug UI Screenshot Utilities
 *
 * Separated from UIManager for single responsibility.
 * Only loaded in development/debug mode.
 */

import { Logger } from '@core/Logger';
import { DOMUtils } from '@core/DOMUtils';

// Unmapped modules - need manual import
declare const html2canvas: any; // TODO: Add proper import

// Unmapped modules - need manual import
// TODO: Add proper import

const UICapture = {
    /**
     * Toggles UI Capture Mode for designing backplates.
     * Hides world, buttons, icons, and text.
     */
    toggleMode() {
        document.body.classList.toggle('ui-capture-mode');
        const isActive = document.body.classList.contains('ui-capture-mode');
        Logger.info('[UICapture]', `Mode: ${isActive ? 'ON' : 'OFF'}`);
        return isActive;
    },

    /**
     * Captures a specific DOM element as a transparent PNG.
     */
    async captureElement(selector: string, filename: string) {
        const el = document.querySelector(selector);
        if (!el) {
            Logger.warn('[UICapture]', `Element not found: ${selector}`);
            return;
        }

        try {
            Logger.info('[UICapture]', `Capturing ${selector}...`);
            const canvas = await html2canvas(el, {
                backgroundColor: null,
                scale: 1,
                useCORS: true,
                ignoreElements: (element: HTMLElement) => {
                    if (element.tagName === 'CANVAS') return true;
                    if (element.tagName === 'IMG' || element.tagName === 'VIDEO') return true;
                    return false;
                }
            });

            const link = DOMUtils.create('a', {
                attributes: {
                    download: filename,
                    href: canvas.toDataURL('image/png')
                }
            }) as HTMLAnchorElement;
            link.click();
            Logger.info('[UICapture]', `Saved ${filename}`);
        } catch (err) {
            Logger.error('[UICapture]', `Failed to capture ${selector}:`, err);
        }
    },

    /**
     * Batch captures all major UI zones as separate assets.
     */
    async captureAllZones() {
        if (!html2canvas) return alert('html2canvas missing');

        const wasActive = document.body.classList.contains('ui-capture-mode');
        if (!wasActive) this.toggleMode();

        await new Promise((r) => setTimeout(r, 500));

        await this.captureElement('#ui-footer-zone', 'ui_plate_footer.png');
        await this.captureElement('#ui-quest-panel', 'ui_plate_quest.png');
        await this.captureElement('#ui-resolve-bar', 'ui_plate_resolve.png');
        await this.captureElement('#ui-hud-left', 'ui_plate_status.png');
        await this.captureElement('#resource-counters', 'ui_plate_resources.png');
    },

    /**
     * Automates the UI Capture workflow
     */
    async autoCapture() {
        await this.captureAllZones();
    }
};

const debugUICapture = () => UICapture.captureAllZones();

// ES6 Module Export
export { UICapture, debugUICapture };
