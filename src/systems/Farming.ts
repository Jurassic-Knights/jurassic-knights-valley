/**
 * Farming System
 * Handles crop growth, soil states, and harvesting
 *
 * Owner: Gameplay Designer
 */

import { Logger } from '../core/Logger';
import { GameState } from '../core/State';

// Unmapped modules - need manual import
declare const CropsData: any; // TODO: Add proper import

// Unmapped modules - need manual import
 // TODO: Add proper import


const Farming = {
    crops: new Map<string, any>(),

    /**
     * Plant a crop at a tile position
     * @param {number} x - Tile X
     * @param {number} y - Tile Y
     * @param {string} cropId - Crop type ID
     */
    plant(x, y, cropId) {
        const key = `${x},${y}`;
        const cropDef = CropsData?.[cropId];

        if (!cropDef) {
            Logger.warn(`[Farming] Unknown crop: ${cropId}`);
            return false;
        }

        this.crops.set(key, {
            id: cropId,
            x,
            y,
            stage: 0,
            growthProgress: 0,
            watered: false,
            plantedDay: GameState?.get('day') || 0
        });

        Logger.info(`[Farming] Planted ${cropId} at ${x},${y}`);
        return true;
    },

    /**
     * Water a crop
     */
    water(x, y) {
        const key = `${x},${y}`;
        const crop = this.crops.get(key);

        if (crop) {
            crop.watered = true;
            return true;
        }
        return false;
    },

    /**
     * Update crop growth (called daily)
     */
    updateDaily() {
        this.crops.forEach((crop, key) => {
            const cropDef = CropsData?.[crop.id];
            if (!cropDef) return;

            // Only grow if watered
            if (crop.watered) {
                crop.growthProgress += 1;

                // Check for stage advancement
                const stagesNeeded = cropDef.daysPerStage || 1;
                if (crop.growthProgress >= stagesNeeded) {
                    crop.stage = Math.min(crop.stage + 1, cropDef.maxStage || 3);
                    crop.growthProgress = 0;
                }
            }

            // Reset watered status for next day
            crop.watered = false;
        });
    },

    /**
     * Harvest a crop
     */
    harvest(x, y) {
        const key = `${x},${y}`;
        const crop = this.crops.get(key);

        if (!crop) return null;

        const cropDef = CropsData?.[crop.id];
        if (!cropDef) return null;

        // Check if fully grown
        if (crop.stage >= (cropDef.maxStage || 3)) {
            this.crops.delete(key);
            return {
                itemId: cropDef.harvestItem,
                quantity: cropDef.harvestAmount || 1
            };
        }

        return null; // Not ready
    },

    /**
     * Get crop at position
     */
    getCrop(x, y) {
        return this.crops.get(`${x},${y}`) || null;
    }
};

export { Farming };
