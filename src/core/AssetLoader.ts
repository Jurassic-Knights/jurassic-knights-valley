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
import { constructPathFromId } from './AssetLoaderPathPatterns';

const SESSION_CACHE_BUSTER = Date.now();

const AssetLoader = {
    cache: new Map(),
    basePath: '/assets/',

    // Threshold for white pixel detection (250-255 catches near-white)
    WHITE_THRESHOLD: GameConstants.Rendering.WHITE_BG_THRESHOLD,

    /** Skip white removal when image exceeds this pixel count to avoid getImageData/toDataURL OOM. */
    MAX_PIXELS_FOR_WHITE_REMOVAL: 2048 * 2048,

    /**
     * Remove white background from an image
     * Used as fallback when _clean.png doesn't exist
     * Skips processing for very large images and catches getImageData OOM.
     * @param {HTMLImageElement} img - Source image
     * @returns {HTMLCanvasElement} - Canvas with transparent background (or unchanged if skipped)
     */
    _removeWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
        const canvas = DOMUtils.createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const pixels = img.width * img.height;
        if (pixels > this.MAX_PIXELS_FOR_WHITE_REMOVAL) {
            return canvas;
        }

        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const threshold = this.WHITE_THRESHOLD;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(imageData, 0, 0);
        } catch {
            // getImageData can throw RangeError (OOM); return canvas with image only
        }
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

    getImagePath(id: string) {
        let finalPath = '';

        // 1. Try static assets first (fastest)
        if (this.staticAssets[id]) {
            finalPath = this.basePath + this.staticAssets[id];
        } else {
            // 2. Try EntityRegistry lookup
            const entityPath = this._getEntityImagePath(id);
            if (entityPath) {
                finalPath = this.basePath + entityPath;
            } else {
                // 3. Pattern-based fallback (construct path from ID conventions)
                const patternPath = constructPathFromId(id);
                if (patternPath) {
                    finalPath = this.basePath + patternPath;
                } else {
                    // 4. Fallback to placeholder
                    Logger.warn(`[AssetLoader] Unknown asset ID: ${id}`);
                    finalPath = this.basePath + 'images/PH.png';
                }
            }
        }

        // In development mode, bust browser cache per session (on page refresh)
        // so edits to source files always show up immediately when developers refresh
        if (import.meta.env && import.meta.env.DEV) {
            return finalPath + `?v=${SESSION_CACHE_BUSTER}`;
        }

        return finalPath;
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
            'environment',
            'hero'
        ];

        for (const cat of categories) {
            const category = cat as keyof typeof EntityRegistry;
            const registry = EntityRegistry[category];
            if (!registry) continue;

            // Direct ID match
            if (registry[id]?.files) {
                return this._selectBestPath(registry[id]!.files as Record<string, string>);
            }

            // Try with category prefix (e.g., "dinosaur_t1_01" → "enemy_dinosaur_t1_01")
            // This handles sprite ID lookups
        }

        // Special case: hero
        if (id === 'hero' && EntityRegistry.hero?.files) {
            return this._selectBestPath(EntityRegistry.hero.files as Record<string, string>);
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

    createImage(src: string, onLoad?: () => void, onError?: () => void): HTMLImageElement {
        const img = new Image();
        const fallback = this.getOriginalPath(src);

        img.onerror = () => {
            if (onError) {
                onError(); // Strict mode: propagate failure
                return;
            }

            if (fallback && img.src !== fallback) {
                img.src = fallback;
            } else if (!img.src.includes('PH.png')) {
                img.src = this.basePath + 'images/PH.png';
            }
        };

        img.onload = () => {
            // Skip processing for data URLs (already processed) and placeholder
            if (img.src.startsWith('data:') || img.src.includes('PH.png')) {
                if (onLoad) onLoad();
                return;
            }
            // Skip processing for large images to avoid getImageData/toDataURL OOM
            const pixels = img.width * img.height;
            if (pixels > this.MAX_PIXELS_FOR_WHITE_REMOVAL) {
                if (onLoad) onLoad();
                return;
            }

            // Remove white background from ALL images
            const processed = this._removeWhiteBackground(img);
            try {
                img.src = processed.toDataURL('image/png');
            } catch {
                // toDataURL can OOM on large canvases; keep original img
            }
            if (onLoad) onLoad();
        };

        img.src = src;
        return img;
    },

    /**
     * Preload an image and cache it
     * If image is an _original file (no _clean exists), removes white background
     * @param {string} id - Asset ID
     * @param {boolean} allowFallback - If true, returns PH.png on missingID. If false, returns null.
     * @returns {Promise<HTMLImageElement | HTMLCanvasElement | null>}
     */
    preloadImage(
        id: string,
        allowFallback: boolean = true
    ): Promise<HTMLImageElement | HTMLCanvasElement | null> {
        const path = this.getImagePath(id);

        if (!allowFallback && path.includes('PH.png')) {
            return Promise.resolve(null);
        }

        if (this.cache.has(path)) {
            return Promise.resolve(this.cache.get(path));
        }

        return new Promise((resolve) => {
            const onLoad = () => {
                // If loading an _original file, remove white background
                // EXCEPTION: Ground textures are opaque tiles, do not process them
                if (path.includes('_original') && !path.includes('/ground/')) {
                    const processed = this._removeWhiteBackground(img);
                    this.cache.set(path, processed);
                    resolve(processed);
                } else {
                    this.cache.set(path, img);
                    resolve(img);
                }
            };

            const onError = !allowFallback ? () => resolve(null) : undefined;

            const img = this.createImage(path, onLoad, onError);
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
        // Procedural audio handled by SFX_Core
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
    },

    /**
     * Get path for the auto-generated Height Map (for blending)
     * @param {string} id - Asset ID
     */
    getHeightMapPath(id: string): string | null {
        const primaryPath = this.getImagePath(id);
        if (!primaryPath) return null;

        // Remove extension, append _height.png
        // Handle _original / _clean variations
        // The script generates [basename]_height.png

        // E.g. assets/images/ground/grass_01_original.png -> assets/images/ground/grass_01_original_height.png
        // Just replace .png with _height.png?
        // Be careful with case sensitivity or other extensions.
        return primaryPath.replace('.png', '_height.png');
    },

    /**
     * Get path for a Chunk Splat Map
     * @param {number} x - Chunk X
     * @param {number} y - Chunk Y
     */
    getSplatMapPath(x: number, y: number): string {
        return this.basePath + `chunks/chunk_${x}_${y}_splat.png`;
    },

    /**
     * Load a Splat Map (RGBA weights)
     * Returns generic image/canvas
     */
    async loadSplatMap(x: number, y: number): Promise<HTMLImageElement | null> {
        const path = this.getSplatMapPath(x, y);
        if (this.cache.has(path)) return this.cache.get(path) as HTMLImageElement;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(path, img);
                resolve(img);
            };
            img.onerror = () => {
                // Return null if no splat map exists (use default blending)
                resolve(null);
            };
            img.src = path;
        });
    }
};

// Export for global access
if (Registry) Registry.register('AssetLoader', AssetLoader);

// ES6 Module Export
export { AssetLoader };
