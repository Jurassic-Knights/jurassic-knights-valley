/**
 * BaseItem - Default configuration for items
 * 
 * Items are collectible objects that go into inventory.
 * Includes crafting materials, consumables, quest items.
 */

const BaseItem = {
    entityType: 'Item',

    // Identity
    name: 'Unknown Item',
    description: '',

    // Classification
    category: 'material',  // material, consumable, quest, key
    rarity: 'common',      // common, uncommon, rare, epic, legendary

    // Stacking
    stackable: true,
    maxStack: 99,

    // Value
    value: 1,
    sellPrice: 1,

    // Visual
    sprite: 'item_base',
    icon: 'ui_item_base',

    // Effects (consumables)
    useEffect: null,

    // Crafting (if craftable)
    recipe: null
};

window.BaseItem = BaseItem;
