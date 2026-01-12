/**
 * Primal Meat - Item
 * 
 * Raw meat dropped from dinosaurs.
 */

const PrimalMeat = {
    ...window.BaseItem,

    id: 'primal_meat',
    name: 'Primal Meat',
    description: 'Raw flesh from a prehistoric beast.',

    category: 'material',
    rarity: 'uncommon',

    value: 5,
    sellPrice: 2,

    sprite: 'item_primal_meat',
    icon: 'ui_item_primal_meat'
};

window.EntityRegistry.items = window.EntityRegistry.items || {};
window.EntityRegistry.items.primal_meat = PrimalMeat;
