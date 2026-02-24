/**
 * Animations Utility
 * Helper functions for UI animations
 *
 * Owner: VFX Specialist
 */
import { DOMUtils } from '@core/DOMUtils';

const Animations = {
    /**
     * Create a ripple effect at click position
     */
    ripple(element: HTMLElement, event: MouseEvent) {
        const rect = element.getBoundingClientRect();
        const ripple = DOMUtils.create('span', {
            className: 'ripple',
            styles: {
                left: `${event.clientX - rect.left}px`,
                top: `${event.clientY - rect.top}px`
            }
        });
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    },

    /**
     * Flash the screen with a color
     */
    screenFlash(color = 'gold') {
        const flash = DOMUtils.create('div', {
            className: `screen-flash screen-flash--${color}`
        });
        document.body.appendChild(flash);

        setTimeout(() => flash.remove(), 300);
    },

    /**
     * Show floating text
     */
    floatingText(text: string, x: number, y: number, type: string = 'gold') {
        const el = DOMUtils.create('div', {
            className: `floating-text floating-text--${type}`,
            text: text,
            styles: {
                left: `${x}px`,
                top: `${y}px`
            }
        });
        document.getElementById('app')?.appendChild(el);

        setTimeout(() => el.remove(), 1000);
    }
};

// ES6 Module Export
export { Animations };
