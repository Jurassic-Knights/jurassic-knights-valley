const AssetLoader = {
    // Registry updated: 2026-01-02-B
    registries: {
        images: null,
        audio: null,
        vfx: null
    },
    cache: new Map(),
    basePath: 'assets/',

    /**
     * Initialize the asset loader with embedded registry data
     * (Avoids CORS issues when running from file:// protocol)
     */
    async init() {
        // Embedded image registry data
        this.registries.images = {
            assets: {
                "ui_res_gold": { "path": "images/ui/currency_gold_clean.png" },
                "ui_icon_gold": { "path": "images/ui/currency_gold_clean.png" },
                "ui_res_gem": { "path": "images/ui/currency_gem_clean.png" },
                "ui_icon_gem": { "path": "images/ui/currency_gem_clean.png" },
                "ui_res_token": { "path": "images/ui/currency_token_clean.png" },
                "ui_icon_token": { "path": "images/ui/currency_token_clean.png" },
                "ui_icon_settings": { "path": "images/ui/icon_settings_clean.png" },
                "ui_icon_orders": { "path": "images/ui/icon_orders_clean.png" },
                "ui_icon_inventory": { "path": "images/ui/icon_inventory_clean.png" },
                "ui_icon_forge": { "path": "images/ui/icon_forge_clean.png" },
                "ui_icon_map": { "path": "images/ui/icon_map_clean.png" },
                "ui_icon_magnet": { "path": "images/ui/icon_magnet_clean.png" },
                "ui_icon_speech_bubble": { "path": "images/ui/ui_icon_speech_bubble_clean.png" },
                "ui_icon_shop": { "path": "images/ui/ui_icon_shop_clean.png" },
                "item_scrap_metal": { "path": "images/resources/drop_scrap_metal_clean.png" },
                "item_iron_ore": { "path": "images/resources/drop_iron_ore_clean.png" },
                "item_fossil_fuel": { "path": "images/resources/drop_fossil_fuel_clean.png" },
                "item_wood": { "path": "images/resources/drop_wood_clean.png" },
                "item_gold": { "path": "images/resources/drop_gold_clean.png" },
                "ui_avatar_knight": { "path": "images/characters/avatar_knight.png" },
                "ui_icon_rest": { "path": "images/ui/icon_rest_clean.png" },
                "ui_icon_lock": { "path": "images/ui/icon_lock_clean.png" },
                "world_iron_ore": { "path": "images/resources/res_iron_ore_clean.png" },
                "world_fossil_fuel": { "path": "images/resources/res_fossil_fuel_clean.png" },
                "world_wood": { "path": "images/resources/res_wood_clean.png" },
                "world_scrap_metal": { "path": "images/resources/res_scrap_metal_clean.png" },
                "world_gold": { "path": "images/resources/res_gold_clean.png" },
                "item_scrap_plate": { "path": "images/items/item_scrap_plate_clean.png" },
                "item_iron_ingot": { "path": "images/items/item_iron_ingot_clean.png" },
                "drop_scrap_metal": { "path": "images/resources/drop_scrap_metal_clean.png" },
                "drop_iron_ore": { "path": "images/resources/drop_iron_ore_clean.png" },
                "drop_fossil_fuel": { "path": "images/resources/drop_fossil_fuel_clean.png" },
                "drop_wood": { "path": "images/resources/drop_wood_clean.png" },
                "drop_gold": { "path": "images/resources/drop_gold_clean.png" },
                "drop_primal_meat": { "path": "images/resources/drop_primal_meat_clean.png" },
                "item_primal_meat": { "path": "images/resources/drop_primal_meat_clean.png" },
                "tool_gun": { "path": "images/tools/tool_gun_clean.png" },
                "tool_shovel": { "path": "images/tools/tool_shovel_clean.png" },
                "building_outpost": { "path": "images/buildings/building_outpost_clean.png" },
                "building_forge": { "path": "images/buildings/building_forge_clean.png" },
                "world_base_layer": { "path": "images/backgrounds/base_layer.jpg" },
                "world_island_home": { "path": "images/backgrounds/zone_home_clean.png" },
                "world_hero": { "path": "images/characters/world_hero_2_clean.png" },
                "world_wood_consumed": { "path": "images/resources/res_wood_consumed_clean.png" },
                "world_iron_ore_consumed": { "path": "images/resources/res_iron_ore_consumed_clean.png" },
                "world_scrap_metal_consumed": { "path": "images/resources/res_scrap_metal_consumed_clean.png" },
                "world_fossil_fuel_consumed": { "path": "images/resources/res_fossil_fuel_consumed_clean.png" },
                "world_gold_consumed": { "path": "images/resources/res_gold_consumed_clean.png" },
                "world_bridge_planks": { "path": "images/environment/environment_planks.png" },

                "vfx_fog": { "path": "images/vfx/fog.png" },
                "vfx_fog_puff": { "path": "images/vfx/fog_dense.png" }, // Final dense fog

                // Dinosaurs
                "dino_velociraptor_base": { "path": "images/dinosaurs/dino_velociraptor_base_clean.png" },
                "dino_tyrannosaurus_base": { "path": "images/dinosaurs/dino_tyrannosaurus_base_clean.png" },
                "dino_triceratops_base": { "path": "images/dinosaurs/dino_triceratops_base_clean.png" },
                "dino_ankylosaurus_base": { "path": "images/dinosaurs/dino_ankylosaurus_base_clean.png" },
                "dino_parasaurolophus_base": { "path": "images/dinosaurs/dino_parasaurolophus_base_clean.png" },
                "dino_stegosaurus_base": { "path": "images/dinosaurs/dino_stegosaurus_base_clean.png" },
                "dino_spinosaurus_base": { "path": "images/dinosaurs/dino_spinosaurus_base_clean.png" },
                "dino_base": { "path": "images/dinosaurs/dino_parasaurolophus_base_clean.png" },
                "dino_walk_1": { "path": "images/characters/dino_walk_1.png" },
                "dino_walk_2": { "path": "images/characters/dino_walk_2.png" },
                "dino_walk_3": { "path": "images/characters/dino_walk_3.png" },
                "dino_walk_4": { "path": "images/characters/dino_walk_4.png" },
                "dino_pteranodon_base": { "path": "images/dinosaurs/dino_pteranodon_base_clean.png" },

                // Zone Backgrounds
                "zone_quarry_fields": { "path": "images/backgrounds/zone_quarry_fields_clean.png" },
                "zone_iron_ridge": { "path": "images/backgrounds/zone_iron_ridge_clean.png" },
                "zone_dead_woods": { "path": "images/backgrounds/zone_dead_woods_clean.png" },
                "zone_crossroads": { "path": "images/backgrounds/zone_crossroads_clean.png" },
                "zone_scrap_yard": { "path": "images/backgrounds/zone_scrap_yard_clean.png" },
                "zone_mud_flats": { "path": "images/backgrounds/zone_mud_flats_clean.png" },
                "zone_bone_valley": { "path": "images/backgrounds/zone_bone_valley_clean.png" },
                "zone_the_ruins": { "path": "images/backgrounds/zone_the_ruins_clean.png" },

                // Merchant Sprites
                "npc_merchant_quarry": { "path": "images/characters/npc_merchant_quarry_clean.png" },
                "npc_merchant_iron": { "path": "images/characters/npc_merchant_iron_clean.png" },
                "npc_merchant_dead": { "path": "images/characters/npc_merchant_dead_clean.png" },
                "npc_merchant_cross": { "path": "images/characters/npc_merchant_cross_clean.png" },
                "npc_merchant_scrap": { "path": "images/characters/npc_merchant_scrap_clean.png" },
                "npc_merchant_mud": { "path": "images/characters/npc_merchant_mud_clean.png" },
                "npc_merchant_bone": { "path": "images/characters/npc_merchant_bone_clean.png" },
                "npc_merchant_ruins": { "path": "images/characters/npc_merchant_ruins_clean.png" }
            }
        };

        // Empty audio/vfx registries for now
        this.registries.audio = {
            assets: {
                // Hero
                "sfx_hero_shoot": { "path": "audio/hero_shoot.wav", "volume": 0.8 },
                "sfx_hero_swing": { "path": "audio/hero_swing.wav", "volume": 0.6 },
                "sfx_hero_impact_flesh": { "path": "audio/hero_impact_flesh.wav", "volume": 0.7 },
                "sfx_hero_impact_metal": { "path": "audio/hero_impact_metal.wav", "volume": 0.7 },
                "sfx_hero_step": { "path": "audio/hero_step.wav", "volume": 0.3 },

                // Resources
                "sfx_resource_break_wood": { "path": "audio/resource_break_wood.wav", "volume": 0.8 },
                "sfx_resource_break_stone": { "path": "audio/resource_break_stone.wav", "volume": 0.8 },
                "sfx_resource_break_metal": { "path": "audio/resource_break_metal.wav", "volume": 0.8 },
                "sfx_resource_collect": { "path": "audio/resource_collect.wav", "volume": 0.6 },

                // Dinosaurs
                "sfx_dino_roar": { "path": "audio/dino_roar.wav", "volume": 1.0 },
                "sfx_dino_attack": { "path": "audio/dino_attack.wav", "volume": 0.8 },
                "sfx_dino_hurt": { "path": "audio/dino_hurt.wav", "volume": 0.7 },
                "sfx_dino_death": { "path": "audio/dino_death.wav", "volume": 0.9 },
                "sfx_dino_respawn": { "path": "audio/dino_respawn.wav", "volume": 0.9 },

                // UI
                "sfx_ui_click": { "path": "audio/ui_click.wav", "volume": 0.5 },
                "sfx_ui_error": { "path": "audio/ui_error.wav", "volume": 0.5 },
                "sfx_ui_purchase": { "path": "audio/ui_purchase.wav", "volume": 0.7 },
                "sfx_ui_unlock": { "path": "audio/ui_unlock.wav", "volume": 1.0 },

                // Game
                "sfx_level_up": { "path": "audio/level_up.wav", "volume": 0.8 }
            }
        };
        this.registries.vfx = { presets: {} };

        console.log('[AssetLoader] Registries loaded (embedded)');
        return true;
    },

    /**
     * Load a registry JSON file (kept for future server-based usage)
     */
    async loadRegistry(path) {
        const response = await fetch(this.basePath + path);
        return response.json();
    },

    /**
     * Get image path by ID
     * @param {string} id - Asset ID (e.g., 'ui_btn_primary')
     * @returns {string|null} - File path or null if not found
     */
    getImagePath(id) {
        const asset = this.registries.images?.assets?.[id];
        if (!asset) {
            console.warn(`[AssetLoader] Image not found: ${id}, using placeholder`);
            return this.basePath + 'images/PH.png';
        }

        // SAFETY: Never allow _original assets in production
        if (asset.path.includes('_original')) {
            console.error(`[AssetLoader] BLOCKED: Cannot use _original asset: ${asset.path}`);
            return this.basePath + 'images/PH.png';
        }

        return this.basePath + asset.path;
    },

    /**
     * Get cached image object
     * @param {string} id
     * @returns {HTMLImageElement|null}
     */
    getImage(id) {
        return this.cache.get(id) || null;
    },

    /**
     * Create an image element with automatic fallback to PH.png on error
     * @param {string} src - Image source path
     * @param {function} onLoad - Optional callback when loaded
     * @returns {HTMLImageElement}
     */
    createImage(src, onLoad) {
        const img = new Image();
        img.onerror = () => {
            console.warn(`[AssetLoader] Image load failed: ${src}, using placeholder`);
            img.src = this.basePath + 'images/PH.png';
        };
        if (onLoad) {
            img.onload = onLoad;
        }
        img.src = src;
        return img;
    },

    /**
     * Get audio path by ID
     * @param {string} id - Asset ID (e.g., 'sfx_click')
     * @returns {object|null} - Audio config or null if not found
     */
    getAudio(id) {
        const asset = this.registries.audio?.assets?.[id];
        if (!asset) {
            console.warn(`[AssetLoader] Audio not found: ${id}`);
            return null;
        }
        return {
            path: this.basePath + asset.path,
            volume: asset.volume ?? 1,
            loop: asset.loop ?? false
        };
    },

    /**
     * Get VFX preset by ID
     * @param {string} id - Preset ID
     * @returns {object|null} - Preset config or null
     */
    getVFXPreset(id) {
        return this.registries.vfx?.presets?.[id] ?? null;
    },

    /**
     * Preload an image and cache it
     * @param {string} id - Asset ID
     * @returns {Promise<HTMLImageElement>}
     */
    async preloadImage(id) {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        const path = this.getImagePath(id);
        if (!path) return null;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(id, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[AssetLoader] Image failed to load: ${path}, using placeholder`);
                // Load placeholder instead
                const placeholder = new Image();
                placeholder.onload = () => {
                    this.cache.set(id, placeholder);
                    resolve(placeholder);
                };
                placeholder.onerror = () => {
                    // Even placeholder failed, return null
                    resolve(null);
                };
                placeholder.src = this.basePath + 'images/PH.png';
            };
            img.src = path;
        });
    }
};

// Export for global access
window.AssetLoader = AssetLoader;
