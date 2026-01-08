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
    }
};

window.BiomeConfig = BiomeConfig;
