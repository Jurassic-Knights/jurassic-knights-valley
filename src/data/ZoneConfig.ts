/**
 * ZoneConfig - Definition of Paintable Zones
 * 
 * Zones are regional overlays used by the Map Editor to drive
 * procedural generation and gameplay logic.
 */

import { BiomeConfig } from './BiomeConfig';

export enum ZoneCategory {
    BIOME = 'biome',
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
    const c = (hash & 0x00FFFFFF)
        .toString(16)
        .toUpperCase();
    return parseInt('00000'.substring(0, 6 - c.length) + c, 16);
}

// Biome mappings (Synched with BiomeConfig)
const biomeZones: Record<string, ZoneDefinition> = Object.values(BiomeConfig.types).reduce((acc, biome) => {
    // Convert theme hex string to number
    const colorStr = biome.visualTheme.groundColor.replace('#', '0x');
    const color = parseInt(colorStr, 16) || 0x00FF00;

    acc[biome.id] = {
        id: biome.id,
        category: ZoneCategory.BIOME,
        name: biome.name,
        color: color,
        description: biome.description
    };
    return acc;
}, {} as Record<string, ZoneDefinition>);


export const ZoneConfig: Record<string, ZoneDefinition> = {
    ...biomeZones,

    // --- CIVILIZATION ZONES (WW1 Theme) ---
    'civ_outpost': { id: 'civ_outpost', category: ZoneCategory.CIVILIZATION, name: 'Outpost (Safe-ish)', color: 0x3498DB }, // Blue
    'civ_trench': { id: 'civ_trench', category: ZoneCategory.CIVILIZATION, name: 'Trench Line', color: 0x7F8C8D }, // Grey
    'civ_noman': { id: 'civ_noman', category: ZoneCategory.CIVILIZATION, name: 'No Man\'s Land', color: 0x2C3E50 }, // Dark Grey
    'civ_ruins': { id: 'civ_ruins', category: ZoneCategory.CIVILIZATION, name: 'Ruins', color: 0x8E44AD }, // Purple
    'civ_supply': { id: 'civ_supply', category: ZoneCategory.CIVILIZATION, name: 'Supply Depot', color: 0xE67E22 }, // Orange

    // --- ENCOUNTER ZONES ---
    'enc_safe': { id: 'enc_safe', category: ZoneCategory.ENCOUNTER, name: 'Safe Zone (No Spawn)', color: 0x2ECC71 },
    'enc_boss': { id: 'enc_boss', category: ZoneCategory.ENCOUNTER, name: 'Boss Arena', color: 0xE74C3C },
    'enc_elite': { id: 'enc_elite', category: ZoneCategory.ENCOUNTER, name: 'High Danger Level', color: 0xC0392B },

    // --- WEATHER ZONES (Atmospheric) ---
    'weather_clear': { id: 'weather_clear', category: ZoneCategory.WEATHER, name: 'Forced Clear', color: 0xF1C40F }, // Sun Yellow
    'weather_fog': { id: 'weather_fog', category: ZoneCategory.WEATHER, name: 'Mustard Fog (Hazard)', color: 0xD4AC0D }, // Mustard Yellow
    'weather_smog': { id: 'weather_smog', category: ZoneCategory.WEATHER, name: 'Artillery Smog', color: 0x5D6D7E }, // Smog Grey
    'weather_rain': { id: 'weather_rain', category: ZoneCategory.WEATHER, name: 'Acid Rain', color: 0x1ABC9C }, // Acid Green
    'weather_storm': { id: 'weather_storm', category: ZoneCategory.WEATHER, name: 'Heavy Storm', color: 0x1F618D }, // Dark Blue

    // --- TACTICAL ZONES ---
    'tac_extraction': { id: 'tac_extraction', category: ZoneCategory.TACTICAL, name: 'Extraction Zone', color: 0x27AE60 }, // Green
    'tac_killbox': { id: 'tac_killbox', category: ZoneCategory.TACTICAL, name: 'Artillery Killbox', color: 0xC0392B }, // Red
    'tac_nobuild': { id: 'tac_nobuild', category: ZoneCategory.TACTICAL, name: 'No Build Zone', color: 0x95A5A6 }, // Concrete
};

export const ZoneCategories = Object.values(ZoneCategory);
