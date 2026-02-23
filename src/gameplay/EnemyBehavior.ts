/**
 * EnemyBehavior - Enemy AI and combat behavior methods
 * Extends Enemy.prototype. Path/UI in EnemyBehaviorPath, EnemyBehaviorUI.
 */

import { Entity } from '@core/Entity';
import { Enemy } from './EnemyCore';
import { Logger } from '@core/Logger';
import { entityManager as EntityManager } from '@core/EntityManager';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { BiomeConfig } from '@data/BiomeConfig';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { EntityTypes } from '@config/EntityTypes';
import { spawnDrop } from './SpawnHelper';
import { GameInstance } from '@core/Game';
import type { IEntity } from '../types/core';
import { MathUtils } from '@core/MathUtils';
import { setupEnemyPathBehavior } from './EnemyBehaviorPath';
import { setupEnemyUIBehavior } from './EnemyBehaviorUI';

setupEnemyPathBehavior();
setupEnemyUIBehavior();

/**
 * Basic wander behavior with aggro detection
 */
Enemy.prototype.updateWander = function (this: Enemy, dt: number) {
    const hero = EntityManager?.getByType('Hero')?.[0] || GameInstance?.hero;
    if (hero && !hero.isDead) {
        const dist = MathUtils.distance(this.x, this.y, hero.x, hero.y);

        if (dist <= this.aggroRange) {
            this.target = hero as Entity;
            this.state = 'chase';

            if (AudioManager) {
                const aggroSfx = this.sfx?.aggro || 'sfx_enemy_aggro';
                AudioManager.playSFX(aggroSfx);
            }

            Logger.info(`[Enemy] ${this.enemyName} aggro on hero at distance ${dist.toFixed(0)}`);
            return;
        }
    }

    this.wanderTimer += dt;

    if (!this.wanderTarget || this.wanderTimer >= this.wanderInterval) {
        const angle = Math.random() * Math.PI * 2;
        const radius = this.patrolRadius ?? getConfig().AI?.PATROL_AREA_RADIUS ?? GameConstants.AI.PATROL_AREA_RADIUS;
        const dist = Math.random() * radius * 0.5;
        this.wanderTarget = {
            x: this.spawnX + Math.cos(angle) * dist,
            y: this.spawnY + Math.sin(angle) * dist
        };
        this.wanderTimer = 0;
        const minTime = getConfig().AI?.WANDER_TIMER_MIN ?? GameConstants.AI.WANDER_TIMER_MIN;
        const maxTime = getConfig().AI?.WANDER_TIMER_MAX ?? GameConstants.AI.WANDER_TIMER_MAX;
        this.wanderInterval = minTime + Math.random() * (maxTime - minTime);
    }

    if (this.wanderTarget) {
        this.moveAlongPath(this.wanderTarget.x, this.wanderTarget.y, this.speed * 0.3, dt);
    }
};

/**
 * Chase behavior
 */
Enemy.prototype.updateChase = function (this: Enemy, dt: number) {
    if (!this.target) {
        this.state = 'returning';
        return;
    }

    const dist = MathUtils.distance(this.x, this.y, this.target.x, this.target.y);

    const spawnDist = MathUtils.distance(this.x, this.y, this.spawnX, this.spawnY);
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
Enemy.prototype.updateAttack = function (this: Enemy, _dt: number) {
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
Enemy.prototype.performAttack = function (this: Enemy) {
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

    const target = this.target as IEntity & { takeDamage?(amount: number, source?: IEntity): void };
    if (target?.takeDamage) {
        target.takeDamage(this.damage, this);
    }
};

/**
 * Return to spawn point
 */
Enemy.prototype.updateReturning = function (this: Enemy, dt: number) {
    const dx = this.spawnX - this.x;
    const dy = this.spawnY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const returnArrival = GameConstants.AI.PATH_ARRIVAL_DIST;
    if (dist < returnArrival) {
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
Enemy.prototype.takeDamage = function (this: Enemy, amount: number, source: Entity | null = null) {
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
Enemy.prototype.triggerPackAggro = function (this: Enemy, target: Entity) {
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
Enemy.prototype.die = function (this: Enemy, killer: Entity | null = null) {
    this.isDead = true;
    this.active = false;
    this.state = 'dead';
    this.health = 0;
    this.respawnTimer = this.respawnTime;

    if (this.lootTable && Array.isArray(this.lootTable)) {
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
                amount = entry.amount as number;
            }

            if (this.isElite) {
                amount = Math.ceil(amount * (this.lootMultiplier || 2));
            }

            spawnDrop(this.x, this.y, entry.item, amount);
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
Enemy.prototype.respawn = function (this: Enemy) {
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
