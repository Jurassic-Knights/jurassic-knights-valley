/**
 * IslandUpgrades - Data structure for per-island upgrades
 *
 * Manages resource slots, auto-production chance, and respawn time.
 *
 * Owner: Gameplay Designer
 */

const IslandUpgrades = {
    // Upgrade data per island (keyed by island grid position)
    islands: {},

    // Base costs
    baseCosts: {
        resourceSlots: 100,
        autoChance: 150,
        respawnTime: 75
    },

    // Cost multiplier per level
    costMultiplier: 1.15,

    // Caps
    caps: {
        resourceSlots: 15, // Max 15 resource nodes
        autoChance: 80, // Max 80% auto-collect
        respawnTime: 100 // Max level 100
    },

    /**
     * Initialize upgrade data for all islands
     */
    init(islands) {
        for (const island of islands) {
            const key = `${island.gridX}_${island.gridY}`;
            this.islands[key] = {
                gridX: island.gridX,
                gridY: island.gridY,
                name: island.name,
                resourceSlots: { level: 1, max: this.caps.resourceSlots }, // Start with 1
                autoChance: { level: 0, max: this.caps.autoChance },
                respawnTime: { level: 1, max: this.caps.respawnTime } // Start with 1
            };
        }
        Logger.info(`[IslandUpgrades] Initialized ${Object.keys(this.islands).length} islands`);
    },

    /**
     * Get upgrade state for an island
     * @param {number} gridX
     * @param {number} gridY
     * @returns {object|null}
     */
    getIsland(gridX, gridY) {
        const key = `${gridX}_${gridY}`;
        return this.islands[key] || null;
    },

    /**
     * Calculate cost for next level of an upgrade
     * @param {string} type - 'resourceSlots', 'autoChance', 'respawnTime'
     * @param {number} currentLevel
     * @returns {number}
     */
    getUpgradeCost(type, currentLevel) {
        const baseCost = this.baseCosts[type] || 100;
        return Math.floor(baseCost * Math.pow(this.costMultiplier, currentLevel));
    },

    /**
     * Check if an upgrade can be purchased
     * @param {number} gridX
     * @param {number} gridY
     * @param {string} type
     * @returns {boolean}
     */
    canUpgrade(gridX, gridY, type) {
        const island = this.getIsland(gridX, gridY);
        if (!island) return false;

        const upgrade = island[type];
        if (!upgrade) return false;

        return upgrade.level < upgrade.max;
    },

    /**
     * Apply an upgrade to an island
     * @param {number} gridX
     * @param {number} gridY
     * @param {string} type
     * @returns {boolean} Success
     */
    applyUpgrade(gridX, gridY, type) {
        const island = this.getIsland(gridX, gridY);
        if (!island) return false;

        const upgrade = island[type];
        if (!upgrade || upgrade.level >= upgrade.max) return false;

        upgrade.level++;
        Logger.info(
            `[IslandUpgrades] ${island.name} ${type} upgraded to level ${upgrade.level} (Max: ${upgrade.max})`
        );
        Logger.info(`[IslandUpgrades] New state:`, JSON.stringify(upgrade));
        return true;
    },

    /**
     * Get current auto-chance percentage for an island
     * @param {number} gridX
     * @param {number} gridY
     * @returns {number} Percentage (0-80)
     */
    getAutoChance(gridX, gridY) {
        const island = this.getIsland(gridX, gridY);
        if (!island) return 0;
        return island.autoChance.level; // 1 level = 1%
    },

    /**
     * Get respawn time in seconds for an island
     * @param {number} gridX
     * @param {number} gridY
     * @returns {number} Seconds
     */
    getRespawnTime(gridX, gridY, baseTime = 30) {
        const island = this.getIsland(gridX, gridY);
        if (!island) return baseTime;

        // Use shared helper
        return this.calculateRespawnTime(island.respawnTime.level, baseTime);
    },

    /**
     * Calculate respawn time based on level
     * @param {number} level
     * @param {number} baseTime
     * @returns {number}
     */
    calculateRespawnTime(level, baseTime) {
        // Base time, speed increased by 10% per level
        // Formula: Time = Base / (1 + (Level * 0.10))
        const speedMultiplier = 1 + level * 0.1;
        return Math.max(2, baseTime / speedMultiplier);
    },

    /**
     * Get max resource slots for an island
     * @param {number} gridX
     * @param {number} gridY
     * @returns {number}
     */
    getResourceSlots(gridX, gridY) {
        const island = this.getIsland(gridX, gridY);
        if (!island) return 1;
        return island.resourceSlots.level;
    }
};

window.IslandUpgrades = IslandUpgrades;

// ES6 Module Export
export { IslandUpgrades };
