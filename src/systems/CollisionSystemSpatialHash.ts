/**
 * CollisionSystemSpatialHash – Spatial hash update for collision queries.
 */
import { Entity } from '../core/Entity';
import { getCollisionBounds } from './CollisionSystemUtils';

export function updateSpatialHash(
    entity: Entity,
    spatialHash: Map<string, Entity[]>,
    cellSize: number
): void {
    const bounds = entity.collision ? getCollisionBounds(entity) : entity.getBounds();

    const startX = Math.floor(bounds.x / cellSize);
    const startY = Math.floor(bounds.y / cellSize);
    const endX = Math.floor((bounds.x + bounds.width) / cellSize);
    const endY = Math.floor((bounds.y + bounds.height) / cellSize);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            if (!spatialHash.has(key)) spatialHash.set(key, []);
            spatialHash.get(key)!.push(entity);
        }
    }
}
