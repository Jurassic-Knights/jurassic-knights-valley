/**
 * Raptor Claw - Item
 * 
 * Crafting material dropped from raptors.
 */

const RaptorClaw = {
    ...window.BaseItem,

    id: 'raptor_claw',
    name: 'Raptor Claw',
    description: 'Razor-sharp talon. Prized by smiths.',

    category: 'material',
    rarity: 'uncommon',

    value: 15,
    sellPrice: 8,

    sprite: 'item_raptor_claw',
    icon: 'ui_item_raptor_claw'
};

window.EntityRegistry.items = window.EntityRegistry.items || {};
window.EntityRegistry.items.raptor_claw = RaptorClaw;
