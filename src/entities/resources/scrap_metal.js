/**
 * Scrap Metal - Resource
 * 
 * Common salvage material from battlefields.
 */

const ScrapMetal = {
    ...window.BaseResource,

    id: 'scrap_metal',
    name: 'Salvaged Scrap',
    description: 'Recovered metal from the ruined front.',

    // Stats
    health: 20,
    maxHealth: 20,

    // Gathering
    respawnTime: 15,
    rarity: 'common',

    // Spawning
    spawnBiomes: ['scrap_yard', 'home'],

    // Visual
    sprite: 'resource_scrap_metal',
    color: '#7A7A7A',

    // Audio/VFX
    sfxSuffix: 'metal',
    vfxType: 'sparks',

    // Drops
    dropItem: 'scrap_metal',
    dropAmount: 1
};

window.EntityRegistry.resources = window.EntityRegistry.resources || {};
window.EntityRegistry.resources.scrap_metal = ScrapMetal;
