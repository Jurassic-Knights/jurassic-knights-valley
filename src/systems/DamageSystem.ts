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
import { FloatingTextManager } from '@vfx/FloatingText';
import type { IGame, IEntity } from '../types/core.d';

const Events = GameConstants.Events;

class DamageSystem {
    game: IGame | null = null;

    private _onDamageBound: any;
    private _onDeathBound: any;

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
        const healthComponent = (entity.components?.health || entity.components?.stats) as any;

        // Apply Armor reduction (simple flat reduction for now)
        if (entity.defense) {
            finalDamage = Math.max(1, finalDamage - entity.defense);
        }

        let tookDamage = false;

        if (healthComponent) {
            // Use component method if available
            if (typeof healthComponent.takeDamage === 'function') {
                Logger.info(
                    `[DamageSystem] Applying ${finalDamage} damage to component on ${entity.id}`
                );
                healthComponent.takeDamage(finalDamage);
                tookDamage = true;
            } else if (typeof healthComponent.health === 'number') {
                // Direct modification
                healthComponent.health -= finalDamage;
                if (healthComponent.health < 0) healthComponent.health = 0;
                tookDamage = true;
            }
        } else if (typeof (entity as any).takeDamage === 'function') {
            // Entity handles its own damage (e.g. Resource)
            Logger.info(`[DamageSystem] Delegating damage to entity ${entity.id}`);
            (entity as any).takeDamage(finalDamage);
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
            const anyEntity = entity as any;
            if (typeof anyEntity.die === 'function') {
                anyEntity.die(source);
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

        // Floating Text
        if (FloatingTextManager) {
            // Color based on type (Crit = yellow, Normal = white, Poison = green)
            // FloatingTextManager handles scale via type configuration
            const textType = type === 'crit' ? 'critical' : 'damage';

            if (type === 'crit') {
                FloatingTextManager.showDamage(x, y - 20, amount, true);
            } else {
                FloatingTextManager.spawn(x, y - 20, Math.round(amount).toString(), textType);
            }
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
                // Organic Blood VFX
                VFXController.playForeground(x, y, VFXConfig.DINO.BLOOD_SPLATTER);
                VFXController.playForeground(x, y, VFXConfig.DINO.BLOOD_MIST);

                if (amount > 10) {
                    VFXController.playForeground(x, y, VFXConfig.DINO.BLOOD_DROPS);
                }
            }
        }
    }

    /**
     * Handle entity death
     */
    handleDeath(data: { entity: IEntity; killer?: IEntity }) {
        const { entity, killer } = data;

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
                xpReward: entity.xpReward || 10,
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
    const previousInstance = Registry.get('DamageSystem');
    if (previousInstance && typeof previousInstance.destroy === 'function') {
        previousInstance.destroy();
    }
}

const damageSystem = new DamageSystem();
if (Registry) Registry.register('DamageSystem', damageSystem);

export { DamageSystem, damageSystem };
