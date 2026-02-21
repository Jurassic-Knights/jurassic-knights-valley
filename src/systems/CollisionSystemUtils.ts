/**
 * CollisionSystemUtils – Shared collision helpers and bounds computation.
 */
import { Entity } from '../core/Entity';
import type { CollisionComponent } from '../components/CollisionComponent';

export function getCollisionBounds(entity: Entity): { x: number; y: number; width: number; height: number } {
    const col = entity.collision;
    if (col) {
        return {
            x: entity.x - col.bounds.width / 2 + col.bounds.offsetX,
            y: entity.y - col.bounds.height / 2 + col.bounds.offsetY,
            width: col.bounds.width,
            height: col.bounds.height
        };
    }
    return entity.getBounds();
}

export function isHardCollision(a: CollisionComponent, b: CollisionComponent): boolean {
    if (a.isTrigger || b.isTrigger) return false;
    return (a.mask & b.layer) !== 0;
}

export function isTriggerCollision(a: CollisionComponent, b: CollisionComponent): boolean {
    return (a.isTrigger || b.isTrigger) && (a.mask & b.layer) !== 0;
}
