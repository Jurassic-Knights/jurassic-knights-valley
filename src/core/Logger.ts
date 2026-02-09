/**
 * Logger - Centralized logging utility with configurable levels
 *
 * Levels:
 * - DEBUG (0): Verbose debugging info
 * - INFO (1): General information
 * - WARN (2): Warnings
 * - ERROR (3): Errors
 * - NONE (4): Disable all logging
 *
 * Usage:
 *   Logger.debug('[System]', 'message');
 *   Logger.info('[System]', 'message');
 *   Logger.warn('[System]', 'message');
 *   Logger.error('[System]', 'message');
 *   Logger.setLevel(Logger.LEVELS.WARN); // Only show warnings and errors
 */

const Logger = {
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    },

    // Default: INFO in production, DEBUG in development
    currentLevel: 1,

    // Color coding for console
    colors: {
        DEBUG: '#888888',
        INFO: '#4FC3F7',
        WARN: '#FFB74D',
        ERROR: '#EF5350'
    },

    setLevel(level: number) {
        this.currentLevel = level;
        console.log(`[Logger] Level set to: ${this._getLevelName(level)}`);
    },

    _getLevelName(level: number) {
        return Object.keys(this.LEVELS).find((key) => this.LEVELS[key as keyof typeof this.LEVELS] === level) || 'UNKNOWN';
    },

    _format(level: number, tag: string, ...args: unknown[]) {
        const timestamp = new Date().toISOString().substr(11, 12);
        const color = this.colors[this._getLevelName(level) as keyof typeof this.colors];
        return [`%c[${timestamp}]${tag}`, `color: ${color}`, ...args];
    },

    debug(tag: string, ...args: unknown[]) {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.log(...this._format(this.LEVELS.DEBUG, tag, ...args));
        }
    },

    info(tag: string, ...args: unknown[]) {
        if (this.currentLevel <= this.LEVELS.INFO) {
            console.log(...this._format(this.LEVELS.INFO, tag, ...args));
        }
    },

    warn(tag: string, ...args: unknown[]) {
        if (this.currentLevel <= this.LEVELS.WARN) {
            console.warn(...this._format(this.LEVELS.WARN, tag, ...args));
        }
    },

    error(tag: string, ...args: unknown[]) {
        if (this.currentLevel <= this.LEVELS.ERROR) {
            console.error(...this._format(this.LEVELS.ERROR, tag, ...args));
        }
    },

    // Group logging for related messages
    group(tag: string, label: string) {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.group(`${tag} ${label}`);
        }
    },

    groupEnd() {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.groupEnd();
        }
    },

    // Performance timing
    time(label: string) {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.time(label);
        }
    },

    timeEnd(label: string) {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.timeEnd(label);
        }
    }
};

// Set default level based on environment
// In production, set to WARN to reduce noise
if (typeof window !== 'undefined' && location.hostname !== 'localhost' && !location.hostname.includes('127.0.0.1')) {
    Logger.currentLevel = Logger.LEVELS.WARN;
}

// ES6 Module Export
export { Logger };
