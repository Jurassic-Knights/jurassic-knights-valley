/**
 * Game Events Configuration
 * Centralized registry of all event names to prevent typos/magic strings.
 */
const Events = {
    // Input
    INPUT_MOVE: 'INPUT_MOVE', // { x, y }
    INPUT_INTENT: 'INPUT_INTENT', // { intent, phase }
    INPUT_ACTION: 'INPUT_ACTION', // (void) - Legacy

    // Gameplay
    HERO_STAMINA_CHANGE: 'HERO_STAMINA_CHANGE',
    HERO_HEALTH_CHANGE: 'HERO_HEALTH_CHANGE',

    // Interaction
    REQUEST_REST: 'REQUEST_REST', // (void)
    REQUEST_MAGNET: 'REQUEST_MAGNET', // (void)

    // Economy & Progression
    RESOURCE_COLLECTED: 'RESOURCE_COLLECTED', // { type, amount, total }
    INVENTORY_UPDATED: 'INVENTORY_UPDATED', // { inventory }
    REQUEST_UPGRADE: 'REQUEST_UPGRADE', // { gridX, gridY, type, cost }
    UPGRADE_PURCHASED: 'UPGRADE_PURCHASED', // { gridX, gridY, type }
    ADD_GOLD: 'ADD_GOLD', // (amount)

    // World
    GAME_STATE_CHANGE: 'GAME_STATE_CHANGE', // { state }

    // Combat - Enemy AI
    ENEMY_AGGRO: 'ENEMY_AGGRO', // { enemy, target }
    ENEMY_ATTACK: 'ENEMY_ATTACK', // { attacker, target, damage }
    ENEMY_LEASH: 'ENEMY_LEASH', // { enemy }
    ENEMY_KILLED: 'ENEMY_KILLED', // { enemy, xpReward, lootTableId }

    // Progression
    XP_GAINED: 'XP_GAINED', // { hero, amount, total, level }
    HERO_LEVEL_UP: 'HERO_LEVEL_UP', // { hero, oldLevel, newLevel, levelsGained }
    HERO_RESPAWNED: 'HERO_RESPAWNED' // { hero }
};

export { Events };
