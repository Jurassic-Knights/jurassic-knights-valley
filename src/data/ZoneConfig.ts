/**
 * ZoneConfig - Definition of Paintable Zones
 *
 * Zones are regional overlays used by the Map Editor to drive
 * procedural generation and gameplay logic.
 */

import { BiomeConfig } from './BiomeConfig';

export enum ZoneCategory {
    BIOME = 'biome',
    TERRAIN = 'terrain', // New: Water, Coast, Cliffs
    CIVILIZATION = 'civilization', // New: Outposts, Trenches, Ruins
    ENCOUNTER = 'encounter', // Danger levels
    WEATHER = 'weather', // Atmospheric overrides
    TACTICAL = 'tactical' // Gameplay modifiers (Extraction, No Build)
}

export interface ZoneDefinition {
    id: string;
    category: ZoneCategory;
    name: string; // Display Name in Editor
    color: number; // Hex Color for Editor Overlay (0xRRGGBB)
    description?: string;
}

// Helper to generate color from string hash (for consistent auto-colors)
function stringToColor(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return parseInt('00000'.substring(0, 6 - c.length) + c, 16);
}

// Biome mappings (Synched with BiomeConfig)
const biomeZones: Record<string, ZoneDefinition> = Object.values(BiomeConfig.types).reduce(
    (acc, biome) => {
        // Convert theme hex string to number
        const colorStr = biome.visualTheme.groundColor.replace('#', '0x');
        const color = parseInt(colorStr, 16) || 0x00ff00;

        acc[biome.id] = {
            id: biome.id,
            category: ZoneCategory.BIOME,
            name: biome.name,
            color: color,
            description: biome.description
        };
        return acc;
    },
    {} as Record<string, ZoneDefinition>
);

export const ZoneConfig: Record<string, ZoneDefinition> = {
    ...biomeZones,
    // --- TERRAIN ZONES (Overrides Biomes) ---
    terrain_deep_water: {
        id: 'terrain_deep_water',
        category: ZoneCategory.TERRAIN,
        name: 'Deep Water',
        color: 0x1a5276
    }, // Dark blue (lowest)
    terrain_water: {
        id: 'terrain_water',
        category: ZoneCategory.TERRAIN,
        name: 'Water',
        color: 0x2980b9
    }, // Blue
    terrain_coast: {
        id: 'terrain_coast',
        category: ZoneCategory.TERRAIN,
        name: 'Coastal Grass',
        color: 0xf39c12
    }, // Sand Orange
    terrain_dirtbank: {
        id: 'terrain_dirtbank',
        category: ZoneCategory.TERRAIN,
        name: 'Dirtbank',
        color: 0x8b6914
    }, // Dirt brown
    terrain_river: {
        id: 'terrain_river',
        category: ZoneCategory.TERRAIN,
        name: 'River',
        color: 0x3498db
    }, // River blue (mapgen4)
    terrain_lowland: {
        id: 'terrain_lowland',
        category: ZoneCategory.TERRAIN,
        name: 'Lowland',
        color: 0x7cb342
    }, // Bright green (flat, near sea)
    terrain_land: {
        id: 'terrain_land',
        category: ZoneCategory.TERRAIN,
        name: 'Land',
        color: 0x6b8e23
    }, // Olive green (plains)
    terrain_highland: {
        id: 'terrain_highland',
        category: ZoneCategory.TERRAIN,
        name: 'Highland',
        color: 0x8b9a46
    }, // Yellow-green (elevated plains)
    terrain_hill: {
        id: 'terrain_hill',
        category: ZoneCategory.TERRAIN,
        name: 'Hill',
        color: 0x8b7355
    }, // Brown (rolling hills)
    terrain_midmountain: {
        id: 'terrain_midmountain',
        category: ZoneCategory.TERRAIN,
        name: 'Mid-Mountain',
        color: 0x6d6d6d
    }, // Grey (mid-elevation)
    terrain_mountain: {
        id: 'terrain_mountain',
        category: ZoneCategory.TERRAIN,
        name: 'Mountain',
        color: 0x4a4a4a
    }, // Dark grey (peaks)

    // --- CIVILIZATION ZONES (WW1 Theme) ---
    civ_outpost: {
        id: 'civ_outpost',
        category: ZoneCategory.CIVILIZATION,
        name: 'Outpost (Safe-ish)',
        color: 0x3498db
    }, // Blue
    civ_trench: {
        id: 'civ_trench',
        category: ZoneCategory.CIVILIZATION,
        name: 'Trench Line',
        color: 0x7f8c8d
    }, // Grey
    civ_noman: {
        id: 'civ_noman',
        category: ZoneCategory.CIVILIZATION,
        name: "No Man's Land",
        color: 0x2c3e50
    }, // Dark Grey
    civ_ruins: {
        id: 'civ_ruins',
        category: ZoneCategory.CIVILIZATION,
        name: 'Ruins',
        color: 0x8e44ad
    }, // Purple
    civ_supply: {
        id: 'civ_supply',
        category: ZoneCategory.CIVILIZATION,
        name: 'Supply Depot',
        color: 0xe67e22
    }, // Orange
    civ_town: {
        id: 'civ_town',
        category: ZoneCategory.CIVILIZATION,
        name: 'Town',
        color: 0xcd853f
    }, // Peru/orange-brown (stand out from terrain)
    civ_bridge: {
        id: 'civ_bridge',
        category: ZoneCategory.CIVILIZATION,
        name: 'Bridge',
        color: 0x5d4e37
    }, // Wood/stone bridge (road over river)

    // --- ENCOUNTER ZONES ---
    enc_safe: {
        id: 'enc_safe',
        category: ZoneCategory.ENCOUNTER,
        name: 'Safe Zone (No Spawn)',
        color: 0x2ecc71
    },
    enc_boss: {
        id: 'enc_boss',
        category: ZoneCategory.ENCOUNTER,
        name: 'Boss Arena',
        color: 0xe74c3c
    },
    enc_elite: {
        id: 'enc_elite',
        category: ZoneCategory.ENCOUNTER,
        name: 'High Danger Level',
        color: 0xc0392b
    },

    // --- WEATHER ZONES (Atmospheric) ---
    weather_clear: {
        id: 'weather_clear',
        category: ZoneCategory.WEATHER,
        name: 'Forced Clear',
        color: 0xf1c40f
    }, // Sun Yellow
    weather_fog: {
        id: 'weather_fog',
        category: ZoneCategory.WEATHER,
        name: 'Mustard Fog (Hazard)',
        color: 0xd4ac0d
    }, // Mustard Yellow
    weather_smog: {
        id: 'weather_smog',
        category: ZoneCategory.WEATHER,
        name: 'Artillery Smog',
        color: 0x5d6d7e
    }, // Smog Grey
    weather_ash: {
        id: 'weather_ash',
        category: ZoneCategory.WEATHER,
        name: 'Ash Fall',
        color: 0xc0392b
    }, // Ember Red
    weather_storm: {
        id: 'weather_storm',
        category: ZoneCategory.WEATHER,
        name: 'Heavy Storm',
        color: 0x1f618d
    }, // Dark Blue

    // --- TACTICAL ZONES ---
    tac_extraction: {
        id: 'tac_extraction',
        category: ZoneCategory.TACTICAL,
        name: 'Extraction Zone',
        color: 0x27ae60
    }, // Green
    tac_killbox: {
        id: 'tac_killbox',
        category: ZoneCategory.TACTICAL,
        name: 'Artillery Killbox',
        color: 0xc0392b
    }, // Red
    tac_nobuild: {
        id: 'tac_nobuild',
        category: ZoneCategory.TACTICAL,
        name: 'No Build Zone',
        color: 0x95a5a6
    } // Concrete
};

export const ZoneCategories = Object.values(ZoneCategory);
