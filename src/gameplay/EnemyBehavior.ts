/**
 * EnemyBehavior - Enemy AI and combat behavior methods
 * Extends Enemy.prototype with behavior methods
 *
 * Methods: moveAlongPath, moveDirectly, updateWander, updateChase,
 *          updateAttack, performAttack, updateReturning, takeDamage,
 *          triggerPackAggro, die, respawn
 */

import { Enemy } from './EnemyCore';
import { Logger } from '../core/Logger';
import { entityManager as EntityManager } from '../core/EntityManager';
import { EventBus } from '../core/EventBus';
import { GameConstants, getConfig } from '../data/GameConstants';
import { BiomeConfig } from '../data/BiomeConfig';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '../vfx/VFXController';
import { VFXConfig } from '../data/VFXConfig';
import { IslandManager } from '../world/IslandManager';
import { EntityTypes } from '../config/EntityTypes';
import { spawnManager as SpawnManager } from '../systems/SpawnManager';
import { GameInstance } from '../core/Game';

import { pathfindingSystem as PathfindingSystem } from '../systems/PathfindingSystem';

// PathfindingSystem may not exist, declare as optional
/**
 * Move along a calculated A* path to destination
 */
Enemy.prototype.moveAlongPath = function (targetX, targetY, speed, dt) {
    const distToTarget = Math.sqrt((targetX - this.x) ** 2 + (targetY - this.y) ** 2);

    if (distToTarget < 20) {
        this.currentPath = [];
        this.pathIndex = 0;
        return true;
    }

    this.pathRecalcTimer += dt;
    const needsNewPath =
        this.currentPath.length === 0 ||
        this.pathIndex >= this.currentPath.length ||
        this.pathRecalcTimer > 1000 ||
        (this.pathTarget && Math.abs(this.pathTarget.x - targetX) > 100) ||
        Math.abs(this.pathTarget.y - targetY) > 100;

    if (needsNewPath && PathfindingSystem) {
        this.currentPath = PathfindingSystem.findPath(this.x, this.y, targetX, targetY);
        this.pathIndex = 0;
        this.pathTarget = { x: targetX, y: targetY };
        this.pathRecalcTimer = 0;

        if (this.currentPath.length > 1) {
            const first = this.currentPath[0];
            const distToFirst = Math.sqrt((first.x - this.x) ** 2 + (first.y - this.y) ** 2);
            if (distToFirst < 50) {
                this.pathIndex = 1;
            }
        }
    }

    if (this.currentPath.length === 0) {
        return this.moveDirectly(targetX, targetY, speed, dt);
    }

    if (this.pathIndex >= this.currentPath.length) {
        this.pathIndex = this.currentPath.length - 1;
    }
    const waypoint = this.currentPath[this.pathIndex];

    const dx = waypoint.x - this.x;
    const dy = waypoint.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 30) {
        this.pathIndex++;
        if (this.pathIndex >= this.currentPath.length) {
            this.currentPath = [];
            return true;
        }
        return this.moveAlongPath(targetX, targetY, speed, dt);
    }

    const moveSpeed = speed * (dt / 1000);
    const moveX = (dx / dist) * moveSpeed;
    const moveY = (dy / dist) * moveSpeed;

    this.x += moveX;
    this.y += moveY;
    this.facingRight = dx > 0;

    return false;
};

/**
 * Fallback direct movement (when pathfinding unavailable)
 */
Enemy.prototype.moveDirectly = function (targetX, targetY, speed, dt) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) return true;

    const moveSpeed = speed * (dt / 1000);
    const newX = this.x + (dx / dist) * moveSpeed;
    const newY = this.y + (dy / dist) * moveSpeed;

    const im = IslandManager;
    if (!im || (im.isWalkable(newX, this.y) && !im.isBlocked(newX, this.y))) {
        this.x = newX;
    }
    if (!im || (im.isWalkable(this.x, newY) && !im.isBlocked(this.x, newY))) {
        this.y = newY;
    }
    this.facingRight = dx > 0;
    return false;
};

/**
 * Basic wander behavior with aggro detection
 */
Enemy.prototype.updateWander = function (dt) {
    const hero = EntityManager?.getByType('Hero')?.[0] || GameInstance?.hero;
    if (hero && !hero.isDead) {
        const dx = hero.x - this.x;
        const dy = hero.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= this.aggroRange) {
            this.target = hero;
            this.state = 'chase';

            if (AudioManager) {
                const aggroSfx = this.sfx?.aggro || 'sfx_enemy_aggro';
                AudioManager.playSFX(aggroSfx);
            }

            Logger.info(
                `[Enemy] ${this.enemyName} aggro on hero at distance ${dist.toFixed(0)}`
            );
            return;
        }
    }

    this.wanderTimer += dt;

    if (!this.wanderTarget || this.wanderTimer >= this.wanderInterval) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.patrolRadius * 0.5;
        this.wanderTarget = {
            x: this.spawnX + Math.cos(angle) * dist,
            y: this.spawnY + Math.sin(angle) * dist
        };
        this.wanderTimer = 0;
        this.wanderInterval = 3000 + Math.random() * 2000;
    }

    if (this.wanderTarget) {
        this.moveAlongPath(this.wanderTarget.x, this.wanderTarget.y, this.speed * 0.3, dt);
    }
};

/**
 * Chase behavior
 */
Enemy.prototype.updateChase = function (dt) {
    if (!this.target) {
        this.state = 'returning';
        return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const spawnDist = Math.sqrt((this.x - this.spawnX) ** 2 + (this.y - this.spawnY) ** 2);
    if (spawnDist > this.leashDistance) {
        this.state = 'returning';
        this.target = null;
        return;
    }

    if (dist <= this.attackRange) {
        this.state = 'attack';
        return;
    }

    this.moveAlongPath(this.target.x, this.target.y, this.speed, dt);
};

/**
 * Attack behavior
 */
Enemy.prototype.updateAttack = function (dt) {
    if (!this.target) {
        this.state = 'wander';
        return;
    }

    const dist = this.distanceTo(this.target);

    if (dist > this.attackRange * 1.2) {
        this.state = 'chase';
        return;
    }

    if (this.attackCooldown <= 0) {
        this.performAttack();
        this.attackCooldown = 1 / this.attackRate;
    }
};

/**
 * Perform attack on target
 */
Enemy.prototype.performAttack = function () {
    if (!this.target) return;

    if (EventBus && GameConstants?.Events) {
        EventBus.emit('ENEMY_ATTACK', {
            attacker: this,
            target: this.target,
            damage: this.damage,
            attackType: this.attackType
        });
    }

    if (AudioManager) {
        const attackSfx = this.sfx?.attack || 'sfx_enemy_attack';
        AudioManager.playSFX(attackSfx);
    }

    if (this.target.takeDamage) {
        this.target.takeDamage(this.damage, this);
    }
};

/**
 * Return to spawn point
 */
Enemy.prototype.updateReturning = function (dt) {
    const dx = this.spawnX - this.x;
    const dy = this.spawnY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 20) {
        this.state = 'wander';
        this.target = null;
        this.wanderTarget = null;
        this.wanderTimer = 0;
        this.health = this.maxHealth;
        Logger.info(`[Enemy] ${this.enemyName} returned to patrol, ready to aggro again`);
        return;
    }

    this.moveAlongPath(this.spawnX, this.spawnY, this.speed * 0.8, dt);
};

/**
 * Take damage from an attack
 */
Enemy.prototype.takeDamage = function (amount, source = null) {
    if (this.isDead) return false;

    this.health -= amount;
    Logger.info(
        `[Enemy] ${this.enemyName} took ${amount} damage! HP: ${this.health}/${this.maxHealth}`
    );

    if (EventBus) {
        EventBus.emit('ENEMY_DAMAGED', {
            enemy: this,
            damage: amount,
            source: source,
            remaining: this.health
        });
    }

    // Blood VFX - Multi-layered realistic gore
    if (VFXController && VFXConfig?.DINO) {
        // Primary blood spray
        VFXController.playForeground(this.x, this.y, VFXConfig.DINO.BLOOD_SPLATTER);
        // Blood mist
        VFXController.playForeground(this.x, this.y, VFXConfig.DINO.BLOOD_MIST);
        // Blood droplets
        VFXController.playForeground(this.x, this.y, VFXConfig.DINO.BLOOD_DROPS);
        // Meat chunks on heavy hits
        if (amount > 10) {
            VFXController.playForeground(this.x, this.y, VFXConfig.DINO.MEAT_CHUNKS);
        }
    }

    if (AudioManager) {
        const hurtSfx = this.sfx?.hurt || 'sfx_enemy_hurt';
        AudioManager.playSFX(hurtSfx);
    }

    if (this.packAggro && this.groupId && source) {
        this.triggerPackAggro(source);
    }

    if (this.health <= 0) {
        this.die(source);
    } else if (source && this.state !== 'attack') {
        this.target = source;
        this.state = 'chase';
    }
};

/**
 * Trigger pack aggro for group members
 */
Enemy.prototype.triggerPackAggro = function (target) {
    if (!EntityManager || !this.groupId) return;

    const packRadius =
        BiomeConfig?.patrolDefaults?.packAggroRadius ||
        GameConstants?.Biome?.PACK_AGGRO_RADIUS ||
        150;

    const enemies = EntityManager.getByType(EntityTypes.ENEMY_DINOSAUR).concat(
        EntityManager.getByType(EntityTypes.ENEMY_SOLDIER)
    );

    for (const enemy of enemies) {
        if (enemy === this || enemy.groupId !== this.groupId) continue;
        if (enemy.isDead || !enemy.packAggro) continue;

        const dist = this.distanceTo(enemy);
        if (dist <= packRadius) {
            enemy.target = target;
            enemy.state = 'chase';
        }
    }

    if (AudioManager) {
        AudioManager.playSFX('sfx_pack_aggro');
    }
};

/**
 * Handle enemy death
 */
Enemy.prototype.die = function (killer = null) {
    this.isDead = true;
    this.active = false;
    this.state = 'dead';
    this.health = 0;
    this.respawnTimer = this.respawnTime;

    if (SpawnManager && this.lootTable && Array.isArray(this.lootTable)) {
        for (const entry of this.lootTable) {
            if (Math.random() > (entry.chance || 1)) continue;

            let amount = 1;
            if (Array.isArray(entry.amount)) {
                amount = Math.floor(
                    entry.amount[0] + Math.random() * (entry.amount[1] - entry.amount[0] + 1)
                );
            } else if (typeof entry.amount === 'object' && entry.amount.min !== undefined) {
                amount = Math.floor(
                    entry.amount.min + Math.random() * (entry.amount.max - entry.amount.min + 1)
                );
            } else if (entry.amount) {
                amount = entry.amount;
            }

            if (this.isElite) {
                amount = Math.ceil(amount * (this.lootMultiplier || 2));
            }

            SpawnManager.spawnDrop(this.x, this.y, entry.item, amount);
        }
    }

    if (EventBus) {
        EventBus.emit('ENEMY_DIED', {
            enemy: this,
            killer: killer,
            xpReward: this.xpReward,
            isElite: this.isElite,
            biomeId: this.biomeId,
            groupId: this.groupId,
            waveId: this.waveId
        });
    }

    if (AudioManager) {
        const deathSfx = this.sfx?.death || 'sfx_enemy_death';
        AudioManager.playSFX(deathSfx);
    }

    Logger.info(`[Enemy] ${this.enemyName} died. Respawn in ${this.respawnTime}s`);
};

/**
 * Respawn the enemy
 */
Enemy.prototype.respawn = function () {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.health = this.maxHealth;
    this.isDead = false;
    this.active = true;
    this.state = 'wander';
    this.target = null;

    if (EventBus) {
        EventBus.emit('ENEMY_RESPAWNED', {
            enemy: this,
            biomeId: this.biomeId,
            groupId: this.groupId,
            waveId: this.waveId
        });
    }

    Logger.info(`[Enemy] ${this.enemyName} respawned`);
};

Logger.info('[EnemyBehavior] Behavior methods added to Enemy prototype');

