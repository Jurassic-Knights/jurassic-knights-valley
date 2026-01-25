/**
 * Resource - Collectible resource entity with health
 *
 * Per GDD: Player spends stamina to damage resource, depleting health to collect.
 *
 * Owner: Director (engine), Gameplay Designer (values), Lore Writer (names)
 */
import { Entity } from '../core/Entity';
import { IslandManager } from '../world/IslandManager';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '../vfx/VFXController';
import { spawnManager } from '../systems/SpawnManager';
import { ProgressBarRenderer } from '../vfx/ProgressBarRenderer';
import { GameConstants, getConfig } from '../data/GameConstants';
import { EntityTypes } from '../config/EntityTypes';
import { Registry } from '../core/Registry';
import { EntityRegistry } from '../entities/EntityLoader';


class Resource extends Entity {
    // Resource identity
    resourceType: string = 'scraps_t1_01';
    nodeSubtype: string | null = null;
    amount: number = 1;
    interactRadius: number = 145;

    // Health system
    maxHealth: number = 30;
    health: number = 30;

    // State
    state: string = 'ready';
    respawnTimer: number = 0;
    maxRespawnTime: number = 30;

    // Island context (inherited from Entity - use declare to avoid overwrite error)
    declare islandGridX: number | undefined;
    declare islandGridY: number | undefined;

    // Respawn tracking
    currentRespawnDuration: number = 30;

    /**
     * Create a resource
     * @param {object} config
     */
    constructor(config: any = {}) {
        // 1. Load Config from EntityRegistry (nodes or resources)
        // 1. Load Config from EntityRegistry (nodes or resources)
        const typeConfig =
            EntityRegistry.nodes?.[config.resourceType] ||
            EntityRegistry.resources?.[config.resourceType] ||
            {};

        // Merge
        const finalConfig = { ...typeConfig, ...config };

        super({
            entityType: EntityTypes.RESOURCE,
            width: finalConfig.width || 150,
            height: finalConfig.height || 150,
            ...config
        });

        this.resourceType = config.resourceType || 'scraps_t1_01';

        // Extract nodeSubtype from config or parse from resourceType (node_mining_t1_01 → mining)
        if (finalConfig.nodeSubtype) {
            this.nodeSubtype = finalConfig.nodeSubtype;
        } else if (this.resourceType.startsWith('node_')) {
            // Parse from ID like node_mining_t1_01 → mining
            const match = this.resourceType.match(/^node_([a-z]+)_t\d/);
            this.nodeSubtype = match ? match[1] : 'mining';
        } else {
            this.nodeSubtype = null;
        }

        this.amount = finalConfig.amount || 1;
        this.interactRadius =
            finalConfig.interactRadius || getConfig().Combat?.DEFAULT_MINING_RANGE || 150;

        // Health system
        this.maxHealth = finalConfig.maxHealth || 30;
        this.health = this.maxHealth;

        // Set color based on type
        this.color = finalConfig.color || '#888888';

        // State: 'ready' or 'depleted'
        this.state = 'ready';
        this.respawnTimer = 0;
        this.maxRespawnTime = finalConfig.respawnTime || 30;

        // Domain Rule: Home Island (Starter Zone) strictly allows only Wood
        // Robust check: Use spatial lookup if grid coords are missing (legacy save support)
        let onHome = false;
        if (this.islandGridX === 0 && this.islandGridY === 0) {
            onHome = true;
        } else if (IslandManager) {
            const island = IslandManager.getIslandAt(this.x, this.y);
            if (island && island.type === 'home') {
                onHome = true;
            }
        }

        // Home island allows T1 nodes (trees in starter area)
        // Check for _t1_ pattern in ID (works with both old node_t1_xx and new node_subtype_t1_xx naming)
        const isT1Node = this.resourceType.includes('_t1_');
        if (onHome && !isT1Node) {
            this.active = false;
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
    isInRange(hero: { x: number; y: number }) {
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
                lifetime: 300,
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

            // Look up respawn time from upgrades if possible
            if (IslandUpgrades && this.islandGridX !== undefined) {
                const baseTime = (Resource as any).TYPES[this.resourceType]
                    ? (Resource as any).TYPES[this.resourceType].baseRespawnTime
                    : 30;
                this.maxRespawnTime = IslandUpgrades.getRespawnTime(
                    this.islandGridX,
                    this.islandGridY,
                    baseTime
                );
            } else if (this.resourceType.includes('_t1_')) {
                this.maxRespawnTime = 15; // Fast respawn for T1 nodes (trees)
            }
            this.respawnTimer = this.maxRespawnTime;

            // Trigger Drop
            if (spawnManager) {
                spawnManager.spawnDrop(this.x, this.y, this.resourceType, this.amount);
            }

            return true; // Yield loot
        }
        return false;
    }

    /**
     * Recalculate respawn timer based on current upgrades
     * Handles proportional time reduction if already respawning
     */
    recalculateRespawnTimer() {
        if (!IslandUpgrades) return;

        // Calculate new total duration
        let newDuration = this.maxRespawnTime; // Default base

        // Base value lookup
        const typeConfig = EntityRegistry.resources?.[this.resourceType] || {};
        const baseTime = typeConfig.respawnTime || 30;

        if (this.islandGridX !== undefined) {
            newDuration = IslandUpgrades.getRespawnTime(
                this.islandGridX,
                this.islandGridY,
                baseTime
            );
        }

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

        const barWidth = 100;
        const barHeight = 14;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 18;

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
            // Fallback: flat bar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(barX, barY, barWidth * this.getHealthPercent(), barHeight);
        }
    }

    // Static properties
    static COLORS: Record<string, string> = {
        scraps: '#7A7A7A', // Grey steel
        minerals: '#8B4513', // Rusty brown
        food: '#8B0000', // Dark red meat
        wood: '#5D4037', // Wood brown
        gold: '#FFD700', // Gold coin
        salvage: '#2F2F2F' // Coal black
    };

    static RARITY: Record<string, string> = {
        COMMON: 'common',
        UNCOMMON: 'uncommon',
        RARE: 'rare',
        LEGENDARY: 'legendary'
    };

    static RARITY_COLORS: Record<string, string> = {
        common: '#BDC3C7', // Silver/Grey
        uncommon: '#2ECC71', // Emerald Green
        rare: '#3498DB', // Bright Blue
        legendary: '#F1C40F' // Gold
    };

    static TYPES: Record<string, any> = {}; // Safety placeholder implies lookup elsewhere
}

// ES6 Module Export
export { Resource };
