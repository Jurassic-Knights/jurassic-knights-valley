/**
 * AssetLoader - Lightweight asset loading system
 * 
 * Reads image paths from EntityRegistry (entity JSONs already have file paths).
 * Only maintains a small static registry for non-entity assets (UI, VFX, world).
 * 
 * Owner: Director
 */

import { Logger } from './Logger';
import { EntityRegistry } from '../entities/EntityLoader';
import { VFXController } from '../vfx/VFXController';
import { Registry } from './Registry';

// VFXController accessed lazily to avoid circular imports

const AssetLoader = {
    cache: new Map(),
    basePath: 'assets/',

    // Threshold for white pixel detection (250-255 catches near-white)
    WHITE_THRESHOLD: 250,

    /**
     * Remove white background from an image
     * Used as fallback when _clean.png doesn't exist
     * @param {HTMLImageElement} img - Source image
     * @returns {HTMLCanvasElement} - Canvas with transparent background
     */
    _removeWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const threshold = this.WHITE_THRESHOLD;

        for (let i = 0; i < data.length; i += 4) {
            // If R, G, B are all >= threshold, make transparent
            if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
                data[i + 3] = 0; // Set alpha to 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    },

    // Static registry for non-entity assets only
    staticAssets: {
        // UI Resource Icons
        "ui_res_gem": "images/ui/ui_res_gem_original.png",
        "ui_res_gold": "images/ui/ui_res_gold_original.png",
        "ui_res_token": "images/ui/ui_res_token_original.png",

        // UI Action Icons
        "ui_icon_forge": "images/ui/ui_icon_forge_original.png",
        "ui_icon_inventory": "images/ui/ui_icon_inventory_original.png",
        "ui_icon_lock": "images/ui/ui_icon_lock_original.png",
        "ui_icon_magnet": "images/ui/ui_icon_magnet_original.png",
        "ui_icon_map": "images/ui/ui_icon_map_original.png",
        "ui_icon_orders": "images/ui/ui_icon_orders_original.png",
        "ui_icon_rest": "images/ui/ui_icon_rest_original.png",
        "ui_icon_settings": "images/ui/ui_icon_settings_original.png",
        "ui_icon_shop": "images/ui/ui_icon_shop_original.png",
        "ui_icon_speech_bubble": "images/ui/ui_icon_speech_bubble_original.png",
        "ui_icon_swap": "images/ui/ui_icon_swap_original.png",

        // VFX Textures
        "vfx_fog": "images/vfx/fog.png",
        "vfx_fog_of_war": "images/vfx/fog_of_war.png",
        "vfx_fog_puff": "images/vfx/fog_dense.png",

        // Base Layers (bg_base_[biome]_## convention)
        "bg_base_all_01": "images/backgrounds/bg_base_all_01_original.png",

        // World/Background
        "world_bridge_planks": "images/environment/environment_planks.png",
        "world_hero": "images/hero/hero_base_clean.png",
        "world_island_home": "images/backgrounds/zone_home_clean.png",

        // Zone backgrounds (fallbacks if not in EntityRegistry)
        "zone_bone_valley": "images/backgrounds/zone_bone_valley_clean.png",
        "zone_crossroads": "images/backgrounds/zone_crossroads_clean.png",
        "zone_dead_woods": "images/backgrounds/zone_dead_woods_clean.png",
        "zone_iron_ridge": "images/backgrounds/zone_iron_ridge_clean.png",
        "zone_mud_flats": "images/backgrounds/zone_mud_flats_clean.png",
        "zone_quarry_fields": "images/backgrounds/zone_quarry_fields_clean.png",
        "zone_scrap_yard": "images/backgrounds/zone_scrap_yard_clean.png",
        "zone_the_ruins": "images/backgrounds/zone_the_ruins_clean.png",

        // Buildings (building_[type]_[tier] convention)
        "building_residential_01": "images/buildings/building_residential_01_clean.png",
        "building_industrial_01": "images/buildings/building_industrial_01_clean.png",

        // Fallback tools
        "tool_t1_01": "images/equipment/tools/tool_t1_01_original.png"
    },

    /**
     * Initialize the asset loader
     * EntityRegistry must be loaded first (handled by SystemConfig priority)
     */
    async init() {
        Logger.info(`[AssetLoader] Initialized (${Object.keys(this.staticAssets).length} static assets, EntityRegistry lookup enabled)`);
        return true;
    },

    /**
     * Get image path by ID
     * Priority: EntityRegistry → static assets → pattern-based fallback → placeholder
     * @param {string} id - Asset ID
     * @returns {string} - File path
     */
    getImagePath(id) {
        // 1. Try static assets first (fastest)
        if (this.staticAssets[id]) {
            return this.basePath + this.staticAssets[id];
        }

        // 2. Try EntityRegistry lookup
        const entityPath = this._getEntityImagePath(id);
        if (entityPath) {
            return this.basePath + entityPath;
        }

        // 3. Pattern-based fallback (construct path from ID conventions)
        const patternPath = this._constructPathFromId(id);
        if (patternPath) {
            return this.basePath + patternPath;
        }

        // 4. Fallback to placeholder
        Logger.warn(`[AssetLoader] Unknown asset ID: ${id}`);
        return this.basePath + 'images/PH.png';
    },

    /**
     * Construct image path from entity ID patterns
     * Handles: enemy_*, enemy_herbivore_*, enemy_dinosaur_*, npc_*, weapon_*, tool_*, etc.
     * @param {string} id
     * @returns {string|null}
     */
    _constructPathFromId(id) {
        if (!id) return null;

        // Enemy patterns
        if (id.startsWith('enemy_herbivore_')) {
            const sprite = id.replace('enemy_', '');
            return `images/enemies/${sprite}_original.png`;
        }
        if (id.startsWith('enemy_dinosaur_')) {
            const sprite = id.replace('enemy_', '');
            return `images/enemies/${sprite}_original.png`;
        }
        if (id.startsWith('enemy_human_')) {
            const sprite = id.replace('enemy_', '');
            return `images/enemies/${sprite}_original.png`;
        }
        if (id.startsWith('enemy_mounted_')) {
            const sprite = id.replace('enemy_', '');
            return `images/enemies/${sprite}_original.png`;
        }

        // Boss patterns
        if (id.startsWith('boss_')) {
            return `images/bosses/${id}_original.png`;
        }

        // NPC patterns
        if (id.startsWith('npc_')) {
            return `images/npcs/${id}_original.png`;
        }

        // Equipment patterns - weapons in subtype subfolders (images named weapon_{subtype}_t{tier}_{variant})
        if (id.startsWith('weapon_melee_')) {
            // Extract subtype: weapon_melee_sword_t1_01 -> sword
            const parts = id.split('_');
            const subtype = parts.slice(2, -2).join('_'); // handles war_hammer, war_axe etc.
            // Image naming: weapon_{subtype}_t{tier}_{variant}_original.png in weapons/{subtype}/
            const imageName = `weapon_${subtype}_${parts.slice(-2).join('_')}`;
            return `images/equipment/weapons/${subtype}/${imageName}_original.png`;
        }
        if (id.startsWith('weapon_ranged_')) {
            // Extract subtype: weapon_ranged_pistol_t1_01 -> pistol, sniper_rifle, machine_gun etc.
            const parts = id.split('_');
            const subtype = parts.slice(2, -2).join('_'); // handles sniper_rifle, machine_gun etc.
            // Image naming: weapon_{subtype}_t{tier}_{variant}_original.png in weapons/{subtype}/
            const imageName = `weapon_${subtype}_${parts.slice(-2).join('_')}`;
            return `images/equipment/weapons/${subtype}/${imageName}_original.png`;
        }
        if (id.startsWith('weapon_shield_')) {
            return `images/equipment/shield/${id}_original.png`;
        }
        if (id.startsWith('signature_melee_')) {
            const parts = id.split('_');
            const subtype = parts[2];
            return `images/equipment/signature/melee/${subtype}/${id}_original.png`;
        }
        if (id.startsWith('signature_ranged_')) {
            const parts = id.split('_');
            const subtype = parts[2];
            return `images/equipment/signature/ranged/${subtype}/${id}_original.png`;
        }
        if (id.startsWith('signature_shield_')) {
            return `images/equipment/signature/shield/${id}_original.png`;
        }
        // Armor patterns - slot-based folders
        if (id.startsWith('head_')) {
            return `images/equipment/armor/head/${id}_original.png`;
        }
        if (id.startsWith('chest_') || id.startsWith('torso_')) {
            return `images/equipment/armor/chest/${id}_original.png`;
        }
        if (id.startsWith('body_')) {
            // Body slot uses armor/chest folder (images still named chest_*)
            return `images/equipment/armor/chest/${id.replace('body_', 'chest_')}_original.png`;
        }
        if (id.startsWith('hands_')) {
            return `images/equipment/armor/hands/${id}_original.png`;
        }
        if (id.startsWith('legs_')) {
            return `images/equipment/armor/legs/${id}_original.png`;
        }
        if (id.startsWith('feet_')) {
            return `images/equipment/armor/feet/${id}_original.png`;
        }
        if (id.startsWith('accessory_')) {
            return `images/equipment/${id}_original.png`;
        }
        // Tool patterns - type-based folders
        if (id.startsWith('tool_mining_')) {
            return `images/equipment/tools/mining/${id}_original.png`;
        }
        if (id.startsWith('tool_woodcutting_')) {
            return `images/equipment/tools/woodcutting/${id}_original.png`;
        }
        if (id.startsWith('tool_harvesting_')) {
            return `images/equipment/tools/harvesting/${id}_original.png`;
        }
        if (id.startsWith('tool_fishing_')) {
            return `images/equipment/tools/fishing/${id}_original.png`;
        }

        // Item patterns
        if (id.startsWith('food_') || id.startsWith('leather_') || id.startsWith('bone_') ||
            id.startsWith('wood_') || id.startsWith('iron_') || id.startsWith('stone_') ||
            id.startsWith('scale_') || id.startsWith('feather_') || id.startsWith('horn_')) {
            return `images/items/${id}_original.png`;
        }

        // Node patterns
        if (id.startsWith('node_')) {
            return `images/nodes/${id}_original.png`;
        }

        // Environment patterns
        if (id.startsWith('arch_') || id.startsWith('flora_') || id.startsWith('prop_') ||
            id.startsWith('furniture_') || id.startsWith('building_')) {
            const type = id.split('_')[0];
            return `images/environment/${type}/${id}_original.png`;
        }

        // Background patterns
        if (id.startsWith('bg_zone_')) {
            return `images/backgrounds/${id.replace('bg_', '')}_clean.png`;
        }

        return null;
    },

    /**
     * Look up image path from EntityRegistry
     * Searches all entity categories for matching ID
     * @param {string} id - Asset ID
     * @returns {string|null} - Path or null if not found
     */
    _getEntityImagePath(id) {
        if (!EntityRegistry) return null;

        // Map of search patterns to categories
        // NOTE: equipment excluded - paths handled by _constructPathFromId with new subfolder structure
        const categories = [
            'enemies', 'bosses', 'nodes', 'resources',
            'items', 'npcs', 'environment'
        ];

        for (const category of categories) {
            const registry = EntityRegistry[category];
            if (!registry) continue;

            // Direct ID match
            if (registry[id]?.files) {
                return this._selectBestPath(registry[id].files);
            }

            // Try with category prefix (e.g., "dinosaur_t1_01" → "enemy_dinosaur_t1_01")
            // This handles sprite ID lookups
        }

        // Special case: hero
        if (id === 'hero' && EntityRegistry.hero?.files) {
            return this._selectBestPath(EntityRegistry.hero.files);
        }

        return null;
    },

    /**
     * Select best available path from files object
     * Priority: clean → approved_original → original
     * @param {object} files - Files object with clean/original paths
     * @returns {string} - Best available path
     */
    _selectBestPath(files) {
        if (files.clean) return files.clean.replace('assets/', '');
        if (files.approved_original) return files.approved_original.replace('assets/', '');
        if (files.original) return files.original.replace('assets/', '');
        return null;
    },

    /**
     * Get fallback path for an asset (converts _clean to _original)
     * @param {string} primaryPath - The primary path
     * @returns {string|null} - Fallback path or null
     */
    getOriginalPath(primaryPath) {
        if (!primaryPath) return null;

        if (primaryPath.includes('_clean')) {
            return primaryPath.replace('_clean', '_original');
        }
        if (primaryPath.includes('_approved_original')) {
            return primaryPath.replace('_approved_original', '_original');
        }
        return null;
    },

    /**
     * Get cached image object
     * @param {string} id
     * @returns {HTMLImageElement|null}
     */
    getImage(id) {
        const path = this.getImagePath(id);
        return this.cache.get(path) || null;
    },

    /**
     * Create an image element with fallback chain
     * Automatically removes white backgrounds from all images
     * @param {string} src - Primary image source path
     * @param {function} onLoad - Optional callback when loaded
     * @returns {HTMLImageElement}
     */
    createImage(src: string, onLoad?: () => void): HTMLImageElement {
        const img = new Image();
        const fallback = this.getOriginalPath(src);
        const self = this;

        img.onerror = () => {
            if (fallback && img.src !== fallback) {
                img.src = fallback;
            } else if (!img.src.includes('PH.png')) {
                img.src = this.basePath + 'images/PH.png';
            }
        };

        img.onload = function () {
            // Skip processing for data URLs (already processed) and placeholder
            if (img.src.startsWith('data:') || img.src.includes('PH.png')) {
                if (onLoad) onLoad();
                return;
            }

            // Remove white background from ALL images
            const processed = self._removeWhiteBackground(img);
            // Replace image source with processed canvas data
            img.src = processed.toDataURL('image/png');
            // Don't retrigger onload for the data URL (handled by startsWith check above)
            if (onLoad) onLoad();
        };

        img.src = src;
        return img;
    },

    /**
     * Preload an image and cache it
     * If image is an _original file (no _clean exists), removes white background
     * @param {string} id - Asset ID
     * @returns {Promise<HTMLImageElement | HTMLCanvasElement>}
     */
    preloadImage(id: string): Promise<HTMLImageElement | HTMLCanvasElement> {
        const path = this.getImagePath(id);

        if (this.cache.has(path)) {
            return Promise.resolve(this.cache.get(path));
        }

        return new Promise((resolve) => {
            const img = this.createImage(path, () => {
                // If loading an _original file, remove white background
                if (path.includes('_original')) {
                    const processed = this._removeWhiteBackground(img);
                    this.cache.set(path, processed);
                    resolve(processed);
                } else {
                    this.cache.set(path, img);
                    resolve(img);
                }
            });
        });
    },

    /**
     * Get audio config (placeholder for future BGM/ambient)
     * @param {string} id
     * @returns {object|null}
     */
    getAudio(id) {
        // Procedural audio handled by ProceduralSFX.js
        // This is only for pre-recorded files (BGM, ambient)
        return null;
    },

    /**
     * Get VFX preset (delegates to VFXController)
     * @param {string} id
     * @returns {object|null}
     */
    getVFXPreset(id) {
        return VFXController?.presets?.[id] || null;
    }
};

// Export for global access
if (Registry) Registry.register('AssetLoader', AssetLoader);

// ES6 Module Export
export { AssetLoader };
