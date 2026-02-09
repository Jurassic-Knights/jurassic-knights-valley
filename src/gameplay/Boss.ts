/**
 * Boss - Powerful biome boss entity
 *
 * Larger, stronger, and has special abilities.
 * Respawns on a timer after death.
 *
 * Work Package: 09-boss-system.md
 */
import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { EntityTypes } from '@config/EntityTypes';
import { BiomeConfig } from '@data/BiomeConfig';
import { EnemyAI } from '../ai/behaviors/enemies/EnemyAI';
import type { HealthComponent } from '../types/core';

import { Enemy } from './EnemyCore';
import { Registry } from '@core/Registry';
import { EntityRegistry } from '@entities/EntityLoader';
import type { IEntity } from '../types/core';

class Boss extends Enemy {
    // Boss property declarations
    isBoss: boolean = true;
    bossType: string = 'unknown_boss';
    bossName: string = 'Unknown Boss';
    abilities: Array<{ id: string; name: string; cooldown?: number; [key: string]: unknown }> = [];
    glowColor: string = '#FF4500';
    scale: number = 1.2;

    /**
     * Create a boss entity
     * @param {object} config - Boss configuration
     */
    constructor(config: { bossType?: string; x?: number; y?: number; [key: string]: unknown } = {}) {
        // Get boss config hierarchy: defaults -> type config -> instance config
        // Get boss config from EntityRegistry
        const defaults = EntityRegistry.defaults?.boss || {};
        const typeConfig = config.bossType ? EntityRegistry.bosses?.[config.bossType] || {} : {};

        // Merge configs (instance overrides type overrides defaults)
        const finalConfig = { ...defaults, ...typeConfig, ...config };

        // Call Enemy constructor with merged config
        super({
            ...finalConfig,
            enemyType: config.bossType,
            forceNormal: true // Bosses don't roll for elite - they are already special
        });

        // Boss Identity
        this.isBoss = true;
        this.bossType = config.bossType || 'unknown_boss';
        this.bossName = finalConfig.name || 'Unknown Boss';
        this.abilities = finalConfig.abilities || [];
        this.lootTableId = finalConfig.lootTableId || `boss_${config.biomeId || 'common'}`;

        // Override entity type marker (still an enemy for targeting)
        this.entityType = EntityTypes.ENEMY || 'enemy';

        // Boss-specific respawn time (longer than regular enemies)
        this.respawnTime =
            finalConfig.respawnTime || BiomeConfig.Biome?.BOSS_RESPAWN_DEFAULT || 300;

        // Visual enhancements
        this.glowColor = finalConfig.glowColor || '#FF4500'; // Boss glow
        this.scale = finalConfig.scale || 1.2; // Slightly larger render

        // Increased threat level for bosses
        this.threatLevel = finalConfig.threatLevel || 5;

        Logger.info(`[Boss] Created ${this.bossName} in ${config.biomeId || 'unknown'}`);
    }

    /**
     * Override render to add boss name plate
     */
    render(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        // Call parent render (draws sprite/color + health bar + threat indicator)
        super.render(ctx);

        // Boss name plate
        this.renderNamePlate(ctx);
    }

    /**
     * Render boss name plate above health bar
     */
    renderNamePlate(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.glowColor;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;

        const offset = GameConstants.Boss.NAME_PLATE_Y_OFFSET;
        const nameY = this.y - this.height / 2 - offset;
        ctx.fillText(this.bossName, this.x, nameY);
        ctx.restore();
    }

    /**
     * Override die to emit boss-specific death event
     */
    die(killer: IEntity | null = null) {
        // Call parent die
        super.die(killer);

        // Emit boss-specific death event
        if (EventBus && GameConstants.Events) {
            EventBus.emit(GameConstants.Events.BOSS_KILLED, {
                boss: this,
                biomeId: this.biomeId,
                bossType: this.bossType,
                xpReward: this.xpReward,
                respawnIn: this.respawnTime
            });
        }

        Logger.info(`[Boss] ${this.bossName} defeated! Respawns in ${this.respawnTime}s`);
    }

    update(dt: number) {
        if (!this.active || this.isDead) {
            if (this.isDead) {
                const ms = GameConstants.Timing.MS_PER_SECOND;
                this.respawnTimer -= dt / ms;
                if (this.respawnTimer <= 0) {
                    this.respawn();
                }
            }
            return;
        }

        // Sync HealthComponent (Fix for HP Bar)
        if (this.components.health) {
            this.health = (this.components.health as unknown as HealthComponent).health;
        }

        if (this.attackCooldown > 0) {
            const ms = GameConstants.Timing.MS_PER_SECOND;
            this.attackCooldown -= dt / ms;
        }

        if (EnemyAI) {
            EnemyAI.updateState(this, dt);
        }

        this.updateAnimation(dt);
    }

    /**
     * Override respawn to emit boss-specific spawn event
     */
    respawn() {
        super.respawn();

        if (EventBus && GameConstants.Events) {
            EventBus.emit(GameConstants.Events.BOSS_SPAWNED, {
                boss: this,
                biomeId: this.biomeId,
                bossType: this.bossType
            });
        }

        Logger.info(`[Boss] ${this.bossName} has respawned!`);
    }
}

// ES6 Module Export
export { Boss };
