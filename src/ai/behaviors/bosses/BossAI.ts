/**
 * BossAI - Phase-based boss behavior
 *
 * Extends basic enemy AI with:
 * - Health-based phase transitions
 * - Special abilities
 * - Enrage mechanics
 *
 * Owner: AI System
 */

import { Logger } from '../../../core/Logger';
import { EventBus } from '../../../core/EventBus';
import { AudioManager } from '../../../audio/AudioManager';
import { BaseAI } from '../BaseAI';
import { EnemyAI } from '../enemies/EnemyAI';
import { Registry } from '../../../core/Registry';
import { MathUtils } from '../../../core/MathUtils';

// Unmapped modules - need manual import

const BossAI = {
    /**
     * Update boss AI state
     */
    updateState(boss: any, hero: any, dt: number) {
        if (!boss.active || boss.isDead) return;

        // Update phase based on health
        this.updatePhase(boss);

        // Update ability cooldowns
        if (boss.abilityCooldown > 0) {
            boss.abilityCooldown -= dt / 1000;
        }

        // State machine
        switch (boss.state) {
            case 'idle':
            case 'wander':
                this.updateWander(boss, hero, dt);
                break;
            case 'chase':
                this.updateChase(boss, hero, dt);
                break;
            case 'attack':
                this.updateAttack(boss, hero, dt);
                break;
            case 'ability':
                this.updateAbility(boss, hero, dt);
                break;
            case 'returning':
                this.updateReturning(boss, dt);
                break;
        }
    },

    /**
     * Update boss phase based on health percentage
     */
    updatePhase(boss: any) {
        const healthPercent = boss.health / boss.maxHealth;
        const oldPhase = boss.phase || 1;

        if (healthPercent > 0.66) boss.phase = 1;
        else if (healthPercent > 0.33) boss.phase = 2;
        else boss.phase = 3;

        // Trigger phase transition effects
        if (boss.phase !== oldPhase) {
            this.onPhaseChange(boss, oldPhase, boss.phase);
        }
    },

    /**
     * Handle phase transition
     */
    onPhaseChange(boss: any, oldPhase: number, newPhase: number) {
        Logger.info(`[BossAI] ${boss.enemyName} entered Phase ${newPhase}`);

        // Phase-specific buffs
        if (newPhase === 2) {
            boss.speed *= 1.2;
            boss.attackRate *= 1.3;
        } else if (newPhase === 3) {
            // Enrage
            boss.speed *= 1.5;
            boss.damage *= 1.5;
            boss.isEnraged = true;
        }

        // Emit event for VFX/audio
        if (EventBus) {
            EventBus.emit('BOSS_PHASE_CHANGE', {
                boss,
                oldPhase,
                newPhase
            });
        }
    },

    /**
     * Use special ability
     */
    updateAbility(boss: any, hero: any, dt: number) {
        // Ability execution - can be extended per boss type
        if (boss.currentAbility && boss.abilityTimer > 0) {
            boss.abilityTimer -= dt;
            if (boss.abilityTimer <= 0) {
                this.executeAbility(boss, hero);
                boss.state = 'chase';
                boss.currentAbility = null;
            }
        } else {
            boss.state = 'chase';
        }
    },

    /**
     * Execute specific ability
     */
    executeAbility(boss: any, hero: any) {
        const ability = boss.currentAbility;
        Logger.info(`[BossAI] ${boss.enemyName} uses ${ability}`);

        if (EventBus) {
            EventBus.emit('BOSS_ABILITY', {
                boss,
                ability,
                target: hero
            });
        }
    },

    /**
     * Wander (bosses rarely wander, mostly patrol)
     */
    updateWander(boss: any, hero: any, dt: number) {
        // Bosses have large aggro range
        if (hero && !hero.isDead && BaseAI?.canSee(boss, hero)) {
            boss.target = hero;
            boss.state = 'chase';

            if (AudioManager) {
                AudioManager.playSFX('sfx_boss_aggro');
            }
            return;
        }

        // Slow patrol
        if (EnemyAI) {
            EnemyAI.updateWander(boss, dt);
        }
    },

    /**
     * Chase with ability checks
     */
    updateChase(boss: any, hero: any, dt: number) {
        if (!boss.target) {
            boss.state = 'returning';
            return;
        }

        // Check for ability usage
        if (boss.abilityCooldown <= 0 && boss.abilities?.length > 0) {
            const dist = boss.distanceTo
                ? boss.distanceTo(hero)
                : MathUtils.distance(hero.x, hero.y, boss.x, boss.y);

            // Random ability at medium range
            if (dist > boss.attackRange * 1.5 && dist < boss.aggroRange) {
                if (Math.random() < 0.3) {
                    this.startAbility(boss);
                    return;
                }
            }
        }

        // Standard chase
        if (EnemyAI) {
            EnemyAI.updateChase(boss, dt);
        }
    },

    /**
     * Start an ability
     */
    startAbility(boss: any) {
        const abilities = boss.abilities || [];
        if (abilities.length === 0) return;

        boss.currentAbility = abilities[Math.floor(Math.random() * abilities.length)];
        boss.abilityTimer = 1000; // 1 second windup
        boss.abilityCooldown = 5; // 5 second cooldown
        boss.state = 'ability';
    },

    /**
     * Attack (delegated to EnemyAI)
     */
    updateAttack(boss: any, hero: any, dt: number) {
        if (EnemyAI) {
            EnemyAI.updateAttack(boss, dt);
        }
    },

    /**
     * Return to spawn
     */
    updateReturning(boss: any, dt: number) {
        if (EnemyAI) {
            EnemyAI.updateReturning(boss, dt);
        }
        // Bosses heal faster when returning
        boss.health = Math.min(boss.health + dt * 0.1, boss.maxHealth);
    }
};

// ES6 Module Export
export { BossAI };
