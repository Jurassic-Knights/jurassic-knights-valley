/**
 * HeroDefaults - Default hero equipment and starting configuration
 *
 * Used to initialize the hero with starting equipment.
 * Modify this file to change default loadout for testing or gameplay.
 *
 * Owner: Gameplay Designer
 */

const HeroDefaults = {
    // Default equipment by slot (use entity IDs from src/entities/equipment/)
    equipment: {
        head: 'head_t1_01', // Cloth Cap
        body: 'chest_t1_01', // Cloth Tunic
        hands: 'hands_t1_01', // Cloth Gloves
        legs: 'feet_t1_01', // Cloth Boots
        accessory: null, // No accessory by default
        hand1: 'weapon_ranged_pistol_t1_01', // Nagant Revolver (pistol)
        hand2: 'weapon_melee_sword_t1_01', // Heavy Knife (sword)
        tool_mining: 'tool_mining_t1_01', // Stone Pickaxe
        tool_woodcutting: 'tool_woodcutting_t1_01', // Stone Hatchet
        tool_harvesting: 'tool_harvesting_t1_01', // Crude Sickle
        tool_fishing: 'tool_fishing_t1_01' // Makeshift Rod
    },

    // Starting inventory items (resource IDs and quantities)
    inventory: {
        gold: 100,
        scraps_t1_01: 10,
        minerals_t1_01: 10,
        minerals_t2_01: 10,
        wood_t1_01: 10,
        food_t1_01: 10
    },

    // Starting stats
    stats: {
        level: 1,
        xp: 0,
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100
    },

    /**
     * Get equipment data for a slot
     * @param {string} slotId - Equipment slot
     * @returns {Object|null} Equipment entity data or null
     */
    getEquipmentForSlot(slotId) {
        const entityId = this.equipment[slotId];
        if (!entityId) return null;

        // Try to load from EntityRegistry.equipment
        if (EntityRegistry?.equipment && EntityRegistry.equipment[entityId]) {
            return EntityRegistry.equipment[entityId];
        }

        return null;
    },

    /**
     * Get all default equipment as array
     * @returns {Array} Array of {slotId, entityId} objects
     */
    getAllEquipment() {
        return Object.entries(this.equipment)
            .filter(([_, id]) => id !== null)
            .map(([slot, id]) => ({ slot, entityId: id }));
    }
};

export { HeroDefaults };
