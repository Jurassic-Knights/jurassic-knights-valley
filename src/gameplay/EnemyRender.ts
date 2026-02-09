/**
 * EnemyRender - Enemy rendering and animation methods
 * Extends Enemy.prototype with render methods
 *
 * Methods: updateAnimation, _loadSprite, render, renderHealthBar, renderThreatIndicator
 */

import { Enemy } from './EnemyCore';
import { Entity } from '@core/Entity';
import { AssetLoader } from '@core/AssetLoader';
import { GameConstants } from '@data/GameConstants';
import { Logger } from '@core/Logger';

/**
 * Update animation frame
 */
Enemy.prototype.updateAnimation = function (dt: number) {
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameInterval) {
        this.frameTimer = 0;
        this.frameIndex = (this.frameIndex + 1) % 2;
    }
};

/**
 * Load sprite from AssetLoader
 */
Enemy.prototype._loadSprite = function () {
    if (!AssetLoader) {
        Logger.warn(`[Enemy] AssetLoader not available for: ${this.enemyType}`);
        return;
    }

    const assetKey = this.enemyType || this.spriteId;
    if (!assetKey) {
        Logger.warn(`[Enemy] No asset key for sprite loading`);
        return;
    }

    const path = AssetLoader.getImagePath(assetKey);

    if (!path || path.includes('PH.png')) {
        Logger.warn(`[Enemy] No sprite found for: ${assetKey}, path: ${path}`);
        return;
    }

    Logger.info(`[Enemy] Loading sprite: ${assetKey} -> ${path}`);

    this._sprite = AssetLoader.createImage(path, () => {
        this._spriteLoaded = true;
        Logger.info(`[Enemy] Sprite loaded: ${assetKey}`);
    });
    this._sprite.onerror = (_e: Event | string) => {
        Logger.error(`[Enemy] Failed to load sprite: ${assetKey}, path: ${path}`, e);
        this._spriteLoaded = false;
    };
};

/**
 * Render enemy (with elite glow if applicable)
 */
Enemy.prototype.render = function (ctx: CanvasRenderingContext2D) {
    if (!this.active) return;

    // Elite glow effect
    if (this.isElite) {
        const pulseMs = GameConstants.EnemyRender.ELITE_PULSE_MS;
        const alphaBase = GameConstants.EnemyRender.ELITE_ALPHA_BASE;
        const alphaAmp = GameConstants.EnemyRender.ELITE_ALPHA_AMPLITUDE;
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = alphaBase + Math.sin(Date.now() / pulseMs) * alphaAmp;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2 + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Draw sprite if loaded, otherwise fallback to color
    if (this._spriteLoaded && this._sprite) {
        ctx.save();
        if (!this.facingRight) {
            ctx.translate(this.x, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(this._sprite, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.drawImage(
                this._sprite,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
        ctx.restore();
    } else {
        // Fallback to colored rectangle via parent
        Entity.prototype.render.call(this, ctx);
    }

    // Health bar
    this.renderHealthBar(ctx);

    // Threat indicator
    if (this.threatLevel >= 3 || this.isElite) {
        this.renderThreatIndicator(ctx);
    }
};

/**
 * Render health bar above enemy
 */
Enemy.prototype.renderHealthBar = function (ctx: CanvasRenderingContext2D) {
    const barWidth = GameConstants.EnemyRender.HEALTH_BAR_WIDTH;
    const barHeight = 6;
    const barX = this.x - barWidth / 2;
    const barYOffset = GameConstants.EnemyRender.HEALTH_BAR_Y_OFFSET;
    const barY = this.y - this.height / 2 - barYOffset;

    const healthPercent = this.health / this.maxHealth;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health fill
    const healthColor =
        healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
    ctx.fillStyle = healthColor;
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

    // Elite border
    if (this.isElite) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    }
};

/**
 * Render threat level indicator
 */
Enemy.prototype.renderThreatIndicator = function (ctx: CanvasRenderingContext2D) {
    const indicatorY = this.y - this.height / 2 - 25;

    ctx.save();
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.isElite ? '#FFD700' : '#FF4500';

    const skulls = '☠'.repeat(Math.min(this.threatLevel, 5));
    ctx.fillText(skulls, this.x, indicatorY);
    ctx.restore();
};

Logger.info('[EnemyRender] Render methods added to Enemy prototype');
