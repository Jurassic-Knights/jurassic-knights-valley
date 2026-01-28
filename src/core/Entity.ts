/**
 * Entity - Base class for all game objects
 *
 * Owner: Director
 */

import { RenderConfig } from '@config/RenderConfig';
import { MaterialLibrary } from '@vfx/MaterialLibrary';
import { AssetLoader } from './AssetLoader';
import { environmentRenderer } from '../rendering/EnvironmentRenderer';
import { Registry } from './Registry';

class Entity {
    // Class properties
    id: string;
    entityType: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    sprite: HTMLImageElement | null;
    active: boolean;
    islandGridX?: number;
    islandGridY?: number;

    /** IEntity interface compliance - returns entityType */
    get type(): string {
        return this.entityType;
    }

    /**
     * Create an entity
     * @param {object} config - Entity configuration
     */
    constructor(config: any = {}) {
        this.id = config.id || `entity_${Date.now()}`;
        this.entityType = config.entityType || 'entity'; // For type checking instead of constructor.name
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 32;
        this.height = config.height || 32;
        this.color = config.color || '#888888';
        this.sprite = config.sprite || null; // Asset ID
        this.active = true;

        // Grid coordinates (optional)
        if (config.islandGridX !== undefined) this.islandGridX = config.islandGridX;
        if (config.islandGridY !== undefined) this.islandGridY = config.islandGridY;
    }

    /**
     * Draw a generic drop shadow under the entity
     * @param {CanvasRenderingContext2D} ctx
     */
    drawShadow(ctx: CanvasRenderingContext2D, forceOpaque = false) {
        if (!this.active) return;

        // Check for RenderConfig before using (fallback for safety)
        if (RenderConfig && RenderConfig.Hero) {
            const shadowWidth = this.width * (RenderConfig.Hero.SHADOW_SCALE_X || 0.5);
            const shadowHeight = shadowWidth * (RenderConfig.Hero.SHADOW_SCALE_Y || 0.3);
            const yOffset = RenderConfig.Hero.SHADOW_OFFSET_Y || -5;

            ctx.save();
            // If forcing opaque (shadow pass), use fully opaque black
            if (forceOpaque) {
                ctx.fillStyle = 'black';
                ctx.globalAlpha = 1.0;
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            }

            ctx.beginPath();
            ctx.ellipse(
                this.x,
                this.y + this.height / 2 + yOffset,
                shadowWidth / 2,
                shadowHeight / 2,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
            return;
        }

        // Check environmentRenderer singleton for dynamic shadows
        const env = environmentRenderer;

        // Default values if system missing
        let scaleY = 0.3;
        let alpha = 0.3;

        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        // Shadow dimensions based on entity size
        // Using this.width and this.height directly in calculations below

        // 1. Static Contact Shadow (Grounding Circle)
        ctx.save();
        ctx.translate(this.x, this.y + this.height / 2 - 6); // Nudge up

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = this.width * 0.6;
        const contactHeight = this.height * 0.15; // Flat oval

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Projected Shadow
        ctx.save();

        // Position at feet (Pivot Point)
        ctx.translate(this.x, this.y + this.height / 2 - 6); // Nudge up

        // Apply Skew (Sun Direction)
        const skew = env ? env.shadowSkew || 0 : 0;
        // Skew X: transform(1, 0, skew, 1, 0, 0)
        // We apply skew before flip, so positive skew leans right (West?), negative leans left (East?)
        // EnvironmentRenderer calculation: (0.5 - time) * 3.
        // Dawn (0.25): +0.75. Leans Right.
        // Dusk (0.75): -0.75. Leans Left.
        ctx.transform(1, 0, skew, 1, 0, 0);

        // Apply Dynamic Transform
        // 1. Scale Y to squash/stretch
        // 2. Flip Y (-scaleY) to project downwards (away from feet) from the pivot
        ctx.scale(1, -scaleY);

        // Draw Shadow (Silhouette)
        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = alpha;
        }

        // Optimize: Use cached silhouette from MaterialLibrary if available
        let shadowImg: HTMLCanvasElement | HTMLImageElement | null = null;
        if (this.sprite && MaterialLibrary) {
            // We need to pass the loaded image if AssetLoader doesn't have it indexed (shouldn't happen often)
            // But MaterialLibrary handles AssetLoader lookups.
            shadowImg = MaterialLibrary.get(this.sprite, 'shadow');
        }

        if (shadowImg) {
            // Draw cached shadow silhouette
            // Anchor at bottom (feet) so it projects "up" into the negative Y space
            // which is flipped to positive Y (shadow on ground) by scale(1, -scaleY)
            ctx.drawImage(shadowImg, -this.width / 2, -this.height, this.width, this.height);
        } else if (this.sprite && AssetLoader) {
            // Fallback: simple oval logic if sprite not ready
            // Skip duplicate oval if contact shadow is enough, but dynamic is crucial for time.
            // Just skip fallback oval here to avoid "double oval" look if contact shadow exists.
        } else {
            // Fallback oval - skip
        }

        ctx.restore();
    }

    /**
     * Update entity (override in subclass)
     * @param {number} dt - Delta time in ms
     */
    update(_dt) {
        // Override in subclass
    }

    /**
     * Render entity
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        if (!this.active) return;

        // Draw sprite if available, else colored rectangle
        if (this.sprite && AssetLoader) {
            const img = AssetLoader.getImage(this.sprite);
            if (img) {
                ctx.drawImage(
                    img,
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
                return;
            }
        }

        // Fallback: colored rectangle
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    /**
     * Get bounding box for collision detection
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getBounds() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Check collision with another entity
     * @param {Entity} other
     * @returns {boolean}
     */
    collidesWith(other) {
        const a = this.getBounds();
        const b = other.getBounds();

        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    /**
     * Get distance to another entity
     * @param {Entity} other
     * @returns {number}
     */
    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// ES6 Module Export
export { Entity };
