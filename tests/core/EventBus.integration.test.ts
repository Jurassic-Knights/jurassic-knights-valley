/**
 * EventBus Integration Tests
 *
 * Tests the real EventBus from src/core/EventBus (on/off/emit behavior).
 * Uses a dedicated test event name to avoid colliding with app listeners.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '@core/EventBus';

const TEST_EVENT = 'TEST_EVENT_AUDIT_' + Math.random().toString(36).slice(2);

describe('EventBus (real implementation)', () => {
    let callback: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        callback = vi.fn();
    });

    afterEach(() => {
        EventBus.off(TEST_EVENT, callback);
    });

    describe('on / emit', () => {
        it('should call listener when event is emitted', () => {
            EventBus.on(TEST_EVENT, callback);
            const payload = { value: 42 };
            EventBus.emit(TEST_EVENT, payload);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith(payload);
        });

        it('should call multiple listeners for same event', () => {
            const cb2 = vi.fn();
            EventBus.on(TEST_EVENT, callback);
            EventBus.on(TEST_EVENT, cb2);
            EventBus.emit(TEST_EVENT, {});
            expect(callback).toHaveBeenCalledTimes(1);
            expect(cb2).toHaveBeenCalledTimes(1);
            EventBus.off(TEST_EVENT, cb2);
        });

        it('should not throw for unregistered event', () => {
            expect(() => EventBus.emit('NONEXISTENT_EVENT_XYZ', {})).not.toThrow();
        });
    });

    describe('off', () => {
        it('should stop calling listener after off', () => {
            EventBus.on(TEST_EVENT, callback);
            EventBus.emit(TEST_EVENT, {});
            expect(callback).toHaveBeenCalledTimes(1);
            EventBus.off(TEST_EVENT, callback);
            EventBus.emit(TEST_EVENT, {});
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
});
