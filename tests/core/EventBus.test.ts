/**
 * EventBus Unit Tests
 *
 * Tests for the pub/sub EventBus system
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Type definitions
type EventCallback<T = unknown> = (data: T) => void;

// Create a fresh EventBus for testing
class TestEventBus {
    listeners: Record<string, EventCallback[]>;

    constructor() {
        this.listeners = {};
    }

    on<T = unknown>(eventName: string, callback: EventCallback<T>): void {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(callback as EventCallback);
    }

    off<T = unknown>(eventName: string, callback: EventCallback<T>): void {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName] = this.listeners[eventName].filter((cb) => cb !== callback);
    }

    emit<T = unknown>(eventName: string, data: T): void {
        if (!this.listeners[eventName]) return;
        this.listeners[eventName].forEach((callback) => {
            callback(data);
        });
    }
}

describe('EventBus', () => {
    let eventBus: TestEventBus;

    beforeEach(() => {
        eventBus = new TestEventBus();
    });

    describe('on', () => {
        it('should register event listeners', () => {
            const callback = vi.fn();
            eventBus.on('TEST_EVENT', callback);
            expect(eventBus.listeners['TEST_EVENT']).toContain(callback);
        });

        it('should allow multiple listeners for same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            eventBus.on('TEST_EVENT', callback1);
            eventBus.on('TEST_EVENT', callback2);
            expect(eventBus.listeners['TEST_EVENT']).toHaveLength(2);
        });
    });

    describe('emit', () => {
        it('should call registered listeners with data', () => {
            const callback = vi.fn();
            const testData = { value: 42 };

            eventBus.on('TEST_EVENT', callback);
            eventBus.emit('TEST_EVENT', testData);

            expect(callback).toHaveBeenCalledWith(testData);
        });

        it('should call all listeners for an event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            eventBus.on('TEST_EVENT', callback1);
            eventBus.on('TEST_EVENT', callback2);
            eventBus.emit('TEST_EVENT', {});

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });

        it('should not throw for unregistered events', () => {
            expect(() => eventBus.emit('UNKNOWN_EVENT', {})).not.toThrow();
        });
    });

    describe('off', () => {
        it('should remove specific listener', () => {
            const callback = vi.fn();
            eventBus.on('TEST_EVENT', callback);
            eventBus.off('TEST_EVENT', callback);
            eventBus.emit('TEST_EVENT', {});

            expect(callback).not.toHaveBeenCalled();
        });

        it('should only remove specified callback', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            eventBus.on('TEST_EVENT', callback1);
            eventBus.on('TEST_EVENT', callback2);
            eventBus.off('TEST_EVENT', callback1);
            eventBus.emit('TEST_EVENT', {});

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });
});
