/**
 * IslandManager - Manages the island grid, collision, and unlock state
 * 
 * World is divided into a grid of square islands separated by water.
 * Bridges connect adjacent islands. Islands must be unlocked with gold.
 * 
 * Owner: Level Architect
 */

class IslandManagerService {
    constructor() {
        // Grid configuration
        this.gridCols = GameConstants.World.GRID_COLS;
        this.gridRows = GameConstants.World.GRID_ROWS;
        this.islandSize = GameConstants.World.ISLAND_SIZE;
        this.waterGap = GameConstants.World.WATER_GAP;
        this.bridgeWidth = GameConstants.World.BRIDGE_WIDTH;
        this.mapPadding = GameConstants.World.MAP_PADDING;

        // Ironhaven offset - shifts all island content to center of world
        this.ironhavenOffsetX = GameConstants.World.IRONHAVEN_OFFSET_X || 0;
        this.ironhavenOffsetY = GameConstants.World.IRONHAVEN_OFFSET_Y || 0;

        // Wall boundaries
        this.wallWidth = GameConstants.World.WALL_WIDTH;
        this.wallPadTop = GameConstants.World.WALL_PAD_TOP;
        this.wallPadBottom = GameConstants.World.WALL_PAD_BOTTOM;

        // Unlock costs by grid position
        this.unlockCosts = GameConstants.UnlockCosts;

        // State
        this.cellSize = 0;
        this.islands = [];
        this.walkableZones = [];
        this.collisionBlocks = [];  // New: blocks that prevent movement

        Logger.info('[IslandManager] Constructed');
    }

    /**
     * Initialize the island grid
     */
    init() {
        this.cellSize = this.islandSize + this.waterGap;
        this.islands = [];

        // Load World Data
        // Default fallbacks provided if WorldData is missing (e.g. unit tests)
        const islandNames = (window.WorldData && WorldData.Names) ? WorldData.Names : [['Home', 'Zone 1', 'Zone 2'], ['Zone 3', 'Zone 4', 'Zone 5'], ['Zone 6', 'Zone 7', 'Zone 8']];
        const islandCategories = (window.WorldData && WorldData.Categories) ? WorldData.Categories : [['home', 'resource', 'resource'], ['resource', 'resource', 'resource'], ['resource', 'resource', 'resource']];
        const zoneResourceTypes = (window.WorldData && WorldData.Resources) ? WorldData.Resources : [['wood', 'wood', 'wood'], ['wood', 'wood', 'wood'], ['wood', 'wood', 'wood']];

        // Load unlocked state from GameState if available
        const savedUnlocks = window.GameState ? window.GameState.get('unlocks') : null;
        // Default to ['0,0'] if savedUnlocks is null OR empty
        const initialUnlocks = (savedUnlocks && savedUnlocks.length > 0) ? savedUnlocks : ['0,0'];
        const unlockedSet = new Set(initialUnlocks); // Home always unlocked

        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const isHome = (col === 0 && row === 0);
                const key = `${col},${row}`;
                const index = row * this.gridCols + col;

                this.islands.push({
                    gridX: col,
                    gridY: row,
                    name: islandNames[row][col],
                    type: isHome ? 'home' : 'normal',
                    category: islandCategories[row][col],
                    resourceType: zoneResourceTypes[row][col],
                    unlocked: unlockedSet.has(key),
                    unlockCost: this.unlockCosts[index],
                    // World coordinates (offset by Ironhaven position)
                    worldX: this.ironhavenOffsetX + this.mapPadding + col * this.cellSize,
                    worldY: this.ironhavenOffsetY + this.mapPadding + row * this.cellSize,
                    width: this.islandSize,
                    height: this.islandSize
                });
            }
        }

        // Initialize walkable zones
        this.rebuildWalkableZones();

        // Initialize collision blocks
        this.rebuildCollisionBlocks();

        Logger.info(`[IslandManager] Initialized ${this.islands.length} zones`);
    }

    /**
     * Get island by grid coordinates
     */
    getIslandByGrid(gridX, gridY) {
        return this.islands.find(i => i.gridX === gridX && i.gridY === gridY);
    }

    /**
     * Check if an island is unlocked
     */
    isIslandUnlocked(gridX, gridY) {
        const island = this.getIslandByGrid(gridX, gridY);
        return island ? island.unlocked : false;
    }

    /**
     * Unlock an island (call after payment confirmed)
     */
    unlockIsland(gridX, gridY) {
        const island = this.getIslandByGrid(gridX, gridY);
        if (!island) return false;
        if (island.unlocked) return false; // Already unlocked

        island.unlocked = true;

        // Persist to GameState
        if (window.GameState) {
            const unlocked = this.islands
                .filter(i => i.unlocked)
                .map(i => `${i.gridX},${i.gridY}`);
            window.GameState.set('unlocks', unlocked);
        }

        Logger.info(`[IslandManager] Unlocked zone: ${island.name}`);

        // AAA Feature: Artillery Bombardment Effect on Unlock
        if (window.VFXController && window.VFXController.bombardZone) {
            const bounds = this.getPlayableBounds(island);
            Logger.info('[IslandManager] Triggering bombardment on:', island.name, bounds);
            // Translate bounds to format expected by bombardZone
            const targetZone = {
                worldX: bounds.x,
                worldY: bounds.y,
                width: bounds.width,
                height: bounds.height
            };
            VFXController.bombardZone(targetZone);
        } else {
            Logger.warn('[IslandManager] VFXController or bombardZone not found!');
        }

        // Rebuild walkable zones to include the new island
        this.rebuildWalkableZones();

        // Rebuild collision blocks (changes from full-zone to edge-only)
        this.rebuildCollisionBlocks();

        // Emit Unlock Event for SpawnManager / UI
        if (window.EventBus) {
            EventBus.emit(Events.ISLAND_UNLOCKED, { gridX, gridY });
        }

        return true;
    }

    /**
     * Get playable bounds for an island (inside walls)
     */
    getPlayableBounds(island) {
        if (!island) return null;
        return {
            x: island.worldX + this.wallWidth,
            y: island.worldY + this.wallPadTop,
            width: island.width - (this.wallWidth * 2),
            height: island.height - (this.wallPadTop + this.wallPadBottom),
            left: island.worldX + this.wallWidth,
            right: island.worldX + island.width - this.wallWidth,
            top: island.worldY + this.wallPadTop,
            bottom: island.worldY + island.height - this.wallPadBottom
        };
    }

    /**
     * Clamp a position to the nearest island's playable area
     */
    clampToPlayableArea(x, y) {
        let island = this.getIslandAt(x, y);

        if (!island) {
            return { x, y };
        }

        const bounds = this.getPlayableBounds(island);
        if (!bounds) return { x, y };

        return {
            x: Math.max(bounds.left, Math.min(bounds.right, x)),
            y: Math.max(bounds.top, Math.min(bounds.bottom, y))
        };
    }

    /**
     * Get the island at world coordinates
     */
    getIslandAt(x, y) {
        for (const island of this.islands) {
            if (x >= island.worldX && x < island.worldX + island.width &&
                y >= island.worldY && y < island.worldY + island.height) {
                return island;
            }
        }
        return null;
    }

    /**
     * Check if position is on a bridge
     */
    isOnBridge(x, y) {
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
                bh -= (margin * 2);
            } else {
                const margin = bw * marginPct;
                bx += margin;
                bw -= (margin * 2);
            }

            if (x >= bx && x < bx + bw &&
                y >= by && y < by + bh) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get bridge at position (if any)
     */
    getBridgeAt(x, y) {
        const bridges = this.getBridges();
        for (const bridge of bridges) {
            if (x >= bridge.x && x < bridge.x + bridge.width &&
                y >= bridge.y && y < bridge.y + bridge.height) {
                return bridge;
            }
        }
        return null;
    }

    /**
     * Get all bridge definitions
     */
    getBridges() {
        const bridges = [];
        const halfBridge = this.bridgeWidth / 2;
        const islandCenter = this.islandSize / 2;
        const overlap = 25; // Extend bridge physics 25px into islands to prevent getting stuck in walls

        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const baseX = this.ironhavenOffsetX + this.mapPadding + col * this.cellSize;
                const baseY = this.ironhavenOffsetY + this.mapPadding + row * this.cellSize;

                // Horizontal bridge to the right
                if (col < this.gridCols - 1) {
                    bridges.push({
                        x: baseX + this.islandSize - overlap,
                        y: baseY + islandCenter - halfBridge,
                        width: this.waterGap + (overlap * 2),
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
                        height: this.waterGap + (overlap * 2),
                        type: 'vertical',
                        from: { col, row },
                        to: { col, row: row + 1 }
                    });
                }
            }
        }

        return bridges;
    }

    /**
     * Rebuild the list of walkable zones (islands + bridges)
     * Called on init and when an island is unlocked
     */
    rebuildWalkableZones() {
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
                zoneWidth = this.waterGap + (overlap * 2);
            } else {
                zoneHeight = this.waterGap + (overlap * 2);
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

        // 3. Biome walkability now handled by BiomeManager.isValidPosition()
        // No need to add rectangular zones - polygon hit testing is used

        Logger.info(`[IslandManager] Rebuilt walkable zones: ${this.walkableZones.length} active zones`);
    }

    /**
     * Check if world position is walkable
     * Uses zone list for islands/bridges, BiomeManager for outer biomes
     */
    isWalkable(x, y) {
        // First check island/bridge zones (Ironhaven internal)
        for (const zone of this.walkableZones) {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
                return true;
            }
        }

        // Fallback: Check BiomeManager for outer biome polygons
        if (window.BiomeManager) {
            return BiomeManager.isValidPosition(x, y);
        }

        return false;
    }

    /**
     * Rebuild collision blocks
     * - Locked zones: entire zone is blocked
     * - Unlocked zones: only edges with bridge openings
     */
    rebuildCollisionBlocks() {
        this.collisionBlocks = [];
        const gridCellSize = GameConstants.Grid.CELL_SIZE; // 128px
        const zoneCells = GameConstants.Grid.ISLAND_CELLS; // 8 cells per zone

        // Bridge opening: cells 3-4 (0-indexed), so block 0-2 and 5-7
        const bridgeOpenStart = 3;
        const bridgeOpenEnd = 4;

        for (const island of this.islands) {
            const zoneX = island.worldX;
            const zoneY = island.worldY;

            // LOCKED ZONES: Block the entire zone
            if (!island.unlocked) {
                this.collisionBlocks.push({
                    x: zoneX,
                    y: zoneY,
                    width: this.islandSize,
                    height: this.islandSize,
                    type: 'locked_zone',
                    zoneId: `${island.gridX},${island.gridY}`
                });
                continue; // Don't add edge blocks for locked zones
            }

            // Check neighbors to determine if bridges exist (neighbor EXISTS, not necessarily unlocked)
            const hasNorthBridge = island.gridY > 0;
            const hasSouthBridge = island.gridY < this.gridRows - 1;
            const hasWestBridge = island.gridX > 0;
            const hasEastBridge = island.gridX < this.gridCols - 1;

            // BIOME ACCESS: Home island has exits to the north and west biome areas
            const hasBiomeNorthExit = (island.type === 'home');
            const hasBiomeWestExit = (island.type === 'home');

            // Top edge (Y = 0)
            for (let cell = 0; cell < zoneCells; cell++) {
                // Skip bridge opening if connected
                if (hasNorthBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;
                // Skip biome exit opening (same position as bridge would be)
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

            // Bottom edge (Y = zoneCells - 1)
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

            // Left edge (X = 0), excluding corners already added
            for (let cell = 1; cell < zoneCells - 1; cell++) {
                if (hasWestBridge && cell >= bridgeOpenStart && cell <= bridgeOpenEnd) continue;
                // Skip biome exit opening
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

            // Right edge (X = zoneCells - 1), excluding corners
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
    }

    /**
     * Check if world position hits a collision block
     * @returns {boolean} true if blocked, false if can move
     */
    isBlocked(x, y) {
        for (const block of this.collisionBlocks) {
            if (x >= block.x && x < block.x + block.width &&
                y >= block.y && y < block.y + block.height) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if hero is in a trigger zone for unlocking
     */
    getUnlockTrigger(x, y) {
        for (const zone of this.walkableZones) {
            if (zone.type === 'bridge') {
                if (x >= zone.x && x <= zone.x + zone.width &&
                    y >= zone.y && y <= zone.y + zone.height) {

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
    }

    /**
     * Get the home island
     */
    getHomeIsland() {
        return this.islands.find(i => i.type === 'home');
    }

    /**
     * Get spawn position for hero
     */
    getHeroSpawnPosition() {
        const home = this.getHomeIsland();
        return {
            x: home.worldX + home.width / 2,
            y: home.worldY + home.height / 2
        };
    }

    /**
     * Get total world size
     */
    getWorldSize() {
        return {
            width: this.mapPadding * 2 + this.gridCols * this.islandSize + (this.gridCols - 1) * this.waterGap,
            height: this.mapPadding * 2 + this.gridRows * this.islandSize + (this.gridRows - 1) * this.waterGap
        };
    }

    /**
     * Update island state (called per frame)
     * Deprecated: Logic moved to AmbientSystem
     */
    update(dt) {
        // No-op
    }

    // ==================== GRID UTILITIES ====================

    /**
     * Convert world coordinates to grid cell coordinates
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @returns {{gx: number, gy: number}} Grid cell coordinates
     */
    worldToGrid(x, y) {
        const cellSize = GameConstants.Grid.CELL_SIZE;
        return {
            gx: Math.floor(x / cellSize),
            gy: Math.floor(y / cellSize)
        };
    }

    /**
     * Convert grid cell coordinates to world center position
     * @param {number} gx - Grid X cell
     * @param {number} gy - Grid Y cell
     * @returns {{x: number, y: number}} World coordinates (cell center)
     */
    gridToWorld(gx, gy) {
        const cellSize = GameConstants.Grid.CELL_SIZE;
        return {
            x: gx * cellSize + cellSize / 2,
            y: gy * cellSize + cellSize / 2
        };
    }

    /**
     * Snap a world position to the nearest grid cell center
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @returns {{x: number, y: number}} Snapped world coordinates
     */
    snapToGrid(x, y) {
        const grid = this.worldToGrid(x, y);
        return this.gridToWorld(grid.gx, grid.gy);
    }

    /**
     * Get the bounds of a grid cell at given grid coordinates
     * @param {number} gx - Grid X cell
     * @param {number} gy - Grid Y cell
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getGridCellBounds(gx, gy) {
        const cellSize = GameConstants.Grid.CELL_SIZE;
        return {
            x: gx * cellSize,
            y: gy * cellSize,
            width: cellSize,
            height: cellSize
        };
    }
}

// Export Singleton Instance
window.IslandManager = new IslandManagerService();
if (window.Registry) Registry.register('IslandManager', window.IslandManager);
