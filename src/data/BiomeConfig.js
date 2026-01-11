/**
 * Biome Configuration
 * Centralized data for biome-specific props, items, and spawn rules.
 */
const BiomeConfig = {
    // Foliage (Clusters)
    FOLIAGE_MAP: {
        'Dead Woods': ['prop_dead_stump', 'prop_dead_roots'],
        'Mud Flats': ['prop_mud_reeds', 'prop_mud_puddle'],
        'Bone Valley': ['prop_bone_ribs'], // Ribs act as landscape
        'The Ruins': ['prop_ruins_slab'],
        'Scrap Yard': ['prop_scrap_tire'], // Tires as "industrial foliage"
        'Iron Ridge': ['prop_iron_pipe']   // Pipes as "industrial foliage"
    },

    // Items (Scattered)
    ITEM_MAP: {
        'Quarry Fields': ['prop_quarry_crate', 'prop_quarry_drill'],
        'Iron Ridge': ['prop_iron_gear'],
        'Crossroads': ['prop_cross_sign', 'prop_cross_post'],
        'Scrap Yard': ['prop_scrap_cog'],
        'Bone Valley': ['prop_bone_skull'], // Skulls are items
        'The Ruins': ['prop_ruins_pillar']
    },

    // Merchant Spawning Configuration
    MERCHANT: {
        PADDING: 70, // Distance from wall/bridge edges
        DEFAULT_OFFSET: 60
    },

    // Prop Spawning Configuration
    PROPS: {
        // Universal Rules
        MIN_DIST: 80, // Minimum distance between any props
        BRIDGE_VISUAL_PADDING: 100, // Exclusion zone around bridges

        // Foliage Clusters
        CLUSTERS: {
            COUNT_MIN: 4,
            COUNT_RND: 3,
            PROPS_PER_CLUSTER_MIN: 3,
            PROPS_PER_CLUSTER_RND: 3,
            RADIUS: 120
        },

        // Scattered Items
        ITEMS: {
            COUNT_MIN: 2,
            COUNT_RND: 3,
            MIN_DIST_MULTIPLIER: 1.5 // Items need more breathing room
        }
    },

    // ============================================
    // OPEN WORLD BIOMES (Enemy Territory)
    // ============================================

    /**
     * Open world biome types extending organically from the zone grid.
     * Players can freely travel to any biome at their own risk.
     */
    types: {
        grasslands: {
            id: 'grasslands',
            name: 'The Grasslands',
            description: 'Rolling plains teeming with feral beasts.',
            difficulty: 1,
            levelRange: { min: 1, max: 10 },
            visualTheme: {
                groundColor: '#4A7C3F',
                ambientColor: '#E8F5E9',
                fogDensity: 0.1
            },
            enemySpawnTable: [
                { enemyId: 'feral_raptor', weight: 60, groupSize: { min: 2, max: 4 } },
                { enemyId: 'feral_soldier', weight: 40, groupSize: { min: 1, max: 2 } }
            ],
            bossId: 'grasslands_alpha',
            bossRespawnTime: 300 // 5 minutes
        },
        tundra: {
            id: 'tundra',
            name: 'The Frozen Wastes',
            description: 'Bitter cold and hardened survivors.',
            difficulty: 2,
            levelRange: { min: 10, max: 20 },
            visualTheme: {
                groundColor: '#B0C4DE',
                ambientColor: '#E0FFFF',
                fogDensity: 0.25
            },
            enemySpawnTable: [
                { enemyId: 'frost_raptor', weight: 40, groupSize: { min: 2, max: 3 } },
                { enemyId: 'frost_trooper', weight: 35, groupSize: { min: 2, max: 4 } },
                { enemyId: 'mammoth_rider', weight: 25, groupSize: { min: 1, max: 1 } }
            ],
            bossId: 'tundra_warlord',
            bossRespawnTime: 360 // 6 minutes
        },
        desert: {
            id: 'desert',
            name: 'The Scorched Sands',
            description: 'Where only the strongest survive the heat.',
            difficulty: 3,
            levelRange: { min: 20, max: 30 },
            visualTheme: {
                groundColor: '#D2B48C',
                ambientColor: '#FFF8DC',
                fogDensity: 0.05
            },
            enemySpawnTable: [
                { enemyId: 'sand_stalker', weight: 35, groupSize: { min: 1, max: 3 } },
                { enemyId: 'dune_marauder', weight: 40, groupSize: { min: 2, max: 5 } },
                { enemyId: 'sand_wyrm', weight: 25, groupSize: { min: 1, max: 1 } }
            ],
            bossId: 'desert_overlord',
            bossRespawnTime: 420 // 7 minutes
        },
        lava_crags: {
            id: 'lava_crags',
            name: 'The Burning Crags',
            description: 'Volcanic hellscape of ash and flame.',
            difficulty: 4,
            levelRange: { min: 30, max: 40 },
            visualTheme: {
                groundColor: '#2F2F2F',
                ambientColor: '#FF4500',
                fogDensity: 0.3
            },
            enemySpawnTable: [
                { enemyId: 'fire_raptor', weight: 30, groupSize: { min: 2, max: 4 } },
                { enemyId: 'magma_knight', weight: 35, groupSize: { min: 1, max: 3 } },
                { enemyId: 'volcanic_titan', weight: 20, groupSize: { min: 1, max: 1 } },
                { enemyId: 'ember_hound', weight: 15, groupSize: { min: 3, max: 6 } }
            ],
            bossId: 'lava_tyrant',
            bossRespawnTime: 480 // 8 minutes
        }
    },

    /**
     * Difficulty multipliers for enemy stats based on biome difficulty tier.
     * Applied to base enemy stats at spawn time.
     */
    difficultyMultipliers: {
        1: { health: 1.0, damage: 1.0, xp: 1.0, loot: 1.0 },
        2: { health: 1.5, damage: 1.3, xp: 1.5, loot: 1.25 },
        3: { health: 2.0, damage: 1.6, xp: 2.0, loot: 1.5 },
        4: { health: 3.0, damage: 2.0, xp: 3.0, loot: 2.0 }
    },

    /**
     * Elite enemy variant multipliers (rare spawns).
     * Applied on top of difficulty multipliers.
     */
    eliteMultipliers: {
        stats: 2.0,   // 2x health/damage
        loot: 3.0,    // 3x loot drops
        xp: 2.5       // 2.5x experience
    },

    /**
     * Default patrol and aggro behavior settings.
     * Can be overridden per-biome or per-enemy type.
     */
    patrolDefaults: {
        areaRadius: 300,      // Enemies wander within this radius from spawn
        leashDistance: 500,   // Stop chasing player beyond this distance
        aggroRange: 200,      // Detection range for player
        packAggroRadius: 150  // Range at which pack members join aggro
    },

    /**
     * Transition zone configuration where biomes blend together.
     */
    transitionZones: {
        blendWidth: 200,      // Width of gradient border between biomes
        mixedSpawnChance: 0.3 // Chance to spawn enemy from adjacent biome
    }
};

window.BiomeConfig = BiomeConfig;
