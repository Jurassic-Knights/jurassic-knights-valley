/**
 * AssetManifest
 * Static registry of non-entity assets (UI, VFX, Backgrounds)
 * Extracted from AssetLoader to separate data from logic.
 */

export const AssetManifest: Record<string, string> = {
    // UI Resource Icons
    ui_res_gem: 'images/ui/ui_res_gem_original.png',
    ui_res_gold: 'images/ui/ui_res_gold_original.png',
    ui_res_token: 'images/ui/ui_res_token_original.png',

    // UI Action Icons
    ui_icon_forge: 'images/ui/ui_icon_forge_original.png',
    ui_icon_inventory: 'images/ui/ui_icon_inventory_original.png',
    ui_icon_lock: 'images/ui/ui_icon_lock_original.png',
    ui_icon_magnet: 'images/ui/ui_icon_magnet_original.png',
    ui_icon_map: 'images/ui/ui_icon_map_original.png',
    ui_icon_orders: 'images/ui/ui_icon_orders_original.png',
    ui_icon_rest: 'images/ui/ui_icon_rest_original.png',
    ui_icon_settings: 'images/ui/ui_icon_settings_original.png',
    ui_icon_shop: 'images/ui/ui_icon_shop_original.png',
    ui_icon_speech_bubble: 'images/ui/ui_icon_speech_bubble_original.png',
    ui_icon_swap: 'images/ui/ui_icon_swap_original.png',

    // Equipment/Inventory Mode Icons
    ui_icon_armor: 'images/ui/ui_icon_armor_original.png',
    ui_icon_weapon: 'images/ui/ui_icon_weapon_original.png',

    ui_icon_pickaxe: 'images/ui/ui_icon_tool_original.png',
    ui_icon_close: 'images/ui/ui_icon_back_original.png',
    ui_icon_crafting: 'images/ui/ui_icon_items_original.png',
    ui_icon_resources: 'images/ui/ui_icon_resources_original.png',
    ui_icon_equip: 'images/ui/ui_icon_equip_original.png',

    // Filter Icons (Generated)
    ui_icon_sword: 'images/ui/ui_icon_sword_original.png',
    ui_icon_axe: 'images/ui/ui_icon_axe_original.png',
    ui_icon_mace: 'images/ui/ui_icon_mace_original.png',
    ui_icon_spear: 'images/ui/ui_icon_spear_original.png',
    ui_icon_knife: 'images/ui/ui_icon_knife_original.png',
    ui_icon_dagger: 'images/ui/ui_icon_knife_original.png', // Alias

    ui_icon_rifle: 'images/ui/ui_icon_rifle_original.png',
    ui_icon_pistol: 'images/ui/ui_icon_pistol_original.png',
    ui_icon_shotgun: 'images/ui/ui_icon_shotgun_original.png',

    ui_icon_helmet: 'images/ui/ui_icon_helmet_original.png',
    ui_icon_chest: 'images/ui/ui_icon_chest_original.png',
    ui_icon_gloves: 'images/ui/ui_icon_gloves_original.png',
    ui_icon_boots: 'images/ui/ui_icon_boots_original.png',
    ui_icon_legs: 'images/ui/ui_icon_boots_original.png', // Alias
    ui_icon_accessory: 'images/ui/ui_icon_accessory_original.png',

    ui_icon_wood_axe: 'images/ui/ui_icon_wood_axe_original.png',
    ui_icon_fishing: 'images/ui/ui_icon_fishing_original.png',
    ui_icon_harvesting: 'images/ui/ui_icon_harvesting_original.png',

    // Stat Icons (for equipment UI display)
    stat_damage: 'images/ui/stat_damage_original.png',
    stat_attack_speed: 'images/ui/stat_attack_speed_original.png',
    stat_range: 'images/ui/stat_range_original.png',
    stat_crit_chance: 'images/ui/stat_crit_chance_original.png',
    stat_crit_damage: 'images/ui/stat_crit_damage_original.png',
    stat_armor: 'images/ui/stat_armor_original.png',
    stat_health: 'images/ui/stat_health_original.png',
    stat_stamina: 'images/ui/stat_stamina_original.png',
    stat_speed: 'images/ui/stat_speed_original.png',
    stat_efficiency: 'images/ui/stat_efficiency_original.png',

    // VFX Textures
    vfx_fog: 'images/vfx/fog.png',
    vfx_fog_of_war: 'images/vfx/fog_of_war.png',
    vfx_fog_puff: 'images/vfx/fog_dense.png',

    // Base Layers (bg_base_[biome]_## convention)
    bg_base_all_01: 'images/backgrounds/bg_base_all_01_original.png',

    // World/Background
    world_bridge_planks: 'images/environment/environment_planks.png',
    world_hero: 'images/hero/hero_base_clean.png',
    world_island_home: 'images/backgrounds/zone_home_clean.png',

    // Zone backgrounds (fallbacks if not in EntityRegistry)
    zone_bone_valley: 'images/backgrounds/zone_bone_valley_clean.png',
    zone_crossroads: 'images/backgrounds/zone_crossroads_clean.png',
    zone_dead_woods: 'images/backgrounds/zone_dead_woods_clean.png',
    zone_iron_ridge: 'images/backgrounds/zone_iron_ridge_clean.png',
    zone_mud_flats: 'images/backgrounds/zone_mud_flats_clean.png',
    zone_quarry_fields: 'images/backgrounds/zone_quarry_fields_clean.png',
    zone_scrap_yard: 'images/backgrounds/zone_scrap_yard_clean.png',
    zone_the_ruins: 'images/backgrounds/zone_the_ruins_clean.png',

    // Type Filters
    'ui_icon_1-hand': 'images/ui/ui_icon_1-hand_original.png',
    'ui_icon_2-hand': 'images/ui/ui_icon_2-hand_original.png',
    ui_icon_melee: 'images/ui/ui_icon_melee_original.png',
    ui_icon_ranged: 'images/ui/ui_icon_ranged_original.png',

    // Weapon Specific Filters
    ui_icon_flail: 'images/ui/ui_icon_flail_original.png',
    ui_icon_greatsword: 'images/ui/ui_icon_greatsword_original.png',

    ui_icon_war_axe: 'images/ui/ui_icon_war_axe_original.png',
    ui_icon_war_hammer: 'images/ui/ui_icon_war_hammer_original.png',
    ui_icon_lance: 'images/ui/ui_icon_lance_original.png',
    ui_icon_halberd: 'images/ui/ui_icon_halberd_original.png',
    ui_icon_machine_gun: 'images/ui/ui_icon_machine_gun_original.png',
    ui_icon_bazooka: 'images/ui/ui_icon_bazooka_original.png',
    ui_icon_flamethrower: 'images/ui/ui_icon_flamethrower_original.png',
    ui_icon_sniper_rifle: 'images/ui/ui_icon_sniper_rifle_original.png',

    // Buildings (building_[type]_[tier] convention)
    building_residential_01: 'images/buildings/building_residential_01_clean.png',
    building_industrial_01: 'images/buildings/building_industrial_01_clean.png',

    // Fallback tools
    tool_t1_01: 'images/equipment/tools/tool_t1_01_original.png'
};
