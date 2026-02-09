
/**
 * ZonePalette
 * 
 * Defines the texture sets used for Ground Blending in different zones.
 * Each entry maps a Zone ID to a set of 3 textures:
 * - Base: The dominant ground texture (Weight = 0)
 * - Overlay: The painted texture (Weight = 255)
 * - Noise: The detail texture used for the height-lerp transition
 */

export interface GroundPaletteEntry {
    baseId: string;
    overlayId: string;
    noiseId: string;
}

// --- DEFAULTS ---
export const GroundPalette: Record<string, GroundPaletteEntry> = {
    'default': {
        baseId: 'ground_base_grass_grasslands_01',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },

    // --- BIOMES ---
    'biome_grasslands': {
        baseId: 'ground_base_grass_grasslands_01',
        overlayId: 'ground_base_dirt_grasslands_02',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    'biome_tundra': {
        baseId: 'ground_base_snow_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    'biome_badlands': {
        baseId: 'ground_base_cracked_earth_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    'biome_desert': {
        baseId: 'ground_base_sand_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    'biome_swamp': {
        baseId: 'ground_base_mud_churned_grasslands_01', // Fallback to grasslands mud if swamp specific missing
        overlayId: 'ground_overgrown_moss_grasslands_01',
        noiseId: 'ground_base_dirt_grasslands_03'
    },
    // --- BIOME SPECIFIC OVERRIDES ---

    // -- Grasslands --
    'biome_grasslands_terrain_water': {
        baseId: 'ground_base_sand_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    'biome_grasslands_terrain_coast': {
        baseId: 'ground_base_grass_grasslands_01',
        overlayId: 'ground_base_sand_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    'biome_grasslands_civ_trench': {
        baseId: 'ground_damage_churned_grasslands_01',
        overlayId: 'ground_interior_planks_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    'biome_grasslands_civ_outpost': {
        baseId: 'ground_base_grass_grasslands_02',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },

    // -- Default Fallbacks (For Civ only, Terrain requires Biome) --
    'default_civ_trench': {
        baseId: 'ground_damage_churned_grasslands_01',
        overlayId: 'ground_interior_planks_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    'default_civ_outpost': {
        baseId: 'ground_base_grass_grasslands_02',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },

    // -- Badlands --
    'biome_badlands_terrain_water': {
        baseId: 'ground_base_sand_desert_01',
        overlayId: 'ground_base_cracked_earth_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    'biome_badlands_terrain_coast': {
        baseId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_sand_desert_01',
        noiseId: 'ground_base_gravel_badlands_01'
    }
};
