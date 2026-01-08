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

        console.log('[IslandManager] Constructed');
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
                    // World coordinates
                    worldX: this.mapPadding + col * this.cellSize,
                    worldY: this.mapPadding + row * this.cellSize,
                    width: this.islandSize,
                    height: this.islandSize
                });
            }
        }

        // Initialize walkable zones
        this.rebuildWalkableZones();

        console.log(`[IslandManager] Initialized ${this.islands.length} zones`);
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

        console.log(`[IslandManager] Unlocked zone: ${island.name}`);

        // AAA Feature: Artillery Bombardment Effect on Unlock
        if (window.VFXController && window.VFXController.bombardZone) {
            const bounds = this.getPlayableBounds(island);
            console.log('[IslandManager] Triggering bombardment on:', island.name, bounds);
            // Translate bounds to format expected by bombardZone
            const targetZone = {
                worldX: bounds.x,
                worldY: bounds.y,
                width: bounds.width,
                height: bounds.height
            };
            VFXController.bombardZone(targetZone);
        } else {
            console.warn('[IslandManager] VFXController or bombardZone not found!');
        }

        // Rebuild walkable zones to include the new island
        this.rebuildWalkableZones();

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
                const baseX = this.mapPadding + col * this.cellSize;
                const baseY = this.mapPadding + row * this.cellSize;

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

        console.log(`[IslandManager] Rebuilt walkable zones: ${this.walkableZones.length} active zones`);
    }

    /**
     * Check if world position is walkable
     * Uses efficient cached zone list
     */
    isWalkable(x, y) {
        for (const zone of this.walkableZones) {
            if (x >= zone.x && x <= zone.x + zone.width &&
                y >= zone.y && y <= zone.y + zone.height) {
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
}

// Export Singleton Instance
window.IslandManager = new IslandManagerService();
if (window.Registry) Registry.register('IslandManager', window.IslandManager);
