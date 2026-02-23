/**
 * SpawnHelper - Minimal spawn utilities for runtime drops
 *
 * Replaces SpawnManager for spawnDrop and spawnCraftedItem.
 * Entity placement is done via map editor; this only handles runtime spawns
 * (drops on enemy death, crafted items).
 *
 * Owner: Director
 */

import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { GameConstants, getConfig } from '@data/GameConstants';
import { DroppedItem } from './DroppedItem';
import { Registry } from '@core/Registry';
import type { IWorldManager } from '../types/world';

interface CraftedItemOptions {
    amount?: number;
    icon?: string | null;
    targetX?: number;
    targetY?: number;
}

const WORLD_SIZE = 160000;

function getWorldManager(): IWorldManager | null {
    return Registry?.get<IWorldManager>('WorldManager') ?? null;
}

function clampToWorldBounds(x: number, y: number): { x: number; y: number } {
    const padding = 100;
    return {
        x: Math.max(padding, Math.min(WORLD_SIZE - padding, x)),
        y: Math.max(padding, Math.min(WORLD_SIZE - padding, y))
    };
}

export function spawnDrop(x: number, y: number, resourceType: string, amount: number = 1): void {
    if (!DroppedItem || !entityManager) return;

    const angle = Math.random() * Math.PI * 2;
    const base = GameConstants.Spawning.DROP_SCATTER_BASE;
    const variance = GameConstants.Spawning.DROP_SCATTER_VARIANCE;
    const distance = base + Math.random() * variance;
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    const drop = new DroppedItem({
        x,
        y,
        resourceType,
        amount,
        minPickupTime: GameConstants.DroppedItem.MIN_PICKUP_TIME
    });

    drop.flyTo(targetX, targetY);
    entityManager.add(drop);

    Logger.info(`[SpawnHelper] Spawned drop: ${resourceType} x${amount} at ${x},${y}`);
}

export function spawnCraftedItem(
    x: number,
    y: number,
    type: string,
    options: CraftedItemOptions = {}
): void {
    if (!DroppedItem || !entityManager) return;

    const { amount = 1, icon = null } = options;

    const drop = new DroppedItem({
        x,
        y,
        resourceType: type,
        amount,
        customIcon: icon,
        minPickupTime: GameConstants.DroppedItem.MIN_PICKUP_TIME_CRAFTED
    });

    entityManager.add(drop);

    let tx: number;
    let ty: number;

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

    const worldManager = getWorldManager() as typeof import('../world/WorldManager')['WorldManager'] & { clampToPlayableArea?(tx: number, ty: number): { x: number; y: number } };
    const clamped = worldManager?.clampToPlayableArea?.(tx, ty) ?? clampToWorldBounds(tx, ty);
    drop.flyTo(clamped.x, clamped.y);

    Logger.info(`[SpawnHelper] Spawned crafted item: ${type}`);
}
