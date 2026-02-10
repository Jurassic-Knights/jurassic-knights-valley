/**
 * DamageSystem tests
 *
 * Verifies that ENTITY_DAMAGED is handled: health component updated,
 * ENTITY_HEALTH_CHANGE / HERO_HEALTH_CHANGE emitted, and ENTITY_DIED when health reaches 0.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { EntityTypes } from '@config/EntityTypes';
import type { IEntity } from '../src/types/core';
// Load DamageSystem so it subscribes to ENTITY_DAMAGED
import '@systems/DamageSystem';

const Events = GameConstants.Events;

describe('DamageSystem (event flow)', () => {
    const testEntityId = 'test-damage-entity-' + Math.random().toString(36).slice(2);

    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        // Clean up any listeners we added
        EventBus.off(Events.ENTITY_HEALTH_CHANGE, () => {});
        EventBus.off(Events.ENTITY_DIED, () => {});
        EventBus.off(Events.DAMAGE_NUMBER_REQUESTED, () => {});
    });

    it('emits ENTITY_HEALTH_CHANGE when entity with health component takes damage', async () => {
        const mockEntity: IEntity = {
            id: testEntityId,
            active: true,
            isDead: false,
            entityType: EntityTypes.ENEMY,
            x: 0,
            y: 0,
            components: {
                health: {
                    health: 100,
                    maxHealth: 100,
                    isDead: false,
                    parent: null,
                    getMaxHealth: () => 100
                }
            },
            defense: 0
        } as unknown as IEntity;

        const promise = new Promise<{ current: number; max: number }>((resolve) => {
            const handler = (data: { current: number; max: number }) => {
                EventBus.off(Events.ENTITY_HEALTH_CHANGE, handler);
                resolve(data);
            };
            EventBus.on(Events.ENTITY_HEALTH_CHANGE, handler);
        });
        EventBus.emit(Events.ENTITY_DAMAGED, { entity: mockEntity, amount: 20 });
        const data = await promise;
        expect(data.current).toBe(80);
        expect(data.max).toBe(100);
    });

    it('emits ENTITY_DIED when health reaches zero', async () => {
        const mockEntity: IEntity = {
            id: testEntityId + '-die',
            active: true,
            isDead: false,
            entityType: EntityTypes.ENEMY,
            x: 0,
            y: 0,
            components: {
                health: {
                    health: 10,
                    maxHealth: 100,
                    isDead: false,
                    parent: null,
                    getMaxHealth: () => 100
                }
            },
            defense: 0,
            die: vi.fn()
        } as unknown as IEntity;

        const promise = new Promise<{ entity: IEntity }>((resolve) => {
            const handler = (data: { entity: IEntity }) => {
                EventBus.off(Events.ENTITY_DIED, handler);
                resolve(data);
            };
            EventBus.on(Events.ENTITY_DIED, handler);
        });
        EventBus.emit(Events.ENTITY_DAMAGED, { entity: mockEntity, amount: 15 });
        const data = await promise;
        expect(data.entity.id).toBe(mockEntity.id);
    });
});
