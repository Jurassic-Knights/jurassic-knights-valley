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
import { ColorPalette } from '@config/ColorPalette';
import { EntityRegistry } from '@entities/EntityLoader';

class ResourceRendererService {
    constructor() {
        Logger.info('[ResourceRenderer] Initialized');
    }

    render(ctx, res, includeShadow = true) {
        if (!res.active) return;

        // Shadow
        if (includeShadow) {
            this.renderShadow(ctx, res);
        }

        // Shake logic (if damaged) - skipped for simplification or handled by Tween?
        // Check if this resource type uses custom rendering (e.g., trees handled elsewhere)
        const typeConfig = EntityRegistry?.resources?.[res.resourceType] || {};
        if (typeConfig.skipDefaultRender) return;

        if (res.state === 'depleted') {
            this.renderDepleted(ctx, res);
            return;
        }

        // Active State
        this.renderActive(ctx, res);
    }

    // ... rest of methods ...
    renderShadow(ctx, res, forceOpaque = false) {
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

    renderDepleted(ctx, res) {
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

            ProgressBarRenderer.draw(ctx, {
                x: res.x - 50, // Width 100 / 2
                y: res.y - res.height / 2 - 18,
                width: 100,
                height: 14,
                percent: pct,
                mode: 'respawn',
                animated: true
            });
        }
    }

    renderActive(ctx, res) {
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
            currentHealth = res.components.health.current;
            maxHealth = res.components.health.max;
        } else if (res.health !== undefined) {
            currentHealth = res.health;
            maxHealth = res.maxHealth || 100;
        }

        // Only draw if damaged and not dead
        if (currentHealth < maxHealth && currentHealth > 0) {
            if (ProgressBarRenderer) {
                const pct = currentHealth / maxHealth;
                ProgressBarRenderer.draw(ctx, {
                    x: res.x - 50,
                    y: res.y - res.height / 2 - 18,
                    width: 100,
                    height: 14,
                    percent: pct,
                    mode: 'health',
                    entityId: res.id // For damage trail
                });
            }
        }
    }

    /**
     * Render a DroppedItem entity
     * @param {CanvasRenderingContext2D} ctx
     * @param {DroppedItem} item
     */
    renderDroppedItem(ctx, item) {
        if (!item.active) return;

        // Render Trail (Stream) - only when magnetized
        if (item.isMagnetized && item.trailHistory.length > 2) {
            ctx.save();
            ctx.strokeStyle = item.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Draw path
            for (let i = 0; i < item.trailHistory.length - 1; i++) {
                const p1 = item.trailHistory[i];
                const p2 = item.trailHistory[i + 1];

                // Opacity fades out at tail
                const alpha = (i / item.trailHistory.length) * 0.6;
                ctx.globalAlpha = alpha;

                // Thickness tapers
                ctx.lineWidth = 8 + (i / item.trailHistory.length) * 24; // 8px to 32px head

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y - p1.z);
                ctx.lineTo(p2.x, p2.y - p2.z);
                ctx.stroke();
            }
            // Connect last point to current
            const last = item.trailHistory[item.trailHistory.length - 1];
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 16;
            ctx.beginPath();
            ctx.moveTo(last.x, last.y - last.z);
            ctx.lineTo(item.x, item.y - item.z);
            ctx.stroke();

            ctx.restore();
        }

        // PERF: Cache pulse value, compute less frequently
        const pulse = 0.7 + 0.3 * Math.sin(item.pulseTime * 4);

        // Render shadow (always on ground)
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        const shadowSize = Math.max(0, (item.width / 2) * (1 - item.z / 100)); // Shrink shadow as it goes high
        ctx.ellipse(item.x, item.y, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Render item (apply Z offset)
        const renderY = item.y - item.z;

        // PERF: Cache asset ID on item to avoid string ops
        // Use entity ID directly (e.g., 'food_t1_01') or customIcon
        if (!item._cachedAssetId) {
            item._cachedAssetId = item.customIcon || item.resourceType;
        }
        const assetId = item._cachedAssetId;

        // PERF: Only get image path once
        if (!item._spriteImage && AssetLoader) {
            const imagePath = AssetLoader.getImagePath(assetId);
            if (imagePath) {
                item._spriteImage = AssetLoader.createImage(imagePath, () => {
                    item._spriteLoaded = true;
                });
                item._spriteLoaded = false;
            }
        }

        if (item._spriteLoaded && item._spriteImage) {
            // Use Material Library for cached silhouette
            if (MaterialLibrary && !item._silhouetteCanvas) {
                // Determine rarity color if missing
                const rarityColor = item.rarityColor || '#BDC3C7';
                item._silhouetteCanvas = MaterialLibrary.get(
                    assetId,
                    'silhouette',
                    { color: rarityColor },
                    item._spriteImage
                );
            }

            // Render Rarity Outline (Behind everything)
            ctx.save();
            ctx.translate(item.x, renderY);
            const scale = 1 + 0.1 * Math.sin(item.pulseTime * 5);
            ctx.scale(scale, scale);

            if (item._silhouetteCanvas) {
                const w = item.width;
                const h = item.height;
                const x = -w / 2;
                const y = -h / 2;

                // PERF: Single slightly-larger silhouette instead of 4 offset draws
                ctx.globalAlpha = 0.7;
                const outlineSize = 4;
                ctx.drawImage(
                    item._silhouetteCanvas,
                    x - outlineSize / 2,
                    y - outlineSize / 2,
                    w + outlineSize,
                    h + outlineSize
                );
            }

            ctx.restore();

            // Render Sprite
            ctx.save();
            ctx.translate(item.x, renderY);
            ctx.scale(scale, scale);

            ctx.drawImage(
                item._spriteImage,
                -item.width / 2,
                -item.height / 2,
                item.width,
                item.height
            );
            ctx.restore();
        } else {
            // Fallback: Geometric render
            ctx.save();

            // Glow
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 10 * pulse;

            // Diamond/gem shape
            ctx.fillStyle = item.color;
            ctx.beginPath();
            ctx.moveTo(item.x, renderY - item.height / 2);
            ctx.lineTo(item.x + item.width / 2, renderY);
            ctx.lineTo(item.x, renderY + item.height / 2);
            ctx.lineTo(item.x - item.width / 2, renderY);
            ctx.closePath();
            ctx.fill();

            // Border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }

        // Amount indicator if > 1
        if (item.amount > 1) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`x${item.amount}`, item.x, item.y + item.height / 2 + 10);
        }
    }
}

// Create singleton and export
const ResourceRenderer = new ResourceRendererService();
if (Registry) Registry.register('ResourceRenderer', ResourceRenderer);

export { ResourceRendererService, ResourceRenderer };
