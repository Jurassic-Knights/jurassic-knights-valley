/**
 * PropConfig - Prop Spawning and Decoration Configuration
 *
 * Separated from BiomeConfig for single responsibility.
 * Contains foliage, item, and prop spawning rules.
 */

const PropConfig = {
    // Foliage (Clusters)
    FOLIAGE_MAP: {
        'Dead Woods': ['prop_dead_stump', 'prop_dead_roots'],
        'Mud Flats': ['prop_mud_reeds', 'prop_mud_puddle'],
        'Bone Valley': ['prop_bone_ribs'],
        'The Ruins': ['prop_ruins_slab'],
        'Scrap Yard': ['prop_scrap_tire'],
        'Iron Ridge': ['prop_iron_pipe']
    },

    // Items (Scattered)
    ITEM_MAP: {
        'Quarry Fields': ['prop_quarry_crate', 'prop_quarry_drill'],
        'Iron Ridge': ['prop_iron_gear'],
        Crossroads: ['prop_cross_sign', 'prop_cross_post'],
        'Scrap Yard': ['prop_scrap_cog'],
        'Bone Valley': ['prop_bone_skull'],
        'The Ruins': ['prop_ruins_pillar']
    },

    // Merchant Spawning Configuration
    MERCHANT: {
        PADDING: 70,
        DEFAULT_OFFSET: 60
    },

    // Prop Spawning Rules
    SPAWN: {
        MIN_DIST: 80,
        BRIDGE_VISUAL_PADDING: 100,

        CLUSTERS: {
            COUNT_MIN: 4,
            COUNT_RND: 3,
            PROPS_PER_CLUSTER_MIN: 3,
            PROPS_PER_CLUSTER_RND: 3,
            RADIUS: 120
        },

        ITEMS: {
            COUNT_MIN: 2,
            COUNT_RND: 3,
            MIN_DIST_MULTIPLIER: 1.5
        }
    }
};

window.PropConfig = PropConfig;

// ES6 Module Export
export { PropConfig };
