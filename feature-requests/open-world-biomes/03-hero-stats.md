---
status: pending
priority: 1
depends_on: none
estimated_complexity: medium
---

# 03 - Hero Stats Expansion

## Scope
Expand hero stats system to support combat with enemies. Add level, XP, attack power, defense, and scalable stats foundation.

## Files to Modify
- `src/config/EntityConfig.js` - Expand hero.base stats
- `src/gameplay/Hero.js` - Add level/XP properties
- `src/components/StatsComponent.js` - Add attack/defense stats

## Files to Create
- (None - extends existing files)

## Implementation Details

### EntityConfig.js - Hero Stats Expansion
```javascript
EntityConfig.hero.base = {
    // Existing
    gridSize: 1.5,
    width: 192,
    height: 192,
    color: '#D4AF37',
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    speed: 700,
    
    // NEW: Combat Stats
    level: 1,
    xp: 0,
    attack: {
        damage: 10,
        rate: 2,
        staminaCost: 1,
        range: { default: 125, gun: 450 }
    },
    defense: 0,              // Damage reduction
    critChance: 0.05,        // 5% base crit
    critMultiplier: 1.5,     // 150% crit damage
    
    // NEW: Leveling Curve
    xpToNextLevel: 100,      // Base XP for level 2
    xpScaling: 1.5           // Each level requires 1.5x more XP
};
```

### StatsComponent.js - Additions
```javascript
class StatsComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        // Existing
        this.speed = config.speed || 100;
        this.maxStamina = config.maxStamina || 100;
        this.stamina = config.stamina ?? this.maxStamina;
        this.critChance = config.critChance || 0;
        this.defense = config.defense || 0;
        
        // NEW: Combat Stats
        this.attack = config.attack || 10;       // Base attack power
        this.critMultiplier = config.critMultiplier || 1.5;
        
        // NEW: Leveling
        this.level = config.level || 1;
        this.xp = config.xp || 0;
        this.xpToNextLevel = config.xpToNextLevel || 100;
        this.xpScaling = config.xpScaling || 1.5;
    }
    
    // Calculate XP needed for next level
    getXPForLevel(targetLevel) {
        const base = this.xpToNextLevel;
        const scaling = this.xpScaling;
        return Math.floor(base * Math.pow(scaling, targetLevel - 1));
    }
    
    // Get total XP needed from level 1 to target
    getTotalXPForLevel(targetLevel) {
        let total = 0;
        for (let i = 1; i < targetLevel; i++) {
            total += this.getXPForLevel(i);
        }
        return total;
    }
    
    // Get effective attack (with level scaling)
    getAttack() {
        return this.attack + (this.level - 1) * 2; // +2 per level
    }
    
    // Get effective defense
    getDefense() {
        return this.defense + (this.level - 1) * 1; // +1 per level
    }
    
    // Calculate damage reduction from defense
    getDamageReduction(incomingDamage) {
        const reduction = this.getDefense() / (this.getDefense() + 100);
        return Math.floor(incomingDamage * (1 - reduction));
    }
}
```

### Hero.js - Level/XP Accessors
```javascript
// Add to Hero class
get level() { return this.components.stats?.level || 1; }
set level(val) { if (this.components.stats) this.components.stats.level = val; }

get xp() { return this.components.stats?.xp || 0; }
set xp(val) { if (this.components.stats) this.components.stats.xp = val; }

get attack() { return this.components.stats?.getAttack() || 10; }
get defense() { return this.components.stats?.getDefense() || 0; }
```

## Acceptance Criteria
- [ ] Hero has level and xp properties
- [ ] StatsComponent has attack, defense, critChance, critMultiplier
- [ ] XP curve calculation is config-driven (xpToNextLevel, xpScaling)
- [ ] Level scaling for attack/defense (not hardcoded)
- [ ] Damage reduction formula uses defense stat
- [ ] Hero.js has accessors for new stats
- [ ] Events emitted on level change (HERO_LEVEL_UP)

## Notes
- Actual XP gain handled by 08-leveling-system.md
- Combat application handled by 06-damage-system.md
- This package focuses on the data structure, not the gameplay logic
