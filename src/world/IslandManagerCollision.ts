/**
 * IslandManagerCollision - Collision block building
 */
import { GameConstants } from '@data/GameConstants';
import { IslandType } from '@config/WorldTypes';
import type { Island, CollisionBlockWithMeta } from '../types/world';

export interface CollisionConfig {
    islandSize: number;
    zoneCells: number;
    gridCellSize: number;
    gridRows: number;
    gridCols: number;
}

export function buildCollisionBlocks(
    islands: Island[],
    config: CollisionConfig
): CollisionBlockWithMeta[] {
    const blocks: CollisionBlockWithMeta[] = [];
    const { islandSize, zoneCells, gridCellSize, gridRows, gridCols } = config;
    const bridgeOpenStart = 3;
    const bridgeOpenEnd = 4;

    for (const island of islands) {
        const zoneX = island.worldX;
        const zoneY = island.worldY;

        if (!island.unlocked) {
            blocks.push({
                x: zoneX,
                y: zoneY,
                width: islandSize,
                height: islandSize,
                type: 'locked_zone',
                zoneId: `${island.gridX},${island.gridY}`
            });
            continue;
        }

        const hasNorthBridge = island.gridY > 0;
        const hasSouthBridge = island.gridY < gridRows - 1;
        const hasWestBridge = island.gridX > 0;
        const hasEastBridge = island.gridX < gridCols - 1;
        const hasBiomeNorthExit = island.type === IslandType.HOME;
        const hasBiomeWestExit = island.type === IslandType.HOME;

        for (let cell = 0; cell < zoneCells; cell++) {
            if (hasNorthBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;
            if (hasBiomeNorthExit && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            blocks.push({
                x: zoneX + cell * gridCellSize,
                y: zoneY,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'top',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }

        for (let cell = 0; cell < zoneCells; cell++) {
            if (hasSouthBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            blocks.push({
                x: zoneX + cell * gridCellSize,
                y: zoneY + (zoneCells - 1) * gridCellSize,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'bottom',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }

        for (let cell = 1; cell < zoneCells - 1; cell++) {
            if (hasWestBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;
            if (hasBiomeWestExit && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            blocks.push({
                x: zoneX,
                y: zoneY + cell * gridCellSize,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'left',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }

        for (let cell = 1; cell < zoneCells - 1; cell++) {
            if (hasEastBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            blocks.push({
                x: zoneX + (zoneCells - 1) * gridCellSize,
                y: zoneY + cell * gridCellSize,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'right',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }
    }

    return blocks;
}
