/**
 * Resource - Collectible resource entity with health
 *
 * Per GDD: Player spends stamina to damage resource, depleting health to collect.
 *
 * Owner: Director (engine), Gameplay Designer (values), Lore Writer (names)
 */
import { Entity } from '@core/Entity';
import { Logger } from '@core/Logger';
import { WorldManager } from '../world/WorldManager';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '@vfx/VFXController';
import { IEntity, IComponents } from '../types/core';
import { spawnResourceDrops } from './ResourceDrops';
import { ProgressBarRenderer } from '@vfx/ProgressBarRenderer';
import { GameConstants, getConfig } from '@data/GameConstants';
import { EntityTypes } from '@config/EntityTypes';

// import removed
import { EntityRegistry } from '@entities/EntityLoader';
import { EntityScaling } from '../utils/EntityScaling';
import { RESOURCE_COLORS, RESOURCE_RARITY, RESOURCE_RARITY_COLORS } from './ResourceConstants';

class Resource extends Entity {
    // Resource identity
    registryId: string | null = null; // Set in constructor
    resourceType: string = 'scraps_t1_01';
    nodeSubtype: string | null = null;
    amount: number = 1;
    interactRadius: number = 145;
    scale: number = 1.0;

    // Health system
    maxHealth: number = 30;
    health: number = 30;

    // State
    state: string = 'ready';
    respawnTimer: number = 0;
    maxRespawnTime: number = 30;

    // Visual caches
    _shadowImg?: HTMLImageElement | null;
    _consumedImage?: HTMLImageElement | null;
    _spriteImage?: HTMLImageElement | null;
    components?: IComponents;

    // Respawn tracking
    currentRespawnDuration: number = 30;

    /**
     * Create a resource
     * @param {object} config
     */
    constructor(
        config: { resourceType?: string; x?: number; y?: number;[key: string]: unknown } = {}
    ) {
        const rType = config.resourceType || 'scraps_t1_01';
        const nodeConfig = EntityRegistry.nodes?.[rType];
        const resConfig = EntityRegistry.resources?.[rType];

        const typeConfig = nodeConfig || resConfig || {};

        if (!nodeConfig && !resConfig) {
            Logger.warn(`[Resource] Registry Lookup FAILED for '${config.resourceType}'`);
        }
        // Calculate size using standard utility
        const size = EntityScaling.calculateSize(config, typeConfig, { width: 150, height: 150 });
        // Merge
        const finalConfig = { ...typeConfig, ...config };

        super({
            entityType: EntityTypes.RESOURCE,
            width: size.width,
            height: size.height,
            collision: finalConfig.collision, // Pass merged collision config
            ...config
        });

        // Store scale
        this.scale = size.scale;

        this.resourceType = config.resourceType || 'scraps_t1_01';
        this.registryId = this.resourceType; // Enable standardized EntityLoader matching

        // Extract nodeSubtype from config or parse from resourceType (node_mining_t1_01 ? mining)
        if (finalConfig.nodeSubtype) {
            this.nodeSubtype = finalConfig.nodeSubtype as string;
        } else if (this.resourceType.startsWith('node_')) {
            // Parse from ID like node_mining_t1_01 ? mining
            const match = this.resourceType.match(/^node_([a-z]+)_t\d/);
            this.nodeSubtype = match ? match[1] : 'mining';
        } else {
            this.nodeSubtype = null;
        }

        this.amount = (finalConfig.amount as number) || 1;
        this.interactRadius =
            (finalConfig.interactRadius as number) || getConfig().Combat?.DEFAULT_MINING_RANGE || 150;

        // Health system
        this.maxHealth = (finalConfig.maxHealth as number) || 30;
        this.health = this.maxHealth;

        // Set color based on type
        this.color = finalConfig.color || '#888888';

        // State: 'ready' or 'depleted'
        this.state = 'ready';
        this.respawnTimer = 0;
        this.maxRespawnTime = finalConfig.respawnTime || 30;

        // Domain Rule: Home Island (Starter Zone) strictly allows only Wood
        // Map-placed entities (from map editor) bypass this rule - user explicitly placed them
        const isMapPlaced = !!config.isMapPlaced;
        if (!isMapPlaced) {
            let onHome = false;
            if (WorldManager) {
                // mapGenParams usage removed
                // To maintain parity, we can assume town index 0 is "home" conceptually,
                // or just allow all nodes. We'll simply let all map nodes spawn.
                onHome = true;
            }

            // Home island allows T1 nodes (trees in starter area)
            const isT1Node = this.resourceType.includes('_t1_');
            if (onHome && !isT1Node) {
                this.active = false;
            }
        }
    }

    /**
     * Update resource state
     * Logic moved to ResourceSystem.js (ECS)
     * @param {number} dt
     */
    update(_dt: number) {
        // Handled by ResourceSystem
    }

    /**
     * Respawn the resource
     * Logic moved to ResourceSystem.js
     */
    respawn() {
        // Handled by ResourceSystem
    }

    /**
     * Check if hero is close enough to interact
     * @param {Hero} hero
     * @returns {boolean}
     */
    isInRange(hero: IEntity) {
        return this.active && this.state === 'ready' && this.distanceTo(hero) < this.interactRadius;
    }

    /**
     * Take damage from hero attack
     * @param {number} damage
     * @returns {boolean} True if resource yielded loot
     */
    takeDamage(damage: number) {
        if (this.state !== 'ready') return false;

        // SFX: Mining Impact (unique per resource type)
        if (AudioManager) {
            const sfxId = `sfx_mine_${this.resourceType}`;
            AudioManager.playSFX(sfxId);
        }

        // Visual Impact VFX (Hit)
        if (VFXController) {
            // 1. Sparks (Immediate stick)
            VFXController.playForeground(this.x, this.y, {
                type: 'spark',
                color: '#FFFFFF',
                count: 12,
                speed: 12,
                lifetime: GameConstants.Resource.VFX_SPARK_LIFETIME,
                size: 10
            });

            // 2. Small Debris Chips
            VFXController.playForeground(this.x, this.y, {
                type: 'debris',
                color: this.color,
                count: 15,
                speed: 10,
                lifetime: 600,
                gravity: 0.3,
                size: 8
            });
        }

        this.health -= damage;
        if (this.health <= 0) {
            // SFX: Break - use config-driven sfxSuffix
            if (AudioManager) {
                const typeConfig = EntityRegistry.resources?.[this.resourceType] || {};
                const suffix = typeConfig.sfxSuffix || 'metal';
                AudioManager.playSFX(`sfx_resource_break_${suffix}`);
            }

            this.health = 0;
            this.state = 'depleted';

            if (this.resourceType.includes('_t1_')) {
                this.maxRespawnTime = GameConstants.Resource.T1_FAST_RESPAWN;
            } else {
                const defaultBase = GameConstants.Resource.DEFAULT_BASE_RESPAWN;
                this.maxRespawnTime =
                    (Resource.TYPES[this.resourceType] as { baseRespawnTime?: number } | undefined)
                        ?.baseRespawnTime ?? defaultBase;
            }
            this.respawnTimer = this.maxRespawnTime;

            spawnResourceDrops(this.x, this.y, this.amount, this.resourceType);
            return true;
        }
        return false;
    }

    /**
     * Recalculate respawn timer based on current upgrades
     * Handles proportional time reduction if already respawning
     */
    recalculateRespawnTimer() {
        if (!WorldManager) return;

        // Calculate new total duration
        let newDuration = this.maxRespawnTime; // Default base

        // Base value lookup
        const typeConfig = EntityRegistry.resources?.[this.resourceType] || {};
        const defaultBase = GameConstants.Resource.DEFAULT_BASE_RESPAWN;
        newDuration = typeConfig.respawnTime ?? defaultBase;

        // If depleted/respawning, scale remaining time
        const currentTotal = this.currentRespawnDuration || this.maxRespawnTime;

        if (this.state === 'depleted' && currentTotal > 0) {
            const completionPct = 1 - this.respawnTimer / currentTotal;
            this.respawnTimer = newDuration * (1 - completionPct);
        }

        this.maxRespawnTime = newDuration; // Update property
        this.currentRespawnDuration = newDuration; // Sync tracking
    }

    /**
     * Get health percentage
     * @returns {number} 0-1
     */
    getHealthPercent() {
        return this.health / this.maxHealth;
    }

    /**
     * Render resource with health bar
     * @param {CanvasRenderingContext2D} ctx
     */
    render(_ctx: CanvasRenderingContext2D) {
        // Handled by ResourceRenderer
    }

    /**
     * Render health bar (UI Layer)
     * @param {CanvasRenderingContext2D} ctx
     */
    renderUI(ctx: CanvasRenderingContext2D) {
        // Health bar (above resource)
        this.renderHealthBar(ctx);
    }

    /**
     * Render health bar above resource using ProgressBarRenderer
     * @param {CanvasRenderingContext2D} ctx
     */
    renderHealthBar(ctx: CanvasRenderingContext2D) {
        // Only show if damaged
        if (this.health >= this.maxHealth) return;
        if (this.state === 'depleted') return;

        const barWidth = GameConstants.Resource.HEALTH_BAR_WIDTH;
        const barHeight = 14;
        const barX = this.x - barWidth / 2;
        const barYOffset = GameConstants.Resource.HEALTH_BAR_Y_OFFSET;
        const barY = this.y - this.height / 2 - barYOffset;

        if (ProgressBarRenderer) {
            ProgressBarRenderer.draw(ctx, {
                x: barX,
                y: barY,
                width: barWidth,
                height: barHeight,
                percent: this.getHealthPercent(),
                mode: 'health',
                entityId: this.id,
                animated: true
            });
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(barX, barY, barWidth * this.getHealthPercent(), barHeight);
        }
    }

    /**
     * Refresh configuration from EntityRegistry
     * Called by EntityLoader on live update
     */
    refreshConfig() {
        // Look up latest config
        const typeConfig =
            EntityRegistry.nodes?.[this.resourceType] ||
            EntityRegistry.resources?.[this.resourceType] ||
            {};

        Logger.info(`[Resource] Refreshing config for ${this.resourceType}`);

        // Update dimensions using standard utility
        // Note: passing empty instance config {} because we want to reset to registry values
        // unless we want to persist instance overrides?
        // Usually hot-reload implies we want to see the new registry values.
        EntityScaling.applyToEntity(this, {}, typeConfig, { width: 120, height: 120 });
    }

    static COLORS = RESOURCE_COLORS;
    static RARITY = RESOURCE_RARITY;
    static RARITY_COLORS = RESOURCE_RARITY_COLORS;
    static TYPES: Record<string, { baseRespawnTime?: number;[key: string]: unknown }> = {};
}

// ES6 Module Export
export { Resource };
