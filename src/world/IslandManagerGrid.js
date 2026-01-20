/**
 * IslandManagerGrid - Bridge and grid utility methods
 * Extends IslandManagerService.prototype with grid utilities
 *
 * Methods: isOnBridge, getBridgeAt, getBridges, worldToGrid, gridToWorld,
 *          snapToGrid, getGridCellBounds
 */

/**
 * Check if position is on a bridge
 */
IslandManagerService.prototype.isOnBridge = function (x, y) {
    const bridges = this.getBridges();
    const marginPct = 0.15;

    for (const bridge of bridges) {
        let bx = bridge.x;
        let by = bridge.y;
        let bw = bridge.width;
        let bh = bridge.height;

        if (bridge.type === 'horizontal') {
            const margin = bh * marginPct;
            by += margin;
            bh -= margin * 2;
        } else {
            const margin = bw * marginPct;
            bx += margin;
            bw -= margin * 2;
        }

        if (x >= bx && x < bx + bw && y >= by && y < by + bh) {
            return true;
        }
    }
    return false;
};

/**
 * Get bridge at position (if any)
 */
IslandManagerService.prototype.getBridgeAt = function (x, y) {
    const bridges = this.getBridges();
    for (const bridge of bridges) {
        if (
            x >= bridge.x &&
            x < bridge.x + bridge.width &&
            y >= bridge.y &&
            y < bridge.y + bridge.height
        ) {
            return bridge;
        }
    }
    return null;
};

/**
 * Get all bridge definitions
 */
IslandManagerService.prototype.getBridges = function () {
    const bridges = [];
    const halfBridge = this.bridgeWidth / 2;
    const islandCenter = this.islandSize / 2;
    const overlap = 25;

    for (let row = 0; row < this.gridRows; row++) {
        for (let col = 0; col < this.gridCols; col++) {
            const baseX = this.ironhavenOffsetX + this.mapPadding + col * this.cellSize;
            const baseY = this.ironhavenOffsetY + this.mapPadding + row * this.cellSize;

            // Horizontal bridge to the right
            if (col < this.gridCols - 1) {
                bridges.push({
                    x: baseX + this.islandSize - overlap,
                    y: baseY + islandCenter - halfBridge,
                    width: this.waterGap + overlap * 2,
                    height: this.bridgeWidth,
                    type: 'horizontal',
                    from: { col, row },
                    to: { col: col + 1, row }
                });
            }

            // Vertical bridge downward
            if (row < this.gridRows - 1) {
                bridges.push({
                    x: baseX + islandCenter - halfBridge,
                    y: baseY + this.islandSize - overlap,
                    width: this.bridgeWidth,
                    height: this.waterGap + overlap * 2,
                    type: 'vertical',
                    from: { col, row },
                    to: { col, row: row + 1 }
                });
            }
        }
    }

    return bridges;
};

// ==================== GRID UTILITIES ====================

/**
 * Convert world coordinates to grid cell coordinates
 */
IslandManagerService.prototype.worldToGrid = function (x, y) {
    const cellSize = GameConstants.Grid.CELL_SIZE;
    return {
        gx: Math.floor(x / cellSize),
        gy: Math.floor(y / cellSize)
    };
};

/**
 * Convert grid cell coordinates to world center position
 */
IslandManagerService.prototype.gridToWorld = function (gx, gy) {
    const cellSize = GameConstants.Grid.CELL_SIZE;
    return {
        x: gx * cellSize + cellSize / 2,
        y: gy * cellSize + cellSize / 2
    };
};

/**
 * Snap a world position to the nearest grid cell center
 */
IslandManagerService.prototype.snapToGrid = function (x, y) {
    const grid = this.worldToGrid(x, y);
    return this.gridToWorld(grid.gx, grid.gy);
};

/**
 * Get the bounds of a grid cell at given grid coordinates
 */
IslandManagerService.prototype.getGridCellBounds = function (gx, gy) {
    const cellSize = GameConstants.Grid.CELL_SIZE;
    return {
        x: gx * cellSize,
        y: gy * cellSize,
        width: cellSize,
        height: cellSize
    };
};

// Create singleton instance and register globally
window.IslandManager = new IslandManagerService();
if (window.Registry) Registry.register('IslandManager', window.IslandManager);

Logger.info('[IslandManagerGrid] Grid methods added, singleton created');

