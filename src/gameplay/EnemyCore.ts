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
import { Entity } from '../core/Entity';
import { Logger } from '../core/Logger';

// Ambient declarations for not-yet-migrated modules
declare const EntityConfig: any;
declare const BiomeConfig: any;
declare const EntityTypes: any;
declare const SpeciesScaleConfig: any;
declare const HealthComponent: any;
declare const StatsComponent: any;
declare const CombatComponent: any;
declare const AIComponent: any;
declare const EnemyAI: any;

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

    // Patrol/Spawn
    spawnX: number = 0;
    spawnY: number = 0;
    patrolRadius: number = 300;
    leashDistance: number = 500;
    aggroRange: number = 200;

    // Combat stats
    health: number = 30;
    maxHealth: number = 30;
    damage: number = 5;
    attackRate: number = 1;
    attackRange: number = 100;
    attackType: string = 'melee';
    speed: number = 80;

    // Rewards
    xpReward: number = 10;
    lootTableId: string = 'common_enemy';
    lootTable: any = null;
    lootMultiplier: number = 1.0;

    // SFX and context
    sfx: any = null;
    biomeId: string | null = null;

    // State machine
    state: string = 'idle';
    target: any = null;
    attackCooldown: number = 0;

    // Respawn
    respawnTime: number = 60;
    respawnTimer: number = 0;
    isDead: boolean = false;

    // Animation
    facingRight: boolean = true;
    frameIndex: number = 0;
    frameTimer: number = 0;
    frameInterval: number = 200;

    // Wander behavior
    wanderTarget: any = null;
    wanderTimer: number = 0;
    wanderInterval: number = 3000;

    // Sprite
    spriteId: string | null = null;
    _spriteLoaded: boolean = false;

    // Components
    components: Record<string, any> = {};

    // Pathfinding state
    currentPath: any[] = [];
    pathIndex: number = 0;
    pathTarget: any = null;
    pathRecalcTimer: number = 0;

    /**
     * Create an enemy entity
     * @param {object} config - Enemy configuration
     */
    constructor(config: any = {}) {
        // Get config hierarchy: defaults -> entity JSON -> instance config
        const defaults = EntityConfig.defaults || EntityConfig.enemy?.defaults || {};

        // Look up type config from EntityRegistry via EnemyConfig.get()
        let typeConfig: any = {};
        if (config.enemyType) {
            // Priority 1: EntityRegistry (from entity JSONs via EntityLoader)
            typeConfig =
                EntityConfig.get?.(config.enemyType) ||
                // Fallback: Old EntityConfig paths (deprecated)
                EntityConfig.enemy?.dinosaurs?.[config.enemyType] ||
                EntityConfig.enemy?.soldiers?.[config.enemyType] ||
                {};
        }

        // Merge configs (instance overrides type overrides defaults)
        const finalConfig = { ...defaults, ...typeConfig, ...config };

        // Elite Roll - 5% chance or forced via config
        const eliteChance =
            EntityConfig.enemy?.eliteSpawnChance ||
            BiomeConfig.Biome?.ELITE_SPAWN_CHANCE ||
            0.05;
        const isElite = config.isElite || (!config.forceNormal && Math.random() < eliteChance);

        // Apply elite multipliers if elite
        if (isElite) {
            const mult = EntityConfig.enemy?.eliteMultipliers || {
                health: 2.0,
                damage: 2.0,
                xpReward: 3.0,
                lootDrops: 3.0
            };
            finalConfig.health = (finalConfig.health || 50) * mult.health;
            finalConfig.maxHealth = (finalConfig.maxHealth || finalConfig.health) * mult.health;
            finalConfig.damage = (finalConfig.damage || 5) * mult.damage;
            finalConfig.xpReward = (finalConfig.xpReward || 10) * mult.xpReward;
        }

        // Apply biome difficulty multipliers if biome specified
        if (config.biomeId && BiomeConfig.types?.[config.biomeId]) {
            const biome = BiomeConfig.types[config.biomeId];
            const diffMult = BiomeConfig.difficultyMultipliers?.[biome.difficulty] || {
                health: 1,
                damage: 1,
                xp: 1,
                loot: 1
            };

            finalConfig.health *= diffMult.health;
            finalConfig.maxHealth = finalConfig.health;
            finalConfig.damage *= diffMult.damage;
            finalConfig.xpReward *= diffMult.xp;
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
        const sizeInfo = SpeciesScaleConfig.getSize(typeConfig, isBoss) || { width: 192, height: 192 };

        // Debug
        if (sizeInfo.scale && sizeInfo.scale !== 1.0) {
            Logger.info(`[Enemy] ${config.enemyType}: species=${typeConfig.species || typeConfig.bodyType}, scale=${sizeInfo.scale}, size=${sizeInfo.width}x${sizeInfo.height}`);
        }

        super({
            id: config.id || `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityType: entityType,
            x: config.x || 0,
            y: config.y || 0,
            width: sizeInfo.width,
            height: sizeInfo.height,
            color: isElite ? '#FF4500' : finalConfig.color || '#8B0000',
            sprite: finalConfig.sprite || null
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

        // Patrol Area (spawn location + wander radius)
        this.spawnX = config.x || 0;
        this.spawnY = config.y || 0;
        this.patrolRadius =
            finalConfig.patrolRadius ||
            BiomeConfig.patrolDefaults?.areaRadius ||
            BiomeConfig.Biome?.PATROL_AREA_RADIUS ||
            300;
        this.leashDistance =
            finalConfig.leashDistance ||
            BiomeConfig.patrolDefaults?.leashDistance ||
            BiomeConfig.Biome?.LEASH_DISTANCE ||
            500;
        this.aggroRange =
            finalConfig.aggroRange ||
            BiomeConfig.patrolDefaults?.aggroRange ||
            BiomeConfig.Biome?.AGGRO_RANGE ||
            200;

        // Combat Stats
        this.health = finalConfig.health || 30;
        this.maxHealth = finalConfig.maxHealth || this.health;
        this.damage = finalConfig.damage || 5;
        this.attackRate = finalConfig.attackRate || 1;
        this.attackRange = finalConfig.attackRange || 100;
        this.attackType = finalConfig.attackType || 'melee';
        this.speed = finalConfig.speed || 80;

        // Rewards
        this.xpReward = finalConfig.xpReward || 10;
        this.lootTableId = finalConfig.lootTableId || 'common_enemy';
        this.lootTable = finalConfig.lootTable || null;
        this.lootMultiplier = isElite
            ? EntityConfig.enemy?.eliteMultipliers?.lootDrops || 3.0
            : 1.0;

        // Entity SFX (from entity JSON)
        this.sfx = finalConfig.sfx || null;

        // Biome Context
        this.biomeId = config.biomeId || null;

        // State Machine
        this.state = 'idle';
        this.target = null;
        this.attackCooldown = 0;

        // Respawn
        this.respawnTime = finalConfig.respawnTime || 60;
        this.respawnTimer = 0;
        this.isDead = false;

        // Animation
        this.facingRight = true;
        this.frameIndex = 0;
        this.frameTimer = 0;
        this.frameInterval = finalConfig.frameInterval || 200;

        // Wander behavior
        this.wanderTarget = null;
        this.wanderTimer = 0;
        this.wanderInterval = 3000 + Math.random() * 2000;

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
    update(dt) {
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
    canSee(hero: any) {
        if (!hero || this.isDead) return false;
        return this.distanceTo(hero) <= this.aggroRange;
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
}

// ES6 Module Export
export { Enemy };
