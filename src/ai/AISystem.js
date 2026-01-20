/**
 * AISystem - Central orchestrator for all AI-driven entities
 *
 * Routes entity updates to appropriate behavior modules based on entityType.
 * Supports: Enemies, Bosses, NPCs, and custom AI types.
 *
 * Owner: AI System
 */

class AISystem {
    constructor() {
        this.game = null;
        this.behaviors = {};
        Logger.info('[AISystem] Constructed');
    }

    init(game) {
        this.game = game;
        this.registerDefaultBehaviors();
        Logger.info('[AISystem] Initialized');
    }

    /**
     * Register default behavior handlers
     */
    registerDefaultBehaviors() {
        // Register behavior modules as they load
        if (window.EnemyAI) this.behaviors['enemy'] = window.EnemyAI;
        if (window.BossAI) this.behaviors['boss'] = window.BossAI;
        if (window.NPCAI) this.behaviors['npc'] = window.NPCAI;
    }

    /**
     * Register a custom behavior module
     * @param {string} type - AI type identifier
     * @param {object} handler - Behavior module with updateState(entity, dt) method
     */
    registerBehavior(type, handler) {
        this.behaviors[type] = handler;
        Logger.info(`[AISystem] Registered behavior: ${type}`);
    }

    /**
     * Main update loop - processes all AI entities
     */
    update(dt) {
        if (!window.EntityManager) return;

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
    updateEntity(entity, hero, dt, forceType = null) {
        // Determine AI type: explicit > entityType-based > default
        const aiType = forceType || entity.aiType || this.getDefaultAIType(entity);
        const behavior = this.behaviors[aiType];

        if (behavior && typeof behavior.updateState === 'function') {
            behavior.updateState(entity, hero, dt);
        } else if (window.EnemyAI) {
            // Fallback to generic enemy AI
            window.EnemyAI.updateState(entity, hero, dt);
        }
    }

    /**
     * Get default AI type based on entity properties
     */
    getDefaultAIType(entity) {
        if (entity.isBoss) return 'boss';
        if (entity.entityType?.includes('enemy')) return 'enemy';
        if (entity.entityType?.includes('npc')) return 'npc';
        return 'enemy';
    }

    /**
     * Event listeners for combat events
     */
    initListeners() {
        if (window.EventBus && window.GameConstants?.Events) {
            EventBus.on(GameConstants.Events.ENTITY_DAMAGED, (data) => this.onEntityDamaged(data));
            EventBus.on(GameConstants.Events.ENTITY_DIED, (data) => this.onEntityDied(data));
        }
    }

    onEntityDamaged(data) {
        const { entity, source } = data;
        if (!entity) return;

        // Trigger aggro on damage
        if (entity.state !== 'attack' && entity.state !== 'chase' && source) {
            entity.target = source;
            entity.state = 'chase';
        }

        // Pack aggro
        if (entity.packAggro && entity.groupId && window.EnemyAI) {
            window.EnemyAI.triggerPackAggro(entity, source);
        }
    }

    onEntityDied(data) {
        const { entity } = data;
        if (!entity) return;

        entity.state = 'dead';

        if (window.EventBus && window.GameConstants?.Events) {
            EventBus.emit(GameConstants.Events.ENEMY_KILLED, {
                enemy: entity,
                xpReward: entity.xpReward,
                lootTableId: entity.lootTableId
            });
        }
    }
}

window.AISystem = new AISystem();
if (window.Registry) Registry.register('AISystem', window.AISystem);

