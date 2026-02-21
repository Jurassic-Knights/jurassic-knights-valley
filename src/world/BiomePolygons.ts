/**
 * BiomePolygons - Polygon definitions for world biomes
 */

import type { BiomeDef } from '../types/world';

export const BIOME_POLYGONS: Record<string, BiomeDef> = {
    ironhaven: {
        id: 'ironhaven',
        name: 'Ironhaven',
        description: 'The central fortress city with floating islands',
        color: '#8B4513',
        tier: 0,
        polygon: [
            { x: 10500, y: 10200 },
            { x: 19200, y: 10000 },
            { x: 19800, y: 11000 },
            { x: 20000, y: 15000 },
            { x: 19500, y: 19000 },
            { x: 19000, y: 19800 },
            { x: 15000, y: 20200 },
            { x: 11000, y: 19800 },
            { x: 10200, y: 19000 },
            { x: 10000, y: 15000 },
            { x: 10200, y: 11000 }
        ]
    },
    grasslands: {
        id: 'grasslands',
        name: 'Grasslands',
        description: 'Lush green plains with docile herbivores',
        color: '#4CAF50',
        tier: 1,
        polygon: [
            { x: 500, y: 8000 },
            { x: 3000, y: 7500 },
            { x: 6000, y: 9000 },
            { x: 8000, y: 10000 },
            { x: 10000, y: 11000 },
            { x: 10200, y: 15000 },
            { x: 10000, y: 19000 },
            { x: 8000, y: 20500 },
            { x: 4000, y: 21000 },
            { x: 1500, y: 20000 },
            { x: 500, y: 17000 },
            { x: 1000, y: 13000 }
        ]
    },
    tundra: {
        id: 'tundra',
        name: 'Tundra',
        description: 'Frozen wasteland with Frost Raptors',
        color: '#B3E5FC',
        tier: 3,
        polygon: [
            { x: 20000, y: 11000 },
            { x: 22000, y: 9000 },
            { x: 25000, y: 8500 },
            { x: 28000, y: 10000 },
            { x: 29500, y: 14000 },
            { x: 29000, y: 18000 },
            { x: 27000, y: 22000 },
            { x: 24000, y: 24000 },
            { x: 21000, y: 23000 },
            { x: 19500, y: 20000 },
            { x: 20000, y: 16000 }
        ]
    },
    badlands: {
        id: 'badlands',
        name: 'Badlands',
        description: 'Volcanic region with lava flows and aggressive predators',
        color: '#BF360C',
        tier: 4,
        polygon: [
            { x: 4000, y: 500 },
            { x: 10000, y: 1000 },
            { x: 15000, y: 500 },
            { x: 20000, y: 1500 },
            { x: 24000, y: 3000 },
            { x: 25000, y: 6000 },
            { x: 23000, y: 8000 },
            { x: 20000, y: 10000 },
            { x: 15000, y: 10200 },
            { x: 10000, y: 10000 },
            { x: 6000, y: 9000 },
            { x: 3000, y: 6000 },
            { x: 2000, y: 3000 }
        ]
    },
    desert: {
        id: 'desert',
        name: 'Desert',
        description: 'Arid sands with Desert Stalkers and Saurians',
        color: '#FFB74D',
        tier: 2,
        polygon: [
            { x: 500, y: 21000 },
            { x: 4000, y: 21500 },
            { x: 8000, y: 21000 },
            { x: 11000, y: 20000 },
            { x: 14000, y: 21000 },
            { x: 16000, y: 23000 },
            { x: 15000, y: 26000 },
            { x: 12000, y: 28000 },
            { x: 8000, y: 29000 },
            { x: 4000, y: 28500 },
            { x: 1500, y: 27000 },
            { x: 500, y: 24000 }
        ]
    }
};
