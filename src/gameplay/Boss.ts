/**
 * Boss - Powerful biome boss entity
 *
 * Larger, stronger, and has special abilities.
 * Respawns on a timer after death.
 *
 * Work Package: 09-boss-system.md
 */
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameConstants, getConfig } from '../data/GameConstants';
import { EntityConfig } from '../config/EntityConfig';
import { EntityTypes } from '../config/EntityTypes';
import { BiomeConfig } from '../data/BiomeConfig';

import { Enemy } from './EnemyCore';
import { Registry } from '../core/Registry';


class Boss extends Enemy {
    // Boss property declarations
    isBoss: boolean = true;
    bossType: string = 'unknown_boss';
    bossName: string = 'Unknown Boss';
    abilities: any[] = [];
    glowColor: string = '#FF4500';
    scale: number = 1.2;

    /**
     * Create a boss entity
     * @param {object} config - Boss configuration
     */
    constructor(config: any = {}) {
        // Get boss config hierarchy: defaults -> type config -> instance config
        const defaults = EntityConfig.boss?.defaults || {};
        const typeConfig = config.bossType
            ? EntityConfig.boss?.types?.[config.bossType] || {}
            : {};

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
    render(ctx) {
        if (!this.active) return;

        // Call parent render (draws sprite/color + health bar + threat indicator)
        super.render(ctx);

        // Boss name plate
        this.renderNamePlate(ctx);
    }

    /**
     * Render boss name plate above health bar
     */
    renderNamePlate(ctx) {
        ctx.save();
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.glowColor;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;

        const nameY = this.y - this.height / 2 - 35;
        ctx.fillText(this.bossName, this.x, nameY);
        ctx.restore();
    }

    /**
     * Override die to emit boss-specific death event
     */
    die(killer = null) {
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
