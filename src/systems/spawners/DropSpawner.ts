/**
 * DropSpawner - Handles dropped item spawning
 *
 * Extracted from SpawnManager.js for modularity.
 * Manages resource drops and crafted item spawning.
 *
 * Owner: Loot System
 */

import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { GameConstants } from '@data/GameConstants';
import { IslandManager } from '../../world/IslandManager';
import { DroppedItem } from '../../gameplay/DroppedItem';
import { Registry } from '@core/Registry';
import { getConfig } from '@data/GameConstants';
import type { SpawnManagerService } from '../SpawnManager';

interface CraftedItemOptions {
    amount?: number;
    icon?: string | null;
    targetX?: number;
    targetY?: number;
}

class DropSpawner {
    spawnManager: SpawnManagerService;

    constructor(spawnManager: SpawnManagerService) {
        this.spawnManager = spawnManager;
    }

    /**
     * Spawn a dropped item at a location
     */
    spawnDrop(x: number, y: number, resourceType: string, amount: number = 1) {
        if (!DroppedItem) return;

        const angle = Math.random() * Math.PI * 2;
        const base = GameConstants.Spawning.DROP_SCATTER_BASE;
        const variance = GameConstants.Spawning.DROP_SCATTER_VARIANCE;
        const distance = base + Math.random() * variance;
        const targetX = x + Math.cos(angle) * distance;
        const targetY = y + Math.sin(angle) * distance;

        const drop = new DroppedItem({
            x: x,
            y: y,
            resourceType: resourceType,
            amount: amount,
            minPickupTime: 2.0
        });

        drop.flyTo(targetX, targetY);

        if (entityManager) entityManager.add(drop);

        Logger.info(`[DropSpawner] Spawned drop: ${resourceType} x${amount} at ${x},${y}`);
    }

    /**
     * Spawn an item crafted by the player (flying out from Forge)
     */
    spawnCraftedItem(x: number, y: number, type: string, options: CraftedItemOptions = {}) {
        if (!DroppedItem || !entityManager) return;

        const { amount = 1, icon = null } = options;

        const drop = new DroppedItem({
            x: x,
            y: y,
            resourceType: type,
            amount: amount,
            customIcon: icon,
            minPickupTime: 0.5
        });

        entityManager.add(drop);

        let tx, ty;

        if (options.targetX !== undefined && options.targetY !== undefined) {
            tx = options.targetX;
            ty = options.targetY;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const base = getConfig().AI.DROP_SPAWN_DISTANCE;
            const variance = getConfig().AI.DROP_SPAWN_VARIANCE;
            const dist = base + Math.random() * variance;
            tx = x + Math.cos(angle) * dist;
            ty = y + Math.sin(angle) * dist;
        }

        if (IslandManager && IslandManager.clampToPlayableArea) {
            const clamped = IslandManager.clampToPlayableArea(tx, ty);
            tx = clamped.x;
            ty = clamped.y;
        }

        drop.flyTo(tx, ty);
        Logger.info(`[DropSpawner] Spawned crafted item: ${type}`);
    }
}

export { DropSpawner };
