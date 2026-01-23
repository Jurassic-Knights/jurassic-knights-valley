/**
 * Logger Unit Tests
 *
 * Tests for the core Logger utility
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Type definitions for the Logger mock
interface LoggerLevels {
    DEBUG: number;
    INFO: number;
    WARN: number;
    ERROR: number;
    NONE: number;
}

interface LoggerColors {
    DEBUG: string;
    INFO: string;
    WARN: string;
    ERROR: string;
}

interface LoggerType {
    LEVELS: LoggerLevels;
    currentLevel: number;
    colors: LoggerColors;
    setLevel: (level: number) => void;
    _getLevelName: (level: number) => string;
    debug: (tag: string, ...args: unknown[]) => void;
    info: (tag: string, ...args: unknown[]) => void;
    warn: (tag: string, ...args: unknown[]) => void;
    error: (tag: string, ...args: unknown[]) => void;
}

// Mock the Logger object (since it uses window globals)
const Logger: LoggerType = {
    LEVELS: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4,
    },
    currentLevel: 1,
    colors: {
        DEBUG: '#888888',
        INFO: '#4FC3F7',
        WARN: '#FFB74D',
        ERROR: '#EF5350',
    },

    setLevel(level: number): void {
        this.currentLevel = level;
    },

    _getLevelName(level: number): string {
        return Object.keys(this.LEVELS).find((key) => this.LEVELS[key as keyof LoggerLevels] === level) || 'UNKNOWN';
    },

    debug(tag: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.LEVELS.DEBUG) {
            console.log(tag, ...args);
        }
    },

    info(tag: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.LEVELS.INFO) {
            console.log(tag, ...args);
        }
    },

    warn(tag: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.LEVELS.WARN) {
            console.warn(tag, ...args);
        }
    },

    error(tag: string, ...args: unknown[]): void {
        if (this.currentLevel <= this.LEVELS.ERROR) {
            console.error(tag, ...args);
        }
    },
};

describe('Logger', () => {
    beforeEach(() => {
        Logger.currentLevel = Logger.LEVELS.INFO;
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('LEVELS', () => {
        it('should have correct level values', () => {
            expect(Logger.LEVELS.DEBUG).toBe(0);
            expect(Logger.LEVELS.INFO).toBe(1);
            expect(Logger.LEVELS.WARN).toBe(2);
            expect(Logger.LEVELS.ERROR).toBe(3);
            expect(Logger.LEVELS.NONE).toBe(4);
        });
    });

    describe('setLevel', () => {
        it('should update currentLevel', () => {
            Logger.setLevel(Logger.LEVELS.WARN);
            expect(Logger.currentLevel).toBe(Logger.LEVELS.WARN);
        });
    });

    describe('_getLevelName', () => {
        it('should return correct level name', () => {
            expect(Logger._getLevelName(0)).toBe('DEBUG');
            expect(Logger._getLevelName(1)).toBe('INFO');
            expect(Logger._getLevelName(2)).toBe('WARN');
            expect(Logger._getLevelName(3)).toBe('ERROR');
        });

        it('should return UNKNOWN for invalid level', () => {
            expect(Logger._getLevelName(99)).toBe('UNKNOWN');
        });
    });

    describe('logging methods', () => {
        it('should log info messages when level is INFO', () => {
            Logger.setLevel(Logger.LEVELS.INFO);
            Logger.info('[Test]', 'test message');
            expect(console.log).toHaveBeenCalled();
        });

        it('should not log debug messages when level is INFO', () => {
            Logger.setLevel(Logger.LEVELS.INFO);
            Logger.debug('[Test]', 'debug message');
            expect(console.log).not.toHaveBeenCalled();
        });

        it('should log warn messages', () => {
            Logger.setLevel(Logger.LEVELS.WARN);
            Logger.warn('[Test]', 'warning message');
            expect(console.warn).toHaveBeenCalled();
        });

        it('should log error messages', () => {
            Logger.setLevel(Logger.LEVELS.ERROR);
            Logger.error('[Test]', 'error message');
            expect(console.error).toHaveBeenCalled();
        });

        it('should not log anything when level is NONE', () => {
            Logger.setLevel(Logger.LEVELS.NONE);
            Logger.debug('[Test]', 'debug');
            Logger.info('[Test]', 'info');
            Logger.warn('[Test]', 'warn');
            Logger.error('[Test]', 'error');
            expect(console.log).not.toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.error).not.toHaveBeenCalled();
        });
    });
});
