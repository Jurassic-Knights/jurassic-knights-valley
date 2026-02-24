/**
 * AISystem - Central orchestrator for all AI-driven entities
 *
 * Routes entity updates to appropriate behavior modules based on entityType.
 * Supports: Enemies, Bosses, NPCs, and custom AI types.
 *
 * Owner: AI System
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { EntityTypes } from '@config/EntityTypes';
import { EnemyAI } from './behaviors/enemies/EnemyAI';
import { BossAI } from './behaviors/bosses/BossAI';
import { NPCAI } from './behaviors/npcs/NPCAI';
import type { IGame, IEntity, IEnemyEntity } from '../types/core';

/** Behavior module with updateState (and optionally triggerPackAggro) */
type BossBehavior = {
    updateState(entity: IEntity, hero: IEntity | null, dt: number): void;
    triggerPackAggro?(entity: IEntity, target: IEntity | null): void;
};

type EnemyBehavior = {
    updateState(entity: IEntity, dt: number): void;
    triggerPackAggro?(entity: IEntity, target: IEntity | null): void;
};

type AIBehavior = BossBehavior | EnemyBehavior;

class AISystem {
    private game: IGame | null = null;
    private behaviors: Record<string, AIBehavior> = {};

    constructor() {
        Logger.info('[AISystem] Constructed');
    }

    init(game: IGame): void {
        this.game = game;
        this.registerDefaultBehaviors();
        Logger.info('[AISystem] Initialized');
    }

    /**
     * Register default behavior handlers
     */
    registerDefaultBehaviors() {
        // Register behavior modules as they load
        if (EnemyAI) this.behaviors['enemy'] = EnemyAI;
        if (BossAI) this.behaviors['boss'] = BossAI;
        if (NPCAI) this.behaviors['npc'] = NPCAI;
    }

    /**
     * Register a custom behavior module
     * @param {string} type - AI type identifier
     * @param {object} handler - Behavior module with updateState(entity, dt) method
     */
    registerBehavior(type: string, handler: AIBehavior) {
        this.behaviors[type] = handler;
        Logger.info(`[AISystem] Registered behavior: ${type}`);
    }

    /**
     * Main update loop - processes all AI entities
     */
    update(dt: number) {
        if (!EntityManager) return;

        const hero = this.game?.hero;

        // Process enemies
        const enemies = EntityManager.getByType(EntityTypes?.ENEMY_DINOSAUR) || [];
        const soldiers = EntityManager.getByType(EntityTypes?.ENEMY_SOLDIER) || [];

        for (const enemy of [...enemies, ...soldiers]) {
            if (enemy.active && !enemy.isDead) {
                this.updateEntity(enemy, hero, dt);
            }
        }

        // Process bosses
        const bosses = EntityManager.getByType('Boss') || [];
        for (const boss of bosses) {
            if (boss.active && !boss.isDead) {
                this.updateEntity(boss, hero, dt, 'boss');
            }
        }
    }

    /**
     * Update a single entity's AI
     */
    updateEntity(
        entity: IEntity,
        hero: IEntity | null | undefined,
        dt: number,
        forceType: string | null = null
    ) {
        // Determine AI type: explicit > entityType-based > default
        const aiType = forceType || entity.aiType || this.getDefaultAIType(entity);
        const behavior = this.behaviors[aiType];

        if (behavior && typeof behavior.updateState === 'function') {
            // Some behaviors expect (entity, hero, dt), others just (entity, dt)
            if (behavior.updateState.length >= 3) {
                (behavior as BossBehavior).updateState(entity, hero || null, dt);
            } else {
                (behavior as EnemyBehavior).updateState(entity, dt);
            }
        } else if (EnemyAI) {
            // Fallback to generic enemy AI (takes entity, dt)
            EnemyAI.updateState(entity, dt);
        }
    }

    /**
     * Get default AI type based on entity properties
     */
    getDefaultAIType(entity: IEntity & { isBoss?: boolean }) {
        if (entity.isBoss) return 'boss';
        if (entity.entityType?.includes('enemy')) return 'enemy';
        if (entity.entityType?.includes('npc')) return 'npc';
        return 'enemy';
    }

    /**
     * Event listeners for combat events
     */
    initListeners() {
        if (EventBus && GameConstants.Events) {
            // Must strictly cast string constants to the generic key
            EventBus.on(GameConstants.Events.ENTITY_DAMAGED as keyof import('../types/events').AppEventMap, (data) =>
                this.onEntityDamaged(data as { entity: IEnemyEntity; source?: IEntity })
            );
            EventBus.on(GameConstants.Events.ENTITY_DIED as keyof import('../types/events').AppEventMap, (data) =>
                this.onEntityDied(data as { entity: IEnemyEntity })
            );
        }
    }

    onEntityDamaged(data: {
        entity: IEnemyEntity;
        source?: IEntity;
    }) {
        const { entity, source } = data;
        if (!entity || !source) return;

        // Trigger aggro on damage
        if (entity.state !== 'attack' && entity.state !== 'chase' && source) {
            entity.target = source;
            entity.state = 'chase';
        }

        // Pack aggro
        if (entity.packAggro && entity.groupId && EnemyAI) {
            EnemyAI.triggerPackAggro(entity as IEnemyEntity, source as IEntity);
        }
    }

    onEntityDied(data: { entity: IEntity & { xpReward?: number; lootTableId?: string } }) {
        const { entity } = data;
        if (!entity) return;

        entity.state = 'dead';

        if (EventBus && GameConstants.Events) {
            EventBus.emit(GameConstants.Events.ENEMY_KILLED as keyof import('../types/events').AppEventMap, {
                enemy: entity,
                killer: undefined // or pass source if available in data
            } as import('../types/events').AppEventMap['ENEMY_KILLED']);
        }
    }
}

// Create and export singleton instance
const aiSystem = new AISystem();
export { AISystem, aiSystem };
