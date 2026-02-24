/**
 * EnemyCoreRefresh - Refresh config from EntityRegistry (hot reload)
 */

import { EntityRegistry } from '@entities/EntityLoader';
import { SpeciesScaleConfig } from '@config/SpeciesScaleConfig';
import type { EntityConfig } from '../types/core';

export function refreshEnemyConfig(
    enemyType: string,
    _width: number,
    _height: number,
    collision: { bounds?: { width: number; height: number } } | null
): { width: number; height: number } | null {
    const typeConfig: EntityConfig = enemyType ? EntityRegistry.enemies?.[enemyType] || {} : {};
    const isBoss = typeConfig.isBoss || typeConfig.entityType === 'Boss';
    const sizeInfo = SpeciesScaleConfig.getSize(typeConfig, isBoss);

    if (!sizeInfo) return null;

    if (collision?.bounds) {
        collision.bounds.width = sizeInfo.width;
        collision.bounds.height = sizeInfo.height;
    }

    return sizeInfo;
}
