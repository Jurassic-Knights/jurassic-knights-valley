/**
 * LootTableConfig - Loot Drop Definitions
 * 
 * Separated from EntityConfig for single responsibility.
 * Defines what enemies drop when killed.
 */

const LootTableConfig = {
    'common_feral': {
        guaranteedDrops: [],
        randomDrops: [
            { itemId: 'primal_meat', weight: 50, amount: { min: 1, max: 2 } },
            { itemId: 'scrap_metal', weight: 30, amount: { min: 1, max: 1 } },
            { itemId: 'gold', weight: 20, amount: { min: 5, max: 15 } }
        ],
        dropCount: { min: 1, max: 2 }
    },
    'raptor_enemy': {
        guaranteedDrops: [{ itemId: 'primal_meat', amount: 1 }],
        randomDrops: [
            { itemId: 'raptor_claw', weight: 25, amount: { min: 1, max: 1 } },
            { itemId: 'primal_meat', weight: 45, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 30, amount: { min: 10, max: 25 } }
        ],
        dropCount: { min: 1, max: 2 }
    },
    'rex_enemy': {
        guaranteedDrops: [
            { itemId: 'primal_meat', amount: 3 },
            { itemId: 'iron_ore', amount: 2 }
        ],
        randomDrops: [
            { itemId: 'rex_tooth', weight: 15, amount: { min: 1, max: 1 } },
            { itemId: 'fossil_fuel', weight: 45, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 40, amount: { min: 50, max: 100 } }
        ],
        dropCount: { min: 2, max: 3 }
    },
    'spitter_enemy': {
        guaranteedDrops: [{ itemId: 'primal_meat', amount: 1 }],
        randomDrops: [
            { itemId: 'acid_gland', weight: 30, amount: { min: 1, max: 1 } },
            { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 30, amount: { min: 15, max: 35 } }
        ],
        dropCount: { min: 1, max: 2 }
    },
    'soldier_common': {
        guaranteedDrops: [],
        randomDrops: [
            { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 3 } },
            { itemId: 'iron_ore', weight: 30, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 30, amount: { min: 20, max: 40 } }
        ],
        dropCount: { min: 1, max: 2 }
    },
    'soldier_brute': {
        guaranteedDrops: [{ itemId: 'iron_ore', amount: 2 }],
        randomDrops: [
            { itemId: 'scrap_metal', weight: 35, amount: { min: 2, max: 4 } },
            { itemId: 'fossil_fuel', weight: 25, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 40, amount: { min: 40, max: 80 } }
        ],
        dropCount: { min: 2, max: 3 }
    },
    'boss_grasslands': {
        guaranteedDrops: [
            { itemId: 'alpha_fang', amount: 1 },
            { itemId: 'gold', amount: 500 }
        ],
        randomDrops: [
            { itemId: 'rare_hide', weight: 45, amount: { min: 1, max: 2 } },
            { itemId: 'primal_essence', weight: 35, amount: { min: 1, max: 1 } },
            { itemId: 'equipment_crate', weight: 20, amount: { min: 1, max: 1 } }
        ],
        dropCount: { min: 2, max: 3 }
    }
};

window.LootTableConfig = LootTableConfig;
