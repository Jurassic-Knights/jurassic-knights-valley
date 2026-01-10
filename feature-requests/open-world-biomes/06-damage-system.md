---
status: pending
priority: 2
depends_on: [02-enemy-config.md, 03-hero-stats.md]
estimated_complexity: medium
---

# 06 - Two-Way Damage System

## Scope
Implement damage dealing from enemies to hero. Currently only hero damages enemies; this adds enemies damaging hero.

## Files to Modify
- `src/components/HealthComponent.js` - Add damage mitigation
- `src/systems/HeroSystem.js` - Handle incoming damage

## Files to Create
- `src/systems/DamageSystem.js` - Centralized damage calculation

## Implementation Details

### DamageSystem.js
```javascript
/**
 * DamageSystem
 * Centralized damage calculation and application.
 * Handles defense mitigation, crits, and damage events.
 */
const DamageSystem = {
    /**
     * Calculate final damage after defense mitigation
     * @param {number} baseDamage - Raw damage
     * @param {number} defense - Target's defense stat
     * @returns {number} Final damage
     */
    calculateDamage(baseDamage, defense = 0) {
        // Diminishing returns formula: defense / (defense + 100)
        const reduction = defense / (defense + 100);
        const finalDamage = Math.floor(baseDamage * (1 - reduction));
        return Math.max(1, finalDamage); // Minimum 1 damage
    },
    
    /**
     * Calculate crit damage
     * @param {number} baseDamage
     * @param {number} critChance - 0-1
     * @param {number} critMultiplier - e.g., 1.5
     * @returns {{ damage: number, isCrit: boolean }}
     */
    rollCrit(baseDamage, critChance = 0, critMultiplier = 1.5) {
        const isCrit = Math.random() < critChance;
        const damage = isCrit ? Math.floor(baseDamage * critMultiplier) : baseDamage;
        return { damage, isCrit };
    },
    
    /**
     * Apply damage from attacker to target
     * @param {Entity} attacker
     * @param {Entity} target
     * @param {number} baseDamage
     */
    applyDamage(attacker, target, baseDamage) {
        if (!target || !target.components?.health) return { dealt: 0, killed: false };
        
        // Get defense
        const defense = target.components.stats?.getDefense?.() || 
                       target.components.stats?.defense || 0;
        
        // Calculate mitigated damage
        const mitigatedDamage = this.calculateDamage(baseDamage, defense);
        
        // Apply
        const killed = target.components.health.takeDamage(mitigatedDamage);
        
        // Emit event
        if (window.EventBus) {
            EventBus.emit('DAMAGE_DEALT', {
                attacker,
                target,
                baseDamage,
                finalDamage: mitigatedDamage,
                killed
            });
        }
        
        return { dealt: mitigatedDamage, killed };
    },
    
    init(game) {
        this.game = game;
        this.initListeners();
        console.log('[DamageSystem] Initialized');
    },
    
    initListeners() {
        if (window.EventBus) {
            // Listen for enemy attacks
            EventBus.on('ENEMY_ATTACK', (data) => this.onEnemyAttack(data));
        }
    },
    
    onEnemyAttack(data) {
        const { attacker, target, damage } = data;
        if (!target || target.entityType !== EntityTypes.HERO) return;
        
        const result = this.applyDamage(attacker, target, damage);
        
        // VFX
        if (window.VFXController && window.VFXConfig) {
            VFXController.playForeground(target.x, target.y, VFXConfig.HERO?.HIT || {
                type: 'burst',
                color: '#FF0000',
                count: 5
            });
        }
        
        // SFX
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_hero_hurt');
        }
        
        // Check death
        if (result.killed) {
            if (window.EventBus) {
                EventBus.emit('HERO_DIED', { hero: target });
            }
        }
    }
};

window.DamageSystem = DamageSystem;
if (window.Registry) Registry.register('DamageSystem', DamageSystem);
```

### Events.js Additions
```javascript
// Damage
DAMAGE_DEALT: 'DAMAGE_DEALT',     // { attacker, target, baseDamage, finalDamage, killed }
HERO_DIED: 'HERO_DIED',           // { hero }
```

### HeroSystem.js Modifications
```javascript
// Add to HeroSystem:

initListeners() {
    // Existing...
    
    if (window.EventBus) {
        EventBus.on('HERO_DIED', (data) => this.onHeroDied(data));
    }
}

onHeroDied(data) {
    const hero = data.hero;
    
    // Death handling - respawn at home
    hero.locked = true;
    
    // Death VFX
    if (window.VFXController && window.VFXConfig) {
        VFXController.playForeground(hero.x, hero.y, VFXConfig.TEMPLATES.HERO_DEATH_FX || {});
    }
    
    // Respawn after delay
    setTimeout(() => {
        const spawnPos = IslandManager.getHeroSpawnPosition();
        hero.x = spawnPos.x;
        hero.y = spawnPos.y;
        hero.components.health.respawn();
        hero.locked = false;
        
        if (window.EventBus) {
            EventBus.emit('HERO_RESPAWNED', { hero });
        }
    }, 2000);
}
```

### SystemConfig.js Addition
```javascript
{ global: 'DamageSystem', priority: 19, init: true },
```

## Acceptance Criteria
- [ ] DamageSystem.js created
- [ ] calculateDamage() applies defense mitigation
- [ ] Enemies can damage hero via ENEMY_ATTACK event
- [ ] Hero health decreases from enemy attacks
- [ ] VFX plays when hero is hit
- [ ] SFX plays when hero is hit
- [ ] HERO_DIED event emits on death
- [ ] Hero respawns at home after death
- [ ] Events emitted: DAMAGE_DEALT, HERO_DIED, HERO_RESPAWNED
- [ ] SystemConfig updated with DamageSystem

## Notes
- Defense formula uses diminishing returns
- Death penalty (XP loss, etc.) can be added later
- Respawn delay is configurable
