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
import { EnemyConfig } from '@config/EnemyConfig';
import { GameConstants } from '@data/GameConstants';
import { HealthComponent } from '../components/HealthComponent';
import { StatsComponent } from '../components/StatsComponent';
import { CombatComponent } from '../components/CombatComponent';
import { AIComponent } from '../components/AIComponent';
import { EnemyAI } from '../ai/behaviors/enemies/EnemyAI';
import { Component } from '@core/Component';
import { getConfig } from '@data/GameConstants';
import { buildEnemyConfig, getPatrolConfig } from './EnemyCoreConfig';
import { refreshEnemyConfig } from './EnemyCoreRefresh';
import type { EntityConfig } from '../types/core';

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

    renderUI(ctx: CanvasRenderingContext2D): void {
        if (!this.active || this.isDead) return;
        this.renderHealthBar(ctx);
        this.renderThreatIndicator(ctx);
    }

    // Rewards
    xpReward: number = GameConstants.Enemy.DEFAULT_XP_REWARD;
    lootTableId: string = 'common_enemy';
    lootTable: Array<{ item: string; chance?: number; amount?: number | number[] | { min: number; max: number; } }> | null = null;
    lootMultiplier: number = 1.0;

    // SFX and context
    sfx: Record<string, string> | null = null;
    biomeId?: string;

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
    spriteId?: string;
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
        const { finalConfig, typeConfig, isElite, entityType, sizeInfo } = buildEnemyConfig(config);

        const scaleValue = (sizeInfo as { scale?: number }).scale;
        if (scaleValue && scaleValue !== 1.0) {
            Logger.info(`[Enemy] ${config.enemyType}: species=${typeConfig.species || typeConfig.bodyType}, scale=${scaleValue}, size=${sizeInfo.width}x${sizeInfo.height}`);
        }

        super({
            id: config.id || `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityType: entityType,
            x: config.x || 0,
            y: config.y || 0,
            width: sizeInfo.width,
            height: sizeInfo.height,
            color: isElite ? '#FF4500' : finalConfig.color || '#8B0000',
            sprite: finalConfig.sprite || undefined,
            collision: finalConfig.collision // Pass merged collision config
        });

        // Enemy Identity
        this.enemyType = config.enemyType || 'unknown';
        this.enemyName = finalConfig.name || 'Unknown Enemy';
        this.species = (finalConfig.species as string) || null;
        this.level = (config.level as number) || 1;
        this.isElite = isElite;
        this.threatLevel = isElite
            ? (finalConfig.threatLevel || 1) + 2
            : finalConfig.threatLevel || 1;

        // Pack Behavior
        this.packAggro = finalConfig.packAggro !== false; // Default true
        this.groupId = (config.groupId as string) || null; // Links enemies in same group
        this.waveId = (config.waveId as string) || null; // For respawn wave tracking

        this.spawnX = config.x || 0;
        this.spawnY = config.y || 0;
        const patrol = getPatrolConfig(finalConfig, config);
        this.patrolRadius = patrol.patrolRadius;
        this.leashDistance = patrol.leashDistance;
        this.aggroRange = patrol.aggroRange;

        const E = GameConstants.Enemy;
        this.health = Number(finalConfig.health) || E.DEFAULT_HEALTH;
        this.maxHealth = Number(finalConfig.maxHealth) || this.health;
        this.damage = Number(finalConfig.damage) || E.DEFAULT_DAMAGE;
        this.attackRate = Number(finalConfig.attackRate) || 1;
        this.attackRange = Number(finalConfig.attackRange) || E.DEFAULT_ATTACK_RANGE;
        this.attackType = (finalConfig.attackType as string) || 'melee';
        this.speed = Number(finalConfig.speed) || E.DEFAULT_SPEED;

        this.xpReward = (finalConfig.xpReward as number) ?? E.DEFAULT_XP_REWARD;
        this.lootTableId = (finalConfig.lootTableId as string) || 'common_enemy';
        this.lootTable = (finalConfig.lootTable as Array<{ item: string; chance?: number; amount?: number | number[] | { min: number; max: number; } }>) || null;
        this.lootMultiplier = isElite
            ? (EnemyConfig.eliteMultipliers as { lootDrops?: number })?.lootDrops ?? 3.0
            : 1.0;

        // Entity SFX (from entity JSON)
        this.sfx = (finalConfig.sfx as Record<string, string>) || null;

        // Biome Context
        this.biomeId = config.biomeId || undefined;

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
        this.frameInterval = (finalConfig.frameInterval as number) ?? E.FRAME_INTERVAL;

        this.wanderTarget = null;
        this.wanderTimer = 0;
        const wMin = GameConstants.Enemy.WANDER_INTERVAL_MIN;
        const wVar = GameConstants.Enemy.WANDER_INTERVAL_VARIANCE;
        this.wanderInterval = wMin + Math.random() * wVar;

        // Sprite Loading
        this.spriteId = (finalConfig.spriteId as string) || undefined;
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
                defense: (finalConfig.defense as number) || 0
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

    refreshConfig() {
        const sizeInfo = refreshEnemyConfig(this.enemyType, this.width, this.height, this.collision as any);
        if (sizeInfo) {
            this.width = sizeInfo.width;
            this.height = sizeInfo.height;
        }
    }
}

// ES6 Module Export
export { Enemy };
