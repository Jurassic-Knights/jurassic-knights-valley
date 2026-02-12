/**
 * SpawnManagerMerchants - Merchant spawning and lookup
 */

import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { getConfig } from '@data/GameConstants';
import { PropConfig } from '@data/PropConfig';
import { IslandType, BridgeOrientation } from '@config/WorldTypes';
import { Merchant } from '../gameplay/Merchant';
import type { IEntity } from '../types/core';
import type { Island, Bridge, IIslandManager } from '../types/world';

export function spawnMerchants(
    islandManager: IIslandManager | null,
    merchants: Merchant[]
): void {
    merchants.length = 0;

    if (!islandManager) return;

    const bridges = islandManager.getBridges();
    const config = getConfig().Spawning;
    const offsetX = PropConfig?.MERCHANT?.DEFAULT_OFFSET || config.MERCHANT.DEFAULT_OFFSET;
    const offsetY = PropConfig?.MERCHANT?.DEFAULT_OFFSET || config.MERCHANT.DEFAULT_OFFSET;
    const padding = PropConfig?.MERCHANT?.PADDING || config.MERCHANT.PADDING;

    for (const island of islandManager.islands) {
        if (island.type === IslandType.HOME) continue;

        const bounds = islandManager.getPlayableBounds(island);
        if (!bounds) continue;

        const entryBridge = bridges.find(
            (b: Bridge) => b.to.col === island.gridX && b.to.row === island.gridY
        );

        let finalX = bounds.x + offsetX;
        let finalY = bounds.y + offsetY;

        if (entryBridge) {
            if (entryBridge.type === BridgeOrientation.HORIZONTAL) {
                finalX = bounds.left + padding;
                const bridgeCenterY = entryBridge.y + entryBridge.height / 2;
                finalY = (bridgeCenterY + bounds.top) / 2;
            } else {
                const bridgeCenterX = entryBridge.x + entryBridge.width / 2;
                finalX = (bridgeCenterX + bounds.left) / 2;
                finalY = bounds.top + padding;
            }
        }

        const merchant = new Merchant({
            x: finalX,
            y: finalY,
            islandId: `${island.gridX}_${island.gridY}`,
            islandName: island.name
        });

        merchants.push(merchant);
        entityManager.add(merchant);
    }

    Logger.info(`[SpawnManager] Spawned ${merchants.length} merchants`);
}

export function getMerchantNearHero(
    islandManager: IIslandManager | null,
    merchants: Merchant[],
    hero: IEntity
): Merchant | null {
    if (!hero) return null;

    for (const merchant of merchants) {
        if (merchant.isInRange(hero)) {
            const [gridX, gridY] = merchant.islandId.split('_').map(Number);
            const island = islandManager ? islandManager.getIslandByGrid(gridX, gridY) : null;
            if (island && island.unlocked) {
                return merchant;
            }
        }
    }
    return null;
}
