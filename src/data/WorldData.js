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

    // Primary Node Types per Zone
    // Uses actual node entity IDs from src/entities/nodes/
    // Only uses nodes with existing images in assets/images/nodes/
    Resources: [
        ['node_woodcutting_t1_01', 'node_mining_t2_03', 'node_mining_t1_02'], // Row 0: Home=DeadTree, Quarry=Coal, IronRidge=Stone
        ['node_woodcutting_t2_01', 'node_mining_t2_04', 'node_harvesting_t2_03'], // Row 1: DeadWoods=AshTree, Crossroads=SaltFlat, ScrapYard=Cactus
        ['node_harvesting_t2_04', 'node_mining_t3_03', 'node_mining_t3_02'] // Row 2: MudFlats=DesertRemains, BoneValley=SandyDeposit, Ruins=BadlandsOutcrop
    ],

    // Default Drops for Dinosaurs in this Zone
    // Uses entity IDs from src/entities/resources/
    DinoDrops: [
        ['food_t1_01', 'food_t1_01', 'food_t1_01'], // Row 0 (Fallbacks)
        ['food_t1_01', 'minerals_t2_01', 'minerals_t2_01'], // Row 1 (Dead Woods = Food)
        ['minerals_t2_01', 'minerals_t2_01', 'minerals_t2_01'] // Row 2
    ]
};

// Export
window.WorldData = WorldData;

// ES6 Module Export
export { WorldData };
