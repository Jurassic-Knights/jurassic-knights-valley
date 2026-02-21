/**
 * Registry Unit Tests
 * Tests register, get, assert, clear, and duplicate-registration guard.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Logger
vi.mock('@core/Logger', () => ({
    Logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

const { Registry } = await import('@core/Registry');

describe('Registry', () => {
    beforeEach(() => {
        Registry.clear();
    });

    describe('register / get', () => {
        it('should register and retrieve a service', () => {
            const service = { name: 'TestService' };
            Registry.register('TestService', service);

            expect(Registry.get('TestService')).toBe(service);
        });

        it('should return undefined for unregistered service', () => {
            expect(Registry.get('NonExistent')).toBeUndefined();
        });

        it('should throw on duplicate registration', () => {
            Registry.register('Dup', { a: 1 });
            expect(() => Registry.register('Dup', { a: 2 })).toThrow();
        });
    });

    describe('assert', () => {
        it('should return the service when present', () => {
            const svc = { val: 42 };
            Registry.register('MySvc', svc);
            expect(Registry.assert('MySvc')).toBe(svc);
        });

        it('should throw when service is missing', () => {
            expect(() => Registry.assert('Missing')).toThrow(/Critical dependency missing/);
        });
    });

    describe('clear', () => {
        it('should remove all registered services', () => {
            Registry.register('A', 1);
            Registry.register('B', 2);
            Registry.clear();

            expect(Registry.get('A')).toBeUndefined();
            expect(Registry.get('B')).toBeUndefined();
        });
    });

    describe('typed get', () => {
        it('should return typed value with generic', () => {
            Registry.register('TypedSvc', { count: 10 });
            const svc = Registry.get<{ count: number }>('TypedSvc');
            expect(svc?.count).toBe(10);
        });
    });
});
