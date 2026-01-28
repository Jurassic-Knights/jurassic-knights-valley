/**
 * Prop - Static decorative entity
 * Rendered as part of the world environment
 */

import { Entity } from '@core/Entity';
import { AssetLoader } from '@core/AssetLoader';

class Prop extends Entity {
    scale: number;
    _img: HTMLImageElement | null = null;

    constructor(config: any = {}) {
        super({
            width: 80,
            height: 80,
            active: true,
            ...config
        });

        this.scale = config.scale || 1.0;
    }

    /**
     * Render the prop with lazy-loading support
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (!this.active) return;

        // Draw shadow first (underneath)
        // Prop inherits from Entity, which has the dynamic shadow logic.
        this.drawShadow(ctx);

        // Try to get from cache first
        let img = AssetLoader ? AssetLoader.getImage(this.sprite) : null;

        // Lazy load if not in cache but AssetLoader exists
        if (!img && AssetLoader && this.sprite) {
            const path = AssetLoader.getImagePath(this.sprite);
            if (path) {
                // Check if we already started loading this specific instance's image to avoid spam
                if (!this._img) {
                    this._img = AssetLoader.createImage(path);
                }
                if (this._img.complete && this._img.naturalWidth) {
                    img = this._img;
                }
            }
        }

        if (img) {
            // Draw centered
            const w = this.width * this.scale;
            const h = this.height * this.scale;
            ctx.drawImage(img, this.x - w / 2, this.y - h / 2, w, h);
        }
        // No fallback - skip rendering until sprite loads
    }
}

export { Prop };
