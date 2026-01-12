/**
 * BaseResource - Default configuration for gatherable resources
 * 
 * Resources are static objects that can be harvested.
 * Examples: ore veins, trees, scrap piles.
 */

const BaseResource = {
    entityType: 'Resource',

    // Size
    gridSize: 1,
    width: 128,
    height: 128,

    // Stats
    health: 30,
    maxHealth: 30,

    // Gathering
    gatherTime: 1,
    gatherAmount: 1,
    interactRadius: 130,

    // Spawning
    respawnTime: 30,
    spawnBiomes: [],

    // Visual
    sprite: 'resource_base',
    rarity: 'common',
    color: '#7A7A7A',

    // Audio
    sfx: {
        gather: 'sfx_resource_gather',
        destroy: 'sfx_resource_destroy'
    },
    sfxSuffix: 'metal',

    // VFX
    vfx: {
        gather: 'vfx_sparks',
        destroy: 'vfx_debris'
    },
    vfxType: 'sparks',

    // Drops
    dropItem: null,
    dropAmount: 1
};

window.BaseResource = BaseResource;
