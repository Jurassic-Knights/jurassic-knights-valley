/**
 * Rock Definitions
 * Rock types, durability, and drop tables
 * 
 * Owner: Gameplay Designer
 */

const RocksData = {
    stone: {
        id: 'stone',
        name: 'Stone',
        durability: 3,
        drops: [
            { itemId: 'item_stone', chance: 1, min: 1, max: 2 }
        ]
    },

    copper_ore: {
        id: 'copper_ore',
        name: 'Copper Ore',
        durability: 4,
        minDepth: 1,
        drops: [
            { itemId: 'item_copper_ore', chance: 1, min: 1, max: 1 },
            { itemId: 'item_stone', chance: 0.5, min: 1, max: 1 }
        ]
    },

    iron_ore: {
        id: 'iron_ore',
        name: 'Iron Ore',
        durability: 6,
        minDepth: 3,
        drops: [
            { itemId: 'item_iron_ore', chance: 1, min: 1, max: 1 },
            { itemId: 'item_stone', chance: 0.3, min: 1, max: 1 }
        ]
    },

    gold_ore: {
        id: 'gold_ore',
        name: 'Gold Ore',
        durability: 8,
        minDepth: 5,
        drops: [
            { itemId: 'item_gold_ore', chance: 1, min: 1, max: 1 }
        ]
    }
};

window.RocksData = RocksData;
