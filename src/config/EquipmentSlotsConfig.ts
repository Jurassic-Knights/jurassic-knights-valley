/**
 * Equipment Slots Configuration
 * Defines all equipment slots and what item types they accept.
 *
 * Slot Types:
 * - hand1/hand2: Dual 1-handed slots for weapons or shields
 * - tool: Dedicated slot for mining/harvesting tools
 * - Armor slots: head, body, hands, legs
 */
const EquipmentSlotsConfig = {
    slots: {
        hand1: {
            label: 'Main Hand',
            accepts: ['weapon', 'shield'],
            allowsDualWield: true
        },
        hand2: {
            label: 'Off Hand',
            accepts: ['weapon', 'shield'],
            allowsDualWield: true
        },
        hand1_alt: {
            label: 'Main Hand (Alt)',
            accepts: ['weapon', 'shield'],
            allowsDualWield: true
        },
        hand2_alt: {
            label: 'Off Hand (Alt)',
            accepts: ['weapon', 'shield'],
            allowsDualWield: true
        },
        tool_mining: {
            label: 'Mining Tool',
            accepts: ['tool']
        },
        tool_woodcutting: {
            label: 'Woodcutting Tool',
            accepts: ['tool']
        },
        tool_harvesting: {
            label: 'Harvesting Tool',
            accepts: ['tool']
        },
        tool_fishing: {
            label: 'Fishing Tool',
            accepts: ['tool']
        },
        tool_shovel: {
            label: 'Shovel',
            accepts: ['tool']
        },
        head: {
            label: 'Head',
            accepts: ['head']
        },
        body: {
            label: 'Body',
            accepts: ['body']
        },
        hands: {
            label: 'Hands',
            accepts: ['hands']
        },
        legs: {
            label: 'Legs',
            accepts: ['legs']
        },
        accessory: {
            label: 'Accessory 1',
            accepts: ['accessory']
        },
        accessory2: {
            label: 'Accessory 2',
            accepts: ['accessory']
        }
    },

    /**
     * Get all slot IDs
     * @returns {string[]}
     */
    getSlotIds() {
        return Object.keys(this.slots);
    },

    /**
     * Check if an item type can be equipped in a slot
     * @param {string} slotId
     * @param {string} itemType
     * @returns {boolean}
     */
    canEquip(slotId: string, itemType: string) {
        const slot = (this.slots as Record<string, { accepts: string[] }>)[slotId];
        return slot ? slot.accepts.includes(itemType) : false;
    }
};

export { EquipmentSlotsConfig };
