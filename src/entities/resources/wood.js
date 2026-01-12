/**
 * Wood - Resource
 * 
 * Common building material from petrified trees.
 */

const Wood = {
    ...window.BaseResource,

    id: 'wood',
    name: 'Petrified Wood',
    description: 'Hardened ancient timber.',

    // Stats
    health: 15,
    maxHealth: 15,

    // Gathering
    respawnTime: 10,
    rarity: 'common',

    // Visual
    sprite: 'resource_wood',
    color: '#5D4037',

    // Audio/VFX
    sfxSuffix: 'wood',
    vfxType: 'wood_chips',

    // Drops
    dropItem: 'wood',
    dropAmount: 1
};

window.EntityRegistry.resources = window.EntityRegistry.resources || {};
window.EntityRegistry.resources.wood = Wood;
