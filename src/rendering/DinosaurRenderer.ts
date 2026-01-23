/**
 * DinosaurRenderer
 * Handles rendering for all dinosaurs.
 */

// Ambient declarations for global dependencies
declare const Logger: any;
declare const EnvironmentRenderer: any;
declare const MaterialLibrary: any;
declare const ProgressBarRenderer: any;
declare const Registry: any;

class DinosaurRendererService {
    constructor() {
        Logger.info('[DinosaurRenderer] Initialized');
    }

    render(ctx, dino, includeShadow = true) {
        if (!dino.active) return;

        // Shadow
        if (includeShadow) {
            this.renderShadow(ctx, dino);
        }

        // Dead State
        if (dino.state === 'dead') {
            this.renderDead(ctx, dino);
            return;
        }

        // Alive State
        ctx.save();

        // 1. Sprite Render (modern: single sprite via _sprite)
        if (dino._spriteLoaded && dino._sprite) {
            const flipX = dino.wanderDirection.x < 0;
            ctx.translate(dino.x, dino.y);
            if (flipX) ctx.scale(-1, 1);
            ctx.drawImage(dino._sprite, -dino.width / 2, -dino.height / 2, dino.width, dino.height);
        }
        // No fallback - just skip rendering until sprite loads

        ctx.restore();
    }

    // ... rest of methods ...
    renderShadow(ctx, dino, forceOpaque = false) {
        // Check EnvironmentRenderer for dynamic shadows
        const env = EnvironmentRenderer;

        let scaleY = 0.3;
        let alpha = 0.3;

        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        // 1. Static Contact Shadow
        ctx.save();
        ctx.translate(dino.x, dino.y + dino.height / 2 - 6);

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = dino.width * 0.7; // Wider for dino
        const contactHeight = dino.height * 0.2;

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Shadow
        ctx.save();
        ctx.translate(dino.x, dino.y + dino.height / 2 - 6); // Pivot at feet

        const skew = env ? env.shadowSkew || 0 : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        // Flip & Scale
        ctx.scale(1, -scaleY);

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'black';
        } else {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'black';
        }

        // 1. Sprite Render (Silhouette)
        // We need to find the correct sprite frame just like render() does
        let sprite = dino._sprites ? dino._sprites[dino.spriteId] : null;
        let spriteName = dino.spriteId;

        if (!sprite && dino.walkFrames) {
            const currentFrameKey = dino.walkFrames[dino.frameIndex];
            sprite = dino._sprites ? dino._sprites[currentFrameKey] : null;
            spriteName = currentFrameKey;
        }

        if (dino._spritesLoaded && sprite) {
            const flipX = dino.wanderDirection.x < 0;

            // Handle Horizontal Flip
            if (flipX) {
                ctx.scale(-1, 1);
            }

            // PERF: Cache shadow on entity (retry until successful)
            if (!dino._shadowImg) {
                if (MaterialLibrary) {
                    const baseShadowId = 'dino_' + (dino.dinoType || 'base') + '_base';
                    dino._shadowImg = MaterialLibrary.get(baseShadowId, 'shadow', {});
                }
            }

            if (dino._shadowImg) {
                // Draw anchored at bottom
                ctx.drawImage(
                    dino._shadowImg,
                    -dino.width / 2,
                    -dino.height,
                    dino.width,
                    dino.height
                );
            }
        }

        ctx.restore();
    }

    renderDead(ctx, dino) {
        ctx.save();
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.ellipse(dino.x, dino.y + 20, 40, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tombstone
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.roundRect(dino.x - 30, dino.y - 30, 60, 60, 10);
        ctx.fill();

        // Skull
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(dino.x - 16, dino.y - 16);
        ctx.lineTo(dino.x + 16, dino.y + 16);
        ctx.moveTo(dino.x + 16, dino.y - 16);
        ctx.lineTo(dino.x - 16, dino.y + 16);
        ctx.stroke();

        ctx.restore();
    }

    renderUI(ctx, dino) {
        if (!dino.active) return;

        // Dead State: Respawn Bar
        if (dino.state === 'dead') {
            // Draw Respawn Progress Bar (High-Dopamine)
            const barWidth = 120;
            const barHeight = 14;
            const barX = dino.x - barWidth / 2;
            const barY = dino.y - 60;

            const totalDuration = dino.currentRespawnDuration || dino.maxRespawnTime;
            const pct = Math.max(0, 1 - dino.respawnTimer / totalDuration);

            if (ProgressBarRenderer) {
                ProgressBarRenderer.draw(ctx, {
                    x: barX,
                    y: barY,
                    width: barWidth,
                    height: barHeight,
                    percent: pct,
                    mode: 'respawn',
                    animated: true
                });
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle = '#3498DB';
                ctx.fillRect(barX, barY, barWidth * pct, barHeight);
            }
            return;
        }

        // Alive State: Health Bar
        if (dino.health < dino.maxHealth) {
            const barWidth = 120;
            const barHeight = 14;
            const barX = dino.x - barWidth / 2;
            const barY = dino.y - dino.height / 2 - 30;

            const healthPercent = dino.health / dino.maxHealth;

            if (ProgressBarRenderer) {
                ProgressBarRenderer.draw(ctx, {
                    x: barX,
                    y: barY,
                    width: barWidth,
                    height: barHeight,
                    percent: healthPercent,
                    mode: 'health',
                    animated: true
                });
            } else {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                ctx.fillStyle =
                    healthPercent > 0.5 ? '#2ECC71' : healthPercent > 0.25 ? '#F39C12' : '#E74C3C';
                ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            }
        }
    }
}

// Create singleton and export
const DinosaurRenderer = new DinosaurRendererService();
if (Registry) Registry.register('DinosaurRenderer', DinosaurRenderer);

export { DinosaurRendererService, DinosaurRenderer };
