/** SFX_Shared - Generic sounds for items, equipment, nodes, weapons, progression, crafting, NPC, environment */
import { SFX } from './SFX_Core';
(function () {
    const Shared = {
        sfx_item_drop_light: () => ({ type: 'noise', attack: 0.001, decay: 0.15, filter: { type: 'lowpass', frequency: 800 }, volume: 0.4, pitchShift: 0.9 }),
        sfx_item_drop_heavy: () => ({ type: 'noise', attack: 0.001, decay: 0.2, filter: { type: 'bandpass', frequency: 400, Q: 2 }, volume: 0.5, pitchShift: 0.6 }),
        sfx_item_pickup: () => ({ type: 'sine', frequency: 600, attack: 0.01, decay: 0.1, sweep: { end: 900, time: 0.1 }, volume: 0.3 }),
        sfx_equip_armor: () => ({ type: 'noise', attack: 0.01, decay: 0.3, filter: { type: 'bandpass', frequency: 2000, Q: 3 }, volume: 0.4 }),
        sfx_equip_weapon: () => ({ type: 'noise', attack: 0.02, decay: 0.2, filter: { type: 'highpass', frequency: 1500 }, volume: 0.35 }),
        sfx_node_hit_wood: () => ({ type: 'noise', attack: 0.005, decay: 0.15, filter: { type: 'lowpass', frequency: 600 }, volume: 0.5, pitchShift: 0.7 + Math.random() * 0.2 }),
        sfx_node_hit_stone: () => ({ type: 'noise', attack: 0.002, decay: 0.1, filter: { type: 'bandpass', frequency: 3000, Q: 4 }, volume: 0.5, pitchShift: 0.8 + Math.random() * 0.3 }),
        sfx_node_break_wood: () => ({ type: 'noise', attack: 0.01, decay: 0.4, filter: { type: 'lowpass', frequency: 400 }, volume: 0.6 }),
        sfx_node_break_stone: () => ({ type: 'noise', attack: 0.01, decay: 0.35, filter: { type: 'bandpass', frequency: 1500, Q: 2 }, volume: 0.55 }),
        sfx_node_respawn: () => ({ type: 'sine', frequency: 400, attack: 0.1, decay: 0.5, sweep: { end: 800, time: 0.5 }, volume: 0.25 }),
        sfx_weapon_swing_sword: () => ({ type: 'noise', attack: 0.01, decay: 0.12, filter: { type: 'highpass', frequency: 2500 }, volume: 0.35 }),
        sfx_weapon_swing_axe: () => ({ type: 'noise', attack: 0.02, decay: 0.15, filter: { type: 'bandpass', frequency: 1500, Q: 2 }, volume: 0.4 }),
        sfx_weapon_swing_hammer: () => ({ type: 'noise', attack: 0.03, decay: 0.2, filter: { type: 'lowpass', frequency: 1000 }, volume: 0.45 }),
        sfx_weapon_shot_rifle: () => ({ type: 'noise', attack: 0.001, decay: 0.15, filter: { type: 'bandpass', frequency: 800, Q: 1 }, volume: 0.6 }),
        sfx_weapon_shot_bow: () => ({ type: 'sawtooth', frequency: 150, attack: 0.005, decay: 0.15, sweep: { end: 80, time: 0.1 }, volume: 0.35 }),
        sfx_weapon_shot_crossbow: () => ({ type: 'noise', attack: 0.002, decay: 0.08, filter: { type: 'bandpass', frequency: 2000, Q: 3 }, volume: 0.4 }),
        sfx_weapon_impact_hit: () => ({ type: 'noise', attack: 0.002, decay: 0.1, filter: { type: 'lowpass', frequency: 500 }, volume: 0.5 }),
        sfx_player_hurt: () => ({ type: 'sine', frequency: 200, attack: 0.01, decay: 0.2, sweep: { end: 100, time: 0.15 }, volume: 0.4 }),
        sfx_hero_hurt: () => ({ type: 'sine', frequency: 200, attack: 0.01, decay: 0.2, sweep: { end: 100, time: 0.15 }, volume: 0.4 }),
        sfx_player_death: () => ({ type: 'sine', frequency: 300, attack: 0.02, decay: 0.6, sweep: { end: 50, time: 0.5 }, volume: 0.5 }),
        sfx_xp_gain: () => ({ type: 'sine', frequency: 800, attack: 0.01, decay: 0.1, sweep: { end: 1000, time: 0.08 }, volume: 0.2 }),
        sfx_level_up: () => ({ type: 'sine', frequency: 400, attack: 0.05, decay: 0.8, sweep: { end: 1200, time: 0.6 }, volume: 0.5 }),
        sfx_quest_complete: () => ({ type: 'sine', frequency: 500, attack: 0.02, decay: 0.5, sweep: { end: 800, time: 0.4 }, volume: 0.45 }),
        sfx_craft_start: () => ({ type: 'noise', attack: 0.05, decay: 0.3, filter: { type: 'bandpass', frequency: 1000, Q: 2 }, volume: 0.3 }),
        sfx_craft_success: () => ({ type: 'sine', frequency: 600, attack: 0.02, decay: 0.3, sweep: { end: 900, time: 0.25 }, volume: 0.4 }),
        sfx_recipe_unlock: () => ({ type: 'sine', frequency: 700, attack: 0.03, decay: 0.4, sweep: { end: 1100, time: 0.35 }, volume: 0.45 }),
        sfx_npc_greet: () => ({ type: 'sine', frequency: 500, attack: 0.02, decay: 0.2, sweep: { end: 700, time: 0.15 }, volume: 0.3 }),
        sfx_npc_buy: () => ({ type: 'sine', frequency: 1500, attack: 0.005, decay: 0.15, sweep: { end: 2000, time: 0.1 }, volume: 0.35 }),
        sfx_water_splash: () => ({ type: 'noise', attack: 0.01, decay: 0.4, filter: { type: 'lowpass', frequency: 600 }, volume: 0.5 }),
        sfx_campfire_loop: () => ({ type: 'noise', attack: 0.02, decay: 0.2, filter: { type: 'bandpass', frequency: 800, Q: 1 }, volume: 0.25 }),
        sfx_door_open: () => ({ type: 'noise', attack: 0.05, decay: 0.3, filter: { type: 'lowpass', frequency: 400 }, volume: 0.35 }),
        sfx_door_close: () => ({ type: 'noise', attack: 0.01, decay: 0.2, filter: { type: 'lowpass', frequency: 500 }, volume: 0.4 })
    };
    if (SFX) SFX.register(Shared);
})();

