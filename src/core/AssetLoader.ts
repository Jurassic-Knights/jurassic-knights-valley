/**
 * AssetLoader - Lightweight asset loading system
 *
 * Reads image paths from EntityRegistry (entity JSONs already have file paths).
 * Only maintains a small static registry for non-entity assets (UI, VFX, world).
 *
 * Owner: Director
 */

import { Logger } from './Logger';
import { EntityRegistry } from '@entities/EntityLoader';
import { VFXController } from '@vfx/VFXController';
import { Registry } from './Registry';
import { DOMUtils } from './DOMUtils';
import { AssetManifest } from '@config/AssetManifest';
import { GameConstants } from '@data/GameConstants';
import { ParticleOptions } from '../types/vfx';

// VFXController accessed lazily to avoid circular imports

const ID_PATTERNS = [
    // Enemies
    {
        matches: (id: string) =>
            id.startsWith('enemy_herbivore_') ||
            id.startsWith('enemy_dinosaur_') ||
            id.startsWith('enemy_human_') ||
            id.startsWith('enemy_mounted_'),
        build: (id: string) => `images/enemies/${id.replace('enemy_', '')}_original.png`
    },
    // Bosses & NPCs
    { matches: (id: string) => id.startsWith('boss_'), build: (id: string) => `images/bosses/${id}_original.png` },
    { matches: (id: string) => id.startsWith('npc_'), build: (id: string) => `images/npcs/${id}_original.png` },

    // Weapons (Complex Subtypes)
    {
        matches: (id: string) => id.startsWith('weapon_melee_') || id.startsWith('weapon_ranged_'),
        build: (id: string) => {
            const parts = id.split('_');
            const subtype = parts.slice(2, -2).join('_');
            const imageName = `weapon_${subtype}_${parts.slice(-2).join('_')}`;
            return `images/equipment/weapons/${subtype}/${imageName}_original.png`;
        }
    },
    {
        matches: (id: string) => id.startsWith('weapon_shield_'),
        build: (id: string) => `images/equipment/shield/${id}_original.png`
    },

    // Signatures
    {
        matches: (id: string) =>
            id.startsWith('signature_melee_') || id.startsWith('signature_ranged_'),
        build: (id: string) => {
            const parts = id.split('_');
            const subtype = parts[2];
            return `images/equipment/signature/${parts[1]}/${subtype}/${id}_original.png`;
        }
    },
    {
        matches: (id: string) => id.startsWith('signature_shield_'),
        build: (id: string) => `images/equipment/signature/shield/${id}_original.png`
    },

    // Armor
    {
        matches: (id: string) => id.startsWith('head_'),
        build: (id: string) => `images/equipment/armor/head/${id}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('chest_') || id.startsWith('torso_'),
        build: (id: string) => `images/equipment/armor/chest/${id}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('body_'),
        build: (id: string) =>
            `images/equipment/armor/chest/${id.replace('body_', 'chest_')}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('hands_'),
        build: (id: string) => `images/equipment/armor/hands/${id}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('legs_'),
        build: (id: string) => `images/equipment/armor/legs/${id}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('feet_'),
        build: (id: string) => `images/equipment/armor/feet/${id}_original.png`
    },
    {
        matches: (id: string) => id.startsWith('accessory_'),
        build: (id: string) => `images/equipment/${id}_original.png`
    },

    // Tools
    {
        matches: (id: string) => id.startsWith('tool_'),
        build: (id: string) => {
            const type = id.split('_')[1]; // mining, woodcutting, etc
            return `images/equipment/tools/${type}/${id}_original.png`;
        }
    },

    // Items (Materials)
    {
        matches: (id: string) =>
            /^(food|leather|bone|wood|iron|stone|scale|feather|horn)_/.test(id),
        build: (id: string) => `images/items/${id}_original.png`
    },

    // Nodes
    {
        matches: (id: string) => id.startsWith('node_'),
        build: (id: string) => `images/nodes/${id}_original.png`
    },

    // Environment
    {
        matches: (id: string) =>
            /^(arch|flora|prop|furniture|building)_/.test(id),
        build: (id: string) => {
            const type = id.split('_')[0];
            return `images/environment/${type}/${id}_original.png`;
        }
    },

    // Backgrounds
    {
        matches: (id: string) => id.startsWith('bg_zone_'),
        build: (id: string) => `images/backgrounds/${id.replace('bg_', '')}_clean.png`
    }
];

const AssetLoader = {
    cache: new Map(),
    basePath: '/assets/',

    // Threshold for white pixel detection (250-255 catches near-white)
    WHITE_THRESHOLD: GameConstants.Rendering.WHITE_BG_THRESHOLD,

    /**
     * Remove white background from an image
     * Used as fallback when _clean.png doesn't exist
     * @param {HTMLImageElement} img - Source image
     * @returns {HTMLCanvasElement} - Canvas with transparent background
     */
    _removeWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
        const canvas = DOMUtils.createCanvas(img.width, img.height);
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
    staticAssets: AssetManifest,


    /**
     * Initialize the asset loader
     * EntityRegistry must be loaded first (handled by SystemConfig priority)
     */
    async init() {
        Logger.info(
            `[AssetLoader] Initialized (${Object.keys(this.staticAssets).length} static assets, EntityRegistry lookup enabled)`
        );
        return true;
    },

    /**
     * Get image path by ID
     * Priority: EntityRegistry → static assets → pattern-based fallback → placeholder
     * @param {string} id - Asset ID
     * @returns {string} - File path
     */
    getImagePath(id: string) {
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
    _constructPathFromId(id: string) {
        if (!id) return null;

        for (const pattern of ID_PATTERNS) {
            if (pattern.matches(id)) {
                return pattern.build(id);
            }
        }
        return null;
    },

    /**
     * Look up image path from EntityRegistry
     * Searches all entity categories for matching ID
     * @param {string} id - Asset ID
     * @returns {string|null} - Path or null if not found
     */
    _getEntityImagePath(id: string) {
        if (!EntityRegistry) return null;

        // Map of search patterns to categories
        // NOTE: equipment excluded - paths handled by _constructPathFromId with new subfolder structure
        const categories = [
            'enemies',
            'bosses',
            'nodes',
            'resources',
            'items',
            'npcs',
            'environment'
        ];

        for (const cat of categories) {
            const category = cat as keyof typeof EntityRegistry;
            const registry = EntityRegistry[category];
            if (!registry) continue;

            // Direct ID match
            if (registry[id]?.files) {
                return this._selectBestPath((registry[id]!.files as Record<string, string>));
            }

            // Try with category prefix (e.g., "dinosaur_t1_01" → "enemy_dinosaur_t1_01")
            // This handles sprite ID lookups
        }

        // Special case: hero
        if (id === 'hero' && EntityRegistry.hero?.files) {
            return this._selectBestPath((EntityRegistry.hero.files as Record<string, string>));
        }

        return null;
    },

    /**
     * Select best available path from files object
     * Priority: clean → approved_original → original
     * @param {object} files - Files object with clean/original paths
     * @returns {string} - Best available path
     */
    _selectBestPath(files: Record<string, string>) {
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
    getOriginalPath(primaryPath: string) {
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
    getImage(id: string) {
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
    /**
     * Get audio config (placeholder for future BGM/ambient)
     * @param {string} id
     * @returns {null}
     */
    getAudio(_id: string): null {
        // Procedural audio handled by ProceduralSFX.js
        // This is only for pre-recorded files (BGM, ambient)
        return null;
    },

    /**
     * Get VFX preset (delegates to VFXController)
     * @param {string} id
     * @returns {ParticleOptions|null}
     */
    getVFXPreset(id: string): ParticleOptions | null {
        const presets = VFXController?.presets;
        return presets?.[id] || null;
    }
};

// Export for global access
if (Registry) Registry.register('AssetLoader', AssetLoader);

// ES6 Module Export
export { AssetLoader };
