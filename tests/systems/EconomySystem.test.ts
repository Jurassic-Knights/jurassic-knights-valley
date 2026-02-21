/**
 * EconomySystem Unit Tests
 * Tests getGold, addGold, and spendGold with mocked hero and state.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all external dependencies
vi.mock('@core/Logger', () => ({
    Logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('@core/EventBus', () => ({
    EventBus: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
    },
}));

vi.mock('@data/GameConstants', () => ({
    GameConstants: {
        Events: {
            ADD_GOLD: 'ADD_GOLD',
            INVENTORY_UPDATED: 'INVENTORY_UPDATED',
        },
    },
    getConfig: vi.fn(),
}));

vi.mock('@core/State', () => ({
    GameState: {
        get: vi.fn(),
        set: vi.fn(),
    },
}));

vi.mock('../world/WorldManager', () => ({ WorldManager: {} }));
vi.mock('../audio/AudioManager', () => ({ AudioManager: {} }));
vi.mock('./VFXTriggerService', () => ({ VFXTriggerService: {} }));
vi.mock('@core/Registry', () => ({
    Registry: {
        register: vi.fn(),
        get: vi.fn(),
    },
}));

const { EconomySystem } = await import('@systems/EconomySystem');

function createMockHero(gold: number) {
    return {
        inventory: { gold },
    };
}

describe('EconomySystem', () => {
    let system: InstanceType<typeof EconomySystem>;

    beforeEach(() => {
        system = new EconomySystem();
    });

    describe('getGold', () => {
        it('should return gold from hero inventory', () => {
            const hero = createMockHero(100);
            system.game = { hero } as unknown as import('../types/core').IGame;

            expect(system.getGold()).toBe(100);
        });

        it('should return 0 when hero has no inventory', () => {
            system.game = { hero: {} } as unknown as import('../types/core').IGame;
            expect(system.getGold()).toBe(0);
        });

        it('should return 0 when no hero exists', () => {
            system.game = { hero: null } as unknown as import('../types/core').IGame;
            expect(system.getGold()).toBe(0);
        });
    });

    describe('addGold', () => {
        it('should increase gold by amount', () => {
            const hero = createMockHero(50);
            system.game = { hero } as unknown as import('../types/core').IGame;

            system.addGold(25);
            expect(hero.inventory.gold).toBe(75);
        });
    });

    describe('spendGold', () => {
        it('should deduct gold when sufficient balance', () => {
            const hero = createMockHero(100);
            system.game = { hero } as unknown as import('../types/core').IGame;

            const result = system.spendGold(30);
            expect(result).toBe(true);
            expect(hero.inventory.gold).toBe(70);
        });

        it('should reject spend when insufficient balance', () => {
            const hero = createMockHero(10);
            system.game = { hero } as unknown as import('../types/core').IGame;

            const result = system.spendGold(50);
            expect(result).toBe(false);
            expect(hero.inventory.gold).toBe(10); // unchanged
        });
    });
});
