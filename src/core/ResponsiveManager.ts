/**
 * ResponsiveManager - Handles responsive breakpoints for mobile and PC
 * Detects format and emits events for UI adaptation
 *
 * Owner: Director
 */

const ResponsiveManager = {
    // Breakpoints matching css/layout.css
    breakpoints: {
        mobile: 480,
        tablet: 768,
        desktop: 1024
    },

    // Current detected format
    currentFormat: 'mobile',
    currentOrientation: 'portrait',

    // Event listeners
    listeners: [],

    /**
     * Initialize the responsive manager
     */
    init() {
        this.detect();
        addEventListener('resize', () => this.onResize());
        addEventListener('orientationchange', () => this.onResize());
        Logger.info(
            `[ResponsiveManager] Initialized: ${this.currentFormat} (${this.currentOrientation})`
        );
    },

    /**
     * Detect current format and orientation
     */
    detect() {
        const width = innerWidth;
        const height = innerHeight;

        // Determine format
        let newFormat;
        if (width <= this.breakpoints.mobile) {
            newFormat = 'mobile';
        } else if (width <= this.breakpoints.tablet) {
            newFormat = 'tablet';
        } else {
            newFormat = 'desktop';
        }

        // Determine orientation
        const newOrientation = width > height ? 'landscape' : 'portrait';

        // Check if changed
        const changed =
            newFormat !== this.currentFormat || newOrientation !== this.currentOrientation;

        this.currentFormat = newFormat;
        this.currentOrientation = newOrientation;

        // Update body classes for CSS targeting
        document.body.classList.remove('mobile', 'tablet', 'desktop', 'portrait', 'landscape');
        document.body.classList.add(this.currentFormat, this.currentOrientation);

        return changed;
    },

    /**
     * Handle resize events
     */
    onResize() {
        if (this.detect()) {
            this.emit('change', {
                format: this.currentFormat,
                orientation: this.currentOrientation
            });
        }
    },

    /**
     * Subscribe to format changes
     * @param {string} event - Event name ('change')
     * @param {function} callback - Handler function
     */
    on(event, callback) {
        this.listeners.push({ event, callback });
    },

    /**
     * Emit event to all listeners
     */
    emit(event, data) {
        this.listeners.filter((l) => l.event === event).forEach((l) => l.callback(data));
    },

    /**
     * Check if current format is mobile
     */
    isMobile() {
        return this.currentFormat === 'mobile';
    },

    /**
     * Check if current format is desktop
     */
    isDesktop() {
        return this.currentFormat === 'desktop';
    },

    /**
     * Get the app container dimensions
     */
    getAppBounds() {
        const app = document.getElementById('app');
        return app ? app.getBoundingClientRect() : null;
    }
};

// Export for global access

// ES6 Module Export
export { ResponsiveManager };
