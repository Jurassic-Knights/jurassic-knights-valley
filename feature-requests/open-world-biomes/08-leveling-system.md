---
status: pending
priority: 3
depends_on: [03-hero-stats.md, 06-damage-system.md]
estimated_complexity: medium
---

# 08 - XP and Leveling System

## Scope
Implement XP gain from killing enemies and level progression for the hero.

## Files to Modify
- `src/components/StatsComponent.js` - Add XP/level methods
- `src/config/Events.js` - Add level events
- `src/gameplay/ProgressionSystem.js` - Replace placeholder

## Files to Create
- (Extends ProgressionSystem.js)

## Implementation Details

### ProgressionSystem.js - Full Implementation
```javascript
/**
 * ProgressionSystem
 * Handles XP gain, leveling, and stat increases.
 */
const ProgressionSystem = {
    init(game) {
        this.game = game;
        this.initListeners();
        console.log('[ProgressionSystem] Initialized');
    },
    
    initListeners() {
        if (window.EventBus) {
            EventBus.on('ENEMY_KILLED', (data) => this.onEnemyKilled(data));
        }
    },
    
    onEnemyKilled(data) {
        const { enemy, xpReward } = data;
        if (!xpReward || !this.game?.hero) return;
        
        this.grantXP(this.game.hero, xpReward);
    },
    
    /**
     * Grant XP to hero
     * @param {Hero} hero
     * @param {number} amount
     */
    grantXP(hero, amount) {
        const stats = hero.components?.stats;
        if (!stats) return;
        
        const oldLevel = stats.level;
        stats.xp += amount;
        
        // Emit XP gain event
        if (window.EventBus) {
            EventBus.emit('XP_GAINED', {
                hero,
                amount,
                total: stats.xp,
                level: stats.level
            });
        }
        
        // Check for level up(s)
        while (stats.xp >= stats.getXPForLevel(stats.level)) {
            stats.xp -= stats.getXPForLevel(stats.level);
            stats.level++;
            this.onLevelUp(hero, stats.level);
        }
        
        // Emit if leveled
        if (stats.level > oldLevel) {
            if (window.EventBus) {
                EventBus.emit('HERO_LEVEL_UP', {
                    hero,
                    oldLevel,
                    newLevel: stats.level,
                    levelsGained: stats.level - oldLevel
                });
            }
        }
    },
    
    /**
     * Handle level up bonuses
     * @param {Hero} hero
     * @param {number} newLevel
     */
    onLevelUp(hero, newLevel) {
        const stats = hero.components?.stats;
        const health = hero.components?.health;
        
        // Stat increases per level (config-driven in future)
        const perLevel = {
            maxHealth: 10,
            attack: 2,
            defense: 1,
            maxStamina: 5
        };
        
        // Apply stat gains
        if (health) {
            health.maxHealth += perLevel.maxHealth;
            health.health = health.maxHealth; // Full heal on level
        }
        
        if (stats) {
            stats.attack = (stats.attack || 10) + perLevel.attack;
            stats.defense = (stats.defense || 0) + perLevel.defense;
            stats.maxStamina += perLevel.maxStamina;
            stats.stamina = stats.maxStamina; // Full restore
        }
        
        // VFX
        if (window.VFXController && window.VFXConfig) {
            VFXController.playForeground(hero.x, hero.y, VFXConfig.TEMPLATES.LEVEL_UP_FX || {
                type: 'burst',
                color: '#FFD700',
                count: 30,
                lifetime: 1000
            });
        }
        
        // SFX
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_level_up');
        }
        
        console.log(`[ProgressionSystem] Hero leveled up to ${newLevel}!`);
    },
    
    /**
     * Get XP required for specific level
     */
    getXPForLevel(level) {
        const base = EntityConfig.hero.base.xpToNextLevel || 100;
        const scaling = EntityConfig.hero.base.xpScaling || 1.5;
        return Math.floor(base * Math.pow(scaling, level - 1));
    },
    
    /**
     * Get hero's current XP progress as percentage
     */
    getXPProgress(hero) {
        const stats = hero.components?.stats;
        if (!stats) return 0;
        
        const required = stats.getXPForLevel(stats.level);
        return stats.xp / required;
    },
    
    // Legacy compatibility
    meetsRequirements(requirements = {}) {
        const hero = this.game?.hero;
        if (!hero) return true;
        
        if (requirements.level && hero.level < requirements.level) return false;
        return true;
    },
    
    getAvailableUnlocks() {
        return [];
    }
};

window.ProgressionSystem = ProgressionSystem;
if (window.Registry) Registry.register('ProgressionSystem', ProgressionSystem);
```

### StatsComponent.js Additions
```javascript
// Add/verify these methods exist:

getXPForLevel(level) {
    const base = this.xpToNextLevel || 100;
    const scaling = this.xpScaling || 1.5;
    return Math.floor(base * Math.pow(scaling, level - 1));
}

getXPProgress() {
    const required = this.getXPForLevel(this.level);
    return this.xp / required;
}
```

### Events.js Additions
```javascript
// Progression
XP_GAINED: 'XP_GAINED',           // { hero, amount, total, level }
HERO_LEVEL_UP: 'HERO_LEVEL_UP',   // { hero, oldLevel, newLevel, levelsGained }
HERO_RESPAWNED: 'HERO_RESPAWNED', // { hero }
```

### UI Integration Notes
```javascript
// For UI to display XP bar, listen for:
EventBus.on('XP_GAINED', (data) => updateXPBar(data.total, data.level));
EventBus.on('HERO_LEVEL_UP', (data) => showLevelUpNotification(data.newLevel));
```

## Acceptance Criteria
- [ ] ProgressionSystem.js fully implemented (replaces placeholder)
- [ ] XP granted on ENEMY_KILLED event
- [ ] Level up triggers when XP threshold reached
- [ ] Multiple levels can be gained from one kill
- [ ] Stats increase on level up (health, attack, defense, stamina)
- [ ] Full heal on level up
- [ ] VFX plays on level up
- [ ] SFX plays on level up
- [ ] XP_GAINED event emitted
- [ ] HERO_LEVEL_UP event emitted
- [ ] XP curve uses config values (xpToNextLevel, xpScaling)
- [ ] SystemConfig updated with proper init

## Notes
- Per-level stat gains should eventually move to EntityConfig
- UI for XP bar is separate (can be added to UIManager)
- Death penalty (XP loss) can be added later
