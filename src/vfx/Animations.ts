/**
 * Animations Utility
 * Helper functions for UI animations
 *
 * Owner: VFX Specialist
 */

const Animations = {
    /**
     * Create a ripple effect at click position
     */
    ripple(element, event) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    },

    /**
     * Flash the screen with a color
     */
    screenFlash(color = 'gold') {
        const flash = document.createElement('div');
        flash.className = `screen-flash screen-flash--${color}`;
        document.body.appendChild(flash);

        setTimeout(() => flash.remove(), 300);
    },

    /**
     * Show floating text
     */
    floatingText(text, x, y, type = 'gold') {
        const el = document.createElement('div');
        el.className = `floating-text floating-text--${type}`;
        el.textContent = text;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.getElementById('app').appendChild(el);

        setTimeout(() => el.remove(), 1000);
    }
};


// ES6 Module Export
export { Animations };
