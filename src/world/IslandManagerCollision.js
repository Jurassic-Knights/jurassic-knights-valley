/**
 * IslandManagerCollision - Walkable zones and collision detection
 * Extends IslandManagerService.prototype with collision methods
 *
 * Methods: rebuildWalkableZones, isWalkable, rebuildCollisionBlocks,
 *          isBlocked, getUnlockTrigger
 */

/**
 * Rebuild the list of walkable zones (islands + bridges)
 */
IslandManagerService.prototype.rebuildWalkableZones = function () {
    this.walkableZones = [];
    const overlap = 150;

    // 1. Add Unlocked Islands (Inner playable area)
    for (const island of this.islands) {
        if (island.unlocked) {
            const bounds = this.getPlayableBounds(island);
            if (bounds) {
                this.walkableZones.push({
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                    id: `island_${island.gridX}_${island.gridY}`,
                    type: 'island'
                });
            }
        }
    }

    // 2. Add Bridges
    const bridges = this.getBridges();

    for (const bridge of bridges) {
        const centerX = bridge.x + bridge.width / 2;
        const centerY = bridge.y + bridge.height / 2;

        let zoneWidth = bridge.width;
        let zoneHeight = bridge.height;

        if (bridge.type === 'horizontal') {
            zoneWidth = this.waterGap + overlap * 2;
        } else {
            zoneHeight = this.waterGap + overlap * 2;
        }

        this.walkableZones.push({
            x: centerX - zoneWidth / 2,
            y: centerY - zoneHeight / 2,
            width: zoneWidth,
            height: zoneHeight,
            id: `bridge_${bridge.from.col}_${bridge.from.row}_to_${bridge.to.col}_${bridge.to.row}`,
            type: 'bridge'
        });
    }

    Logger.info(`[IslandManager] Rebuilt walkable zones: ${this.walkableZones.length} active zones`);
};

/**
 * Check if world position is walkable
 */
IslandManagerService.prototype.isWalkable = function (x, y) {
    for (const zone of this.walkableZones) {
        if (
            x >= zone.x &&
            x <= zone.x + zone.width &&
            y >= zone.y &&
            y <= zone.y + zone.height
        ) {
            return true;
        }
    }

    if (window.BiomeManager) {
        return BiomeManager.isValidPosition(x, y);
    }

    return false;
};

/**
 * Rebuild collision blocks
 */
IslandManagerService.prototype.rebuildCollisionBlocks = function () {
    this.collisionBlocks = [];
    const gridCellSize = GameConstants.Grid.CELL_SIZE;
    const zoneCells = GameConstants.Grid.ISLAND_CELLS;
    const bridgeOpenStart = 3;
    const bridgeOpenEnd = 4;

    for (const island of this.islands) {
        const zoneX = island.worldX;
        const zoneY = island.worldY;

        if (!island.unlocked) {
            this.collisionBlocks.push({
                x: zoneX,
                y: zoneY,
                width: this.islandSize,
                height: this.islandSize,
                type: 'locked_zone',
                zoneId: `${island.gridX},${island.gridY}`
            });
            continue;
        }

        const hasNorthBridge = island.gridY > 0;
        const hasSouthBridge = island.gridY < this.gridRows - 1;
        const hasWestBridge = island.gridX > 0;
        const hasEastBridge = island.gridX < this.gridCols - 1;
        const hasBiomeNorthExit = island.type === 'home';
        const hasBiomeWestExit = island.type === 'home';

        // Top edge
        for (let cell = 0; cell < zoneCells; cell++) {
            if (hasNorthBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;
            if (hasBiomeNorthExit && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            this.collisionBlocks.push({
                x: zoneX + cell * gridCellSize,
                y: zoneY,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'top',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }

        // Bottom edge
        for (let cell = 0; cell < zoneCells; cell++) {
            if (hasSouthBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            this.collisionBlocks.push({
                x: zoneX + cell * gridCellSize,
                y: zoneY + (zoneCells - 1) * gridCellSize,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'bottom',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }

        // Left edge
        for (let cell = 1; cell < zoneCells - 1; cell++) {
            if (hasWestBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;
            if (hasBiomeWestExit && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            this.collisionBlocks.push({
                x: zoneX,
                y: zoneY + cell * gridCellSize,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'left',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }

        // Right edge
        for (let cell = 1; cell < zoneCells - 1; cell++) {
            if (hasEastBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;

            this.collisionBlocks.push({
                x: zoneX + (zoneCells - 1) * gridCellSize,
                y: zoneY + cell * gridCellSize,
                width: gridCellSize,
                height: gridCellSize,
                edge: 'right',
                zoneId: `${island.gridX},${island.gridY}`
            });
        }
    }

    Logger.info(`[IslandManager] Rebuilt collision blocks: ${this.collisionBlocks.length} blocks`);
};

/**
 * Check if world position hits a collision block
 */
IslandManagerService.prototype.isBlocked = function (x, y) {
    for (const block of this.collisionBlocks) {
        if (
            x >= block.x &&
            x < block.x + block.width &&
            y >= block.y &&
            y < block.y + block.height
        ) {
            return true;
        }
    }
    return false;
};

/**
 * Check if hero is in a trigger zone for unlocking
 */
IslandManagerService.prototype.getUnlockTrigger = function (x, y) {
    for (const zone of this.walkableZones) {
        if (zone.type === 'bridge') {
            if (
                x >= zone.x &&
                x <= zone.x + zone.width &&
                y >= zone.y &&
                y <= zone.y + zone.height
            ) {
                const parts = zone.id.split('_');
                if (parts.length === 6) {
                    const fromCol = parseInt(parts[1]);
                    const fromRow = parseInt(parts[2]);
                    const toCol = parseInt(parts[4]);
                    const toRow = parseInt(parts[5]);

                    const fromIsland = this.getIslandByGrid(fromCol, fromRow);
                    const toIsland = this.getIslandByGrid(toCol, toRow);

                    if (fromIsland && fromIsland.unlocked && toIsland && !toIsland.unlocked) {
                        return toIsland;
                    }
                    if (toIsland && toIsland.unlocked && fromIsland && !fromIsland.unlocked) {
                        return fromIsland;
                    }
                }
            }
        }
    }
    return null;
};

Logger.info('[IslandManagerCollision] Collision methods added to IslandManagerService prototype');

