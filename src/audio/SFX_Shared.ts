/**
 * SFX_Shared.js - Shared procedural SFX for game systems
 *
 * These are generic sounds used across multiple entities/systems.
 * Items, nodes, progression, crafting, environment, etc.
 */

// Ambient declarations
declare const SFX_Modules: any;

(function () {
    const Shared = {
        // ========== ITEM SOUNDS ==========

        sfx_item_drop_light: function () {
            // Soft thud for cloth, food, leather
            return {
                type: 'noise',
                attack: 0.001,
                decay: 0.15,
                filter: { type: 'lowpass', frequency: 800 },
                volume: 0.4,
                pitchShift: 0.9
            };
        },

        sfx_item_drop_heavy: function () {
            // Metallic clunk for metal, stone, bone
            return {
                type: 'noise',
                attack: 0.001,
                decay: 0.2,
                filter: { type: 'bandpass', frequency: 400, Q: 2 },
                volume: 0.5,
                pitchShift: 0.6
            };
        },

        sfx_item_pickup: function () {
            // Quick satisfying pickup sound
            return {
                type: 'sine',
                frequency: 600,
                attack: 0.01,
                decay: 0.1,
                sweep: { end: 900, time: 0.1 },
                volume: 0.3
            };
        },

        // ========== EQUIPMENT SOUNDS ==========

        sfx_equip_armor: function () {
            // Metal armor equip - clinking
            return {
                type: 'noise',
                attack: 0.01,
                decay: 0.3,
                filter: { type: 'bandpass', frequency: 2000, Q: 3 },
                volume: 0.4
            };
        },

        sfx_equip_weapon: function () {
            // Weapon draw/sheathe
            return {
                type: 'noise',
                attack: 0.02,
                decay: 0.2,
                filter: { type: 'highpass', frequency: 1500 },
                volume: 0.35
            };
        },

        // ========== NODE SOUNDS ==========

        sfx_node_hit_wood: function () {
            // Axe hitting tree
            return {
                type: 'noise',
                attack: 0.005,
                decay: 0.15,
                filter: { type: 'lowpass', frequency: 600 },
                volume: 0.5,
                pitchShift: 0.7 + Math.random() * 0.2
            };
        },

        sfx_node_hit_stone: function () {
            // Pickaxe hitting rock
            return {
                type: 'noise',
                attack: 0.002,
                decay: 0.1,
                filter: { type: 'bandpass', frequency: 3000, Q: 4 },
                volume: 0.5,
                pitchShift: 0.8 + Math.random() * 0.3
            };
        },

        sfx_node_break_wood: function () {
            // Tree falling / wood breaking
            return {
                type: 'noise',
                attack: 0.01,
                decay: 0.4,
                filter: { type: 'lowpass', frequency: 400 },
                volume: 0.6
            };
        },

        sfx_node_break_stone: function () {
            // Rock crumbling
            return {
                type: 'noise',
                attack: 0.01,
                decay: 0.35,
                filter: { type: 'bandpass', frequency: 1500, Q: 2 },
                volume: 0.55
            };
        },

        sfx_node_respawn: function () {
            // Magic/nature respawn shimmer
            return {
                type: 'sine',
                frequency: 400,
                attack: 0.1,
                decay: 0.5,
                sweep: { end: 800, time: 0.5 },
                volume: 0.25
            };
        },

        // ========== WEAPON SOUNDS ==========

        sfx_weapon_swing_sword: function () {
            // Sword whoosh
            return {
                type: 'noise',
                attack: 0.01,
                decay: 0.12,
                filter: { type: 'highpass', frequency: 2500 },
                volume: 0.35
            };
        },

        sfx_weapon_swing_axe: function () {
            // Heavier swing
            return {
                type: 'noise',
                attack: 0.02,
                decay: 0.15,
                filter: { type: 'bandpass', frequency: 1500, Q: 2 },
                volume: 0.4
            };
        },

        sfx_weapon_swing_hammer: function () {
            // Heavy crushing swing
            return {
                type: 'noise',
                attack: 0.03,
                decay: 0.2,
                filter: { type: 'lowpass', frequency: 1000 },
                volume: 0.45
            };
        },

        sfx_weapon_shot_rifle: function () {
            // Gunshot
            return {
                type: 'noise',
                attack: 0.001,
                decay: 0.15,
                filter: { type: 'bandpass', frequency: 800, Q: 1 },
                volume: 0.6
            };
        },

        sfx_weapon_shot_bow: function () {
            // Arrow release twang
            return {
                type: 'sawtooth',
                frequency: 150,
                attack: 0.005,
                decay: 0.15,
                sweep: { end: 80, time: 0.1 },
                volume: 0.35
            };
        },

        sfx_weapon_shot_crossbow: function () {
            // Crossbow snap
            return {
                type: 'noise',
                attack: 0.002,
                decay: 0.08,
                filter: { type: 'bandpass', frequency: 2000, Q: 3 },
                volume: 0.4
            };
        },

        sfx_weapon_impact_hit: function () {
            // Attack lands on target
            return {
                type: 'noise',
                attack: 0.002,
                decay: 0.1,
                filter: { type: 'lowpass', frequency: 500 },
                volume: 0.5
            };
        },

        // ========== PLAYER SOUNDS ==========

        sfx_player_hurt: function () {
            // Player takes damage
            return {
                type: 'sine',
                frequency: 200,
                attack: 0.01,
                decay: 0.2,
                sweep: { end: 100, time: 0.15 },
                volume: 0.4
            };
        },

        sfx_player_death: function () {
            // Player dies
            return {
                type: 'sine',
                frequency: 300,
                attack: 0.02,
                decay: 0.6,
                sweep: { end: 50, time: 0.5 },
                volume: 0.5
            };
        },

        // ========== PROGRESSION SOUNDS ==========

        sfx_xp_gain: function () {
            // XP tick - subtle chime
            return {
                type: 'sine',
                frequency: 800,
                attack: 0.01,
                decay: 0.1,
                sweep: { end: 1000, time: 0.08 },
                volume: 0.2
            };
        },

        sfx_level_up: function () {
            // Level up fanfare
            return {
                type: 'sine',
                frequency: 400,
                attack: 0.05,
                decay: 0.8,
                sweep: { end: 1200, time: 0.6 },
                volume: 0.5
            };
        },

        sfx_quest_complete: function () {
            // Quest/achievement complete
            return {
                type: 'sine',
                frequency: 500,
                attack: 0.02,
                decay: 0.5,
                sweep: { end: 800, time: 0.4 },
                volume: 0.45
            };
        },

        // ========== CRAFTING SOUNDS ==========

        sfx_craft_start: function () {
            // Begin crafting
            return {
                type: 'noise',
                attack: 0.05,
                decay: 0.3,
                filter: { type: 'bandpass', frequency: 1000, Q: 2 },
                volume: 0.3
            };
        },

        sfx_craft_success: function () {
            // Item crafted
            return {
                type: 'sine',
                frequency: 600,
                attack: 0.02,
                decay: 0.3,
                sweep: { end: 900, time: 0.25 },
                volume: 0.4
            };
        },

        sfx_recipe_unlock: function () {
            // New recipe learned
            return {
                type: 'sine',
                frequency: 700,
                attack: 0.03,
                decay: 0.4,
                sweep: { end: 1100, time: 0.35 },
                volume: 0.45
            };
        },

        // ========== NPC SOUNDS ==========

        sfx_npc_greet: function () {
            // Open shop/talk to NPC
            return {
                type: 'sine',
                frequency: 500,
                attack: 0.02,
                decay: 0.2,
                sweep: { end: 700, time: 0.15 },
                volume: 0.3
            };
        },

        sfx_npc_buy: function () {
            // Purchase item - coin sound
            return {
                type: 'sine',
                frequency: 1500,
                attack: 0.005,
                decay: 0.15,
                sweep: { end: 2000, time: 0.1 },
                volume: 0.35
            };
        },

        // ========== ENVIRONMENT SOUNDS ==========

        sfx_water_splash: function () {
            // Enter water
            return {
                type: 'noise',
                attack: 0.01,
                decay: 0.4,
                filter: { type: 'lowpass', frequency: 600 },
                volume: 0.5
            };
        },

        sfx_campfire_loop: function () {
            // Fire crackle (single burst, loop in code)
            return {
                type: 'noise',
                attack: 0.02,
                decay: 0.2,
                filter: { type: 'bandpass', frequency: 800, Q: 1 },
                volume: 0.25
            };
        },

        sfx_door_open: function () {
            // Door opening
            return {
                type: 'noise',
                attack: 0.05,
                decay: 0.3,
                filter: { type: 'lowpass', frequency: 400 },
                volume: 0.35
            };
        },

        sfx_door_close: function () {
            // Door closing
            return {
                type: 'noise',
                attack: 0.01,
                decay: 0.2,
                filter: { type: 'lowpass', frequency: 500 },
                volume: 0.4
            };
        }
    };
})();

