/**
 * ResourceDrops – Spawn drops when resource is depleted.
 */
import { Logger } from '@core/Logger';
import { EntityRegistry } from '@entities/EntityLoader';
import { spawnDrop } from './SpawnHelper';

export function spawnResourceDrops(
    x: number,
    y: number,
    amount: number,
    resourceType: string
): void {
    const typeConfig = EntityRegistry.nodes?.[resourceType] || EntityRegistry.resources?.[resourceType] || {};

    if (typeConfig.drops && Array.isArray(typeConfig.drops) && typeConfig.drops.length > 0) {
        typeConfig.drops.forEach((drop: { item: string; chance?: number; amount?: number | [number, number] }) => {
            const roll = Math.random();
            const chance = drop.chance !== undefined ? drop.chance : 1;
            if (roll <= chance) {
                let count = 1;
                if (Array.isArray(drop.amount)) {
                    count = Math.floor(Math.random() * (drop.amount[1] - drop.amount[0] + 1)) + drop.amount[0];
                } else if (typeof drop.amount === 'number') count = drop.amount;
                spawnDrop(x, y, drop.item, count);
            }
        });
    } else if (typeConfig.resourceDrop) {
        spawnDrop(x, y, typeConfig.resourceDrop as string, amount);
    } else if (typeConfig.loot && Array.isArray(typeConfig.loot)) {
        typeConfig.loot.forEach((drop: { item: string; chance?: number }) => {
            if (Math.random() <= (drop.chance || 1)) spawnDrop(x, y, drop.item, 1);
        });
    } else {
        Logger.warn(`[Resource] No drop configured for ${resourceType}. Dropping nothing.`);
    }
}
