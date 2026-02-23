/**
 * EnemyAI - Enemy behavior state machine
 *
 * Extracted from Enemy.js for modularity.
 * Handles wander, chase, attack, and returning behaviors.
 *
 * Usage: EnemyAI.updateState(enemy, dt)
 *
 * Owner: Combat System
 */

import { entityManager } from '../../../core/EntityManager';
import { AudioManager } from '../../../audio/AudioManager';
import { EventBus } from '../../../core/EventBus';
import { GameConstants, getConfig } from '../../../data/GameConstants';
import { BiomeConfig } from '../../../data/BiomeConfig';
import { EntityTypes } from '../../../config/EntityTypes';
import { GameInstance } from '../../../core/Game';
import { MathUtils } from '../../../core/MathUtils';
import type { IEntity, IEnemyEntity } from '../../../types/core';

const EnemyAI = {
    /**
     * Update enemy AI state
     * @param {Enemy} enemy - The enemy to update
     * @param {number} dt - Delta time in ms
     */
    updateState(baseEntity: IEntity, dt: number) {
        const enemy = baseEntity as IEnemyEntity;
        if (!enemy.active || enemy.isDead) return;

        switch (enemy.state) {
            case 'idle':
            case 'wander':
                this.updateWander(enemy, dt);
                break;
            case 'chase':
                this.updateChase(enemy, dt);
                break;
            case 'attack':
                this.updateAttack(enemy, dt);
                break;
            case 'returning':
                this.updateReturning(enemy, dt);
                break;
        }
    },

    /**
     * Wander behavior with aggro detection
     */
    updateWander(enemy: IEnemyEntity, dt: number) {
        // Check for hero aggro
        const hero = entityManager?.getByType('Hero')?.[0] || GameInstance?.hero;
        if (hero && !hero.isDead && this.canSee(enemy, hero)) {
            enemy.target = hero;
            enemy.state = 'chase';

            if (AudioManager) {
                AudioManager.playSFX('sfx_enemy_aggro');
            }
            return;
        }

        enemy.wanderTimer += dt;

        if (!enemy.wanderTarget || enemy.wanderTimer >= enemy.wanderInterval) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * enemy.patrolRadius * 0.5;
            enemy.wanderTarget = {
                x: enemy.spawnX + Math.cos(angle) * dist,
                y: enemy.spawnY + Math.sin(angle) * dist
            };
            enemy.wanderTimer = 0;
            // Read wander timers from config for live tuning
            const cfg = getConfig() as {
                AI?: { WANDER_TIMER_MIN?: number; WANDER_TIMER_MAX?: number };
            };
            const wanderMin = cfg.AI?.WANDER_TIMER_MIN || 2000;
            const wanderMax = cfg.AI?.WANDER_TIMER_MAX || 5000;
            enemy.wanderInterval = wanderMin + Math.random() * (wanderMax - wanderMin);
        }

        if (enemy.wanderTarget) {
            enemy.moveAlongPath(enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed * 0.3, dt);
        }
    },

    /**
     * Chase behavior with leash distance check
     */
    updateChase(enemy: IEnemyEntity, dt: number) {
        if (!enemy.target) {
            enemy.state = 'returning';
            return;
        }

        const dist = enemy.distanceTo(enemy.target);

        // Check leash distance
        const spawnDist = MathUtils.distance(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY);
        if (spawnDist > enemy.leashDistance) {
            enemy.state = 'returning';
            enemy.target = null;
            return;
        }

        // Attack if in range
        if (dist <= enemy.attackRange) {
            enemy.state = 'attack';
            return;
        }

        // Move towards target
        enemy.moveAlongPath(enemy.target.x, enemy.target.y, enemy.speed, dt);
    },

    /**
     * Attack behavior
     */
    updateAttack(enemy: IEnemyEntity, _dt: number) {
        if (!enemy.target) {
            enemy.state = 'wander';
            return;
        }

        const dist = enemy.distanceTo(enemy.target);

        // Chase if target moved out of range
        if (dist > enemy.attackRange * 1.2) {
            enemy.state = 'chase';
            return;
        }

        // Attack on cooldown
        if (enemy.attackCooldown <= 0) {
            this.performAttack(enemy);
            enemy.attackCooldown = 1 / enemy.attackRate;
        }
    },

    /**
     * Return to spawn behavior
     */
    updateReturning(enemy: IEnemyEntity, dt: number) {
        const dist = MathUtils.distance(enemy.spawnX, enemy.spawnY, enemy.x, enemy.y);

        if (dist < 20) {
            enemy.state = 'wander';
            enemy.target = null;
            enemy.wanderTarget = null;
            enemy.wanderTimer = 0;
            enemy.health = enemy.maxHealth;
            return;
        }

        enemy.moveAlongPath(enemy.spawnX, enemy.spawnY, enemy.speed * 0.8, dt);
    },

    /**
     * Perform attack on target
     */
    performAttack(enemy: IEnemyEntity) {
        if (!enemy.target) return;

        if (EventBus && GameConstants?.Events) {
            EventBus.emit('ENEMY_ATTACK', {
                attacker: enemy,
                target: enemy.target,
                damage: enemy.damage,
                attackType: enemy.attackType
            });
        }

        if (AudioManager) {
            AudioManager.playSFX('sfx_enemy_attack');
        }

        const target = enemy.target as import('../../../types/core').ICombatEntity;
        if (target && target.takeDamage) {
            // Provide a fallback of 0 if damage is undefined, though IEnemyEntity strictly has it
            target.takeDamage(enemy.damage || 0, enemy);
        }
    },

    /**
     * Trigger pack aggro for group members
     */
    triggerPackAggro(enemy: IEnemyEntity, target: IEntity | null) {
        if (!entityManager || !enemy.groupId) return;

        // Read pack aggro radius from config for live tuning
        const packRadius =
            (getConfig() as { AI?: { PACK_AGGRO_RADIUS?: number } }).AI?.PACK_AGGRO_RADIUS ||
            BiomeConfig?.patrolDefaults?.packAggroRadius ||
            300;

        const enemies = entityManager
            .getByType(EntityTypes.ENEMY_DINOSAUR)
            .concat(entityManager.getByType(EntityTypes.ENEMY_SOLDIER));

        for (const other of enemies) {
            if (other === enemy || other.groupId !== enemy.groupId) continue;
            if (other.isDead || !other.packAggro) continue;

            const dist = enemy.distanceTo(other);
            if (dist <= packRadius) {
                other.target = target;
                other.state = 'chase';
            }
        }

        if (AudioManager) {
            AudioManager.playSFX('sfx_pack_aggro');
        }
    },

    /**
     * Check if enemy can see hero (in aggro range)
     */
    canSee(enemy: IEnemyEntity, hero: IEntity | null) {
        if (!hero || enemy.isDead) return false;
        return enemy.distanceTo(hero) <= enemy.aggroRange;
    }
};

// ES6 Module Export
export { EnemyAI };
