/**
 * Crop Definitions
 * 
 * Owner: Gameplay Designer (balance values)
 * Owner: Lore Writer (name, description)
 */

const CropsData = {
    // Example crops - to be expanded
    turnip: {
        id: 'turnip',
        name: 'Turnip',
        description: 'A fast-growing root vegetable',
        seasons: ['spring'],
        daysPerStage: 1,
        maxStage: 4,
        harvestItem: 'item_turnip',
        harvestAmount: 1,
        seedCost: 20,
        sellPrice: 35
    },

    potato: {
        id: 'potato',
        name: 'Potato',
        description: 'Hardy and filling',
        seasons: ['spring'],
        daysPerStage: 2,
        maxStage: 4,
        harvestItem: 'item_potato',
        harvestAmount: 1,
        seedCost: 50,
        sellPrice: 80
    }
};

window.CropsData = CropsData;
