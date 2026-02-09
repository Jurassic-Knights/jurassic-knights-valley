/**
 * EntityManager Unit Tests
 *
 * Tests add/remove/getAll/getByType for the entity manager service.
 * Uses a fresh EntityManagerService instance (no init) to avoid Quadtree/Registry/Game deps.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { EntityManagerService } from '@core/EntityManager';
import type { IEntity } from '@/types/core';

class MockEntity implements IEntity {
    x = 0;
    y = 0;
    width = 16;
    height = 16;
    active = true;
    constructor(
        public id: string,
        x = 0,
        y = 0
    ) {
        this.x = x;
        this.y = y;
    }
}

describe('EntityManagerService', () => {
    let manager: EntityManagerService;

    beforeEach(() => {
        manager = new EntityManagerService();
    });

    describe('add / getAll', () => {
        it('should add entity and return it in getAll', () => {
            const e = new MockEntity('a', 10, 20);
            manager.add(e);
            const all = manager.getAll();
            expect(all).toHaveLength(1);
            expect(all[0]).toBe(e);
            expect(all[0].x).toBe(10);
            expect(all[0].y).toBe(20);
        });

        it('should add multiple entities', () => {
            manager.add(new MockEntity('1'));
            manager.add(new MockEntity('2'));
            manager.add(new MockEntity('3'));
            expect(manager.getAll()).toHaveLength(3);
        });
    });

    describe('getByType', () => {
        it('should return entities by constructor name', () => {
            const a = new MockEntity('a');
            const b = new MockEntity('b');
            manager.add(a);
            manager.add(b);
            const mockEntities = manager.getByType('MockEntity');
            expect(mockEntities).toHaveLength(2);
            expect(mockEntities).toContain(a);
            expect(mockEntities).toContain(b);
        });

        it('should return empty array for unknown type', () => {
            manager.add(new MockEntity('a'));
            expect(manager.getByType('NonExistent')).toEqual([]);
        });
    });

    describe('remove', () => {
        it('should remove entity and remove from getByType', () => {
            const e = new MockEntity('a');
            manager.add(e);
            expect(manager.getAll()).toHaveLength(1);
            manager.remove(e);
            expect(manager.getAll()).toHaveLength(0);
            expect(manager.getByType('MockEntity')).toHaveLength(0);
        });

        it('should no-op when removing unknown entity', () => {
            const e = new MockEntity('a');
            manager.add(e);
            const other = new MockEntity('b');
            manager.remove(other);
            expect(manager.getAll()).toHaveLength(1);
        });
    });
});
