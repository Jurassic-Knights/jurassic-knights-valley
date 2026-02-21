/**
 * CollisionSystemCollision – Collision detection and trigger event handling.
 */
import { Entity } from '../core/Entity';
import { WorldManager } from '../world/WorldManager';
import { GameConstants } from '../data/GameConstants';
import { EventBus } from '../core/EventBus';
import { getCollisionBounds, isHardCollision, isTriggerCollision } from './CollisionSystemUtils';

export function checkCollision(
    entity: Entity,
    spatialHash: Map<string, Entity[]>,
    cellSize: number,
    getBounds: (e: Entity) => { x: number; y: number; width: number; height: number }
): boolean {
    const col = entity.collision;
    const bounds = getBounds(entity);

    if (WorldManager.isBlocked(bounds.x, bounds.y) ||
        WorldManager.isBlocked(bounds.x + bounds.width, bounds.y) ||
        WorldManager.isBlocked(bounds.x, bounds.y + bounds.height) ||
        WorldManager.isBlocked(bounds.x + bounds.width, bounds.y + bounds.height)) {
        return true;
    }

    const startX = Math.floor(bounds.x / cellSize);
    const startY = Math.floor(bounds.y / cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / cellSize);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            const neighbors = spatialHash.get(key);
            if (!neighbors) continue;

            for (const other of neighbors) {
                if (other === entity || !other.active) continue;

                const otherCol = other.collision;
                if (!otherCol || !otherCol.enabled) continue;

                if (col && isHardCollision(col, otherCol)) {
                    if (entity.collidesWith(other)) return true;
                }
            }
        }
    }
    return false;
}

export function checkTriggers(
    entity: Entity,
    spatialHash: Map<string, Entity[]>,
    cellSize: number,
    activeCollisions: Map<string, Set<string>>,
    currentOverlapsScratch: Set<string>,
    entities: Entity[],
    getBounds: (e: Entity) => { x: number; y: number; width: number; height: number }
): void {
    const col = entity.collision;
    if (!col) return;

    const bounds = getBounds(entity);
    const startX = Math.floor(bounds.x / cellSize);
    const startY = Math.floor(bounds.y / cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / cellSize);

    currentOverlapsScratch.clear();

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            const neighbors = spatialHash.get(key);
            if (!neighbors) continue;

            for (const other of neighbors) {
                if (other === entity || !other.active) continue;

                const otherCol = other.collision;
                if (!otherCol || !otherCol.enabled) continue;

                if (isTriggerCollision(col, otherCol) && entity.collidesWith(other)) {
                    currentOverlapsScratch.add(other.id);
                }
            }
        }
    }

    let previousOverlaps = activeCollisions.get(entity.id);
    if (!previousOverlaps) {
        previousOverlaps = new Set();
        activeCollisions.set(entity.id, previousOverlaps);
    }

    for (const otherId of currentOverlapsScratch) {
        if (!previousOverlaps.has(otherId)) {
            const other = entities.find((e) => e.id === otherId);
            if (other) EventBus.emit(GameConstants.Events.COLLISION_START, { a: entity, b: other });
        }
    }

    for (const otherId of previousOverlaps) {
        if (!currentOverlapsScratch.has(otherId)) {
            const other = entities.find((e) => e.id === otherId);
            if (other) EventBus.emit(GameConstants.Events.COLLISION_END, { a: entity, b: other });
        }
    }

    previousOverlaps.clear();
    for (const id of currentOverlapsScratch) previousOverlaps.add(id);
}
