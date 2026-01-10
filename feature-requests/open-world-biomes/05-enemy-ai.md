---
status: pending
priority: 2
depends_on: [02-enemy-config.md]
estimated_complexity: high
---

# 05 - Enemy AI System

## Scope
Implement hostile AI behavior: wander in patrol area, detect player, chase, attack, and leash back when player escapes.

## Files to Modify
- `src/components/AIComponent.js` - Add aggro/leash states
- `src/config/Events.js` - Add enemy combat events

## Files to Create
- `src/systems/EnemySystem.js` - AI update logic

## Implementation Details

### AIComponent.js - State Additions
```javascript
// Add new states to AIComponent
// States: 'IDLE', 'WANDER', 'CHASE', 'ATTACK', 'FLEE', 'LEASH_RETURN'

class AIComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        // Existing...
        
        // NEW: Aggro System
        this.aggroRange = config.aggroRange || 200;
        this.leashDistance = config.leashDistance || 500;
        this.attackRange = config.attackRange || 100;
        
        // NEW: Combat State
        this.attackCooldown = 0;
        this.attackWindup = 0;
        this.isAttacking = false;
    }
    
    // Check if target is within aggro range
    canAggro(target) {
        if (!target) return false;
        const dx = target.x - this.parent.x;
        const dy = target.y - this.parent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.aggroRange;
    }
    
    // Check if too far from spawn (should leash)
    shouldLeash() {
        if (!this.parent.spawnX) return false;
        const dx = this.parent.x - this.parent.spawnX;
        const dy = this.parent.y - this.parent.spawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist > this.leashDistance;
    }
    
    // Check if in attack range
    inAttackRange(target) {
        if (!target) return false;
        const dx = target.x - this.parent.x;
        const dy = target.y - this.parent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.attackRange;
    }
}
```

### EnemySystem.js
```javascript
/**
 * EnemySystem
 * Handles AI, Movement, and Combat updates for hostile enemies.
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
        const ai = enemy.components.ai;
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
            
            // NEW: Pack Aggro - alert nearby grouped enemies
            if (enemy.packAggro && enemy.groupId) {
                this.alertPackMembers(enemy, hero);
            }
            
            if (window.EventBus) {
                EventBus.emit('ENEMY_AGGRO', { enemy, target: hero });
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
        const dx = nextX - enemy.spawnX;
        const dy = nextY - enemy.spawnY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > enemy.patrolRadius) {
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
     * NEW: Alert pack members when one enemy aggros
     */
    alertPackMembers(aggroEnemy, target) {
        if (!window.EntityManager) return;
        
        const enemies = EntityManager.getByType('Enemy');
        const alertRadius = GameConstants.Biome?.PACK_ALERT_RADIUS || 300;
        
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
                EventBus.emit('ENEMY_LEASH', { enemy });
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
        const combat = enemy.components.combat;
        
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
                        EventBus.emit('ENEMY_ATTACK', {
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
        if (entity?.entityType !== EntityTypes.ENEMY) return;
        
        // SFX
        if (window.AudioManager) AudioManager.playSFX('sfx_enemy_hurt');
    }
    
    onEntityDied(data) {
        const { entity } = data;
        if (entity?.entityType !== EntityTypes.ENEMY) return;
        
        // Death handling
        entity.state = 'dead';
        if (window.AudioManager) AudioManager.playSFX('sfx_enemy_death');
        
        // Emit for XP/Loot
        if (window.EventBus) {
            EventBus.emit('ENEMY_KILLED', {
                enemy: entity,
                xpReward: entity.xpReward,
                lootTableId: entity.lootTableId
            });
        }
    }
}

window.EnemySystem = new EnemySystem();
if (window.Registry) Registry.register('EnemySystem', window.EnemySystem);
```

### Events.js Additions
```javascript
// Combat
ENEMY_AGGRO: 'ENEMY_AGGRO',           // { enemy, target }
ENEMY_ATTACK: 'ENEMY_ATTACK',         // { attacker, target, damage }
ENEMY_LEASH: 'ENEMY_LEASH',           // { enemy }
ENEMY_KILLED: 'ENEMY_KILLED',         // { enemy, xpReward, lootTableId }
```

## Acceptance Criteria
- [ ] AIComponent has aggro, leash, attack range checks
- [ ] EnemySystem.js created with state machine
- [ ] States implemented: WANDER, CHASE, ATTACK, LEASH_RETURN
- [ ] Enemies wander within patrol radius
- [ ] Enemies detect hero within aggro range
- [ ] Enemies chase hero until attack range
- [ ] Enemies stop chasing when hero exceeds leash distance
- [ ] Enemies return to spawn point when leashed
- [ ] Events emitted: ENEMY_AGGRO, ENEMY_ATTACK, ENEMY_KILLED
- [ ] SystemConfig.js updated with EnemySystem

## Notes
- Actual damage application handled by 06-damage-system.md
- XP rewards handled by 08-leveling-system.md
- Loot drops handled by 07-loot-system.md
