/**
 * Iron Sword - Equipment
 * 
 * Basic melee weapon.
 */

const IronSword = {
    ...window.BaseEquipment,

    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'Standard issue. Reliable.',

    slot: 'weapon',
    category: 'melee',
    rarity: 'common',
    tier: 1,

    // Stats
    damage: 15,
    attackRange: 125,
    attackRate: 1.5,
    hands: 1,

    // Value
    value: 50,
    sellPrice: 25,

    // Visual
    sprite: 'weapon_iron_sword',
    icon: 'ui_weapon_iron_sword',

    // Recipe
    recipe: {
        station: 'forge',
        ingredients: [
            { item: 'iron_ore', count: 3 },
            { item: 'wood', count: 1 }
        ],
        craftTime: 5
    }
};

window.EntityRegistry.equipment = window.EntityRegistry.equipment || {};
window.EntityRegistry.equipment.iron_sword = IronSword;
