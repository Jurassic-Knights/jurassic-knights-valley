/**
 * EntityLoaderBroadcast - Handle live entity updates from dashboard
 */
import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { EntityConfig, IEntity } from '../types/core';

interface EntityRegistryStrict {
    enemies: Record<string, EntityConfig>;
    bosses: Record<string, EntityConfig>;
    [key: string]: Record<string, EntityConfig> | undefined;
}

export function handleEntityUpdate(
    EntityRegistry: EntityRegistryStrict,
    category: string,
    configId: string,
    updates: Record<string, unknown>
) {
    const validCategory = category as keyof EntityRegistryStrict;
    if (!EntityRegistry[validCategory]) return;

    const registryEntity = EntityRegistry[validCategory][configId];
    if (!registryEntity) {
        Logger.warn(`[EntityLoader] Received update for unknown entity: ${category}/${configId}`);
        return;
    }

    for (const [key, value] of Object.entries(updates)) {
        if (key.includes('.')) {
            const parts = key.split('.');
            let target = registryEntity as Record<string, unknown>;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!target[parts[i]]) (target as Record<string, unknown>)[parts[i]] = {};
                target = (target[parts[i]] as Record<string, unknown>);
            }
            target[parts[parts.length - 1]] = value;

            if (parts[0] === 'display') {
                const param = parts[1];
                if (param === 'width' || param === 'height' || param === 'sizeScale' || param === 'scale') {
                    (registryEntity as Record<string, unknown>)[param] = value;
                }
            }
        } else {
            (registryEntity as Record<string, unknown>)[key] = value;
        }
    }

    Logger.info(`[EntityLoader] Live update applied to Registry: ${category}/${configId}`);

    if (!entityManager) return;

    const activeEntities = entityManager.getAll();
    let updatedCount = 0;

    for (const entity of activeEntities) {
        const matchesInfo =
            entity.registryId === configId ||
            entity.entityType === configId ||
            entity.dinoType === configId ||
            entity.bossType === configId ||
            entity.resourceType === configId ||
            entity.itemType === configId ||
            entity.spriteId === configId ||
            entity.sprite === configId;

        if (!matchesInfo) continue;

        for (const [key, value] of Object.entries(updates)) {
            if (key === 'health' || key === 'maxHealth') {
                const numVal = Number(value);
                if (!isNaN(numVal)) {
                    if (key === 'maxHealth') entity.maxHealth = numVal;
                    if (key === 'health') {
                        entity.health = numVal;
                        if (!entity.maxHealth || entity.maxHealth < numVal) {
                            entity.maxHealth = numVal;
                        }
                    }
                }
            } else if (key.startsWith('stats.')) {
                const statName = key.split('.')[1];
                const numVal = Number(value);
                if (!isNaN(numVal)) {
                    (entity as Record<string, unknown>)[statName] = numVal;
                }
            } else {
                if (typeof value !== 'object') {
                    (entity as Record<string, unknown>)[key] = value;
                }
            }
        }

        const displayUpdates = updates.width || updates.height ||
            updates.sizeScale || updates.scale ||
            updates['display.width'] || updates['display.height'] ||
            updates['display.sizeScale'] || updates['display.scale'];

        if (displayUpdates) {
            if (entity.refreshConfig && typeof entity.refreshConfig === 'function') {
                entity.refreshConfig();
            } else {
                if (updates.width) entity.width = Number(updates.width);
                if (updates.height) entity.height = Number(updates.height);
                const ent = entity as IEntity & { collision?: { bounds?: { width: number; height: number } } };
                if (ent.collision?.bounds) {
                    ent.collision.bounds.width = entity.width;
                    ent.collision.bounds.height = entity.height;
                }
            }
        }
        updatedCount++;
    }

    if (updatedCount > 0) {
        Logger.info(`[EntityLoader] Live updated ${updatedCount} active instances of ${configId}`);
    }
}
