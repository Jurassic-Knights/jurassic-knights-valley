/**
 * SpawnManagerIslands - Island resource refresh and respawn timer updates
 */

import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { IslandManager } from '../world/IslandManager';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import type { IEntity } from '../types/core';
import type { ResourceSpawner } from './spawners/ResourceSpawner';

interface IWorldEntity extends IEntity {
    islandGridX?: number;
    islandGridY?: number;
    active: boolean;
    recalculateRespawnTimer?(): void;
}

export function refreshIslandResources(
    gridX: number,
    gridY: number,
    resourceSpawner: ResourceSpawner | null
): void {
    const island = IslandManager.getIslandByGrid(gridX, gridY);
    if (!island) return;

    const targetCount = IslandUpgrades?.getResourceSlots?.(gridX, gridY) || 1;

    if (island.category === 'dinosaur') {
        const allDinos = entityManager.getByType('Dinosaur');
        const currentCount = allDinos.filter(
            (d: IWorldEntity) => d.islandGridX === gridX && d.islandGridY === gridY
        ).length;
        const needed = targetCount - currentCount;

        if (needed > 0 && resourceSpawner) {
            resourceSpawner.spawnDinosaursOnIsland(island, needed);
        }
        return;
    }

    const allResources = entityManager.getByType('Resource');
    const currentResources = allResources.filter(
        (res: IWorldEntity) => res.islandGridX === gridX && res.islandGridY === gridY
    );
    const currentCount = currentResources.length;

    if (targetCount > currentCount && resourceSpawner) {
        resourceSpawner.spawnResourcesGridOnIsland(island, targetCount, currentCount);
    } else if (targetCount < currentCount) {
        let toRemove = currentCount - targetCount;
        for (let i = currentResources.length - 1; i >= 0; i--) {
            const res = currentResources[i];
            res.active = false;
            entityManager.remove(res);
            toRemove--;
            if (toRemove <= 0) break;
        }
    }
}

export function updateIslandRespawnTimers(gridX: number, gridY: number): void {
    const resources = entityManager.getByType('Resource');
    for (const res of resources) {
        if (res.islandGridX === gridX && res.islandGridY === gridY) {
            if (typeof res.recalculateRespawnTimer === 'function') {
                res.recalculateRespawnTimer();
            }
        }
    }

    const dinosaurs = entityManager.getByType('Dinosaur');
    for (const dino of dinosaurs) {
        if (dino.islandGridX === gridX && dino.islandGridY === gridY) {
            if (typeof dino.recalculateRespawnTimer === 'function') {
                dino.recalculateRespawnTimer();
            }
        }
    }

    Logger.info(`[SpawnManager] Updated respawn timers for island ${gridX},${gridY}`);
}
