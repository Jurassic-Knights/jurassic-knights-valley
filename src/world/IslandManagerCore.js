/**
 * IslandManagerCore - Island grid initialization and unlock state
 * Core service class with constructor and island management
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
        this.collisionBlocks = [];

        Logger.info('[IslandManager] Constructed');
    }

    /**
     * Initialize the island grid
     */
    init() {
        this.cellSize = this.islandSize + this.waterGap;
        this.islands = [];

        // Load World Data with defaults
        const islandNames = window.WorldData?.Names || [
            ['Home', 'Zone 1', 'Zone 2'],
            ['Zone 3', 'Zone 4', 'Zone 5'],
            ['Zone 6', 'Zone 7', 'Zone 8']
        ];
        const islandCategories = window.WorldData?.Categories || [
            ['home', 'resource', 'resource'],
            ['resource', 'resource', 'resource'],
            ['resource', 'resource', 'resource']
        ];
        const zoneResourceTypes = window.WorldData?.Resources || [
            ['wood', 'wood', 'wood'],
            ['wood', 'wood', 'wood'],
            ['wood', 'wood', 'wood']
        ];

        const savedUnlocks = window.GameState ? window.GameState.get('unlocks') : null;
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

    /**
     * Get island by grid coordinates
     */
    getIslandByGrid(gridX, gridY) {
        return this.islands.find((i) => i.gridX === gridX && i.gridY === gridY);
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
        if (island.unlocked) return false;

        island.unlocked = true;

        if (window.GameState) {
            const unlocked = this.islands
                .filter((i) => i.unlocked)
                .map((i) => `${i.gridX},${i.gridY}`);
            window.GameState.set('unlocks', unlocked);
        }

        Logger.info(`[IslandManager] Unlocked zone: ${island.name}`);

        this.rebuildWalkableZones();
        this.rebuildCollisionBlocks();

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
    clampToPlayableArea(x, y) {
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
    getIslandAt(x, y) {
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
    getHomeIsland() {
        return this.islands.find((i) => i.type === 'home');
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
}

// Global registration (methods added in IslandManagerCollision.js and IslandManagerGrid.js)
window.IslandManagerService = IslandManagerService;

