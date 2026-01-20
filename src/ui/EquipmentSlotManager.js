/**
 * EquipmentSlotManager - Slot and equip logic for EquipmentUI
 * Handles equipping, unequipping, slot selection, and 2-hand weapon logic.
 * 
 * Owner: UI Engineer
 */
class EquipmentSlotManager {
    /**
     * Equip an item from inventory to appropriate slot
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @param {string} itemId - Item to equip
     */
    static equipItem(ui, itemId) {
        const hero = window.GameInstance?.hero;
        if (!hero?.equipment) {
            Logger.warn('[EquipmentSlotManager] Cannot equip - hero.equipment not available');
            return;
        }

        const item = ui.cachedEquipment.find(e => e.id === itemId);
        if (!item) {
            Logger.warn(`[EquipmentSlotManager] Item not found: ${itemId}`);
            return;
        }

        // Map slot based on sourceFile or slot
        let targetSlot = item.slot;

        // Weapons go to hand1/hand2 or hand1_alt/hand2_alt based on targetEquipSet
        if (item.sourceFile === 'weapon' || item.sourceFile === 'signature' || item.slot === 'weapon' || item.weaponType) {
            // Determine which slots to use based on targetEquipSet (1 or 2)
            const targetSet = ui.targetEquipSet || 1;
            const hand1Slot = targetSet === 2 ? 'hand1_alt' : 'hand1';
            const hand2Slot = targetSet === 2 ? 'hand2_alt' : 'hand2';

            const hand1 = hero.equipment.getSlot(hand1Slot);
            const hand2 = hero.equipment.getSlot(hand2Slot);

            // 2-hand weapons always go to hand1 and disable hand2
            if (item.gripType === '2-hand') {
                targetSlot = hand1Slot;
                // Unequip hand2 if occupied
                if (hand2) {
                    Logger.info(`[EquipmentSlotManager] 2-hand weapon - unequipping ${hand2Slot}`);
                    hero.equipment.unequip(hand2Slot);
                }
            }
            // 1-hand weapons check for available slots
            else if (!hand1) {
                targetSlot = hand1Slot;
            } else if (!hand2 && (!hand1 || hand1.gripType !== '2-hand')) {
                // Can only use hand2 if hand1 is not a 2-hand weapon
                targetSlot = hand2Slot;
            } else if (hand1?.gripType === '2-hand') {
                // If hand1 is 2-hand, replace it with this 1-hand
                targetSlot = hand1Slot;
            } else {
                // Both slots full with 1-hand weapons - enter slot selection mode
                Logger.info(`[EquipmentSlotManager] Both weapon slots full in Set ${targetSet}`);
                ui.slotSelectionMode = true;
                ui.pendingEquipItem = item;
                ui._render();
                return;
            }
        }
        // Tools go to type-specific tool slots
        else if (item.sourceFile === 'tool' || item.slot === 'tool') {
            // Route to specific tool slot based on toolSubtype
            const toolSlotMap = {
                mining: 'tool_mining',
                woodcutting: 'tool_woodcutting',
                harvesting: 'tool_harvesting',
                fishing: 'tool_fishing'
            };
            targetSlot = toolSlotMap[item.toolSubtype] || 'tool_mining';
        }
        // Chest armor goes to body
        else if (item.sourceFile === 'chest') {
            targetSlot = 'body';
        }
        // Feet armor goes to legs
        else if (item.sourceFile === 'feet') {
            targetSlot = 'legs';
        }
        // Accessories go to accessory slot
        else if (item.sourceFile === 'accessory' || item.slot === 'accessory') {
            targetSlot = 'accessory';
        }

        EquipmentSlotManager.equipToSlot(ui, item, targetSlot);
    }

    /**
     * Equip an item to a specific slot
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @param {Object} item - Item to equip
     * @param {string} targetSlot - Target slot ID
     */
    static equipToSlot(ui, item, targetSlot) {
        const hero = window.GameInstance?.hero;
        if (!hero?.equipment) return;

        Logger.info(`[EquipmentSlotManager] Equipping ${item.name} to slot ${targetSlot}`);
        const success = hero.equipment.equip(targetSlot, item);

        if (success) {
            Logger.info(`[EquipmentSlotManager] Successfully equipped ${item.name}`);
        } else {
            Logger.warn(`[EquipmentSlotManager] Failed to equip ${item.name} to ${targetSlot}`);
        }

        // Keep selectedItem so user can still see stats after equipping
        ui._render();
    }

    /**
     * Unequip an item from a slot
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @param {string} slotId - Slot to unequip
     */
    static unequipSlot(ui, slotId) {
        const hero = window.GameInstance?.hero;
        if (!hero?.equipment) return;

        hero.equipment.unequip(slotId);
        ui._render();
    }

    /**
     * Handle slot selection during slot selection mode
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @param {string} slotId - Selected slot
     * @returns {boolean} True if handled
     */
    static handleSlotSelection(ui, slotId) {
        if (!ui.slotSelectionMode || !ui.pendingEquipItem) return false;
        if (slotId !== 'hand1' && slotId !== 'hand2') return false;

        Logger.info(`[EquipmentSlotManager] Slot selection: equipping ${ui.pendingEquipItem.id} to ${slotId}`);
        const item = ui.pendingEquipItem;
        ui.slotSelectionMode = false;
        ui.pendingEquipItem = null;
        EquipmentSlotManager.equipToSlot(ui, item, slotId);
        return true;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.EquipmentSlotManager = EquipmentSlotManager;
}

