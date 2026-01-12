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

const EnemyAI = {
    /**
     * Update enemy AI state
     * @param {Enemy} enemy - The enemy to update
     * @param {number} dt - Delta time in ms
     */
    updateState(enemy, dt) {
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
    updateWander(enemy, dt) {
        // Check for hero aggro
        const hero = window.EntityManager?.getByType('Hero')?.[0] || window.Game?.hero;
        if (hero && !hero.isDead && this.canSee(enemy, hero)) {
            enemy.target = hero;
            enemy.state = 'chase';

            if (window.AudioManager) {
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
            enemy.wanderInterval = 3000 + Math.random() * 2000;
        }

        if (enemy.wanderTarget) {
            enemy.moveAlongPath(enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed * 0.3, dt);
        }
    },

    /**
     * Chase behavior with leash distance check
     */
    updateChase(enemy, dt) {
        if (!enemy.target) {
            enemy.state = 'returning';
            return;
        }

        const dist = enemy.distanceTo(enemy.target);

        // Check leash distance
        const spawnDist = Math.sqrt(
            (enemy.x - enemy.spawnX) ** 2 + (enemy.y - enemy.spawnY) ** 2
        );
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
    updateAttack(enemy, dt) {
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
    updateReturning(enemy, dt) {
        const dist = Math.sqrt(
            (enemy.spawnX - enemy.x) ** 2 + (enemy.spawnY - enemy.y) ** 2
        );

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
    performAttack(enemy) {
        if (!enemy.target) return;

        if (window.EventBus && window.GameConstants?.Events) {
            EventBus.emit('ENEMY_ATTACK', {
                attacker: enemy,
                target: enemy.target,
                damage: enemy.damage,
                attackType: enemy.attackType
            });
        }

        if (window.AudioManager) {
            AudioManager.playSFX('sfx_enemy_attack');
        }

        if (enemy.target.takeDamage) {
            enemy.target.takeDamage(enemy.damage, enemy);
        }
    },

    /**
     * Trigger pack aggro for group members
     */
    triggerPackAggro(enemy, target) {
        if (!window.EntityManager || !enemy.groupId) return;

        const packRadius = window.BiomeConfig?.patrolDefaults?.packAggroRadius ||
            window.GameConstants?.Biome?.PACK_AGGRO_RADIUS || 150;

        const enemies = EntityManager.getByType(EntityTypes.ENEMY_DINOSAUR)
            .concat(EntityManager.getByType(EntityTypes.ENEMY_SOLDIER));

        for (const other of enemies) {
            if (other === enemy || other.groupId !== enemy.groupId) continue;
            if (other.isDead || !other.packAggro) continue;

            const dist = enemy.distanceTo(other);
            if (dist <= packRadius) {
                other.target = target;
                other.state = 'chase';
            }
        }

        if (window.AudioManager) {
            AudioManager.playSFX('sfx_pack_aggro');
        }
    },

    /**
     * Check if enemy can see hero (in aggro range)
     */
    canSee(enemy, hero) {
        if (!hero || enemy.isDead) return false;
        return enemy.distanceTo(hero) <= enemy.aggroRange;
    }
};

window.EnemyAI = EnemyAI;
