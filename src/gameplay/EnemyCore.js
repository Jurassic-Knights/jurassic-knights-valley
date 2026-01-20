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

class Enemy extends Entity {
    /**
     * Create an enemy entity
     * @param {object} config - Enemy configuration
     */
    constructor(config = {}) {
        // Get config hierarchy: defaults -> entity JSON -> instance config
        const defaults = window.EnemyConfig?.defaults || window.EntityConfig?.enemy?.defaults || {};

        // Look up type config from EntityRegistry via EnemyConfig.get()
        let typeConfig = {};
        if (config.enemyType) {
            // Priority 1: EntityRegistry (from entity JSONs via EntityLoader)
            typeConfig =
                window.EnemyConfig?.get?.(config.enemyType) ||
                // Fallback: Old EntityConfig paths (deprecated)
                window.EntityConfig?.enemy?.dinosaurs?.[config.enemyType] ||
                window.EntityConfig?.enemy?.soldiers?.[config.enemyType] ||
                {};
        }

        // Merge configs (instance overrides type overrides defaults)
        const finalConfig = { ...defaults, ...typeConfig, ...config };

        // Elite Roll - 5% chance or forced via config
        const eliteChance =
            window.EntityConfig?.enemy?.eliteSpawnChance ||
            window.GameConstants?.Biome?.ELITE_SPAWN_CHANCE ||
            0.05;
        const isElite = config.isElite || (!config.forceNormal && Math.random() < eliteChance);

        // Apply elite multipliers if elite
        if (isElite) {
            const mult = window.EntityConfig?.enemy?.eliteMultipliers || {
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
        if (config.biomeId && window.BiomeConfig?.types?.[config.biomeId]) {
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
        const sizeInfo = window.SpeciesScaleConfig?.getSize(typeConfig, isBoss) || { width: 192, height: 192 };

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
            window.BiomeConfig?.patrolDefaults?.areaRadius ||
            window.GameConstants?.Biome?.PATROL_AREA_RADIUS ||
            300;
        this.leashDistance =
            finalConfig.leashDistance ||
            window.BiomeConfig?.patrolDefaults?.leashDistance ||
            window.GameConstants?.Biome?.LEASH_DISTANCE ||
            500;
        this.aggroRange =
            finalConfig.aggroRange ||
            window.BiomeConfig?.patrolDefaults?.aggroRange ||
            window.GameConstants?.Biome?.AGGRO_RANGE ||
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
            ? window.EntityConfig?.enemy?.eliteMultipliers?.lootDrops || 3.0
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
        if (window.HealthComponent) {
            this.components.health = new HealthComponent(this, {
                maxHealth: this.maxHealth,
                health: this.health
            });
        }

        // Stats Component
        if (window.StatsComponent) {
            this.components.stats = new StatsComponent(this, {
                speed: this.speed,
                defense: finalConfig.defense || 0
            });
        }

        // Combat Component
        if (window.CombatComponent) {
            this.components.combat = new CombatComponent(this, {
                damage: this.damage,
                rate: this.attackRate,
                range: this.attackRange
            });
        }

        // AI Component (for EnemySystem AI logic)
        if (window.AIComponent) {
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

        if (window.EnemyAI) {
            EnemyAI.updateState(this, dt);
        }

        this.updateAnimation(dt);
    }

    /**
     * Check if hero is in aggro range
     * @param {Entity} hero
     * @returns {boolean}
     */
    canSee(hero) {
        if (!hero || this.isDead) return false;
        return this.distanceTo(hero) <= this.aggroRange;
    }
}

// Global registration (methods added in EnemyBehavior.js and EnemyRender.js)
window.Enemy = Enemy;

// ES6 Module Export
export { Enemy };
