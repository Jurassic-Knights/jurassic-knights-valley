/**
 * HeroRenderer - Dedicated rendering system for the player character
 *
 * Extracted from Hero.js to separate logic from presentation.
 * Uses RenderConfig for constants.
 */

import { Logger } from '@core/Logger';
import { RenderConfig } from '@config/RenderConfig';
import { MaterialLibrary } from '@vfx/MaterialLibrary';
import { AssetLoader } from '@core/AssetLoader';
import { Registry } from '@core/Registry';
import { EntityRegistry } from '@entities/EntityLoader';
import { DOMUtils } from '@core/DOMUtils';
import { environmentRenderer } from './EnvironmentRenderer';
import { drawStatusBars } from './HeroRendererStatusBars';
import { drawRangeCircles } from './HeroRendererRangeCircles';
import { drawShadow } from './HeroRendererShadow';
import { drawWeapon } from './HeroRendererWeapon';
import { Hero } from '../gameplay/Hero';
import type { IEntity, IGame, ISystem } from '../types/core';

class HeroRendererSystem implements ISystem {
    // Cached image properties
    private _heroPath: string | null = null;
    private _heroImg: HTMLImageElement | null = null;
    private _heroCanvas: HTMLCanvasElement | null = null;
    private _heroW: number | null = null;
    private _heroH: number | null = null;
    private _shadowImg: HTMLImageElement | HTMLCanvasElement | null = null;

    constructor() {
        Logger.info('[HeroRenderer] Initialized');
    }

    /** System initialization */
    init(game: IGame): void {
        // No specific init logic needed yet
    }

    /**
     * Set the hero skin - clears cached images and loads new skin
     * @param {string} skinId - Hero skin ID (e.g., 'hero_t1_01')
     */
    setSkin(skinId: string) {
        // Get skin data from EntityRegistry
        const skinData = EntityRegistry?.hero?.[skinId];
        if (!skinData) {
            Logger.warn(`[HeroRenderer] Skin not found: ${skinId}`);
            return;
        }

        // Build image path from skin files
        let path = null;
        if (skinData.files?.clean) {
            path = 'assets/' + skinData.files.clean;
        } else if (skinData.files?.original) {
            path = 'assets/' + skinData.files.original;
        }

        if (!path) {
            Logger.warn(`[HeroRenderer] No image path for skin: ${skinId}`);
            return;
        }

        // Clear all cached images to force reload
        this._heroPath = path;
        this._heroImg = null;
        this._heroCanvas = null;
        this._heroW = null;
        this._heroH = null;
        this._shadowImg = null;

        Logger.info(`[HeroRenderer] Skin changed to: ${skinId} -> ${path}`);
    }

    /**
     * Render the hero and their equipped weapon
     * @param {CanvasRenderingContext2D} ctx
     * @param {Hero} hero
     */
    render(ctx: CanvasRenderingContext2D, hero: Hero, includeShadow = true, alpha = 1) {
        if (!hero || !hero.active) return;

        // Interpolation
        const prevX = (hero.prevX !== undefined) ? hero.prevX : hero.x;
        const prevY = (hero.prevY !== undefined) ? hero.prevY : hero.y;

        const renderX = prevX + (hero.x - prevX) * alpha;
        const renderY = prevY + (hero.y - prevY) * alpha;

        const originalX = hero.x;
        const originalY = hero.y;

        // Apply interpolated coordinates for rendering
        const heroPos = hero as { x: number; y: number };
        heroPos.x = renderX;
        heroPos.y = renderY;

        try {
            if (includeShadow) {
                this._ensureShadowImg();
                drawShadow(ctx, hero, {
                    shadowImg: this._shadowImg,
                    forceOpaque: false
                });
            }

            drawRangeCircles(ctx, hero);

            this.drawBody(ctx, hero);

            drawWeapon(ctx, hero);

            drawStatusBars(ctx, hero);
        } finally {
            // Restore actual physics coordinates
            const heroPos = hero as { x: number; y: number };
            heroPos.x = originalX;
            heroPos.y = originalY;
        }
    }

    private _ensureShadowImg(): void {
        if (!this._shadowImg && MaterialLibrary) {
            this._shadowImg = MaterialLibrary.get('world_hero', 'shadow', {});
        }
    }

    /** For ShadowRenderer compatibility */
    drawShadow(ctx: CanvasRenderingContext2D, hero: Hero, forceOpaque = false) {
        this._ensureShadowImg();
        drawShadow(ctx, hero, { shadowImg: this._shadowImg, forceOpaque });
    }

    /**
     * Draw the main hero sprite
     */
    drawBody(ctx: CanvasRenderingContext2D, hero: Hero) {
        // PERF: Cache heroPath on renderer - use saved skin or default
        if (!this._heroPath) {
            const savedSkin = localStorage.getItem('heroSelectedSkin') || 'hero_t1_01';
            const skinData = EntityRegistry?.hero?.[savedSkin];

            if (skinData?.files?.clean) {
                this._heroPath = 'assets/' + skinData.files.clean;
            } else if (skinData?.files?.original) {
                this._heroPath = 'assets/' + skinData.files.original;
            } else if (AssetLoader) {
                // Fallback to world_hero asset
                this._heroPath = AssetLoader.getImagePath('world_hero');
            }
        }

        if (this._heroPath) {
            // Lazy load image on the renderer instance
            if (!this._heroImg) {
                this._heroImg = AssetLoader.createImage(this._heroPath);
            }

            // Wait for image to be fully processed (white removal converts src to data URL)
            const isProcessed =
                this._heroImg.src.startsWith('data:') || this._heroImg.src.includes('PH.png');
            const isLoaded = this._heroImg.complete && this._heroImg.naturalWidth;

            if (isLoaded && isProcessed) {
                // PERF: Cache scaled sprite to avoid expensive resizing every frame
                // Invalidate cache if dimensions change
                if (
                    !this._heroCanvas ||
                    this._heroW !== hero.width ||
                    this._heroH !== hero.height
                ) {
                    this._heroW = hero.width;
                    this._heroH = hero.height;
                    this._heroCanvas = DOMUtils.createCanvas(hero.width, hero.height);
                    const c = this._heroCanvas.getContext('2d');
                    c.imageSmoothingEnabled = false;
                    c.drawImage(this._heroImg, 0, 0, hero.width, hero.height);
                }

                ctx.drawImage(this._heroCanvas, hero.x - hero.width / 2, hero.y - hero.height / 2);
            }
        }
        // No fallback - skip rendering until sprite loads
    }
}

// Create singleton and export
const HeroRenderer = new HeroRendererSystem();
if (Registry) Registry.register('HeroRenderer', HeroRenderer);

export { HeroRendererSystem, HeroRenderer };
