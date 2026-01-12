/**
 * BaseEquipment - Default configuration for weapons and armor
 * 
 * Equipment items that can be equipped by the hero.
 * Provides stat bonuses and abilities.
 */

const BaseEquipment = {
    entityType: 'Equipment',

    // Identity
    name: 'Unknown Equipment',
    description: '',

    // Classification
    slot: 'weapon',        // weapon, armor, helmet, boots, accessory
    category: 'melee',     // melee, ranged, armor, accessory
    rarity: 'common',
    tier: 1,

    // Stats
    damage: 0,
    defense: 0,
    speed: 0,
    critChance: 0,
    critMultiplier: 0,

    // Weapon-specific
    attackRange: 125,
    attackRate: 1,
    hands: 1,              // 1 = one-handed, 2 = two-handed

    // Value
    value: 10,
    sellPrice: 5,

    // Visual
    sprite: 'equipment_base',
    icon: 'ui_equipment_base',

    // Audio
    sfx: {
        equip: 'sfx_equip',
        attack: 'sfx_sword_swing'
    },

    // VFX
    vfx: {
        attack: 'vfx_sword_slash'
    },

    // Crafting
    recipe: null
};

window.BaseEquipment = BaseEquipment;
