/**
 * IslandManagerCore - Island grid initialization, collision, and spatial utilities
 *
 * CONSOLIDATED: Methods previously in IslandManagerCollision.ts and IslandManagerGrid.ts
 * are now directly defined here to avoid ES module circular dependency issues with Vite.
 *
 * Owner: Level Architect
 */

import { Logger } from '@core/Logger';
import { GameConstants, getConfig } from '@data/GameConstants';
import { WorldData } from '@data/WorldData';
import { GameState } from '@core/State';
import { EventBus } from '@core/EventBus';
import { BiomeManager } from './BiomeManager';
import type {
    Island,
    Bridge,
    WalkableZoneWithId,
    CollisionBlockWithMeta,
    PlayableBounds
} from '../types/world';

class IslandManagerService {
    // Property declarations
    gridCols: number;
    gridRows: number;
    islandSize: number;
    waterGap: number;
    bridgeWidth: number;
    mapPadding: number;
    ironhavenOffsetX: number;
    ironhavenOffsetY: number;
    wallWidth: number;
    wallPadTop: number;
    wallPadBottom: number;
    unlockCosts: number[];
    cellSize: number = 0;
    islands: Island[] = [];
    walkableZones: WalkableZoneWithId[] = [];
    collisionBlocks: CollisionBlockWithMeta[] = [];

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
        this.unlockCosts = getConfig().UnlockCosts;

        // State
        this.cellSize = 0;
        this.islands = [];
        this.walkableZones = [];
        this.collisionBlocks = [];

        Logger.info('[IslandManager] Constructed');
    }

    /**
     * Initialize the island grid
     */
    init() {
        Logger.info('[IslandManager] init() called');
        this.cellSize = this.islandSize + this.waterGap;
        this.islands = [];

        // Load World Data with defaults
        const islandNames = WorldData?.Names || [
            ['Home', 'Zone 1', 'Zone 2'],
            ['Zone 3', 'Zone 4', 'Zone 5'],
            ['Zone 6', 'Zone 7', 'Zone 8']
        ];
        const islandCategories = WorldData?.Categories || [
            ['home', 'resource', 'resource'],
            ['resource', 'resource', 'resource'],
            ['resource', 'resource', 'resource']
        ];
        const zoneResourceTypes = WorldData?.Resources || [
            ['wood', 'wood', 'wood'],
            ['wood', 'wood', 'wood'],
            ['wood', 'wood', 'wood']
        ];

        const savedUnlocks = GameState ? GameState.get('unlocks') : null;
        const initialUnlocks = savedUnlocks && savedUnlocks.length > 0 ? savedUnlocks : ['0,0'];
        const unlockedSet = new Set(initialUnlocks);

        for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col < this.gridCols; col++) {
                const isHome = col === 0 && row === 0;
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
                    worldX: this.ironhavenOffsetX + this.mapPadding + col * this.cellSize,
                    worldY: this.ironhavenOffsetY + this.mapPadding + row * this.cellSize,
                    width: this.islandSize,
                    height: this.islandSize
                });
            }
        }

        this.rebuildWalkableZones();
        this.rebuildCollisionBlocks();

        Logger.info(`[IslandManager] Initialized ${this.islands.length} zones`);
    }

    // ==================== COLLISION METHODS (from IslandManagerCollision.ts) ====================

    /**
     * Rebuild the list of walkable zones (islands + bridges)
     */
    rebuildWalkableZones(): void {
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

        Logger.info(
            `[IslandManager] Rebuilt walkable zones: ${this.walkableZones.length} active zones`
        );
    }

    /**
     * Check if world position is walkable
     */
    isWalkable(x: number, y: number): boolean {
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

        if (BiomeManager) {
            return BiomeManager.isValidPosition(x, y);
        }

        return false;
    }

    /**
     * Rebuild collision blocks
     */
    rebuildCollisionBlocks(): void {
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

        Logger.info(
            `[IslandManager] Rebuilt collision blocks: ${this.collisionBlocks.length} blocks`
        );
    }

    /**
     * Check if world position hits a collision block
     */
    isBlocked(x: number, y: number): boolean {
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
    }

    /**
     * Check if hero is in a trigger zone for unlocking
     */
    getUnlockTrigger(x: number, y: number): Island | null {
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
    }

    // ==================== GRID METHODS (from IslandManagerGrid.ts) ====================

    /**
     * Check if position is on a bridge
     */
    isOnBridge(x: number, y: number): boolean {
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
    }

    /**
     * Get bridge at position (if any)
     */
    getBridgeAt(x: number, y: number): Bridge | null {
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
    }

    /**
     * Get all bridge definitions
     */
    getBridges(): Bridge[] {
        const bridges: Bridge[] = [];
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
    }

    /**
     * Convert world coordinates to grid cell coordinates
     */
    worldToGrid(x: number, y: number): { gx: number; gy: number } {
        const cellSize = GameConstants.Grid.CELL_SIZE;
        return {
            gx: Math.floor(x / cellSize),
            gy: Math.floor(y / cellSize)
        };
    }

    /**
     * Convert grid cell coordinates to world center position
     */
    gridToWorld(gx: number, gy: number): { x: number; y: number } {
        const cellSize = GameConstants.Grid.CELL_SIZE;
        return {
            x: gx * cellSize + cellSize / 2,
            y: gy * cellSize + cellSize / 2
        };
    }

    /**
     * Snap a world position to the nearest grid cell center
     */
    snapToGrid(x: number, y: number): { x: number; y: number } {
        const grid = this.worldToGrid(x, y);
        return this.gridToWorld(grid.gx, grid.gy);
    }

    /**
     * Get the bounds of a grid cell at given grid coordinates
     */
    getGridCellBounds(
        gx: number,
        gy: number
    ): { x: number; y: number; width: number; height: number } {
        const cellSize = GameConstants.Grid.CELL_SIZE;
        return {
            x: gx * cellSize,
            y: gy * cellSize,
            width: cellSize,
            height: cellSize
        };
    }

    // ==================== ORIGINAL CORE METHODS ====================

    /**
     * Get island by grid coordinates
     */
    getIslandByGrid(gridX: number, gridY: number): Island | undefined {
        return this.islands.find((i) => i.gridX === gridX && i.gridY === gridY);
    }

    /**
     * Check if an island is unlocked
     */
    isIslandUnlocked(gridX: number, gridY: number): boolean {
        const island = this.getIslandByGrid(gridX, gridY);
        return island ? island.unlocked : false;
    }

    /**
     * Unlock an island (call after payment confirmed)
     */
    unlockIsland(gridX: number, gridY: number): boolean {
        const island = this.getIslandByGrid(gridX, gridY);
        if (!island) return false;
        if (island.unlocked) return false;

        island.unlocked = true;

        if (GameState) {
            const unlocked = this.islands
                .filter((i) => i.unlocked)
                .map((i) => `${i.gridX},${i.gridY}`);
            GameState.set('unlocks', unlocked);
        }

        Logger.info(`[IslandManager] Unlocked zone: ${island.name}`);

        this.rebuildWalkableZones();
        this.rebuildCollisionBlocks();

        if (EventBus) {
            EventBus.emit(GameConstants.Events.ISLAND_UNLOCKED, { gridX, gridY });
        }

        return true;
    }

    /**
     * Get playable bounds for an island (inside walls)
     */
    getPlayableBounds(island: Island | null | undefined): PlayableBounds | null {
        if (!island) return null;
        return {
            x: island.worldX + this.wallWidth,
            y: island.worldY + this.wallPadTop,
            width: island.width - this.wallWidth * 2,
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
    clampToPlayableArea(x: number, y: number): { x: number; y: number } {
        const island = this.getIslandAt(x, y);
        if (!island) return { x, y };

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
    getIslandAt(x: number, y: number): Island | null {
        for (const island of this.islands) {
            if (
                x >= island.worldX &&
                x < island.worldX + island.width &&
                y >= island.worldY &&
                y < island.worldY + island.height
            ) {
                return island;
            }
        }
        return null;
    }

    /**
     * Get the home island
     */
    getHomeIsland(): Island | undefined {
        return this.islands.find((i) => i.type === 'home');
    }

    /**
     * Get spawn position for hero
     */
    getHeroSpawnPosition(): { x: number; y: number } {
        const home = this.getHomeIsland();
        return {
            x: home.worldX + home.width / 2,
            y: home.worldY + home.height / 2
        };
    }

    /**
     * Get total world size
     */
    getWorldSize(): { width: number; height: number } {
        return {
            width:
                this.mapPadding * 2 +
                this.gridCols * this.islandSize +
                (this.gridCols - 1) * this.waterGap,
            height:
                this.mapPadding * 2 +
                this.gridRows * this.islandSize +
                (this.gridRows - 1) * this.waterGap
        };
    }
}

export { IslandManagerService };
