/**
 * DamageSystem
 * Centralized handler for all damage, death, and combat VFX logic.
 *
 * Responsibilities:
 * - Listens for ENTITY_DAMAGED
 * - Applies damage to Health/Stats components
 * - Triggers Blood/Hit VFX
 * - Triggers Floating Text
 * - Handles Death (ENTITY_DIED) and Loot generation
 *
 * Owner: Combat System
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { VFXController } from '@vfx/VFXController';
import { VFXConfig } from '@data/VFXConfig';
import { AudioManager } from '@audio/AudioManager';
import { Registry } from '@core/Registry';
import { EntityTypes } from '@config/EntityTypes';
import type { IGame, IEntity } from '../types/core.d';
import { isDamageable, isMortal } from '../utils/typeGuards';

const Events = GameConstants.Events;

class DamageSystem {
    game: IGame | null = null;

    private _onDamageBound: (data: {
        entity: IEntity;
        amount: number;
        source?: IEntity;
        type?: string;
    }) => void;
    private _onDeathBound: (data: { entity: IEntity }) => void;

    constructor() {
        Logger.info('[DamageSystem] Initialized');
        // Bind handlers once
        this._onDamageBound = this.handleDamage.bind(this);
        this._onDeathBound = this.handleDeath.bind(this);

        this.initListeners();
    }

    init(game: IGame) {
        this.game = game;
    }

    initListeners() {
        if (EventBus) {
            EventBus.on(Events.ENTITY_DAMAGED, this._onDamageBound);
            EventBus.on(Events.ENTITY_DIED, this._onDeathBound);
        }
    }

    destroy() {
        if (EventBus) {
            EventBus.off(Events.ENTITY_DAMAGED, this._onDamageBound);
            EventBus.off(Events.ENTITY_DIED, this._onDeathBound);
            Logger.info('[DamageSystem] Cleared listeners');
        }
    }

    /**
     * Process incoming damage
     */
    handleDamage(data: { entity: IEntity; amount: number; source?: IEntity; type?: string }) {
        const { entity, amount, source, type } = data;
        if (!entity || !entity.active || entity.isDead) return;

        // 1. Apply Damage (using component if available)
        // Check for StatsComponent (Hero/Complex Entities)
        let finalDamage = amount;
        const healthComponent = (entity.components?.health || entity.components?.stats) as import('../types/core').HealthComponent | undefined;

        // Apply Armor reduction (simple flat reduction for now)
        if (entity.defense) {
            finalDamage = Math.max(1, finalDamage - entity.defense);
        }

        let tookDamage = false;

        if (healthComponent && typeof healthComponent.health === 'number') {
            // Data-only: apply damage and clamp; systems emit events
            Logger.info(
                `[DamageSystem] Applying ${finalDamage} damage to component on ${entity.id}`
            );
            healthComponent.health = Math.max(0, healthComponent.health - finalDamage);
            if (healthComponent.health <= 0) {
                healthComponent.isDead = true;
                healthComponent.health = 0;
            }
            tookDamage = true;
            const maxH = healthComponent.maxHealth ?? entity.maxHealth;
            if (entity.entityType === EntityTypes.HERO) {
                EventBus.emit(Events.HERO_HEALTH_CHANGE, {
                    current: healthComponent.health,
                    max: maxH
                });
            } else {
                EventBus.emit(Events.ENTITY_HEALTH_CHANGE, {
                    entity,
                    current: healthComponent.health,
                    max: maxH
                });
            }
        } else if (isDamageable(entity)) {
            // Entity handles its own damage (e.g. Resource)
            Logger.info(`[DamageSystem] Delegating damage to entity ${entity.id}`);
            entity.takeDamage(finalDamage);
            return; // Entity handles VFX/Death/State
        } else if (typeof entity.health === 'number') {
            Logger.info(
                `[DamageSystem] Applying ${finalDamage} damage directly to entity ${entity.id}`
            );
            // Fallback to direct entity property (Enemies mostly)
            entity.health -= finalDamage;
            if (entity.health < 0) entity.health = 0;
            tookDamage = true;
        }

        if (!tookDamage) return;

        // 2. Trigger VFX & SFX
        this.playHitEffects(entity, finalDamage, type);

        // 3. Check Death
        const currentHealth = healthComponent ? healthComponent.health : entity.health;
        if (currentHealth <= 0) {
            // Call entity-specific death handler (sets respawn timers, cleanup, etc.)
            if (isMortal(entity)) {
                entity.die(source);
            } else {
                // Fallback
                entity.isDead = true;
                entity.state = 'dead';
            }

            EventBus.emit(GameConstants.Events.ENTITY_DIED, {
                entity: entity,
                killer: source
            });
        }
    }

    /**
     * visual and audio effects for damage
     */
    playHitEffects(entity: IEntity, amount: number, type: string = 'physical') {
        const x = entity.x;
        const y = entity.y;

        // Floating Text: emit event; FloatingTextManager subscribes
        const yOffset = GameConstants.Damage.FLOATING_TEXT_Y_OFFSET;
        const isCrit = type === 'crit';
        if (EventBus) {
            EventBus.emit(GameConstants.Events.DAMAGE_NUMBER_REQUESTED, {
                x,
                y: y - yOffset,
                amount: Math.round(amount),
                isCrit
            });
        }

        // SFX
        if (AudioManager) {
            const isHero = entity.entityType === EntityTypes.HERO;
            AudioManager.playSFX(isHero ? 'sfx_hero_hurt' : 'sfx_enemy_hurt');
        }

        // VFX (Blood)
        if (VFXController && VFXConfig) {
            const isMechanical = entity.entityType === EntityTypes.BUILDING; // Assuming buildings bleed sparks not blood

            if (isMechanical) {
                // Sparks for mechanical/buildings
                // TODO: Add Spark VFX config
            } else {
                const vfx = VFXConfig as any;
                VFXController.playForeground(x, y, vfx.DINO.BLOOD_SPLATTER);
                VFXController.playForeground(x, y, vfx.DINO.BLOOD_MIST);

                const threshold = GameConstants.Combat.DAMAGE_VFX_THRESHOLD;
                if (amount > threshold) {
                    VFXController.playForeground(x, y, vfx.DINO.BLOOD_DROPS);
                }
            }
        }
    }

    /**
     * Handle entity death
     */
    handleDeath(data: { entity: IEntity; killer?: IEntity }) {
        const { entity } = data;

        Logger.info(`[DamageSystem] Entity died: ${entity.entityType} (ID: ${entity.id})`);

        // 1. Hero Death
        if (entity.entityType === EntityTypes.HERO) {
            EventBus.emit(GameConstants.Events.HERO_DIED, { hero: entity });
            if (AudioManager) AudioManager.playSFX('sfx_hero_death');
            return;
        }

        // 2. Enemy Death
        if (this.isEnemy(entity)) {
            if (AudioManager) AudioManager.playSFX('sfx_enemy_death');

            // Emit kill event for Quests/XP
            EventBus.emit(GameConstants.Events.ENEMY_KILLED, {
                enemy: entity,
                xpReward: entity.xpReward ?? GameConstants.Combat.XP_REWARD_FALLBACK,
                lootTableId: entity.lootTableId
            });
        }
    }

    isEnemy(entity: IEntity): boolean {
        return (
            entity.entityType === EntityTypes.ENEMY_DINOSAUR ||
            entity.entityType === EntityTypes.ENEMY_SOLDIER ||
            entity.entityType === EntityTypes.ENEMY_SAURIAN ||
            (entity.constructor && entity.constructor.name === 'Enemy')
        );
    }
}

// Singleton Management for HMR
if (Registry) {
    const previousInstance = Registry.get('DamageSystem') as { destroy?: () => void } | undefined;
    if (previousInstance && typeof previousInstance.destroy === 'function') {
        previousInstance.destroy();
    }
}

const damageSystem = new DamageSystem();
if (Registry) Registry.register('DamageSystem', damageSystem);

export { DamageSystem, damageSystem };
