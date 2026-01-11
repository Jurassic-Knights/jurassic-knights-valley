/**
 * EnemySystem
 * Handles AI, Movement, and Combat updates for hostile enemies.
 * 
 * States: WANDER, CHASE, ATTACK, LEASH_RETURN
 */
class EnemySystem {
    constructor() {
        console.log('[EnemySystem] Initialized');
    }

    init(game) {
        this.game = game;
        this.initListeners();
    }

    initListeners() {
        if (window.EventBus) {
            EventBus.on('ENTITY_DAMAGED', (data) => this.onEntityDamaged(data));
            EventBus.on('ENTITY_DIED', (data) => this.onEntityDied(data));
        }
    }

    update(dt) {
        if (!window.EntityManager) return;
        const enemies = EntityManager.getByType('Enemy');
        const hero = this.game?.hero;

        for (const enemy of enemies) {
            if (enemy.active && enemy.state !== 'dead') {
                this.updateEnemy(enemy, hero, dt);
            }
        }
    }

    updateEnemy(enemy, hero, dt) {
        const ai = enemy.components?.ai;
        if (!ai) return;

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

    handleWander(enemy, hero, dt) {
        const ai = enemy.components.ai;

        // Check for aggro
        if (hero && ai.canAggro(hero)) {
            ai.setState('CHASE');
            ai.target = hero;

            // Pack Aggro - alert nearby grouped enemies
            if (enemy.packAggro && enemy.groupId) {
                this.alertPackMembers(enemy, hero);
            }

            if (window.EventBus) {
                EventBus.emit(Events.ENEMY_AGGRO, { enemy, target: hero });
            }
            return;
        }

        // Wander within patrol area
        ai.wanderTimer -= dt;
        if (ai.wanderTimer <= 0) {
            ai.randomizeWander();
        }

        // Move
        const speed = enemy.speed * (dt / 1000);
        let nextX = enemy.x + ai.wanderDirection.x * speed;
        let nextY = enemy.y + ai.wanderDirection.y * speed;

        // Clamp to patrol radius
        const patrolRadius = enemy.patrolRadius || 150;
        const dx = nextX - enemy.spawnX;
        const dy = nextY - enemy.spawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > patrolRadius) {
            // Reverse direction
            ai.wanderDirection.x *= -1;
            ai.wanderDirection.y *= -1;
            nextX = enemy.x;
            nextY = enemy.y;
        }

        enemy.x = nextX;
        enemy.y = nextY;
    }

    /**
     * Alert pack members when one enemy aggros
     */
    alertPackMembers(aggroEnemy, target) {
        if (!window.EntityManager) return;

        const enemies = EntityManager.getByType('Enemy');
        const alertRadius = window.GameConstants?.Biome?.PACK_ALERT_RADIUS || 300;

        for (const enemy of enemies) {
            if (enemy === aggroEnemy) continue;
            if (enemy.groupId !== aggroEnemy.groupId) continue;
            if (!enemy.packAggro) continue; // Respect individual packAggro flag
            if (enemy.components.ai?.state !== 'WANDER') continue;

            // Check distance
            const dx = enemy.x - aggroEnemy.x;
            const dy = enemy.y - aggroEnemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= alertRadius) {
                enemy.components.ai.setState('CHASE');
                enemy.components.ai.target = target;
            }
        }
    }

    handleChase(enemy, hero, dt) {
        const ai = enemy.components.ai;

        // Check leash
        if (ai.shouldLeash()) {
            ai.setState('LEASH_RETURN');
            ai.target = null;
            if (window.EventBus) {
                EventBus.emit(Events.ENEMY_LEASH, { enemy });
            }
            return;
        }

        // Check attack range
        if (ai.inAttackRange(hero)) {
            ai.setState('ATTACK');
            return;
        }

        // Move toward target
        const dx = hero.x - enemy.x;
        const dy = hero.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const speed = enemy.speed * (dt / 1000);
            enemy.x += (dx / dist) * speed;
            enemy.y += (dy / dist) * speed;
        }
    }

    handleAttack(enemy, hero, dt) {
        const ai = enemy.components.ai;
        const combat = enemy.components?.combat;

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

        // Attack cooldown
        if (combat) {
            combat.update(dt);
            if (combat.canAttack) {
                const attacked = combat.attack();
                if (attacked) {
                    // Emit attack event for damage system
                    if (window.EventBus) {
                        EventBus.emit(Events.ENEMY_ATTACK, {
                            attacker: enemy,
                            target: hero,
                            damage: combat.damage
                        });
                    }
                }
            }
        }
    }

    handleLeashReturn(enemy, dt) {
        const ai = enemy.components.ai;

        // Move back to spawn
        const dx = enemy.spawnX - enemy.x;
        const dy = enemy.spawnY - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
            ai.setState('WANDER');
            return;
        }

        const speed = enemy.speed * 1.5 * (dt / 1000); // Faster return
        enemy.x += (dx / dist) * speed;
        enemy.y += (dy / dist) * speed;
    }

    onEntityDamaged(data) {
        const { entity } = data;
        if (!entity) return;

        // Check if entity is an enemy type
        const entityType = entity.entityType;
        if (entityType !== EntityTypes?.ENEMY_DINOSAUR && entityType !== EntityTypes?.ENEMY_SOLDIER) return;

        // SFX
        if (window.AudioManager) AudioManager.playSFX('sfx_enemy_hurt');
    }

    onEntityDied(data) {
        const { entity } = data;
        if (!entity) return;

        // Check if entity is an enemy type
        const entityType = entity.entityType;
        if (entityType !== EntityTypes?.ENEMY_DINOSAUR && entityType !== EntityTypes?.ENEMY_SOLDIER) return;

        // Death handling
        entity.state = 'dead';
        if (window.AudioManager) AudioManager.playSFX('sfx_enemy_death');

        // Emit for XP/Loot
        if (window.EventBus) {
            EventBus.emit(Events.ENEMY_KILLED, {
                enemy: entity,
                xpReward: entity.xpReward,
                lootTableId: entity.lootTableId
            });
        }
    }
}

window.EnemySystem = new EnemySystem();
if (window.Registry) Registry.register('EnemySystem', window.EnemySystem);
