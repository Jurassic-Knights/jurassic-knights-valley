/**
 * Resource - Collectible resource entity with health
 * 
 * Per GDD: Player spends stamina to damage resource, depleting health to collect.
 * 
 * Owner: Director (engine), Gameplay Designer (values), Lore Writer (names)
 */

class Resource extends Entity {
    /**
     * Create a resource
     * @param {object} config
     */
    constructor(config = {}) {
        // 1. Load Config from EntityRegistry (v2) or BaseResource fallback
        const defaults = window.BaseResource || {};
        const typeConfig = (window.EntityRegistry?.resources?.[config.resourceType]) || {};

        // Merge
        const finalConfig = { ...defaults, ...typeConfig, ...config };

        super({
            entityType: EntityTypes.RESOURCE,
            width: finalConfig.width || 150,
            height: finalConfig.height || 150,
            ...config
        });

        this.resourceType = config.resourceType || 'scrap_metal';
        this.amount = finalConfig.amount || 1; // Cascades from EntityConfig.resource.defaults
        this.interactRadius = finalConfig.interactRadius || 145;

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
        } else if (window.IslandManager) {
            const island = IslandManager.getIslandAt(this.x, this.y);
            if (island && island.type === 'home') {
                onHome = true;
            }
        }

        if (onHome && this.resourceType !== 'wood') {
            this.active = false;
            // console.warn(`[Resource] Suppressed invalid ${this.resourceType} on Home Island`);
        }
    }

    /**
     * Update resource state
     * Logic moved to ResourceSystem.js (ECS)
     * @param {number} dt
     */
    update(dt) {
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
    isInRange(hero) {
        return this.active && this.state === 'ready' && this.distanceTo(hero) < this.interactRadius;
    }

    /**
     * Take damage from hero attack
     * @param {number} damage
     * @returns {boolean} True if resource yielded loot
     */
    takeDamage(damage) {
        if (this.state !== 'ready') return false;

        // SFX: Mining Impact (unique per resource type)
        if (window.AudioManager) {
            const sfxId = `sfx_mine_${this.resourceType}`;
            AudioManager.playSFX(sfxId);
        }

        // Visual Impact VFX (Hit)
        if (window.VFXController) {
            // 1. Sparks (Immediate stick)
            VFXController.playForeground(this.x, this.y, {
                type: 'spark',
                color: '#FFFFFF',
                count: 12,     // Increased from 5 to 12
                speed: 12,     // Increased from 8 to 12
                lifetime: 300,
                size: 10       // Increased from 5 to 10
            });

            // 2. Small Debris Chips
            VFXController.playForeground(this.x, this.y, {
                type: 'debris',
                color: this.color,
                count: 15,     // Increased from 8 to 15
                speed: 10,     // Increased from 6 to 10
                lifetime: 600,
                gravity: 0.3,
                size: 8        // Increased from 5 to 8
            });
        }

        this.health -= damage;
        if (this.health <= 0) {
            // SFX: Break - use config-driven sfxSuffix
            if (window.AudioManager) {
                const typeConfig = (window.EntityConfig && EntityConfig.resource.types[this.resourceType]) || {};
                const suffix = typeConfig.sfxSuffix || 'metal';
                AudioManager.playSFX(`sfx_resource_break_${suffix}`);
            }

            this.health = 0;
            this.state = 'depleted';

            // Look up respawn time from upgrades if possible
            if (window.IslandUpgrades && this.islandGridX !== undefined) {
                const baseTime = Resource.TYPES[this.resourceType] ? Resource.TYPES[this.resourceType].baseRespawnTime : 30;
                this.maxRespawnTime = IslandUpgrades.getRespawnTime(this.islandGridX, this.islandGridY, baseTime);
            } else if (this.resourceType === 'wood') {
                this.maxRespawnTime = 15; // Fast respawn for trees
            }
            this.respawnTimer = this.maxRespawnTime;

            // Trigger Drop
            if (window.SpawnManager) {
                SpawnManager.spawnDrop(this.x, this.y, this.resourceType, this.amount);
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
        if (!window.IslandUpgrades) return;

        // Calculate new total duration
        let newDuration = this.maxRespawnTime; // Default base

        // Base value lookup
        const typeConfig = (window.EntityConfig && EntityConfig.resource) ?
            EntityConfig.resource.types[this.resourceType] : {};
        const baseTime = typeConfig.respawnTime || 30;

        if (this.islandGridX !== undefined) {
            newDuration = IslandUpgrades.getRespawnTime(this.islandGridX, this.islandGridY, baseTime);
        }

        // If depleted/respawning, scale remaining time
        // Note: Resource.js wasn't tracking 'currentRespawnDuration' before, we need to add/use it
        // If not tracked, fallback to maxRespawnTime (which was the 'current' before this update)
        const currentTotal = this.currentRespawnDuration || this.maxRespawnTime;

        if (this.state === 'depleted' && currentTotal > 0) {
            const completionPct = 1 - (this.respawnTimer / currentTotal);
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
    render(ctx) {
        // Handled by ResourceRenderer
    }

    /**
     * Render health bar (UI Layer)
     * @param {CanvasRenderingContext2D} ctx
     */
    renderUI(ctx) {
        // Health bar (above resource)
        this.renderHealthBar(ctx);
    }

    /**
     * Render health bar above resource using ProgressBarRenderer
     * @param {CanvasRenderingContext2D} ctx
     */
    renderHealthBar(ctx) {
        // Only show if damaged
        if (this.health >= this.maxHealth) return;
        if (this.state === 'depleted') return;

        const barWidth = 100;
        const barHeight = 14;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 18;

        if (window.ProgressBarRenderer) {
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
}

// Resource type colors (lore-compliant: industrial, military)
Resource.COLORS = {
    scrap_metal: '#7A7A7A',    // Grey steel
    iron_ore: '#8B4513',       // Rusty brown
    fossil_fuel: '#2F2F2F',    // Coal black
    gold: '#FFD700',           // Gold coin
    wood: '#5D4037',           // Wood brown
    primal_meat: '#8B0000'     // Dark red meat
};

Resource.RARITY = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    LEGENDARY: 'legendary'
};

Resource.RARITY_COLORS = {
    common: '#BDC3C7',      // Silver/Grey
    uncommon: '#2ECC71',    // Emerald Green
    rare: '#3498DB',        // Bright Blue
    legendary: '#F1C40F'    // Gold
};

// Resource definitions with health values (Gameplay Designer)
// Resource definitions
// Now centralized in EntityConfig.js. 
// Kept as alias for backward compatibility only if strictly needed, otherwise remove.
// Resource.TYPES = EntityConfig.resource.types; // (Requires EntityConfig to be loaded)
Resource.TYPES = {}; // Safety placeholder implies lookup elsewhere

window.Resource = Resource;
