/**
 * WorldData - Static configuration for the game world
 * 
 * Contains island names, biomes, and resource distribution.
 * Decoupled from IslandManager logic.
 */
const WorldData = {
    // 3x3 Grid of Island Names
    Names: [
        ['Home Outpost', 'Quarry Fields', 'Iron Ridge'],
        ['Dead Woods', 'Crossroads', 'Scrap Yard'],
        ['Mud Flats', 'Bone Valley', 'The Ruins']
    ],

    // Zone categories
    // 'home': Safe zone, no enemies
    // 'resource': grid resource spawns, fewer enemies
    // 'dinosaur': random AI spawns, dangerous
    Categories: [
        ['home', 'resource', 'resource'],
        ['dinosaur', 'resource', 'resource'],
        ['dinosaur', 'dinosaur', 'dinosaur']
    ],

    // Primary Resource Types per Zone
    // Used by SpawnManager to determine what resources to spawn
    Resources: [
        ['wood', 'iron_ore', 'scrap_metal'],           // Row 0
        ['fossil_fuel', 'scrap_metal', 'scrap_metal'], // Row 1
        ['fossil_fuel', 'fossil_fuel', 'fossil_fuel']  // Row 2
    ],

    // Default Drops for Dinosaurs in this Zone
    DinoDrops: [
        ['primal_meat', 'primal_meat', 'primal_meat'],     // Row 0 (Fallbacks)
        ['primal_meat', 'fossil_fuel', 'fossil_fuel'],     // Row 1 (Dead Woods = Meat)
        ['fossil_fuel', 'fossil_fuel', 'fossil_fuel']      // Row 2
    ]
};

// Export
window.WorldData = WorldData;
