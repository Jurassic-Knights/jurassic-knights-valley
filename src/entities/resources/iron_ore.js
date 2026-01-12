/**
 * Iron Ore - Resource
 * 
 * Metal deposit for crafting weapons and armor.
 */

const IronOre = {
    ...window.BaseResource,

    id: 'iron_ore',
    name: 'Iron Deposit',
    description: 'Raw ore pulled from muddy trenches.',

    // Stats
    health: 60,
    maxHealth: 60,

    // Gathering
    respawnTime: 45,
    rarity: 'uncommon',

    // Spawning
    spawnBiomes: ['iron_ridge', 'quarry_fields'],

    // Visual
    sprite: 'resource_iron_ore',
    color: '#8B4513',

    // Audio/VFX
    sfxSuffix: 'metal',
    vfxType: 'sparks',

    // Drops
    dropItem: 'iron_ore',
    dropAmount: 1
};

window.EntityRegistry.resources = window.EntityRegistry.resources || {};
window.EntityRegistry.resources.iron_ore = IronOre;
