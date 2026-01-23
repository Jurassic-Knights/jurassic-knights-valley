/**
 * Merchant - NPC entity on each island for purchasing upgrades
 *
 * Owner: Director (engine), Gameplay Designer (values)
 */
import { Entity } from '../core/Entity';

// Ambient declarations for not-yet-migrated modules
declare const EntityConfig: any;
declare const EntityTypes: any;
declare const EnvironmentRenderer: any;
declare const MaterialLibrary: any;
declare const AssetLoader: any;

class Merchant extends Entity {
    // Merchant properties
    islandId: string = 'unknown';
    islandName: string = 'Unknown Island';
    interactRadius: number = 140;
    bobTime: number = 0;

    // Sprite caching
    _img: any = null;
    _shadowImg: any = null;
    _imgAssetId: string | null = null;
    _cachedSpriteId: string | null = null;
    _iconImg: any = null;

    constructor(config: any = {}) {
        // 1. Load Config
        const defaults =
            EntityConfig && EntityConfig.npc ? EntityConfig.npc.merchant?.defaults || {} : {};
        const finalConfig = { ...defaults, ...config };

        super({
            entityType: EntityTypes.MERCHANT,
            width: finalConfig.width || 186,
            height: finalConfig.height || 186,
            color: finalConfig.color || '#8E44AD', // Purple - merchant color
            ...config
        });

        this.islandId = config.islandId || 'unknown';
        this.islandName = config.islandName || 'Unknown Island';
        this.interactRadius = finalConfig.interactRadius || 140;

        // Animation timer
        this.bobTime = 0;
    }

    /**
     * Update merchant (idle animation)
     * @param {number} dt - Delta time in ms
     */
    update(dt: number) {
        this.bobTime += dt / 1000;
    }

    /**
     * Check if hero is in range to interact
     * @param {Hero} hero
     * @returns {boolean}
     */
    isInRange(hero: any) {
        if (!this.active || !hero) return false;
        return this.distanceTo(hero) < this.interactRadius;
    }

    /**
     * Get the sprite asset ID based on zone theme
     * Maps to numbered IDs: npc_merchant_01 through npc_merchant_08
     */
    getSpriteId() {
        if (!this.islandName) return 'npc_merchant_04'; // Default: Crossroads
        const name = this.islandName.toLowerCase();

        // Biome to numbered ID mapping
        if (name.includes('home'))
            return 'npc_merchant_04'; // No home merchant, use crossroads
        else if (name.includes('quarry')) return 'npc_merchant_01';
        else if (name.includes('iron')) return 'npc_merchant_02';
        else if (name.includes('dead')) return 'npc_merchant_03';
        else if (name.includes('cross')) return 'npc_merchant_04';
        else if (name.includes('scrap')) return 'npc_merchant_05';
        else if (name.includes('mud')) return 'npc_merchant_06';
        else if (name.includes('bone')) return 'npc_merchant_07';
        else if (name.includes('ruins')) return 'npc_merchant_08';

        return 'npc_merchant_04'; // Default: Crossroads
    }

    /**
     * Draw shadow for merchant (called by GameRenderer shadow pass)
     */
    drawShadow(ctx: CanvasRenderingContext2D, forceOpaque = false) {
        if (!this.active || !this._img) return;

        // Standard Shadow config
        const env = EnvironmentRenderer;
        let scaleY = 0.3;
        let alpha = 0.3;
        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        const size = 186; // Match Hero size

        // 1. Static Contact Shadow
        ctx.save();
        ctx.translate(this.x, this.y + size / 2 - 6);

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = size * 0.4;
        const contactHeight = size * 0.1;

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Shadow
        ctx.save();
        ctx.translate(this.x, this.y + size / 2 - 6);

        const skew = env ? env.shadowSkew || 0 : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        ctx.scale(1, -scaleY);

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = alpha;
        }

        // PERF: Cache shadow image on entity (retry until successful)
        if (!this._shadowImg) {
            if (!this._imgAssetId) {
                this._imgAssetId = this.getSpriteId();
            }
            if (MaterialLibrary && this._imgAssetId) {
                this._shadowImg = MaterialLibrary.get(this._imgAssetId, 'shadow', {});
            }
        }

        if (this._shadowImg) {
            ctx.drawImage(this._shadowImg, -size / 2, -size, size, size);
        }
        // No fallback - skip rendering until shadow loads

        ctx.restore();
    }

    /**
     * Render merchant
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        const bob = Math.sin(this.bobTime * 2) * 3;

        // Try to draw sprite
        if (AssetLoader) {
            // PERF: Cache sprite ID on first call (avoid string ops per frame)
            if (!this._cachedSpriteId) {
                this._cachedSpriteId = this.getSpriteId();
            }
            const id = this._cachedSpriteId;

            // PERF: Only load image once
            if (!this._img) {
                const path = AssetLoader.getImagePath(id);
                if (path) {
                    this._img = AssetLoader.createImage(path);
                    this._imgAssetId = id;
                }
            }

            if (this._img && this._img.complete && this._img.naturalWidth) {
                const size = 186; // Match Hero size

                ctx.save();

                // Sprite (centered)
                ctx.drawImage(this._img, this.x - size / 2, this.y - size / 2 + bob, size, size);

                ctx.restore();

                // PERF: Cache speech bubble icon (only load once)
                if (!this._iconImg) {
                    const iconPath = AssetLoader.getImagePath('ui_icon_speech_bubble');
                    if (iconPath) {
                        this._iconImg = AssetLoader.createImage(iconPath);
                    }
                }

                if (this._iconImg && this._iconImg.complete && this._iconImg.naturalWidth) {
                    const iconSize = 64;
                    const hoverOffset = Math.sin(this.bobTime * 3) * 5;
                    const iconY = this.y - size / 2 - iconSize + 20 + hoverOffset;
                    ctx.drawImage(this._iconImg, this.x - iconSize / 2, iconY, iconSize, iconSize);
                }
                return;
            }
        }

        // No fallback - skip rendering until sprite loads
    }
}

// ES6 Module Export
export { Merchant };
