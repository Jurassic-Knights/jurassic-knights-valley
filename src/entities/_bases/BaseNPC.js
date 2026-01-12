/**
 * BaseNPC - Default configuration for non-player characters
 * 
 * NPCs include merchants, blacksmiths, quest givers, etc.
 * They are friendly and provide services.
 */

const BaseNPC = {
    entityType: 'NPC',

    // Size
    gridSize: 1,
    width: 128,
    height: 128,

    // Behavior
    interactable: true,
    interactionRange: 100,

    // AI
    aiType: 'stationary',
    patrolRadius: 0,

    // Dialogue
    dialogueId: null,
    greeting: 'Hello, traveler.',

    // Shop (if merchant)
    isShop: false,
    shopInventory: [],

    // Visual
    sprite: 'npc_base',

    // Audio
    sfx: {
        greet: 'sfx_npc_greet',
        trade: 'sfx_npc_trade'
    }
};

window.BaseNPC = BaseNPC;
