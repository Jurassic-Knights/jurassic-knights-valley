/**
 * IslandManagerCore - Island grid initialization, collision, and spatial utilities
 *
 * Delegates to IslandManagerGrid, IslandManagerBridges, IslandManagerWalkable, IslandManagerCollision
 * for pure logic; this file orchestrates state and public API.
 */

import { Logger } from '@core/Logger';
import { GameConstants, getConfig } from '@data/GameConstants';
import { WorldData } from '@data/WorldData';
import { GameState } from '@core/State';
import { EventBus } from '@core/EventBus';
import { BiomeManager } from './BiomeManager';
import { IslandType } from '@config/WorldTypes';
import type {
    Island,
    WalkableZoneWithId,
    CollisionBlockWithMeta,
    PlayableBounds
} from '../types/world';
import * as Grid from './IslandManagerGrid';
import * as Bridges from './IslandManagerBridges';
import { buildWalkableZones, getUnlockTrigger } from './IslandManagerWalkable';
import { buildCollisionBlocks } from './IslandManagerCollision';

class IslandManagerService {
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
        this.gridCols = GameConstants.World.GRID_COLS;
        this.gridRows = GameConstants.World.GRID_ROWS;
        this.islandSize = GameConstants.World.ISLAND_SIZE;
        this.waterGap = GameConstants.World.WATER_GAP;
        this.bridgeWidth = GameConstants.World.BRIDGE_WIDTH;
        this.mapPadding = GameConstants.World.MAP_PADDING;
        this.ironhavenOffsetX = GameConstants.World.IRONHAVEN_OFFSET_X || 0;
        this.ironhavenOffsetY = GameConstants.World.IRONHAVEN_OFFSET_Y || 0;
        this.wallWidth = GameConstants.World.WALL_WIDTH;
        this.wallPadTop = GameConstants.World.WALL_PAD_TOP;
        this.wallPadBottom = GameConstants.World.WALL_PAD_BOTTOM;
        this.unlockCosts = getConfig().UnlockCosts;
        this.cellSize = 0;
        this.islands = [];
        this.walkableZones = [];
        this.collisionBlocks = [];

        Logger.info('[IslandManager] Constructed');
    }

    init() {
        Logger.info('[IslandManager] init() called');
        this.cellSize = this.islandSize + this.waterGap;
        this.islands = [];

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

    rebuildWalkableZones(): void {
        const bridgeConfig = this.getBridgeConfig();
        const bridges = Bridges.getBridges(bridgeConfig);
        const getBounds = (i: Island) => this.getPlayableBounds(i)!;

        this.walkableZones = buildWalkableZones(
            this.islands,
            bridges,
            this.waterGap,
            150,
            getBounds
        );

        Logger.info(
            `[IslandManager] Rebuilt walkable zones: ${this.walkableZones.length} active zones`
        );
    }

    private getBridgeConfig(): Bridges.BridgeConfig {
        return {
            gridCols: this.gridCols,
            gridRows: this.gridRows,
            cellSize: this.cellSize,
            islandSize: this.islandSize,
            waterGap: this.waterGap,
            bridgeWidth: this.bridgeWidth,
            mapPadding: this.mapPadding,
            ironhavenOffsetX: this.ironhavenOffsetX,
            ironhavenOffsetY: this.ironhavenOffsetY
        };
    }

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

    rebuildCollisionBlocks(): void {
        this.collisionBlocks = buildCollisionBlocks(this.islands, {
            islandSize: this.islandSize,
            zoneCells: GameConstants.Grid.ISLAND_CELLS,
            gridCellSize: GameConstants.Grid.CELL_SIZE,
            gridRows: this.gridRows,
            gridCols: this.gridCols
        });

        Logger.info(
            `[IslandManager] Rebuilt collision blocks: ${this.collisionBlocks.length} blocks`
        );
    }

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

    getUnlockTrigger(x: number, y: number): Island | null {
        return getUnlockTrigger(
            x,
            y,
            this.walkableZones,
            (gx, gy) => this.getIslandByGrid(gx, gy)
        );
    }

    getBridges() {
        return Bridges.getBridges(this.getBridgeConfig());
    }

    isOnBridge(x: number, y: number): boolean {
        return Bridges.isOnBridge(x, y, this.getBridges());
    }

    getBridgeAt(x: number, y: number) {
        return Bridges.getBridgeAt(x, y, this.getBridges());
    }

    worldToGrid(x: number, y: number) {
        return Grid.worldToGrid(x, y);
    }

    gridToWorld(gx: number, gy: number) {
        return Grid.gridToWorld(gx, gy);
    }

    snapToGrid(x: number, y: number) {
        return Grid.snapToGrid(x, y);
    }

    getGridCellBounds(gx: number, gy: number) {
        return Grid.getGridCellBounds(gx, gy);
    }

    getIslandByGrid(gridX: number, gridY: number): Island | undefined {
        return this.islands.find((i) => i.gridX === gridX && i.gridY === gridY);
    }

    isIslandUnlocked(gridX: number, gridY: number): boolean {
        const island = this.getIslandByGrid(gridX, gridY);
        return island ? island.unlocked : false;
    }

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

    getHomeIsland(): Island | undefined {
        return this.islands.find((i) => i.type === IslandType.HOME);
    }

    getHeroSpawnPosition(): { x: number; y: number } {
        const home = this.getHomeIsland();
        return {
            x: home!.worldX + home!.width / 2,
            y: home!.worldY + home!.height / 2
        };
    }

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
