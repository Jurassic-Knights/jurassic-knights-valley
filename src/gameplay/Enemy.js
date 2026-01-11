/**
 * Enemy - Hostile entity that attacks the player
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
        // Get config hierarchy: defaults -> type config -> instance config
        const defaults = window.EntityConfig?.enemy?.defaults || {};

        // Look up type config from dinosaurs or soldiers tables
        let typeConfig = {};
        if (config.enemyType) {
            typeConfig = window.EntityConfig?.enemy?.dinosaurs?.[config.enemyType] ||
                window.EntityConfig?.enemy?.soldiers?.[config.enemyType] || {};
        }

        // Merge configs (instance overrides type overrides defaults)
        const finalConfig = { ...defaults, ...typeConfig, ...config };

        // Elite Roll - 5% chance or forced via config
        const eliteChance = window.EntityConfig?.enemy?.eliteSpawnChance ||
            window.GameConstants?.Biome?.ELITE_SPAWN_CHANCE || 0.05;
        const isElite = config.isElite || (!config.forceNormal && Math.random() < eliteChance);

        // Apply elite multipliers if elite
        if (isElite) {
            const mult = window.EntityConfig?.enemy?.eliteMultipliers || {
                health: 2.0, damage: 2.0, xpReward: 3.0, lootDrops: 3.0
            };
            finalConfig.health = (finalConfig.health || 50) * mult.health;
            finalConfig.maxHealth = (finalConfig.maxHealth || finalConfig.health) * mult.health;
            finalConfig.damage = (finalConfig.damage || 5) * mult.damage;
            finalConfig.xpReward = (finalConfig.xpReward || 10) * mult.xpReward;
        }

        // Apply biome difficulty multipliers if biome specified
        if (config.biomeId && window.BiomeConfig?.types?.[config.biomeId]) {
            const biome = BiomeConfig.types[config.biomeId];
            const diffMult = BiomeConfig.difficultyMultipliers?.[biome.difficulty] ||
                { health: 1, damage: 1, xp: 1, loot: 1 };

            finalConfig.health *= diffMult.health;
            finalConfig.maxHealth = finalConfig.health;
            finalConfig.damage *= diffMult.damage;
            finalConfig.xpReward *= diffMult.xp;
        }

        // Determine entity type
        const entityType = finalConfig.entityType ||
            (typeConfig.entityType === 'enemy_soldier' ?
                EntityTypes.ENEMY_SOLDIER : EntityTypes.ENEMY_DINOSAUR);

        // Call parent constructor
        super({
            id: config.id || `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            entityType: entityType,
            x: config.x || 0,
            y: config.y || 0,
            width: finalConfig.width || 192,
            height: finalConfig.height || 192,
            color: isElite ? '#FF4500' : (finalConfig.color || '#8B0000'),
            sprite: finalConfig.sprite || null
        });

        // Enemy Identity
        this.enemyType = config.enemyType || 'unknown';
        this.enemyName = finalConfig.name || 'Unknown Enemy';
        this.species = finalConfig.species || null;
        this.level = config.level || 1;
        this.isElite = isElite;
        this.threatLevel = isElite ? (finalConfig.threatLevel || 1) + 2 : (finalConfig.threatLevel || 1);

        // Pack Behavior
        this.packAggro = finalConfig.packAggro !== false; // Default true
        this.groupId = config.groupId || null; // Links enemies in same group
        this.waveId = config.waveId || null;   // For respawn wave tracking

        // Patrol Area (spawn location + wander radius)
        this.spawnX = config.x || 0;
        this.spawnY = config.y || 0;
        this.patrolRadius = finalConfig.patrolRadius ||
            window.BiomeConfig?.patrolDefaults?.areaRadius ||
            window.GameConstants?.Biome?.PATROL_AREA_RADIUS || 300;
        this.leashDistance = finalConfig.leashDistance ||
            window.BiomeConfig?.patrolDefaults?.leashDistance ||
            window.GameConstants?.Biome?.LEASH_DISTANCE || 500;
        this.aggroRange = finalConfig.aggroRange ||
            window.BiomeConfig?.patrolDefaults?.aggroRange ||
            window.GameConstants?.Biome?.AGGRO_RANGE || 200;

        // Combat Stats
        this.health = finalConfig.health || 30;  // Lowered for testing (3 shots)
        this.maxHealth = finalConfig.maxHealth || this.health;
        this.damage = finalConfig.damage || 5;
        this.attackRate = finalConfig.attackRate || 1;
        this.attackRange = finalConfig.attackRange || 100;
        this.attackType = finalConfig.attackType || 'melee';
        this.speed = finalConfig.speed || 80;

        // Rewards
        this.xpReward = finalConfig.xpReward || 10;
        this.lootTableId = finalConfig.lootTableId || 'common_enemy';
        this.lootMultiplier = isElite ?
            (window.EntityConfig?.enemy?.eliteMultipliers?.lootDrops || 3.0) : 1.0;

        // Biome Context
        this.biomeId = config.biomeId || null;

        // State Machine
        this.state = 'idle'; // idle, wander, chase, attack, returning, dead
        this.target = null;  // Current target (usually Hero)
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
        this.wanderInterval = 3000 + Math.random() * 2000; // 3-5 seconds

        // Sprite Loading (for enemy dinosaurs, use dino sprites)
        this.spriteId = this.species ? `dino_${this.species}_base` : null;
        this._sprite = null;
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
        this.currentPath = [];      // Array of waypoints {x, y}
        this.pathIndex = 0;         // Current waypoint index
        this.pathTarget = null;     // Last destination we calculated path to
        this.pathRecalcTimer = 0;   // Recalculate path periodically
    }

    /**
     * Move along a calculated A* path to destination
     * @param {number} targetX - Destination X
     * @param {number} targetY - Destination Y  
     * @param {number} speed - Movement speed
     * @param {number} dt - Delta time in ms
     * @returns {boolean} True if moving, false if arrived
     */
    moveAlongPath(targetX, targetY, speed, dt) {
        const distToTarget = Math.sqrt((targetX - this.x) ** 2 + (targetY - this.y) ** 2);

        // Already at destination?
        if (distToTarget < 20) {
            this.currentPath = [];
            this.pathIndex = 0;
            return true;
        }

        // Check if we need to recalculate path
        this.pathRecalcTimer += dt;
        const needsNewPath =
            this.currentPath.length === 0 ||
            this.pathIndex >= this.currentPath.length ||
            this.pathRecalcTimer > 1000 || // Recalc every 1 second
            (this.pathTarget &&
                Math.abs(this.pathTarget.x - targetX) > 100 ||
                Math.abs(this.pathTarget.y - targetY) > 100);

        if (needsNewPath && window.PathfindingSystem) {
            this.currentPath = window.PathfindingSystem.findPath(this.x, this.y, targetX, targetY);
            this.pathIndex = 0;
            this.pathTarget = { x: targetX, y: targetY };
            this.pathRecalcTimer = 0;

            // Skip first waypoint if we're already close to it
            if (this.currentPath.length > 1) {
                const first = this.currentPath[0];
                const distToFirst = Math.sqrt((first.x - this.x) ** 2 + (first.y - this.y) ** 2);
                if (distToFirst < 50) {
                    this.pathIndex = 1;
                }
            }
        }

        // No path available? Try direct movement as fallback
        if (this.currentPath.length === 0) {
            return this.moveDirectly(targetX, targetY, speed, dt);
        }

        // Get current waypoint
        if (this.pathIndex >= this.currentPath.length) {
            this.pathIndex = this.currentPath.length - 1;
        }
        const waypoint = this.currentPath[this.pathIndex];

        // Move towards waypoint
        const dx = waypoint.x - this.x;
        const dy = waypoint.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Reached waypoint? Move to next
        if (dist < 30) {
            this.pathIndex++;
            if (this.pathIndex >= this.currentPath.length) {
                // Path complete
                this.currentPath = [];
                return true;
            }
            return this.moveAlongPath(targetX, targetY, speed, dt);
        }

        // Move towards waypoint
        const moveSpeed = speed * (dt / 1000);
        const moveX = (dx / dist) * moveSpeed;
        const moveY = (dy / dist) * moveSpeed;

        this.x += moveX;
        this.y += moveY;
        this.facingRight = dx > 0;

        return false;
    }

    /**
     * Fallback direct movement (when pathfinding unavailable)
     */
    moveDirectly(targetX, targetY, speed, dt) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) return true;

        const moveSpeed = speed * (dt / 1000);
        const newX = this.x + (dx / dist) * moveSpeed;
        const newY = this.y + (dy / dist) * moveSpeed;

        const im = window.IslandManager;
        if (!im || (im.isWalkable(newX, this.y) && !im.isBlocked(newX, this.y))) {
            this.x = newX;
        }
        if (!im || (im.isWalkable(this.x, newY) && !im.isBlocked(this.x, newY))) {
            this.y = newY;
        }
        this.facingRight = dx > 0;
        return false;
    }

    /**
     * Update enemy logic
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt) {
        if (!this.active || this.isDead) {
            // Handle respawn timer
            if (this.isDead) {
                this.respawnTimer -= dt / 1000;
                if (this.respawnTimer <= 0) {
                    this.respawn();
                }
            }
            return;
        }

        // Update attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt / 1000;
        }

        // State machine (basic - full AI in 05-enemy-ai.md)
        switch (this.state) {
            case 'idle':
            case 'wander':
                this.updateWander(dt);
                break;
            case 'chase':
                this.updateChase(dt);
                break;
            case 'attack':
                this.updateAttack(dt);
                break;
            case 'returning':
                this.updateReturning(dt);
                break;
        }

        // Update animation
        this.updateAnimation(dt);
    }

    /**
     * Basic wander behavior with aggro detection
     */
    updateWander(dt) {
        // Check for hero aggro FIRST
        const hero = window.EntityManager?.getByType('Hero')?.[0] ||
            (window.Game?.hero);
        if (hero && !hero.isDead) {
            const dx = hero.x - this.x;
            const dy = hero.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.aggroRange) {
                // Aggro! Switch to chase
                this.target = hero;
                this.state = 'chase';

                // Play aggro sound
                if (window.AudioManager) {
                    AudioManager.playSFX('sfx_enemy_aggro');
                }

                console.log(`[Enemy] ${this.enemyName} aggro on hero at distance ${dist.toFixed(0)}`);
                return;
            }
        }

        this.wanderTimer += dt;

        if (!this.wanderTarget || this.wanderTimer >= this.wanderInterval) {
            // Pick new wander target within patrol radius
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * this.patrolRadius * 0.5;
            this.wanderTarget = {
                x: this.spawnX + Math.cos(angle) * dist,
                y: this.spawnY + Math.sin(angle) * dist
            };
            this.wanderTimer = 0;
            this.wanderInterval = 3000 + Math.random() * 2000;
        }

        // Move towards wander target using A* pathfinding (30% speed for wander)
        if (this.wanderTarget) {
            this.moveAlongPath(this.wanderTarget.x, this.wanderTarget.y, this.speed * 0.3, dt);
        }
    }

    /**
     * Placeholder chase behavior (full implementation in 05-enemy-ai.md)
     */
    updateChase(dt) {
        if (!this.target) {
            this.state = 'returning';
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Check leash distance
        const spawnDist = Math.sqrt(
            (this.x - this.spawnX) ** 2 + (this.y - this.spawnY) ** 2
        );
        if (spawnDist > this.leashDistance) {
            this.state = 'returning';
            this.target = null;
            return;
        }

        // Attack if in range
        if (dist <= this.attackRange) {
            this.state = 'attack';
            return;
        }

        // Move towards target using A* pathfinding
        this.moveAlongPath(this.target.x, this.target.y, this.speed, dt);
    }

    /**
     * Placeholder attack behavior
     */
    updateAttack(dt) {
        if (!this.target) {
            this.state = 'wander';
            return;
        }

        const dist = this.distanceTo(this.target);

        // If target moved out of range, chase
        if (dist > this.attackRange * 1.2) {
            this.state = 'chase';
            return;
        }

        // Attack on cooldown
        if (this.attackCooldown <= 0) {
            this.performAttack();
            this.attackCooldown = 1 / this.attackRate;
        }
    }

    /**
     * Perform attack on target
     */
    performAttack() {
        if (!this.target) return;

        // Emit attack event for damage system (06-damage-system.md)
        if (window.EventBus && window.GameConstants?.Events) {
            EventBus.emit('ENEMY_ATTACK', {
                attacker: this,
                target: this.target,
                damage: this.damage,
                attackType: this.attackType
            });
        }

        // Play attack sound
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_enemy_attack');
        }

        // Direct damage fallback if no damage system
        if (this.target.takeDamage) {
            this.target.takeDamage(this.damage, this);
        }
    }

    /**
     * Return to spawn point
     */
    updateReturning(dt) {
        const dx = this.spawnX - this.x;
        const dy = this.spawnY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 20) {
            this.state = 'wander';
            this.target = null;  // Ensure target is cleared
            this.wanderTarget = null;  // Reset wander target
            this.wanderTimer = 0;  // Reset wander timer
            this.health = this.maxHealth; // Heal when returning home
            console.log(`[Enemy] ${this.enemyName} returned to patrol, ready to aggro again`);
            return;
        }

        // Move back to spawn using A* pathfinding (80% speed)
        this.moveAlongPath(this.spawnX, this.spawnY, this.speed * 0.8, dt);
    }

    /**
     * Take damage from an attack
     * @param {number} amount - Damage amount
     * @param {Entity} source - Attack source
     */
    takeDamage(amount, source = null) {
        if (this.isDead) return false;

        this.health -= amount;
        console.log(`[Enemy] ${this.enemyName} took ${amount} damage! HP: ${this.health}/${this.maxHealth}`);

        // Emit damage event
        if (window.EventBus) {
            EventBus.emit('ENEMY_DAMAGED', {
                enemy: this,
                damage: amount,
                source: source,
                remaining: this.health
            });
        }

        // Play hurt sound
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_enemy_hurt');
        }

        // Trigger pack aggro
        if (this.packAggro && this.groupId && source) {
            this.triggerPackAggro(source);
        }

        // Check death
        if (this.health <= 0) {
            this.die(source);
        } else if (source && this.state !== 'attack') {
            // Aggro on damage
            this.target = source;
            this.state = 'chase';
        }
    }

    /**
     * Trigger pack aggro for group members
     */
    triggerPackAggro(target) {
        if (!window.EntityManager || !this.groupId) return;

        const packRadius = window.BiomeConfig?.patrolDefaults?.packAggroRadius ||
            window.GameConstants?.Biome?.PACK_AGGRO_RADIUS || 150;

        const enemies = EntityManager.getByType(EntityTypes.ENEMY_DINOSAUR)
            .concat(EntityManager.getByType(EntityTypes.ENEMY_SOLDIER));

        for (const enemy of enemies) {
            if (enemy === this || enemy.groupId !== this.groupId) continue;
            if (enemy.isDead || !enemy.packAggro) continue;

            const dist = this.distanceTo(enemy);
            if (dist <= packRadius) {
                enemy.target = target;
                enemy.state = 'chase';
            }
        }

        // Play pack aggro sound
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_pack_aggro');
        }
    }

    /**
     * Handle enemy death
     */
    die(killer = null) {
        this.isDead = true;
        this.active = false;
        this.state = 'dead';
        this.health = 0;
        this.respawnTimer = this.respawnTime;

        // Emit death event
        if (window.EventBus) {
            EventBus.emit('ENEMY_DIED', {
                enemy: this,
                killer: killer,
                xpReward: this.xpReward,
                lootTableId: this.lootTableId,
                lootMultiplier: this.lootMultiplier,
                isElite: this.isElite,
                biomeId: this.biomeId,
                groupId: this.groupId,
                waveId: this.waveId
            });
        }

        // Play death sound
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_enemy_death');
        }

        console.log(`[Enemy] ${this.enemyName} died. Respawn in ${this.respawnTime}s`);
    }

    /**
     * Respawn the enemy
     */
    respawn() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.health = this.maxHealth;
        this.isDead = false;
        this.active = true;
        this.state = 'wander';
        this.target = null;

        if (window.EventBus) {
            EventBus.emit('ENEMY_RESPAWNED', {
                enemy: this,
                biomeId: this.biomeId,
                groupId: this.groupId,
                waveId: this.waveId
            });
        }

        console.log(`[Enemy] ${this.enemyName} respawned`);
    }

    /**
     * Update animation frame
     */
    updateAnimation(dt) {
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameInterval) {
            this.frameTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % 2; // Simple 2-frame anim
        }
    }

    /**
     * Load sprite from AssetLoader
     */
    _loadSprite() {
        if (!this.spriteId || !window.AssetLoader) return;

        const path = AssetLoader.getImagePath(this.spriteId);
        if (path) {
            this._sprite = new Image();
            this._sprite.onload = () => {
                this._spriteLoaded = true;
            };
            this._sprite.src = path;
        }
    }

    /**
     * Render enemy (with elite glow if applicable)
     */
    render(ctx) {
        if (!this.active) return;

        // Elite glow effect
        if (this.isElite) {
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.1;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2 + 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Draw sprite if loaded, otherwise fallback to color
        if (this._spriteLoaded && this._sprite) {
            ctx.save();
            // Flip horizontally based on facing direction
            if (!this.facingRight) {
                ctx.translate(this.x, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(this._sprite, -this.width / 2, -this.height / 2, this.width, this.height);
            } else {
                ctx.drawImage(this._sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            }
            ctx.restore();
        } else {
            // Fallback to colored rectangle
            super.render(ctx);
        }

        // Health bar
        this.renderHealthBar(ctx);

        // Threat indicator
        if (this.threatLevel >= 3 || this.isElite) {
            this.renderThreatIndicator(ctx);
        }
    }

    /**
     * Render health bar above enemy
     */
    renderHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.height / 2 - 15;

        const healthPercent = this.health / this.maxHealth;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const healthColor = healthPercent > 0.5 ? '#4CAF50' :
            healthPercent > 0.25 ? '#FF9800' : '#F44336';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // Elite border
        if (this.isElite) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        }
    }

    /**
     * Render threat level indicator
     */
    renderThreatIndicator(ctx) {
        const indicatorY = this.y - this.height / 2 - 25;

        ctx.save();
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.isElite ? '#FFD700' : '#FF4500';

        const skulls = '☠'.repeat(Math.min(this.threatLevel, 5));
        ctx.fillText(skulls, this.x, indicatorY);
        ctx.restore();
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

// Global registration
window.Enemy = Enemy;
