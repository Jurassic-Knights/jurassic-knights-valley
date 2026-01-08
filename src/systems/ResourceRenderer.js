/**
 * ResourceRenderer
 * Handles rendering for all resources.
 */
class ResourceRendererService {
    constructor() {
        console.log('[ResourceRenderer] Initialized');
    }

    render(ctx, res, includeShadow = true) {
        if (!res.active) return;

        // Shadow
        if (includeShadow) {
            this.renderShadow(ctx, res);
        }

        // Shake logic (if damaged) - skipped for simplification or handled by Tween?
        // Logic: if wood, return early (don't render sprite).
        if (res.resourceType === 'wood') return;

        if (res.state === 'depleted') {
            this.renderDepleted(ctx, res);
            return;
        }

        // Active State
        this.renderActive(ctx, res);
    }

    // ... rest of methods ...
    renderShadow(ctx, res, forceOpaque = false) {
        // Check EnvironmentRenderer for dynamic shadows
        const env = window.EnvironmentRenderer;

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

        const skew = env ? (env.shadowSkew || 0) : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        ctx.scale(1, -scaleY); // Flip resource shadows vertical

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'black';
        } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'black';
        }

        // Attempt to draw cached sprite silhouette
        const assetId = 'world_' + res.resourceType;
        let shadowImg = null;

        // Ensure image is loaded even if renderActive is skipped (e.g. Wood)
        if (!res._spriteImage) {
            const imagePath = window.AssetLoader ? AssetLoader.getImagePath(assetId) : null;
            if (imagePath) {
                res._spriteImage = AssetLoader.createImage(imagePath);
            }
        }

        if (window.MaterialLibrary) {
            // Pass res._spriteImage as override if available to ensure cache hit if AssetLoader is slow
            shadowImg = MaterialLibrary.get(assetId, 'shadow', {}, res._spriteImage);
        }

        if (shadowImg) {
            // Draw anchored at bottom center (-w/2, -h)
            ctx.drawImage(shadowImg, -res.width / 2, -res.height, res.width, res.height);
        } else {
            // Fallback: Geometric Shadow (Avoid lag)
            // If opaque, ensure it's black (already set fillStyle)
            ctx.beginPath();
            // Draw ellipse "upwards" so it projects "downwards" when flipped
            ctx.ellipse(0, -res.height / 4, res.width / 2, res.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    renderDepleted(ctx, res) {
        // Consumed Sprite
        const consumedAssetId = 'world_' + res.resourceType + '_consumed';
        const consumedPath = window.AssetLoader ? AssetLoader.getImagePath(consumedAssetId) : null;

        // Simple image load logic, in real engine use AssetLoader.get()
        if (consumedPath) {
            // We can't easily cache image on the renderer without a map.
            // Rely on browser caching or check res._consumedImage (legacy data prop)
            if (!res._consumedImage) {
                res._consumedImage = AssetLoader.createImage(consumedPath);
            }
            if (res._consumedImage.complete && res._consumedImage.naturalWidth) {
                ctx.drawImage(res._consumedImage, res.x - res.width / 2, res.y - res.height / 2, res.width, res.height);
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
        if (window.ProgressBarRenderer && res.respawnTimer > 0 && res.maxRespawnTime > 0) {
            // Calculate percentage (0 to 1 filling up)
            const remaining = res.respawnTimer;
            const total = res.maxRespawnTime;
            const pct = 1 - (remaining / total);

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
        const assetId = 'world_' + res.resourceType;
        const imagePath = window.AssetLoader ? AssetLoader.getImagePath(assetId) : null;

        if (imagePath) {
            if (!res._spriteImage) {
                res._spriteImage = AssetLoader.createImage(imagePath);
            }
            if (res._spriteImage.complete && res._spriteImage.naturalWidth) {
                ctx.drawImage(res._spriteImage, res.x - res.width / 2, res.y - res.height / 2, res.width, res.height);
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
            if (window.ProgressBarRenderer) {
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

        // Render Trail (Stream)
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

        // Pulsing glow effect
        const pulse = 0.7 + 0.3 * Math.sin(item.pulseTime * 4);

        // Render shadow (always on ground)
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        const shadowSize = Math.max(0, item.width / 2 * (1 - item.z / 100)); // Shrink shadow as it goes high
        ctx.ellipse(item.x, item.y, shadowSize, shadowSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Render item (apply Z offset)
        const renderY = item.y - item.z;

        // Check for custom icon
        const assetId = item.customIcon || ('drop_' + item.resourceType);
        const imagePath = window.AssetLoader ? AssetLoader.getImagePath(assetId) : null;

        if (imagePath && !item._spriteImage) {
            item._spriteImage = AssetLoader.createImage(imagePath, () => { item._spriteLoaded = true; });
            item._spriteLoaded = false;
        }

        if (item._spriteLoaded && item._spriteImage) {
            // Use Material Library for cached silhouette
            if (window.MaterialLibrary && !item._silhouetteCanvas) {
                // Determine rarity color if missing
                const rarityColor = item.rarityColor || '#BDC3C7';
                item._silhouetteCanvas = MaterialLibrary.get(assetId, 'silhouette', { color: rarityColor }, item._spriteImage);
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

                // 1. Glow Layer (Draw silhouette with blur)
                ctx.save();
                ctx.shadowColor = item.rarityColor;
                ctx.shadowBlur = 15;
                ctx.globalAlpha = 0.6;
                ctx.drawImage(item._silhouetteCanvas, x, y, w, h);
                ctx.restore();

                // 2. Solid Line Layer
                ctx.globalAlpha = 1.0;
                const strokeDist = 2;
                ctx.drawImage(item._silhouetteCanvas, x - strokeDist, y, w, h);
                ctx.drawImage(item._silhouetteCanvas, x + strokeDist, y, w, h);
                ctx.drawImage(item._silhouetteCanvas, x, y - strokeDist, w, h);
                ctx.drawImage(item._silhouetteCanvas, x, y + strokeDist, w, h);
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

window.ResourceRenderer = new ResourceRendererService();
if (window.Registry) Registry.register('ResourceRenderer', window.ResourceRenderer);
