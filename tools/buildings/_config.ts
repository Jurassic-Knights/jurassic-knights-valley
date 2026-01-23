/**
 * _config - Auto-generated from JSON
 */

export const config = {
    "version": "1.0",
    "lastUpdated": "2026-01-11",
    "description": "Buildings configuration - player structures and world buildings",
    "defaults": {
        "statusWorkflow": [
            "pending",
            "approved",
            "declined",
            "clean",
            "missing"
        ],
        "vfx": {
            "construction": "vfx_building_construct",
            "destruction": "vfx_building_destroy",
            "ambient": "vfx_building_ambient"
        },
        "sfx": {
            "construction": "sfx_building_construct",
            "destruction": "sfx_building_destroy",
            "ambient": "sfx_building_ambient"
        }
    },
    "categories": {
        "military": "Bunkers, watchtowers, barracks, defensive structures",
        "industrial": "Forges, workshops, refineries, production buildings",
        "residential": "Tents, cabins, outposts, shelter structures",
        "decorative": "Monuments, flags, signage, aesthetic elements"
    }
};

export default config;
