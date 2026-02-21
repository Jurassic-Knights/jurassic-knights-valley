/**
 * EventBus Unit Tests
 * Tests subscribe, emit, unsubscribe, and error isolation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger to suppress console output
vi.mock('@core/Logger', () => ({
    Logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

// Import after mocks
const { EventBus } = await import('@core/EventBus');

describe('EventBus', () => {
    beforeEach(() => {
        // Clear all listeners between tests
        EventBus.listeners = {};
    });

    describe('on / emit', () => {
        it('should call listener when event is emitted', () => {
            const listener = vi.fn();
            EventBus.on('TEST_EVENT', listener);
            EventBus.emit('TEST_EVENT', { value: 42 });

            expect(listener).toHaveBeenCalledOnce();
            expect(listener).toHaveBeenCalledWith({ value: 42 });
        });

        it('should support multiple listeners on the same event', () => {
            const listener1 = vi.fn();
            const listener2 = vi.fn();
            EventBus.on('MULTI', listener1);
            EventBus.on('MULTI', listener2);
            EventBus.emit('MULTI', 'data');

            expect(listener1).toHaveBeenCalledWith('data');
            expect(listener2).toHaveBeenCalledWith('data');
        });

        it('should not call listener for different events', () => {
            const listener = vi.fn();
            EventBus.on('EVENT_A', listener);
            EventBus.emit('EVENT_B', 'data');

            expect(listener).not.toHaveBeenCalled();
        });

        it('should handle emit with no data', () => {
            const listener = vi.fn();
            EventBus.on('NO_DATA', listener);
            EventBus.emit('NO_DATA');

            expect(listener).toHaveBeenCalledWith(undefined);
        });

        it('should handle emit with no listeners (no-op)', () => {
            expect(() => EventBus.emit('UNREGISTERED_EVENT')).not.toThrow();
        });
    });

    describe('off', () => {
        it('should unsubscribe a specific listener', () => {
            const listener = vi.fn();
            EventBus.on('UNSUB', listener);
            EventBus.off('UNSUB', listener);
            EventBus.emit('UNSUB', 'data');

            expect(listener).not.toHaveBeenCalled();
        });

        it('should not affect other listeners when unsubscribing', () => {
            const keep = vi.fn();
            const remove = vi.fn();
            EventBus.on('PARTIAL', keep);
            EventBus.on('PARTIAL', remove);
            EventBus.off('PARTIAL', remove);
            EventBus.emit('PARTIAL', 'data');

            expect(keep).toHaveBeenCalledOnce();
            expect(remove).not.toHaveBeenCalled();
        });

        it('should handle off for non-existent event (no-op)', () => {
            expect(() => EventBus.off('NONEXISTENT', vi.fn())).not.toThrow();
        });
    });

    describe('error isolation', () => {
        it('should not propagate listener errors to other listeners', () => {
            const badListener = vi.fn(() => { throw new Error('boom'); });
            const goodListener = vi.fn();
            EventBus.on('ERROR_TEST', badListener);
            EventBus.on('ERROR_TEST', goodListener);

            expect(() => EventBus.emit('ERROR_TEST', 'data')).not.toThrow();

            expect(badListener).toHaveBeenCalledOnce();
            expect(goodListener).toHaveBeenCalledOnce();
        });
    });
});
