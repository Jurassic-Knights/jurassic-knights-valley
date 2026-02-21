/**
 * ResourceRenderer
 * Handles rendering for all resources.
 */

import { Logger } from '@core/Logger';
import { MaterialLibrary } from '@vfx/MaterialLibrary';
import { ProgressBarRenderer } from '@vfx/ProgressBarRenderer';
import { AssetLoader } from '@core/AssetLoader';
import { Registry } from '@core/Registry';
import { environmentRenderer } from './EnvironmentRenderer';
import { Resource } from '../gameplay/Resource';
import { DroppedItem } from '../gameplay/DroppedItem';
import { renderDroppedItem } from './ResourceRendererDropped';
import { ColorPalette } from '@config/ColorPalette';
import { EntityRegistry } from '@entities/EntityLoader';
import { GameConstants } from '@data/GameConstants';
import type { IGame, ISystem } from '../types/core';

class ResourceRendererService implements ISystem {
    constructor() {
        Logger.info('[ResourceRenderer] Initialized');
    }

    init(game: IGame): void { }

    render(ctx: CanvasRenderingContext2D, res: Resource, includeShadow = true) {
        if (!res.active) return;

        // Shadow
        if (includeShadow) {
            this.renderShadow(ctx, res);
        }

        // Shake logic (if damaged) - skipped for simplification or handled by Tween?
        // Check if this resource type uses custom rendering (e.g., trees handled elsewhere)
        const typeConfig =
            EntityRegistry?.nodes?.[res.resourceType] || EntityRegistry?.resources?.[res.resourceType] || {};
        if (typeConfig.skipDefaultRender) return;

        if (res.state === 'depleted') {
            this.renderDepleted(ctx, res);
            return;
        }

        // Active State
        this.renderActive(ctx, res);
    }

    // ... rest of methods ...
    renderShadow(ctx: CanvasRenderingContext2D, res: Resource, forceOpaque = false) {
        // Check environmentRenderer singleton for dynamic shadows
        const env = environmentRenderer;

        let scaleY = 0.3;
        let alpha = 0.3;

        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        // 1. Static Contact Shadow
        ctx.save();
        ctx.translate(res.x, res.y + res.height / 2 - 6);

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = res.width * 0.6;
        const contactHeight = res.height * 0.15;

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Shadow
        ctx.save();
        ctx.translate(res.x, res.y + res.height / 2 - 6);

        const skew = env ? env.shadowSkew || 0 : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        ctx.scale(1, -scaleY); // Flip resource shadows vertical

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'black';
        } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'black';
        }

        // PERF: Cache shadow image on entity (retry until successful)
        if (!res._shadowImg) {
            // Use same asset ID logic as renderActive
            let assetId = null;
            if (res.resourceType && res.resourceType.startsWith('node_')) {
                assetId = res.resourceType;
            } else {
                const entityData =
                    EntityRegistry?.nodes?.[res.resourceType] ||
                    EntityRegistry?.resources?.[res.resourceType];
                if (entityData?.sprite) {
                    assetId = entityData.sprite;
                } else if (entityData?.id) {
                    assetId = entityData.id;
                } else {
                    assetId = res.resourceType;
                }
            }
            if (MaterialLibrary && assetId) {
                res._shadowImg = MaterialLibrary.get(assetId, 'shadow', {});
            }
        }

        if (res._shadowImg) {
            // Draw anchored at bottom center (-w/2, -h)
            ctx.drawImage(res._shadowImg, -res.width / 2, -res.height, res.width, res.height);
        } else {
            // Fallback: Geometric Shadow
            ctx.beginPath();
            ctx.ellipse(0, -res.height / 4, res.width / 2, res.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    renderDepleted(ctx: CanvasRenderingContext2D, res: Resource) {
        // For node_* types, use resourceType directly as base asset ID
        let baseAssetId = null;
        if (res.resourceType && res.resourceType.startsWith('node_')) {
            baseAssetId = res.resourceType;
        } else {
            // Fallback: try EntityRegistry lookup for legacy types
            const entityData =
                EntityRegistry?.nodes?.[res.resourceType] ||
                EntityRegistry?.resources?.[res.resourceType];
            if (entityData?.sprite) {
                baseAssetId = entityData.sprite;
            } else if (entityData?.id) {
                baseAssetId = entityData.id;
            } else {
                baseAssetId = 'world_' + res.resourceType;
            }
        }

        const consumedAssetId = baseAssetId + '_consumed';
        const consumedPath = AssetLoader ? AssetLoader.getImagePath(consumedAssetId) : null;

        // Simple image load logic, in real engine use AssetLoader.get()
        if (consumedPath) {
            // We can't easily cache image on the renderer without a map.
            // Rely on browser caching or check res._consumedImage (legacy data prop)
            if (!res._consumedImage) {
                res._consumedImage = AssetLoader.createImage(consumedPath);
            }
            if (res._consumedImage.complete && res._consumedImage.naturalWidth) {
                ctx.drawImage(
                    res._consumedImage,
                    res.x - res.width / 2,
                    res.y - res.height / 2,
                    res.width,
                    res.height
                );
            }
        } else {
            // Fallback
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#222222';
            ctx.beginPath();
            ctx.arc(res.x, res.y, res.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.arc(res.x, res.y, res.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Use ProgressBarRenderer for Respawn Timer
        if (ProgressBarRenderer && res.respawnTimer > 0 && res.maxRespawnTime > 0) {
            // Calculate percentage (0 to 1 filling up)
            const remaining = res.respawnTimer;
            const total = res.maxRespawnTime;
            const pct = 1 - remaining / total;

            const R = GameConstants.Resource;
            ProgressBarRenderer.draw(ctx, {
                x: res.x - R.HEALTH_BAR_OFFSET_X,
                y: res.y - res.height / 2 - R.HEALTH_BAR_Y_OFFSET,
                width: R.HEALTH_BAR_WIDTH,
                height: R.HEALTH_BAR_HEIGHT,
                percent: pct,
                mode: 'respawn',
                animated: true
            });
        }
    }

    renderActive(ctx: CanvasRenderingContext2D, res: Resource) {
        // For node_* types, use resourceType directly as asset key (matches AssetLoader)
        let assetId = null;
        if (res.resourceType && res.resourceType.startsWith('node_')) {
            assetId = res.resourceType;
        } else {
            // Fallback: try EntityRegistry lookup for legacy types
            const entityData =
                EntityRegistry?.nodes?.[res.resourceType] ||
                EntityRegistry?.resources?.[res.resourceType];
            if (entityData?.sprite) {
                assetId = entityData.sprite;
            } else if (entityData?.id) {
                assetId = entityData.id;
            } else {
                // Last resort: legacy world_ prefix
                assetId = 'world_' + res.resourceType;
            }
        }

        const imagePath = AssetLoader ? AssetLoader.getImagePath(assetId) : null;

        if (imagePath) {
            if (!res._spriteImage) {
                res._spriteImage = AssetLoader.createImage(imagePath);
            }
            if (res._spriteImage.complete && res._spriteImage.naturalWidth) {
                ctx.drawImage(
                    res._spriteImage,
                    res.x - res.width / 2,
                    res.y - res.height / 2,
                    res.width,
                    res.height
                );
                return;
            }
        }

        // Fallback Procedural
        ctx.save();
        ctx.shadowColor = res.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = res.color;
        ctx.beginPath();
        ctx.roundRect(res.x - res.width / 2, res.y - res.height / 2, res.width, res.height, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Letter
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const letter = res.resourceType.charAt(0).toUpperCase();
        ctx.fillText(letter, res.x, res.y);
        ctx.restore();

        // --- Progress Bar (Health) ---
        // Check for health (Component or Direct)
        let currentHealth = 0;
        let maxHealth = 0;

        if (res.components && res.components.health) {
            currentHealth = res.components.health.health;
            maxHealth = res.components.health.maxHealth;
        } else if (res.health !== undefined) {
            currentHealth = res.health;
            maxHealth = res.maxHealth || GameConstants.Combat.DEFAULT_MAX_HEALTH_NPC;
        }

        // Only draw if damaged and not dead
        if (currentHealth < maxHealth && currentHealth > 0) {
            if (ProgressBarRenderer) {
                const pct = currentHealth / maxHealth;
                const R = GameConstants.Resource;
                ProgressBarRenderer.draw(ctx, {
                    x: res.x - R.HEALTH_BAR_OFFSET_X,
                    y: res.y - res.height / 2 - R.HEALTH_BAR_Y_OFFSET,
                    width: R.HEALTH_BAR_WIDTH,
                    height: R.HEALTH_BAR_HEIGHT,
                    percent: pct,
                    mode: 'health',
                    entityId: res.id // For damage trail
                });
            }
        }
    }

    renderDroppedItem(ctx: CanvasRenderingContext2D, item: DroppedItem) {
        renderDroppedItem(ctx, item);
    }
}

// Create singleton and export
const ResourceRenderer = new ResourceRendererService();
if (Registry) Registry.register('ResourceRenderer', ResourceRenderer);

export { ResourceRendererService, ResourceRenderer };
