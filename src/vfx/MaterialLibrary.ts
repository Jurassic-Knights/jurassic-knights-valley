/**
 * MaterialLibrary - Procedural Texture Processor & Cache
 *
 * Generates and caches dynamic variations of existing assets (Materials).
 * Used for:
 * - Outlines (Selection)
 * - Silhouettes (Rarity Glows, Locked State)
 * - Tints (Hit Flashes, Status Effects)
 * - Grayscale (Disabled UI)
 *
 * Architecture:
 * - Singleton
 * - Uses Offscreen Canvas for processing
 * - Caches results by a unique signature key
 *
 * Owner: VFX Specialist
 */

import { Registry } from '@core/Registry';
import { AssetLoader } from '@core/AssetLoader';
import { Logger } from '@core/Logger';
import { DOMUtils } from '@core/DOMUtils';

interface OutlineParams {
    color?: string;
    thickness?: number;
}

interface SilhouetteParams {
    color?: string;
}

interface TintParams {
    color?: string;
    opacity?: number;
    mode?: GlobalCompositeOperation;
}

type MaterialParams = OutlineParams & SilhouetteParams & TintParams;

type MaterialProcessor = (source: HTMLImageElement, params: MaterialParams) => HTMLCanvasElement;

const MaterialLibrary = {
    cache: new Map<string, HTMLCanvasElement | HTMLImageElement>(),

    /**
     * Get a processed material (Canvas/Image)
     * @param {string} assetId - The source asset ID (e.g. 'ui_icon_gold')
     * @param {string} material - Material type ('outline', 'silhouette', 'tint', 'grayscale')
     * @param {object} params - Material parameters
     * @param {HTMLImageElement} [sourceOverride] - Optional source image if not in AssetLoader
     * @returns {HTMLCanvasElement|HTMLImageElement|null} - Processed image or null if not ready
     */
    get(assetId: string, material: string, params: MaterialParams = {}, sourceOverride: HTMLImageElement | null = null) {
        // 1. Get Source
        let source = sourceOverride;
        if (!source && AssetLoader) {
            source = AssetLoader.getImage(assetId);
        }

        if (!source || !source.complete || source.naturalWidth === 0) return null;

        // 2. Generate Cache Key
        const key = this._generateKey(assetId, material, params);

        // 3. Check Cache
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // 4. Validate Processor
        // Explicit mapping to avoid any cast and ensure types
        let processor: MaterialProcessor | undefined;

        switch (material) {
            case 'outline': processor = this.outline.bind(this); break;
            case 'silhouette': processor = this.silhouette.bind(this); break;
            case 'tint': processor = this.tint.bind(this); break;
            case 'grayscale': processor = (s) => this.grayscale(s); break; // Wrapper for different signature
            case 'shadow': processor = (s) => this.shadow(s); break;
        }

        if (!processor) {
            Logger.warn(`[MaterialLibrary] Unknown material: ${material}`);
            return source;
        }

        const result = processor(source, params);
        if (result) {
            this.cache.set(key, result);
        }

        return result;
    },

    /**
     * Generate unique cache string
     * Optimized to avoid JSON.stringify for common cases
     */
    _generateKey(id: string, mat: string, params: MaterialParams) {
        // Fast path: empty params object (common for shadows)
        const keys = Object.keys(params);
        if (keys.length === 0) {
            return `${id}:${mat}`;
        }
        // Fast path: single color param (common for silhouette/tint)
        if (keys.length === 1 && keys[0] === 'color') {
            return `${id}:${mat}:${params.color}`;
        }
        // Slow path: full serialization
        return `${id}:${mat}:${JSON.stringify(params)}`;
    },

    /**
     * Helper: Create offscreen canvas of same size
     */
    _createCanvas(w: number, h: number) {
        return DOMUtils.createCanvas(w, h);
    },

    // =========================================================================
    // MATERIAL PROCESSORS
    // =========================================================================

    /**
     * Outline Effect
     * @param {HTMLImageElement} source
     * @param {object} params { color: '#FFF', thickness: 2 }
     */
    outline(source: HTMLImageElement, params: OutlineParams): HTMLCanvasElement {
        const color = params.color || '#FFFFFF';
        const thickness = params.thickness || 2;

        // Canvas must be larger to accommodate outline
        const w = source.width + thickness * 2;
        const h = source.height + thickness * 2;
        const canvas = this._createCanvas(w, h);
        const ctx = canvas.getContext('2d');

        if (!ctx) return canvas;

        // Center offset
        const dx = thickness;
        const dy = thickness;

        // 1. Draw Silhouette of the outline color (Offset in 8 directions for quality)
        ctx.save();

        // Generate a solid silhouette first to optimize (instead of drawing image 8 times)
        // Draw image, composite source-in color
        const sCanvas = this._createCanvas(source.width, source.height);
        const sCtx = sCanvas.getContext('2d');
        if (sCtx) {
            sCtx.drawImage(source, 0, 0);
            sCtx.globalCompositeOperation = 'source-in';
            sCtx.fillStyle = color;
            sCtx.fillRect(0, 0, source.width, source.height);

            // Draw the silhouette in directions
            // Corners + Cardinal (8-way) for smooth thick lines
            const offsets = [
                [-1, -1],
                [0, -1],
                [1, -1],
                [-1, 0],
                [1, 0],
                [-1, 1],
                [0, 1],
                [1, 1]
            ];

            for (const [ox, oy] of offsets) {
                ctx.drawImage(sCanvas, dx + ox * thickness, dy + oy * thickness);
            }
        }

        ctx.restore();

        // 2. Draw Source Image on top
        ctx.drawImage(source, dx, dy);

        return canvas;
    },

    /**
     * Solid Silhouette (e.g. for rarity glows behind item)
     * @param {HTMLImageElement} source
     * @param {object} params { color: '#F00' }
     */
    silhouette(source: HTMLImageElement, params: SilhouetteParams): HTMLCanvasElement {
        const color = params.color || '#000000';

        const canvas = this._createCanvas(source.width, source.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) return canvas;

        // Draw source
        ctx.drawImage(source, 0, 0);

        // Tint full solid
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas;
    },

    /**
     * Color Tint (Overlay)
     * Use for Hit Flash (white), Status Effects (Green poison)
     * @param {HTMLImageElement} source
     * @param {object} params { color: '#FFF', opacity: 0.5, mode: 'source-atop' }
     */
    tint(source: HTMLImageElement, params: TintParams): HTMLCanvasElement {
        const color = params.color || '#FFFFFF';
        const opacity = params.opacity !== undefined ? params.opacity : 0.5;
        const mode = params.mode || 'source-atop'; // source-atop keeps alpha of source

        const canvas = this._createCanvas(source.width, source.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) return canvas;

        // Draw Source
        ctx.drawImage(source, 0, 0);

        // Apply Tint
        ctx.globalCompositeOperation = mode;
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas;
    },

    /**
     * Grayscale (Desaturation)
     * @param {HTMLImageElement} source
     */
    grayscale(source: HTMLImageElement): HTMLCanvasElement {
        const canvas = this._createCanvas(source.width, source.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) return canvas;

        // Standard draw
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(source, 0, 0);
        ctx.filter = 'none';

        return canvas;
    },

    /**
     * Shadow Silhouette (Optimized for performance)
     * Hard blacks out the image for use as a projected shadow.
     * @param {HTMLImageElement} source
     */
    shadow(source: HTMLImageElement): HTMLCanvasElement {
        // Reuse silhouette logic with black color, explicit naming for clarity
        return this.silhouette(source, { color: '#000000' });
    }
};

// Export
if (Registry) Registry.register('MaterialLibrary', MaterialLibrary);

// ES6 Module Export
export { MaterialLibrary };
