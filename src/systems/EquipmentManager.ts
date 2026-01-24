/**
 * EquipmentManager
 * Manages equipped items on an entity (typically Hero).
 * Handles equip/unequip, stat aggregation, and set bonus detection.
 * 
 * Owner: Gameplay Engineer
 */

import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { SetBonusesConfig } from '../config/SetBonusesConfig';
import { EquipmentSlotsConfig } from '../config/EquipmentSlotsConfig';

class EquipmentManager {
    owner: any;
    slots: Record<string, any> = {};
    activeWeaponSet: number = 1;

    /**
     * @param {Entity} owner - The entity that owns this equipment
     */
    constructor(owner: any) {
        this.owner = owner;

        // Initialize empty slots from config
        if (EquipmentSlotsConfig) {
            for (const slotId of EquipmentSlotsConfig.getSlotIds()) {
                this.slots[slotId] = null;
            }
        }

        // Weapon set initialized above

        Logger.info(`[EquipmentManager] Initialized for ${owner.id || owner.constructor.name}`);
    }

    /**
     * Swap between weapon set 1 and weapon set 2
     */
    swapWeaponSet() {
        this.activeWeaponSet = this.activeWeaponSet === 1 ? 2 : 1;
        Logger.info(`[EquipmentManager] Swapped to weapon set ${this.activeWeaponSet}`);

        if (EventBus) {
            EventBus.emit('WEAPON_SET_CHANGED', { activeSet: this.activeWeaponSet });
        }

        return this.activeWeaponSet;
    }

    /**
     * Get the slot IDs for the currently active weapon set
     * @returns {Object} { mainHand: string, offHand: string }
     */
    getActiveWeaponSlots() {
        if (this.activeWeaponSet === 2) {
            return { mainHand: 'hand1_alt', offHand: 'hand2_alt' };
        }
        return { mainHand: 'hand1', offHand: 'hand2' };
    }

    /**
     * Get the weapons from the currently active set
     * @returns {Object} { mainHand: Object|null, offHand: Object|null }
     */
    getActiveWeapons() {
        const slots = this.getActiveWeaponSlots();
        return {
            mainHand: this.slots[slots.mainHand],
            offHand: this.slots[slots.offHand]
        };
    }

    /**
     * Get equipped items that should apply stats (excludes inactive weapon set)
     * @returns {Object[]}
     */
    getEquippedItemsForStats() {
        const activeSlots = this.getActiveWeaponSlots();
        const excludedSlots = this.activeWeaponSet === 1
            ? ['hand1_alt', 'hand2_alt']
            : ['hand1', 'hand2'];

        return Object.entries(this.slots)
            .filter(([slotId, item]) => item !== null && !excludedSlots.includes(slotId))
            .map(([slotId, item]) => item);
    }

    /**
     * Equip an item to a slot
     * @param {string} slotId - The slot to equip to (e.g., 'hand1', 'chest')
     * @param {Object} equipmentData - Full equipment object with id, stats, etc.
     * @returns {boolean} Success
     */
    equip(slotId, equipmentData) {
        if (!this.slots.hasOwnProperty(slotId)) {
            Logger.warn(`[EquipmentManager] Invalid slot: ${slotId}`);
            return false;
        }

        // Validate item type can go in this slot
        // NOTE: Validation temporarily relaxed due to incorrect type values in equipment data
        const itemType = equipmentData.slot || equipmentData.sourceFile || equipmentData.type;
        if (EquipmentSlotsConfig && !EquipmentSlotsConfig.canEquip(slotId, itemType)) {
            // Log warning but still allow equip (data issue)
            Logger.warn(`[EquipmentManager] Type mismatch: ${itemType} in ${slotId} - allowing anyway`);
        }

        // Unequip existing item first
        const previousItem = this.slots[slotId];
        this.slots[slotId] = equipmentData;

        // Emit event for UI and other systems
        if (EventBus) {
            EventBus.emit('EQUIPMENT_CHANGED', {
                owner: this.owner.id,
                slot: slotId,
                equipped: equipmentData,
                unequipped: previousItem
            });
        }

        Logger.info(`[EquipmentManager] Equipped ${equipmentData.id} to ${slotId}`);
        return true;
    }

    /**
     * Unequip an item from a slot
     * @param {string} slotId
     * @returns {Object|null} The unequipped item or null
     */
    unequip(slotId) {
        if (!this.slots.hasOwnProperty(slotId)) {
            return null;
        }

        const item = this.slots[slotId];
        this.slots[slotId] = null;

        if (item && EventBus) {
            EventBus.emit('EQUIPMENT_CHANGED', {
                owner: this.owner.id,
                slot: slotId,
                equipped: null,
                unequipped: item
            });
        }

        return item;
    }

    /**
     * Get all currently equipped items
     * @returns {Object[]} Array of equipped items (non-null)
     */
    getEquippedItems() {
        return Object.values(this.slots).filter(item => item !== null);
    }

    /**
     * Get IDs of all equipped items
     * @returns {string[]}
     */
    getEquippedIds() {
        return this.getEquippedItems().map(item => item.id);
    }

    /**
     * Get item equipped in a specific slot
     * @param {string} slotId
     * @returns {Object|null}
     */
    getSlot(slotId) {
        return this.slots[slotId] || null;
    }

    // === Stat Aggregation ===

    /**
     * Get total bonus for a stat from all equipped items + set bonuses
     * @param {string} statKey - e.g., 'damage', 'armor', 'critChance'
     * @returns {number}
     */
    getStatBonus(statKey) {
        let total = 0;

        // Sum from equipped items (excluding inactive weapon set)
        for (const item of this.getEquippedItemsForStats()) {
            if (item.stats && typeof item.stats[statKey] === 'number') {
                total += item.stats[statKey];
            }
        }

        // Add set bonuses
        if (SetBonusesConfig) {
            const setBonuses = SetBonusesConfig.calculateSetBonuses(this.getEquippedIds());
            if (setBonuses[statKey]) {
                total += setBonuses[statKey];
            }
        }

        return total;
    }

    /**
     * Check if any equipped item has a boolean effect
     * @param {string} effectKey - e.g., 'bleed', 'stagger'
     * @returns {boolean}
     */
    hasEffect(effectKey) {
        for (const item of this.getEquippedItems()) {
            if (item.stats && item.stats[effectKey] === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the highest value of a stat from equipped items
     * Useful for range (use best weapon's range)
     * @param {string} statKey
     * @returns {number}
     */
    getMaxStat(statKey) {
        let max = 0;
        for (const item of this.getEquippedItems()) {
            if (item.stats && typeof item.stats[statKey] === 'number') {
                max = Math.max(max, item.stats[statKey]);
            }
        }
        return max;
    }

    /**
     * Get active set bonuses for display
     * @returns {Object[]} Array of { setName, pieceCount, bonuses }
     */
    getActiveSetBonuses() {
        if (!SetBonusesConfig) return [];

        const equippedIds = this.getEquippedIds();
        const setCounts = {};
        const result = [];

        // Count pieces per set
        for (const id of equippedIds) {
            const setId = SetBonusesConfig.findSetForPiece(id);
            if (setId) {
                setCounts[setId] = (setCounts[setId] || 0) + 1;
            }
        }

        // Build result
        for (const [setId, count] of Object.entries(setCounts) as [string, number][]) {
            const set = SetBonusesConfig.sets[setId];
            const activeBonuses: any = {};

            for (const [threshold, stats] of Object.entries(set.bonuses) as [string, any][]) {
                if (count >= parseInt(threshold)) {
                    Object.assign(activeBonuses, stats);
                }
            }

            if (Object.keys(activeBonuses).length > 0) {
                result.push({
                    setId,
                    setName: set.name,
                    pieceCount: count,
                    totalPieces: set.pieces.length,
                    bonuses: activeBonuses
                });
            }
        }

        return result;
    }
}

// ES6 Module Export
export { EquipmentManager };
