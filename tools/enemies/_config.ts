/**
 * _config - Auto-generated from JSON
 */

export const config = {
    "version": "2.0",
    "lastUpdated": "2026-01-11",
    "description": "Enemy entities - dinosaurs, saurians, and hostile humans with loot tables",
    "statusWorkflow": [
        "pending",
        "approved",
        "declined",
        "clean",
        "missing"
    ],
    "categories": {
        "dinosaur": "Natural prehistoric creatures",
        "saurian": "Intelligent reptilian humanoids",
        "human": "Hostile human factions",
        "herbivore": "Non-hostile prehistoric creatures"
    },
    "tiers": {
        "t1": {
            "name": "Grasslands",
            "biomes": [
                "grasslands",
                "home",
                "quarry_fields",
                "iron_ridge"
            ],
            "description": "Early game - basic enemies"
        },
        "t2": {
            "name": "Tundra",
            "biomes": [
                "tundra",
                "dead_woods",
                "crossroads"
            ],
            "description": "Mid-early game - moderate challenge"
        },
        "t3": {
            "name": "Desert",
            "biomes": [
                "desert",
                "scrap_yard",
                "mud_flats"
            ],
            "description": "Mid-late game - significant challenge"
        },
        "t4": {
            "name": "Badlands",
            "biomes": [
                "badlands",
                "bone_valley",
                "the_ruins"
            ],
            "description": "Endgame - toughest enemies"
        }
    },
    "defaultStats": {
        "health": 50,
        "damage": 5,
        "speed": 80,
        "attackRate": 1,
        "attackRange": 100,
        "aggroRange": 200,
        "leashDistance": 500,
        "xpReward": 10,
        "threatLevel": 1,
        "attackType": "melee",
        "packAggro": true,
        "isElite": false
    },
    "defaultVFX": {
        "spawn": "vfx_spawn",
        "death": "vfx_death",
        "hit": "vfx_blood_hit"
    },
    "defaultSFX": {
        "spawn": "sfx_spawn",
        "death": "sfx_death",
        "hit": "sfx_flesh_hit"
    }
};

export default config;
