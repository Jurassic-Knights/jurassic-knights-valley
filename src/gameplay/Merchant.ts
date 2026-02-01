/**
 * Merchant - NPC entity on each island for purchasing upgrades
 *
 * Owner: Director (engine), Gameplay Designer (values)
 */
import { Entity } from '@core/Entity';
import { Logger } from '@core/Logger';
import { MaterialLibrary } from '@vfx/MaterialLibrary';
import { AssetLoader } from '@core/AssetLoader';
import { environmentRenderer } from '../rendering/EnvironmentRenderer';
import { EntityTypes } from '@config/EntityTypes';
import { EntityRegistry } from '@entities/EntityLoader';
import { Registry } from '@core/Registry';
import { getConfig } from '@data/GameConstants';
import { EntityScaling } from '../utils/EntityScaling';

// Unmapped modules - need manual import

class Merchant extends Entity {
    // Merchant properties
    registryId: string = 'npc_merchant'; // Required for EntityLoader hot-reload
    islandId: string = 'unknown';
    islandName: string = 'Unknown Island';
    interactRadius: number = 140;
    bobTime: number = 0;
    scale: number = 1.0;

    // Sprite caching
    _img: any = null;
    _shadowImg: any = null;
    _imgAssetId: string | null = null;
    _cachedSpriteId: string | null = null;
    _iconImg: any = null;

    constructor(config: any = {}) {
        // 1. Load Config
        const defaults = {
            gridSize: 1.5,
            width: 192,
            height: 192,
            interactRadius: 140,
            color: '#8E44AD'
        };

        // Determine correct Registry ID based on Island Name (same logic as Sprite ID)
        const islandName = config.islandName || 'Unknown Island';

        // If config provides specific ID, use it. Otherwise derive from island.
        let registryId = config.registryId;
        if (!registryId) {
            const name = islandName.toLowerCase();
            if (name.includes('quarry')) registryId = 'npc_merchant_01';
            else if (name.includes('iron')) registryId = 'npc_merchant_02';
            else if (name.includes('dead')) registryId = 'npc_merchant_03';
            else if (name.includes('cross')) registryId = 'npc_merchant_04';
            else if (name.includes('scrap')) registryId = 'npc_merchant_05';
            else if (name.includes('mud')) registryId = 'npc_merchant_06';
            else if (name.includes('bone')) registryId = 'npc_merchant_07';
            else if (name.includes('ruins')) registryId = 'npc_merchant_08';
            else registryId = 'npc_merchant_04'; // Default
        }

        // Lookup with correct ID
        const typeConfig = EntityRegistry.npcs?.[registryId] || EntityRegistry.environment?.[registryId] || {};

        if (!EntityRegistry.npcs?.[registryId]) {
            Logger.warn(`[Merchant] Registry Lookup FAILED for '${registryId}'. Falling back to defaults.`);
        } else {
            Logger.info(`[Merchant] Registry Lookup SUCCESS for '${registryId}'. Scale: ${typeConfig.scale}`);
        }

        // Calculate size using standard utility
        const size = EntityScaling.calculateSize(config, typeConfig, { width: 192, height: 192 });

        const finalConfig = { ...defaults, ...typeConfig, ...config };

        super({
            entityType: EntityTypes.MERCHANT,
            width: size.width,
            height: size.height,
            color: finalConfig.color || '#8E44AD', // Purple - merchant color
            ...config
        });

        this.scale = size.scale;
        this.registryId = registryId;
        this.islandId = config.islandId || 'unknown';
        this.islandName = islandName;
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
        // Read from config for live dashboard updates
        const radius = getConfig().Interaction?.MERCHANT_RADIUS || this.interactRadius;
        return this.distanceTo(hero) < radius;
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
    /**
     * Draw shadow for merchant (called by GameRenderer shadow pass)
     */
    drawShadow(ctx: CanvasRenderingContext2D, forceOpaque = false) {
        if (!this.active || !this._img) return;

        // Standard Shadow config
        const env = environmentRenderer;
        let scaleY = 0.3;
        let alpha = 0.3;
        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        const size = this.width; // Use actual entity width

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
                // Use entity dimensions (baked scale)
                const width = this.width;
                const height = this.height;

                ctx.save();

                // Sprite (centered)
                // Use height for Y centering to support non-square types
                ctx.drawImage(this._img, this.x - width / 2, this.y - height / 2 + bob, width, height);

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
                    // Fix: Use 'height' or 'width' for positioning, 'size' var is gone
                    const iconY = this.y - height / 2 - iconSize + 20 + hoverOffset;
                    ctx.drawImage(this._iconImg, this.x - iconSize / 2, iconY, iconSize, iconSize);
                }
                return;
            }
        }

        // No fallback - skip rendering until sprite loads
    }
    /**
     * Refresh configuration from EntityRegistry
     */
    refreshConfig() {
        // Find config (Merchants might use island-based logic, or generic NPC logic)
        // For now, look up by generic 'npc_merchant' key or fallback to defaults
        const registryId = this.registryId || 'npc_merchant';
        const typeConfig = EntityRegistry.npcs?.[registryId] || EntityRegistry.environment?.[registryId] || {};

        Logger.info(`[Merchant] Refreshing config for ${registryId}`);

        // Update dimensions using standard utility
        EntityScaling.applyToEntity(this, {}, typeConfig, { width: 192, height: 192 });
    }
}

// ES6 Module Export
export { Merchant };
