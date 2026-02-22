/**
 * EnemySystem
 * Handles AI, Movement, and Combat updates for hostile enemies.
 *
 * States: WANDER, CHASE, ATTACK, LEASH_RETURN
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { entityManager } from '@core/EntityManager';
import { GameConstants } from '@data/GameConstants';
import { AudioManager } from '../audio/AudioManager';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { Registry } from '@core/Registry';
import { EntityTypes } from '@config/EntityTypes';
import { MathUtils } from '@core/MathUtils';
import type { IGame, IEntity } from '@app-types/core';
import { Enemy } from '../gameplay/EnemyCore';
import { Entity } from '../core/Entity';
import { AIComponent } from '../components/AIComponent';
import { CombatComponent } from '../components/CombatComponent';
import { HealthComponent } from '../components/HealthComponent';

// Events from GameConstants
const Events = GameConstants.Events;

// Event data interface
interface EntityEvent {
    entity: IEntity;
    amount?: number;
    killer?: IEntity;
}

class EnemySystem {
    game: IGame | null = null;

    constructor() {
        Logger.info('[EnemySystem] Initialized');
    }

    init(game: IGame) {
        this.game = game;
        this.initListeners();
    }

    initListeners() {
        if (EventBus) {
            // EventBus.on('ENTITY_DAMAGED', (data: EntityEvent) => this.onEntityDamaged(data));
            // EventBus.on('ENTITY_DIED', (data: EntityEvent) => this.onEntityDied(data));
        }
    }

    update(dt: number) {
        if (!entityManager) return;
        const enemies = entityManager.getByType('Enemy');
        const hero = this.game?.hero;

        for (const enemy_ of enemies) {
            const enemy = enemy_ as Enemy;
            if (enemy.active && enemy.state !== 'dead') {
                this.updateEnemy(enemy, hero, dt);
            }
        }
    }

    updateEnemy(enemy: Enemy, hero: IEntity | null, dt: number) {
        // Update interpolation state (per fixed tick)
        enemy.prevX = enemy.x;
        enemy.prevY = enemy.y;

        // Sync HealthComponent to Entity property for Renderer/UI
        const healthComp = enemy.components?.health as HealthComponent;
        if (healthComp) {
            enemy.health = healthComp.health;
        }

        const ai = enemy.components?.ai as AIComponent;
        if (!ai) return;

        // Debug state
        // Logger.info(`[EnemySystem] ${enemy.id} State: ${ai.state} Pos: ${enemy.x.toFixed(0)},${enemy.y.toFixed(0)}`);

        // State Machine
        switch (ai.state) {
            case 'WANDER':
                this.handleWander(enemy, hero, dt);
                break;
            case 'CHASE':
                this.handleChase(enemy, hero, dt);
                break;
            case 'ATTACK':
                this.handleAttack(enemy, hero, dt);
                break;
            case 'LEASH_RETURN':
                this.handleLeashReturn(enemy, dt);
                break;
        }
    }

    handleWander(enemy: Enemy, hero: IEntity | null, dt: number) {
        const ai = enemy.components?.ai as AIComponent;

        // Check for aggro
        if (hero && ai.canAggro(hero)) {
            ai.setState('CHASE');
            ai.target = hero;

            // Pack Aggro - alert nearby grouped enemies
            if (enemy.packAggro && enemy.groupId) {
                this.alertPackMembers(enemy, hero);
            }

            if (EventBus) {
                EventBus.emit(GameConstants.Events.ENEMY_AGGRO, { enemy, target: hero });
            }
            return;
        }

        // Wander within patrol area
        ai.wanderTimer -= dt;
        if (ai.wanderTimer <= 0) {
            ai.randomizeWander();
        }

        const msPerSecond = GameConstants.Timing.MS_PER_SECOND;
        const speed = enemy.speed * (dt / msPerSecond);
        const dx = ai.wanderDirection.x * speed;
        const dy = ai.wanderDirection.y * speed;

        // Predict next pos for patrol radius check
        const nextX = enemy.x + dx;
        const nextY = enemy.y + dy;

        // Clamp to patrol radius
        const patrolRadius = enemy.patrolRadius ?? GameConstants.Combat.DEFAULT_PATROL_RADIUS;
        const dist = MathUtils.distance(nextX, nextY, enemy.spawnX, enemy.spawnY);

        if (dist > patrolRadius) {
            // Reverse direction
            ai.wanderDirection.x *= -1;
            ai.wanderDirection.y *= -1;
            // Immediate turnaround
            return;
        }

        this.applyMovement(enemy, dx, dy);
    }

    /**
     * Alert pack members when one enemy aggros
     */
    alertPackMembers(aggroEnemy: IEntity, target: IEntity) {
        if (!entityManager) return;

        const enemies = entityManager.getByType('Enemy');
        const alertRadius = GameConstants.Biome.PACK_AGGRO_RADIUS;

        for (const enemy of enemies) {
            if (enemy === aggroEnemy) continue;
            if (enemy.groupId !== aggroEnemy.groupId) continue;
            if (!enemy.packAggro) continue; // Respect individual packAggro flag
            const ai = enemy.components?.ai as AIComponent;
            if (ai?.state !== 'WANDER') continue;

            // Check distance
            const dist = MathUtils.distance(enemy.x, enemy.y, aggroEnemy.x, aggroEnemy.y);

            if (dist <= alertRadius) {
                ai.setState?.('CHASE');
                ai.target = target;
            }
        }
    }

    handleChase(enemy: Enemy, hero: IEntity, dt: number) {
        const ai = enemy.components?.ai as AIComponent;

        // Check leash
        if (ai.shouldLeash()) {
            ai.setState('LEASH_RETURN');
            ai.target = null;
            if (EventBus) {
                EventBus.emit(GameConstants.Events.ENEMY_LEASH, { enemy });
            }
            return;
        }

        // Check attack range
        if (ai.inAttackRange(hero)) {
            ai.setState('ATTACK');
            return;
        }

        // Move toward target
        const dxRaw = hero.x - enemy.x;
        const dyRaw = hero.y - enemy.y;
        const dist = MathUtils.distance(enemy.x, enemy.y, hero.x, hero.y);

        if (dist > 0) {
            const ms = GameConstants?.Timing?.MS_PER_SECOND ?? 1000;
            const speed = enemy.speed * (dt / ms);
            const dx = (dxRaw / dist) * speed;
            const dy = (dyRaw / dist) * speed;
            this.applyMovement(enemy, dx, dy);
        }
    }

    applyMovement(enemy: IEntity, dx: number, dy: number) {
        if (enemy instanceof Entity && EventBus) {
            EventBus.emit(GameConstants.Events.ENTITY_MOVE_REQUEST, { entity: enemy, dx, dy });
        } else {
            enemy.x += dx;
            enemy.y += dy;
        }
    }

    handleAttack(enemy: Enemy, hero: IEntity, dt: number) {
        const ai = enemy.components?.ai as AIComponent;
        const combat = enemy.components?.combat as CombatComponent;

        // Check if still in range
        if (!ai.inAttackRange(hero)) {
            ai.setState('CHASE');
            return;
        }

        // Check leash
        if (ai.shouldLeash()) {
            ai.setState('LEASH_RETURN');
            return;
        }

        if (combat) {
            if (combat.cooldownTimer > 0) {
                combat.cooldownTimer -= dt / 1000;
                if (combat.cooldownTimer <= 0) {
                    combat.cooldownTimer = 0;
                    combat.canAttack = true;
                }
            }
            if (combat.canAttack) {
                combat.cooldownTimer = 1 / combat.rate;
                combat.canAttack = false;
                if (EventBus) {
                    EventBus.emit(GameConstants.Events.ENTITY_DAMAGED, {
                        entity: hero,
                        amount: combat.damage,
                        source: enemy,
                        type: 'physical'
                    });
                    EventBus.emit(GameConstants.Events.ENEMY_ATTACK, {
                        attacker: enemy,
                        target: hero,
                        damage: combat.damage
                    });
                }
            }
        }
    }

    handleLeashReturn(enemy: Enemy, dt: number) {
        const ai = enemy.components?.ai as AIComponent;

        // Move back to spawn
        const dxRaw = enemy.spawnX - enemy.x;
        const dyRaw = enemy.spawnY - enemy.y;
        const dist = MathUtils.distance(enemy.x, enemy.y, enemy.spawnX, enemy.spawnY);

        const arrivalThreshold = GameConstants.Biome.LEASH_ARRIVAL_THRESHOLD;
        if (dist < arrivalThreshold) {
            ai.setState('WANDER');
            return;
        }

        const ms = GameConstants?.Timing?.MS_PER_SECOND ?? 1000;
        const mult = GameConstants.Biome.LEASH_RETURN_SPEED_MULTIPLIER;
        const speed = enemy.speed * mult * (dt / ms);
        const dx = (dxRaw / dist) * speed;
        const dy = (dyRaw / dist) * speed;
        this.applyMovement(enemy, dx, dy);
    }

    onEntityDamaged(data: EntityEvent) {
        const { entity, amount } = data;
        if (!entity) return;

        const entityType = entity.entityType;
        if (
            entityType !== EntityTypes?.ENEMY_DINOSAUR &&
            entityType !== EntityTypes?.ENEMY_SOLDIER &&
            entityType !== EntityTypes?.ENEMY_SAURIAN
        )
            return;

        // SFX
        if (AudioManager) AudioManager.playSFX('sfx_enemy_hurt');

        if (VFXController && VFXConfig) {
            VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.BLOOD_SPLATTER);
            // Blood mist
            VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.BLOOD_MIST);
            // Blood droplets
            VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.BLOOD_DROPS);
            // Meat chunks on heavy hits
            const threshold = GameConstants.Combat.DAMAGE_VFX_THRESHOLD;
            if (amount > threshold) {
                VFXController.playForeground(entity.x, entity.y, VFXConfig.DINO.MEAT_CHUNKS);
            }
        }
    }

    onEntityDied(data: EntityEvent) {
        const { entity } = data;
        if (!entity) return;

        // Check if entity is an enemy type
        const entityType = entity.entityType;
        if (
            entityType !== EntityTypes?.ENEMY_DINOSAUR &&
            entityType !== EntityTypes?.ENEMY_SOLDIER &&
            entityType !== EntityTypes?.ENEMY_SAURIAN
        )
            return;

        // Death handling
        entity.state = 'dead';
        if (AudioManager) AudioManager.playSFX('sfx_enemy_death');

        // Emit for XP/Loot
        if (EventBus) {
            EventBus.emit(Events.ENEMY_KILLED, {
                enemy: entity,
                xpReward: entity.xpReward,
                lootTableId: entity.lootTableId
            });
        }
    }
}

// Create singleton and export
const enemySystem = new EnemySystem();
if (Registry) Registry.register('EnemySystem', enemySystem);

export { EnemySystem, enemySystem };
