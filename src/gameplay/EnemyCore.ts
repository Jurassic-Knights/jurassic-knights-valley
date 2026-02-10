/**
 * EnemyCore - Core Enemy class with constructor and state
 *
 * Different from Dinosaur (passive zone creatures).
 * Enemies spawn in open world biomes and actively hunt the player.
 *
 * Features:
 * - Elite variants (5% spawn chance, 2x stats, 3x loot)
 * - Pack aggro behavior (grouped enemies attack together)
 * - Patrol/leash system (enemies return to spawn area)
 * - Wave-based respawning (groups respawn together)
 *
 * Owner: Combat System
 */
import { Entity } from '@core/Entity';
import { Logger } from '@core/Logger';
import { EntityConfig as EntityConfigValue } from '@config/EntityConfig';
import { EntityRegistry } from '@entities/EntityLoader';
import { GameConstants } from '@data/GameConstants';
import { BiomeConfig } from '@data/BiomeConfig';
import { EntityTypes } from '@config/EntityTypes';
import { SpeciesScaleConfig } from '@config/SpeciesScaleConfig';
import { HealthComponent } from '../components/HealthComponent';
import { StatsComponent } from '../components/StatsComponent';
import { CombatComponent } from '../components/CombatComponent';
import { AIComponent } from '../components/AIComponent';
import { EnemyAI } from '../ai/behaviors/enemies/EnemyAI';
import { Registry } from '@core/Registry';
import { Component } from '@core/Component';
import { getConfig } from '@data/GameConstants';
import type { EntityConfig } from '../types/core';

// Unmapped modules - need manual import

class Enemy extends Entity {
    // Identity
    enemyType: string = 'unknown';
    enemyName: string = 'Unknown Enemy';
    species: string | null = null;
    level: number = 1;
    isElite: boolean = false;
    threatLevel: number = 1;

    // Pack behavior
    packAggro: boolean = true;
    groupId: string | null = null;
    waveId: string | null = null;

    // Patrol/Spawn (fallbacks from GameConstants.Biome)
    spawnX: number = 0;
    spawnY: number = 0;
    patrolRadius: number = GameConstants.Biome.PATROL_AREA_RADIUS;
    leashDistance: number = GameConstants.Biome.LEASH_DISTANCE;
    aggroRange: number = GameConstants.Biome.AGGRO_RANGE;

    // Combat stats (fallbacks from GameConstants.Enemy)
    health: number = GameConstants.Enemy.DEFAULT_HEALTH;
    maxHealth: number = GameConstants.Enemy.DEFAULT_HEALTH;
    damage: number = GameConstants.Enemy.DEFAULT_DAMAGE;
    attackRate: number = 1;
    attackRange: number = GameConstants.Enemy.DEFAULT_ATTACK_RANGE;
    attackType: string = 'melee';
    speed: number = GameConstants.Enemy.DEFAULT_SPEED;

    // Boss Flag
    isBoss?: boolean = false;

    // Render methods (optional implementation)
    // Render methods (optional implementation)
    renderUI(ctx: CanvasRenderingContext2D): void {
        if (!this.active || this.isDead) return;
        this.renderHealthBar(ctx);
        this.renderThreatIndicator(ctx);
    }

    // Rewards
    xpReward: number = GameConstants.Enemy.DEFAULT_XP_REWARD;
    lootTableId: string = 'common_enemy';
    lootTable: Record<string, number> | null = null;
    lootMultiplier: number = 1.0;

    // SFX and context
    sfx: Record<string, string> | null = null;
    biomeId: string | null = null;

    // State machine
    state: string = 'idle';
    target: Entity | null = null;
    attackCooldown: number = 0;

    // Respawn
    respawnTime: number = GameConstants.Enemy.DEFAULT_RESPAWN_TIME;
    respawnTimer: number = 0;
    isDead: boolean = false;

    // Animation
    facingRight: boolean = true;
    frameIndex: number = 0;
    frameTimer: number = 0;
    frameInterval: number = GameConstants.Enemy.FRAME_INTERVAL;

    // Wander behavior
    wanderTarget: { x: number; y: number } | null = null;
    wanderTimer: number = 0;
    wanderInterval: number = GameConstants.Enemy.WANDER_INTERVAL_MIN;

    // Sprite
    spriteId: string | null = null;
    _sprite: HTMLImageElement | null = null;
    _spriteLoaded: boolean = false;

    // Components
    components: Record<string, Component> = {};

    // Pathfinding state
    currentPath: { x: number; y: number }[] = [];
    pathIndex: number = 0;
    pathTarget: { x: number; y: number } | null = null;
    pathRecalcTimer: number = 0;

    /**
     * Create an enemy entity
     * @param {EntityConfig} config - Enemy configuration
     */
    constructor(config: EntityConfig = {}) {
        // Get config hierarchy: defaults -> entity JSON -> instance config
        const defaults = EntityConfigValue.defaults || EntityConfigValue.enemy?.defaults || {};

        // Look up type config from EntityRegistry via EnemyConfig.get()
        let typeConfig: EntityConfig = {};
        if (config.enemyType) {
            // Priority 1: EntityRegistry (from entity JSONs via EntityLoader)
            // Check enemies first (includes bosses), then fallbacks
            typeConfig =
                EntityRegistry.enemies?.[config.enemyType] ||
                EntityConfigValue.get?.(config.enemyType) ||
                // Fallback: Old EntityConfig paths (deprecated)
                EntityConfigValue.enemy?.dinosaurs?.[config.enemyType] ||
                EntityConfigValue.enemy?.soldiers?.[config.enemyType] ||
                {};
        }

        // Merge configs (instance overrides type overrides defaults)
        const finalConfig = { ...defaults, ...typeConfig, ...config };

        // Elite Roll - 5% chance or forced via config
        const eliteChance =
            EntityConfigValue.enemy?.eliteSpawnChance || BiomeConfig.Biome?.ELITE_SPAWN_CHANCE || 0.05;
        const isElite = config.isElite || (!config.forceNormal && Math.random() < eliteChance);

        // Apply elite multipliers if elite
        if (isElite) {
            const mult = EntityConfigValue.enemy?.eliteMultipliers || {
                health: 2.0,
                damage: 2.0,
                xpReward: 3.0,
                lootDrops: 3.0
            };
            const eliteFallback = GameConstants.Enemy.ELITE_FALLBACK_HEALTH;
            finalConfig.health = (Number(finalConfig.health) || eliteFallback) * mult.health;
            finalConfig.maxHealth =
                (Number(finalConfig.maxHealth) || finalConfig.health) * mult.health;
            finalConfig.damage = (Number(finalConfig.damage) || GameConstants.Enemy.DEFAULT_DAMAGE) * mult.damage;
            finalConfig.xpReward = (Number(finalConfig.xpReward) || GameConstants.Enemy.DEFAULT_XP_REWARD) * mult.xpReward;
        }

        // Apply biome difficulty multipliers if biome specified
        if (config.biomeId && (BiomeConfig.types as Record<string, { difficulty?: string; [key: string]: unknown }>)?.[config.biomeId]) {
            const biome = (BiomeConfig.types as Record<string, { difficulty?: string; [key: string]: unknown }>)[config.biomeId];
            const diffMult = (BiomeConfig.difficultyMultipliers as Record<string, { damage?: number; [key: string]: unknown }>)?.[biome.difficulty] || {
                health: 1,
                damage: 1,
                xp: 1,
                loot: 1
            };

            finalConfig.health = (finalConfig.health || 0) * diffMult.health;
            finalConfig.maxHealth = finalConfig.health;
            finalConfig.damage = (finalConfig.damage || 0) * diffMult.damage;
            finalConfig.xpReward = (finalConfig.xpReward || 0) * diffMult.xp;
        }

        // Determine entity type based on sourceFile or explicit entityType
        let entityType = finalConfig.entityType;
        if (!entityType) {
            // Infer from sourceFile or enemyType string
            const sourceFile = (typeConfig.sourceFile || config.enemyType || '').toLowerCase();
            if (sourceFile.includes('soldier') || sourceFile.includes('human')) {
                entityType = EntityTypes.ENEMY_SOLDIER;
            } else if (sourceFile.includes('saurian')) {
                entityType = EntityTypes.ENEMY_SAURIAN;
            } else {
                entityType = EntityTypes.ENEMY_DINOSAUR;
            }
        }

        // Call parent constructor
        // Get size from SpeciesScaleConfig (runtime lookup by species/bodyType)
        const isBoss = typeConfig.isBoss || typeConfig.entityType === 'Boss';
        const defaultSize = GameConstants.Enemy.DEFAULT_SIZE;
        const sizeInfo = SpeciesScaleConfig.getSize(typeConfig, isBoss) || {
            width: defaultSize,
            height: defaultSize
        };

        // Debug
        const scaleValue = (sizeInfo as { scale?: number }).scale;
        if (scaleValue && scaleValue !== 1.0) {
            Logger.info(
                `[Enemy] ${config.enemyType}: species=${typeConfig.species || typeConfig.bodyType}, scale=${scaleValue}, size=${sizeInfo.width}x${sizeInfo.height}`
            );
        }

        super({
            id: config.id || `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityType: entityType,
            x: config.x || 0,
            y: config.y || 0,
            width: sizeInfo.width,
            height: sizeInfo.height,
            color: isElite ? '#FF4500' : finalConfig.color || '#8B0000',
            sprite: finalConfig.sprite || null,
            collision: finalConfig.collision // Pass merged collision config
        });

        // Enemy Identity
        this.enemyType = config.enemyType || 'unknown';
        this.enemyName = finalConfig.name || 'Unknown Enemy';
        this.species = finalConfig.species || null;
        this.level = config.level || 1;
        this.isElite = isElite;
        this.threatLevel = isElite
            ? (finalConfig.threatLevel || 1) + 2
            : finalConfig.threatLevel || 1;

        // Pack Behavior
        this.packAggro = finalConfig.packAggro !== false; // Default true
        this.groupId = config.groupId || null; // Links enemies in same group
        this.waveId = config.waveId || null; // For respawn wave tracking

        // Patrol Area (spawn location + wander radius) - read from GameConfig.AI
        this.spawnX = config.x || 0;
        this.spawnY = config.y || 0;
        const Biome = GameConstants.Biome;
        this.patrolRadius =
            finalConfig.patrolRadius ??
            getConfig().AI?.PATROL_AREA_RADIUS ??
            BiomeConfig.patrolDefaults?.areaRadius ??
            Biome.PATROL_AREA_RADIUS;
        this.leashDistance =
            finalConfig.leashDistance ??
            getConfig().Biome?.LEASH_DISTANCE ??
            BiomeConfig.patrolDefaults?.leashDistance ??
            Biome.LEASH_DISTANCE;
        this.aggroRange =
            finalConfig.aggroRange ??
            getConfig().Biome?.AGGRO_RANGE ??
            BiomeConfig.patrolDefaults?.aggroRange ??
            Biome.AGGRO_RANGE;

        const E = GameConstants.Enemy;
        this.health = Number(finalConfig.health) || E.DEFAULT_HEALTH;
        this.maxHealth = Number(finalConfig.maxHealth) || this.health;
        this.damage = Number(finalConfig.damage) || E.DEFAULT_DAMAGE;
        this.attackRate = Number(finalConfig.attackRate) || 1;
        this.attackRange = Number(finalConfig.attackRange) || E.DEFAULT_ATTACK_RANGE;
        this.attackType = finalConfig.attackType || 'melee';
        this.speed = Number(finalConfig.speed) || E.DEFAULT_SPEED;

        this.xpReward = finalConfig.xpReward ?? E.DEFAULT_XP_REWARD;
        this.lootTableId = finalConfig.lootTableId || 'common_enemy';
        this.lootTable = finalConfig.lootTable || null;
        this.lootMultiplier = isElite
            ? EntityConfigValue.enemy?.eliteMultipliers?.lootDrops || 3.0
            : 1.0;

        // Entity SFX (from entity JSON)
        this.sfx = finalConfig.sfx || null;

        // Biome Context
        this.biomeId = config.biomeId || null;

        // State Machine
        this.state = 'idle';
        this.target = null;
        this.attackCooldown = 0;

        this.respawnTime = finalConfig.respawnTime ?? E.DEFAULT_RESPAWN_TIME;
        this.respawnTimer = 0;
        this.isDead = false;

        // Animation
        this.facingRight = true;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = finalConfig.frameInterval ?? E.FRAME_INTERVAL;

        this.wanderTarget = null;
        this.wanderTimer = 0;
        const wMin = GameConstants.Enemy.WANDER_INTERVAL_MIN;
        const wVar = GameConstants.Enemy.WANDER_INTERVAL_VARIANCE;
        this.wanderInterval = wMin + Math.random() * wVar;

        // Sprite Loading
        this.spriteId = finalConfig.spriteId || null;
        this._spriteLoaded = false;
        this._loadSprite();

        // Initialize Components (for EnemySystem integration)
        this.components = {};

        // Health Component
        if (HealthComponent) {
            this.components.health = new HealthComponent(this, {
                maxHealth: this.maxHealth,
                health: this.health
            });
        }

        // Stats Component
        if (StatsComponent) {
            this.components.stats = new StatsComponent(this, {
                speed: this.speed,
                defense: finalConfig.defense || 0
            });
        }

        // Combat Component
        if (CombatComponent) {
            this.components.combat = new CombatComponent(this, {
                damage: this.damage,
                rate: this.attackRate,
                range: this.attackRange
            });
        }

        // AI Component (for EnemySystem AI logic)
        if (AIComponent) {
            this.components.ai = new AIComponent(this, {
                state: 'WANDER',
                aggroRange: this.aggroRange,
                leashDistance: this.leashDistance,
                attackRange: this.attackRange
            });
        }

        // Pathfinding state
        this.currentPath = [];
        this.pathIndex = 0;
        this.pathTarget = null;
        this.pathRecalcTimer = 0;
    }

    /**
     * Update enemy logic
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt: number) {
        if (!this.active || this.isDead) {
            if (this.isDead) {
                this.respawnTimer -= dt / 1000;
                if (this.respawnTimer <= 0) {
                    this.respawn();
                }
            }
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt / 1000;
        }

        if (EnemyAI) {
            EnemyAI.updateState(this, dt);
        }

        this.updateAnimation(dt);
    }

    /**
     * Check if hero is in aggro range
     * @param {Entity} hero
     * @returns {boolean}
     */
    canSee(hero: Entity) {
        if (!hero || this.isDead) return false;
        // Use dynamic config for live updates
        const aggroRange = getConfig().Biome?.AGGRO_RANGE || this.aggroRange;
        return this.distanceTo(hero) <= aggroRange;
    }

    /**
     * Load sprite asset (stub - implemented in EnemyBehavior.ts prototype extension)
     */
    _loadSprite(): void {
        // Implementation in EnemyBehavior.ts via prototype
    }

    /**
     * Respawn the enemy (stub - implemented in EnemyBehavior.ts prototype extension)
     */
    respawn(): void {
        // Implementation in EnemyBehavior.ts via prototype
    }

    /**
     * Update animation frames (stub - implemented in EnemyBehavior.ts prototype extension)
     */
    updateAnimation(_dt: number): void {
        // Implementation in EnemyBehavior.ts via prototype
    }

    /**
     * Die method (stub - implemented in EnemyBehavior.ts prototype extension)
     */
    die(_killer: Entity | null = null): void {
        // Implementation in EnemyBehavior.ts via prototype
    }

    // ============================================
    // Prototype extension stubs (implemented in EnemyBehavior.ts)
    // ============================================
    moveAlongPath(_targetX: number, _targetY: number, _speed: number, _dt: number): boolean { return false; }
    moveDirectly(_targetX: number, _targetY: number, _speed: number, _dt: number): boolean {
        return false;
    }
    updateWander(_dt: number): void { }
    updateChase(_dt: number): void { }
    updateAttack(_dt: number): void { }
    performAttack(): void { }
    updateReturning(_dt: number): void { }
    takeDamage(_amount: number, _source: Entity | null = null): void { }
    triggerPackAggro(_target: Entity): void { }
    renderHealthBar(_ctx: CanvasRenderingContext2D): void { }
    renderThreatIndicator(_ctx: CanvasRenderingContext2D): void { }

    /**
     * Refresh configuration from EntityRegistry
     * Called by EntityLoader on live update
     */
    refreshConfig() {
        // 1. Re-fetch config
        // Re-construct logic similar to constructor lookup
        const typeConfig: EntityConfig = this.enemyType ? EntityRegistry.enemies?.[this.enemyType] || {} : {};

        // 2. Re-calculate size
        const isBoss = typeConfig.isBoss || typeConfig.entityType === 'Boss';
        const sizeInfo = SpeciesScaleConfig.getSize(typeConfig, isBoss);

        if (sizeInfo) {
            this.width = sizeInfo.width;
            this.height = sizeInfo.height;
            // Logger.info(`[Enemy] Refreshed config for ${this.enemyType}: ${this.width}x${this.height}`);
        }

        // 3. Sync Collision
        if (this.collision && this.collision.bounds) {
            this.collision.bounds.width = this.width;
            this.collision.bounds.height = this.height;
        }
    }
}

// ES6 Module Export
export { Enemy };
