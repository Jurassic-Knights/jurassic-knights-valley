/* eslint-disable max-lines */
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
    midId: string; // weight 0.5: base→mid→overlay (3-layer blend)
    overlayId: string;
    noiseId: string;
}

// --- DEFAULTS ---
export const GroundPalette: Record<string, GroundPaletteEntry> = {
    default: {
        baseId: 'ground_base_grass_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },

    // --- BIOMES ---
    // 3-layer: grass (0) → sand (0.5) → mud (1) for water/coast; weight alone drives visual
    biome_grasslands: {
        baseId: 'ground_base_grass_grasslands_01',
        midId: 'ground_base_sand_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_tundra: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_badlands: {
        baseId: 'ground_base_cracked_earth_badlands_01',
        midId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    biome_desert: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_swamp: {
        baseId: 'ground_base_mud_churned_grasslands_01',
        midId: 'ground_overgrown_moss_grasslands_01',
        overlayId: 'ground_overgrown_moss_grasslands_01',
        noiseId: 'ground_base_dirt_grasslands_03'
    },
    // --- BIOME + CIV (terrain_coast / terrain_water no longer have overrides; weight drives 3-layer blend) ---

    biome_grasslands_civ_trench: {
        baseId: 'ground_damage_churned_grasslands_01',
        midId: 'ground_interior_planks_grasslands_01',
        overlayId: 'ground_interior_planks_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_civ_outpost: {
        baseId: 'ground_base_grass_grasslands_02',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_civ_town: {
        baseId: 'ground_base_dirt_grasslands_01',
        midId: 'ground_base_gravel_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_civ_bridge: {
        baseId: 'ground_interior_planks_grasslands_01',
        midId: 'ground_base_gravel_grasslands_01',
        overlayId: 'ground_interior_planks_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },

    default_civ_trench: {
        baseId: 'ground_damage_churned_grasslands_01',
        midId: 'ground_interior_planks_grasslands_01',
        overlayId: 'ground_interior_planks_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    default_civ_outpost: {
        baseId: 'ground_base_grass_grasslands_02',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    default_civ_town: {
        baseId: 'ground_base_dirt_grasslands_01',
        midId: 'ground_base_gravel_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    default_civ_bridge: {
        baseId: 'ground_interior_planks_grasslands_01',
        midId: 'ground_base_gravel_grasslands_01',
        overlayId: 'ground_interior_planks_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },

    // --- TUNDRA terrain (deep_water / water / coast) ---
    biome_tundra_terrain_deep_water: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_water: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_coast: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },

    // --- DESERT terrain (deep_water / water / coast) ---
    biome_desert_terrain_deep_water: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_water: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_coast: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },

    // --- TUNDRA / DESERT civ (fallbacks for roads and towns) ---
    biome_tundra_civ_trench: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_civ_outpost: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_desert_civ_trench: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_civ_outpost: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },

    // --- WATER (deep < water) ---
    biome_grasslands_terrain_deep_water: {
        baseId: 'ground_base_sand_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_base_dirt_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    // --- DIRTBANK (elevation 0..0.1) ---
    biome_grasslands_terrain_dirtbank: {
        baseId: 'ground_base_dirt_grasslands_01',
        midId: 'ground_base_gravel_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_tundra_terrain_dirtbank: {
        baseId: 'ground_base_dirt_grasslands_01',
        midId: 'ground_base_gravel_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_desert_terrain_dirtbank: {
        baseId: 'ground_base_dirt_grasslands_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_badlands_terrain_dirtbank: {
        baseId: 'ground_base_cracked_earth_badlands_01',
        midId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    // --- ELEVATION TERRAIN (mapgen4 lowland / land / highland / hill / midmountain / mountain) ---
    biome_grasslands_terrain_lowland: {
        baseId: 'ground_base_grass_grasslands_01',
        midId: 'ground_base_sand_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_terrain_land: {
        baseId: 'ground_base_grass_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_terrain_highland: {
        baseId: 'ground_base_grass_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_terrain_hill: {
        baseId: 'ground_base_grass_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_terrain_midmountain: {
        baseId: 'ground_base_gravel_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_grasslands_terrain_mountain: {
        baseId: 'ground_base_gravel_grasslands_01',
        midId: 'ground_base_dirt_grasslands_01',
        overlayId: 'ground_damage_churned_grasslands_01',
        noiseId: 'ground_base_gravel_grasslands_01'
    },
    biome_tundra_terrain_lowland: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_land: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_highland: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_hill: {
        baseId: 'ground_base_snow_tundra_01',
        midId: 'ground_base_rock_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_midmountain: {
        baseId: 'ground_base_rock_tundra_01',
        midId: 'ground_base_gravel_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_tundra_terrain_mountain: {
        baseId: 'ground_base_rock_tundra_01',
        midId: 'ground_base_gravel_tundra_01',
        overlayId: 'ground_base_rock_tundra_01',
        noiseId: 'ground_base_gravel_tundra_01'
    },
    biome_desert_terrain_lowland: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_land: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_highland: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_hill: {
        baseId: 'ground_base_sand_desert_01',
        midId: 'ground_base_rock_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_midmountain: {
        baseId: 'ground_base_rock_desert_01',
        midId: 'ground_base_gravel_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_desert_terrain_mountain: {
        baseId: 'ground_base_rock_desert_01',
        midId: 'ground_base_gravel_desert_01',
        overlayId: 'ground_base_rock_desert_01',
        noiseId: 'ground_base_gravel_desert_01'
    },
    biome_badlands_terrain_lowland: {
        baseId: 'ground_base_cracked_earth_badlands_01',
        midId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    biome_badlands_terrain_land: {
        baseId: 'ground_base_cracked_earth_badlands_01',
        midId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    biome_badlands_terrain_highland: {
        baseId: 'ground_base_cracked_earth_badlands_01',
        midId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    biome_badlands_terrain_hill: {
        baseId: 'ground_base_cracked_earth_badlands_01',
        midId: 'ground_base_rock_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    biome_badlands_terrain_midmountain: {
        baseId: 'ground_base_rock_badlands_01',
        midId: 'ground_base_gravel_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    },
    biome_badlands_terrain_mountain: {
        baseId: 'ground_base_rock_badlands_01',
        midId: 'ground_base_gravel_badlands_01',
        overlayId: 'ground_base_rock_badlands_01',
        noiseId: 'ground_base_gravel_badlands_01'
    }
};
