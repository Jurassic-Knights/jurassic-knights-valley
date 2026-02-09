/**
 * IslandUpgrades - Data structure for per-island upgrades
 *
 * Manages resource slots, auto-production chance, and respawn time.
 *
 * Owner: Gameplay Designer
 */

import { Logger } from '@core/Logger';
import { GameConstants } from '@data/GameConstants';

export interface UpgradeLevel {
    level: number;
    max: number;
}

export interface IslandUpgradeState {
    gridX: number;
    gridY: number;
    name: string;
    resourceSlots: UpgradeLevel;
    autoChance: UpgradeLevel;
    respawnTime: UpgradeLevel;
    [key: string]: unknown; // Index signature for dynamic access
}

const IslandUpgrades = {
    // Upgrade data per island (keyed by island grid position)
    islands: {} as Record<string, IslandUpgradeState>,

    get baseCosts(): Record<string, number> {
        return GameConstants.IslandUpgrades.BASE_COSTS;
    },

    costMultiplier: 1.15,

    get caps(): Record<string, number> {
        return GameConstants.IslandUpgrades.CAPS;
    },

    /**
     * Initialize upgrade data for all islands
     */
    init(islands: Array<{ gridX: number; gridY: number; [key: string]: unknown }>) {
        // Defensive: ensure islands is an iterable array
        if (!islands || !Array.isArray(islands)) {
            Logger.warn('[IslandUpgrades] init called with invalid islands parameter, skipping');
            return;
        }
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
    /**
     * Get upgrade state for an island
     */
    getIsland(gridX: number, gridY: number): IslandUpgradeState | null {
        const key = `${gridX}_${gridY}`;
        return this.islands[key] || null;
    },

    /**
     * Calculate cost for next level of an upgrade
     * @param {string} type - 'resourceSlots', 'autoChance', 'respawnTime'
     */
    getUpgradeCost(type: string, currentLevel: number): number {
        const defaultBase = GameConstants.IslandUpgrades.DEFAULT_BASE_COST;
        const baseCost = this.baseCosts[type] ?? defaultBase;
        return Math.floor(baseCost * Math.pow(this.costMultiplier, currentLevel));
    },

    /**
     * Check if an upgrade can be purchased
     * @param {number} gridX
     * @param {number} gridY
     * @param {string} type
     * @returns {boolean}
     */
    /**
     * Check if an upgrade can be purchased
     */
    canUpgrade(gridX: number, gridY: number, type: string): boolean {
        const island = this.getIsland(gridX, gridY);
        if (!island) return false;

        const upgrade = island[type];
        if (!upgrade) return false;

        return upgrade.level < upgrade.max;
    },

    /**
     * Apply an upgrade to an island
     */
    applyUpgrade(gridX: number, gridY: number, type: string): boolean {
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
    /**
     * Get current auto-chance percentage for an island
     */
    getAutoChance(gridX: number, gridY: number): number {
        const island = this.getIsland(gridX, gridY);
        if (!island) return 0;
        return island.autoChance.level; // 1 level = 1%
    },

    /**
     * Get respawn time in seconds for an island
     */
    getRespawnTime(gridX: number, gridY: number, baseTime = 30): number {
        const island = this.getIsland(gridX, gridY);
        if (!island) return baseTime;

        // Use shared helper
        return this.calculateRespawnTime(island.respawnTime.level, baseTime);
    },

    /**
     * Calculate respawn time based on level
     */
    calculateRespawnTime(level: number, baseTime: number): number {
        // Base time, speed increased by 10% per level
        // Formula: Time = Base / (1 + (Level * 0.10))
        const speedMultiplier = 1 + level * 0.1;
        return Math.max(2, baseTime / speedMultiplier);
    },

    /**
     * Get max resource slots for an island
     */
    getResourceSlots(gridX: number, gridY: number): number {
        const island = this.getIsland(gridX, gridY);
        if (!island) return 1;
        return island.resourceSlots.level;
    }
};

import { Registry } from '@core/Registry';
Registry.register('IslandUpgrades', IslandUpgrades);

// ES6 Module Export
export { IslandUpgrades };
