/**
 * Fossil Fuel - Resource
 * 
 * Rare combustible for war machines.
 */

const FossilFuel = {
    ...window.BaseResource,

    id: 'fossil_fuel',
    name: 'Black Tar',
    description: 'Combustible fuel for the war machines.',

    // Stats
    health: 100,
    maxHealth: 100,

    // Gathering
    respawnTime: 90,
    rarity: 'rare',

    // Spawning
    spawnBiomes: ['mud_flats', 'dead_woods'],

    // Visual
    sprite: 'resource_fossil_fuel',
    color: '#2F2F2F',

    // Audio/VFX
    sfxSuffix: 'stone',
    vfxType: 'dust',

    // Drops
    dropItem: 'fossil_fuel',
    dropAmount: 1
};

window.EntityRegistry.resources = window.EntityRegistry.resources || {};
window.EntityRegistry.resources.fossil_fuel = FossilFuel;
