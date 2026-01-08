/**
 * HeroRenderer - Dedicated rendering system for the player character
 * 
 * Extracted from Hero.js to separate logic from presentation.
 * Uses RenderConfig for constants.
 */
class HeroRendererSystem {
    constructor() {
        console.log('[HeroRenderer] Initialized');
    }

    /**
     * Render the hero and their equipped weapon
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Hero} hero 
     */
    render(ctx, hero, includeShadow = true) {
        if (!hero || !hero.active) return;

        // Draw Shadow
        if (includeShadow) {
            this.drawShadow(ctx, hero);
        }

        // Draw Hero Body
        this.drawBody(ctx, hero);

        // Draw Weapon (and Muzzle Flash)
        this.drawWeapon(ctx, hero);

        // Draw Status Bars (Health above, Resolve below)
        this.drawStatusBars(ctx, hero);
    }

    /**
     * Draw health bar above hero
     */
    drawStatusBars(ctx, hero) {
        const barWidth = 80;
        const barHeight = 10;
        const cornerRadius = 4;

        // Health Bar (above hero) - GREEN
        const healthY = hero.y - hero.height / 2 - 18;
        const healthPercent = Math.max(0, Math.min(1, hero.health / hero.maxHealth));

        this.drawBar(ctx, hero.x, healthY, barWidth, barHeight, healthPercent, '#2ECC71', '#0E2C1A', cornerRadius);
    }

    /**
     * Helper to draw a rounded progress bar
     */
    drawBar(ctx, x, y, width, height, percent, fillColor, bgColor, radius) {
        const halfWidth = width / 2;

        ctx.save();

        // Background
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(x - halfWidth, y - height / 2, width, height, radius);
        ctx.fill();

        // Fill
        if (percent > 0) {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            const fillWidth = width * percent;
            ctx.roundRect(x - halfWidth, y - height / 2, fillWidth, height, radius);
            ctx.fill();
        }

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - halfWidth, y - height / 2, width, height, radius);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw drop shadow
     */
    drawShadow(ctx, hero, forceOpaque = false) {
        // Safe access to RenderConfig
        const cfg = window.RenderConfig ? RenderConfig.Hero : null;
        if (!cfg) return;

        // Check EnvironmentRenderer for dynamic shadows
        const env = window.EnvironmentRenderer;

        // Default values if system missing
        let scaleY = 0.3;
        let alpha = 0.3;

        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        // 1. Static Contact Shadow
        ctx.save();
        ctx.translate(hero.x, hero.y + hero.height / 2 - 6);

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = hero.width * 0.5;
        const contactHeight = hero.height * 0.12;

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Projected Shadow
        ctx.save();
        ctx.translate(hero.x, hero.y + hero.height / 2 - 6);

        // Skew
        const skew = env ? (env.shadowSkew || 0) : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        // Dynamic Scale & Flip
        ctx.scale(1, -scaleY);

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = alpha;
        }

        // Optimize: Use cached silhouette
        const heroAssetId = 'world_hero';
        let shadowImg = null;
        if (window.MaterialLibrary) {
            // Pass locally loaded _heroImg to ensure MaterialLibrary has a source
            shadowImg = MaterialLibrary.get(heroAssetId, 'shadow', {}, this._heroImg);
        }

        if (shadowImg) {
            // Draw anchored at bottom (0,0) -> (-W/2, -H)
            ctx.drawImage(
                shadowImg,
                -hero.width / 2, -hero.height,
                hero.width, hero.height
            );
        } else {
            // Fallback Oval (Prevent Lag)
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.ellipse(0, -hero.height / 4, hero.width / 2, hero.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Draw the main hero sprite
     */
    drawBody(ctx, hero) {
        const heroPath = window.AssetLoader ? AssetLoader.getImagePath('world_hero') : null;

        if (heroPath) {
            // Lazy load image on the renderer instance, not the entity
            if (!this._heroImg) {
                this._heroImg = new Image();
                this._heroImg.src = heroPath;
            }

            if (this._heroImg.complete && this._heroImg.naturalWidth) {
                ctx.drawImage(
                    this._heroImg,
                    hero.x - hero.width / 2,
                    hero.y - hero.height / 2,
                    hero.width,
                    hero.height
                );
            }
        } else {
            // Fallback: Gold circle
            ctx.fillStyle = hero.color || '#D4AF37';
            ctx.beginPath();
            ctx.arc(hero.x, hero.y, hero.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Border
            ctx.strokeStyle = '#1A1A2E';
            ctx.lineWidth = 6;
            ctx.stroke();
        }
    }

    /**
     * Draw the equipped weapon based on target
     */
    drawWeapon(ctx, hero) {
        // Calculate Aim Direction
        let aimX = 0;
        let aimY = 0;

        if (hero.targetResource) {
            const dx = hero.targetResource.x - hero.x;
            const dy = hero.targetResource.y - hero.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                aimX = dx / dist;
                aimY = dy / dist;
            }
        } else {
            const inputMove = hero.inputMove || { x: 0, y: 0 };
            if (inputMove.x !== 0 || inputMove.y !== 0) {
                aimX = inputMove.x;
                aimY = inputMove.y;
            } else {
                aimX = 1; // Default right
            }
        }

        ctx.save();
        ctx.translate(hero.x, hero.y);

        const baseAngle = Math.atan2(aimY, aimX);

        // Determine Weapon Type (Gun vs Shovel)
        const isGun = hero.targetResource && (
            (window.Dinosaur && hero.targetResource instanceof window.Dinosaur) ||
            hero.targetResource.constructor.name === 'Dinosaur'
        );

        if (isGun) {
            this.drawRifle(ctx, hero, baseAngle);
        } else {
            this.drawShovel(ctx, hero, baseAngle);
        }

        ctx.restore();
    }

    drawRifle(ctx, hero, baseAngle) {
        const cfg = window.RenderConfig ? RenderConfig.Hero.WEAPON.RIFLE : null;
        if (!cfg) return;

        ctx.rotate(baseAngle);

        // Recoil Animation
        let recoil = 0;
        if (hero.isAttacking && hero.attackTimer > 0) {
            // Assume 2 attacks/sec hardcoded fallback if missing
            const rate = hero.components?.combat?.rate || 2;
            const cooldown = 1 / rate;
            const progress = 1 - (hero.attackTimer / cooldown);

            if (progress < cfg.KICK_DURATION_PCT) {
                recoil = cfg.RECOIL_DISTANCE * (progress / cfg.KICK_DURATION_PCT);
            } else if (progress < (cfg.KICK_DURATION_PCT + cfg.RECOVER_DURATION_PCT)) {
                const recoverProgress = (progress - cfg.KICK_DURATION_PCT) / cfg.RECOVER_DURATION_PCT;
                recoil = cfg.RECOIL_DISTANCE * (1 - recoverProgress);
            }
        }

        ctx.translate(recoil, 0);

        // Draw Sprite
        const gunPath = window.AssetLoader ? AssetLoader.getImagePath('tool_gun') : null;
        if (gunPath) {
            if (!this._gunImg) {
                this._gunImg = new Image();
                this._gunImg.src = gunPath;
            }

            if (this._gunImg.complete && this._gunImg.naturalWidth) {
                const scale = cfg.TARGET_WIDTH / this._gunImg.naturalWidth;
                const drawHeight = this._gunImg.naturalHeight * scale;

                ctx.drawImage(this._gunImg, cfg.OFFSET_X, -drawHeight / 2, cfg.TARGET_WIDTH, drawHeight);
            }
        } else {
            // Fallback Procedural Gun
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(10, -3, 15, 6);
        }
    }

    drawShovel(ctx, hero, baseAngle) {
        const cfg = window.RenderConfig ? RenderConfig.Hero.WEAPON.SHOVEL : null;
        if (!cfg) return;

        // Swing Animation
        let swingOffset = cfg.IDLE_ANGLE;

        if (hero.isAttacking && hero.attackTimer > 0) {
            const rate = hero.components?.combat?.rate || 2;
            const cooldown = 1 / rate;
            const progress = 1 - (hero.attackTimer / cooldown);

            if (progress < 0.2) {
                // Cock back
                swingOffset = cfg.IDLE_ANGLE + (cfg.COCK_ANGLE * (progress / 0.2));
                // Actually the config has absolute angles, let's interpolate logic
                // If IDLE is -0.5 and COCK is -0.5, nothing distinct?
                // Let's stick to the logic copied from Hero.js but using CFG constants
                swingOffset = cfg.COCK_ANGLE - (progress / 0.2) * 0.5; // Manual tweak to match old Feel
            } else if (progress < 0.5) {
                // Swing Forward
                swingOffset = cfg.SWING_FWD_ANGLE + ((progress - 0.2) / 0.3) * cfg.SWING_MAX_ANGLE;
            } else {
                // Return
                swingOffset = (cfg.SWING_FWD_ANGLE + cfg.SWING_MAX_ANGLE) - ((progress - 0.5) / 0.5) * cfg.RETURN_ANGLE;
            }
        }

        ctx.rotate(baseAngle + swingOffset);

        // Draw Sprite
        const shovelPath = window.AssetLoader ? AssetLoader.getImagePath('tool_shovel') : null;
        if (shovelPath) {
            if (!this._shovelImg) {
                this._shovelImg = new Image();
                this._shovelImg.src = shovelPath;
            }

            if (this._shovelImg.complete && this._shovelImg.naturalWidth) {
                const scale = cfg.TARGET_HEIGHT / this._shovelImg.naturalHeight;
                const drawWidth = this._shovelImg.naturalWidth * scale;

                ctx.save();
                ctx.rotate(Math.PI / 2); // Shovel sprite is vertical
                ctx.drawImage(this._shovelImg, -drawWidth / 2, -cfg.TARGET_HEIGHT + cfg.OFFSET_Y, drawWidth, cfg.TARGET_HEIGHT);
                ctx.restore();
            }
        } else {
            // Fallback Procedural Pickaxe
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(10, -3, 30, 6);
        }
    }
}

// Global & Register
window.HeroRenderer = new HeroRendererSystem();
if (window.Registry) Registry.register('HeroRenderer', window.HeroRenderer);
