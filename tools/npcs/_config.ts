/**
 * _config - Auto-generated from JSON
 */

export const config = {
    "version": "1.0",
    "lastUpdated": "2026-01-11",
    "description": "NPC configuration - merchants, quest givers, and other non-hostile characters",
    "defaults": {
        "statusWorkflow": [
            "pending",
            "approved",
            "declined",
            "clean",
            "missing"
        ],
        "vfx": {
            "idle": "vfx_npc_idle",
            "interact": "vfx_npc_interact"
        },
        "sfx": {
            "greet": "sfx_npc_greet",
            "trade": "sfx_npc_trade"
        }
    },
    "categories": {
        "merchant": "Shop NPCs that sell/buy items",
        "quest_giver": "NPCs that provide quests (future)",
        "vendor": "Specialized service providers (future)"
    }
};

export default config;
