/**
 * Merchant NPC
 * 
 * Friendly trader who sells items and buys loot.
 */

const MerchantEntity = {
    ...window.BaseNPC,

    id: 'merchant',
    name: 'Wandering Merchant',
    description: 'Sells supplies and buys salvage.',

    // Behavior
    isShop: true,
    interactionRange: 120,

    // Dialogue
    greeting: 'What do you need, knight?',

    // Visual
    sprite: 'npc_merchant',

    // Shop
    shopInventory: [
        { item: 'health_potion', price: 25, stock: 5 },
        { item: 'stamina_potion', price: 20, stock: 5 },
        { item: 'iron_sword', price: 100, stock: 1 }
    ],

    // Audio
    sfx: {
        greet: 'sfx_merchant_greet',
        trade: 'sfx_coin_drop'
    }
};

window.EntityRegistry.npcs = window.EntityRegistry.npcs || {};
window.EntityRegistry.npcs.merchant = MerchantEntity;
