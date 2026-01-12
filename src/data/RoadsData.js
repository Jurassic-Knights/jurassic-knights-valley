/**
 * RoadsData - World Road Network Configuration
 * 
 * Extracted from BiomeManager for better separation of concerns.
 * Contains all road definitions, intersections, and routing data.
 * 
 * Tiered System:
 * - Tier 0: Roundabouts (hub centers)
 * - Tier 1: Main Highways (Ironhaven → Biomes)
 * - Tier 2: Ring Roads (Biome ↔ Biome)
 * - Tier 3: Internal Roads (within biomes)
 */

const RoadsData = {
    ROADS: [
        // ========== TIER 0: ROUNDABOUTS ==========
        {
            id: 'roundabout_ironhaven',
            tier: 0,
            name: 'Ironhaven Central',
            points: [
                { x: 15000, y: 10200 },
                { x: 10500, y: 15000 },
                { x: 15000, y: 19500 },
                { x: 19500, y: 15000 }
            ],
            width: 200
        },

        // ========== TIER 1: MAIN HIGHWAYS ==========
        {
            id: 'highway_north',
            tier: 1,
            name: 'North Gate Road',
            points: [
                { x: 15000, y: 10200 },
                { x: 14200, y: 8500 },
                { x: 15800, y: 6800 },
                { x: 15000, y: 5000 }
            ],
            width: 160
        },
        {
            id: 'highway_west',
            tier: 1,
            name: 'West Trade Route',
            points: [
                { x: 10200, y: 15000 },
                { x: 8500, y: 15300 },
                { x: 6500, y: 14800 },
                { x: 5000, y: 15000 }
            ],
            width: 160
        },
        {
            id: 'highway_east',
            tier: 1,
            name: 'East Frontier',
            points: [
                { x: 19800, y: 15000 },
                { x: 21500, y: 14500 },
                { x: 23500, y: 15500 },
                { x: 25000, y: 17000 }
            ],
            width: 160
        },
        {
            id: 'highway_south',
            tier: 1,
            name: 'South Merchant Way',
            points: [
                { x: 15000, y: 19800 },
                { x: 13000, y: 21500 },
                { x: 10000, y: 23000 },
                { x: 8000, y: 25000 }
            ],
            width: 160
        },

        // ========== TIER 2: RING ROADS ==========
        {
            id: 'ring_nw',
            tier: 2,
            name: 'Northern Pass',
            points: [
                { x: 5000, y: 15000 },
                { x: 4500, y: 11000 },
                { x: 8000, y: 7000 },
                { x: 15000, y: 5000 }
            ],
            width: 128
        },
        {
            id: 'ring_ne',
            tier: 2,
            name: 'Eastern Ridge',
            points: [
                { x: 15000, y: 5000 },
                { x: 19000, y: 6000 },
                { x: 23000, y: 10000 },
                { x: 25000, y: 17000 }
            ],
            width: 128
        },
        {
            id: 'ring_sw',
            tier: 2,
            name: 'Southern Trail',
            points: [
                { x: 5000, y: 15000 },
                { x: 4000, y: 18000 },
                { x: 5000, y: 21000 },
                { x: 8000, y: 25000 }
            ],
            width: 128
        },
        {
            id: 'ring_se',
            tier: 2,
            name: 'Desert Crossing',
            points: [
                { x: 8000, y: 25000 },
                { x: 14000, y: 24000 },
                { x: 20000, y: 21000 },
                { x: 25000, y: 17000 }
            ],
            width: 128
        },

        // ========== TIER 3: INTERNAL ROADS ==========
        // Grasslands
        {
            id: 'grass_farm_n',
            tier: 3,
            name: 'Farm Circuit North',
            points: [
                { x: 5000, y: 15000 },
                { x: 3500, y: 13000 },
                { x: 2000, y: 11000 },
                { x: 3000, y: 9000 }
            ],
            width: 96
        },
        {
            id: 'grass_river',
            tier: 3,
            name: 'River Road',
            points: [
                { x: 5000, y: 15000 },
                { x: 6500, y: 17000 },
                { x: 7000, y: 18500 },
                { x: 6000, y: 19500 }
            ],
            width: 96
        },
        // Badlands
        {
            id: 'bad_crater_e',
            tier: 3,
            name: 'Crater Loop East',
            points: [
                { x: 15000, y: 5000 },
                { x: 18000, y: 4000 },
                { x: 20000, y: 3000 },
                { x: 22000, y: 4000 }
            ],
            width: 96
        },
        {
            id: 'bad_lava',
            tier: 3,
            name: 'Lava Fork',
            points: [
                { x: 15000, y: 5000 },
                { x: 13000, y: 3500 },
                { x: 10000, y: 2500 },
                { x: 8000, y: 3000 }
            ],
            width: 96
        },
        // Tundra
        {
            id: 'tundra_glacier',
            tier: 3,
            name: 'Glacier Path',
            points: [
                { x: 25000, y: 17000 },
                { x: 26500, y: 14000 },
                { x: 27500, y: 11000 },
                { x: 28000, y: 9000 }
            ],
            width: 96
        },
        {
            id: 'tundra_wolf',
            tier: 3,
            name: 'Wolf Run',
            points: [
                { x: 25000, y: 17000 },
                { x: 24000, y: 19000 },
                { x: 22000, y: 21000 },
                { x: 21000, y: 22000 }
            ],
            width: 96
        },
        // Desert
        {
            id: 'desert_oasis_n',
            tier: 3,
            name: 'Oasis Circle North',
            points: [
                { x: 8000, y: 25000 },
                { x: 6000, y: 23500 },
                { x: 4000, y: 24000 },
                { x: 2500, y: 25000 }
            ],
            width: 96
        },
        {
            id: 'desert_dune',
            tier: 3,
            name: 'Dune Shortcut',
            points: [
                { x: 8000, y: 25000 },
                { x: 10000, y: 26500 },
                { x: 12000, y: 27500 },
                { x: 14000, y: 27000 }
            ],
            width: 96
        }
    ],

    ROAD_SPEED_MULTIPLIER: 1.3,

    // Hub Coordinates
    HUBS: {
        ironhaven_central: { x: 15000, y: 15000 },
        four_winds: { x: 5000, y: 15000 },
        ash_crossing: { x: 15000, y: 5000 },
        frost_gate: { x: 25000, y: 17000 },
        caravan_rest: { x: 8000, y: 25000 }
    }
};

window.RoadsData = RoadsData;
