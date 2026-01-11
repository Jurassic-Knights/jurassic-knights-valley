---
status: complete
priority: 1
depends_on: none
estimated_complexity: medium
---

# 02 - Enemy Configuration

## Scope
Define hostile enemy types that attack the player. Includes enemy dinosaurs and hostile soldiers. Separate from passive zone dinosaurs.

## Files to Modify
- `src/config/EntityConfig.js` - Add `enemy` section
- `src/config/EntityTypes.js` - Add ENEMY_DINOSAUR, ENEMY_SOLDIER types

## Files to Create
- (None - embedded in EntityConfig.js for consistency)

## Implementation Details

### EntityTypes.js Addition
```javascript
const EntityTypes = {
    HERO: 'hero',
    DINOSAUR: 'dinosaur',           // Passive zone dinos
    ENEMY_DINOSAUR: 'enemy_dinosaur', // NEW: Hostile dinosaurs
    ENEMY_SOLDIER: 'enemy_soldier',   // NEW: Hostile soldiers
    RESOURCE: 'resource',
    MERCHANT: 'merchant',
    DROPPED_ITEM: 'dropped_item',
    PROP: 'prop'
};
```

### EntityConfig.js - Enemy Section
```javascript
EntityConfig.enemy = {
    defaults: {
        gridSize: 1.5,
        width: 192,
        height: 192,
        health: 50,
        maxHealth: 50,
        damage: 5,
        attackRate: 1,         // Attacks per second
        attackRange: 100,      // Melee range
        speed: 80,             // Faster than passive dinos
        aggroRange: 200,       // Detection radius
        leashDistance: 500,    // Max chase distance from spawn
        xpReward: 10,
        lootTableId: 'common_enemy',
        packAggro: true,       // NEW: Group aggro behavior
        isElite: false,        // NEW: Elite variant flag
        threatLevel: 1         // NEW: 1-5 for UI indicators
    },
    
    // Elite Multipliers
    eliteMultipliers: {
        health: 2.0,
        damage: 2.0,
        xpReward: 3.0,
        lootDrops: 3.0
    },
    eliteSpawnChance: 0.05, // 5% chance to spawn as elite
    
    // Enemy Dinosaurs
    dinosaurs: {
        'enemy_raptor': {
            name: 'Feral Raptor',
            species: 'velociraptor',
            entityType: 'enemy_dinosaur',
            health: 40,
            damage: 8,
            speed: 120,
            attackType: 'melee',
            xpReward: 15,
            lootTableId: 'raptor_enemy',
            packAggro: true,    // Raptors hunt in packs
            threatLevel: 1
        },
        'enemy_rex': {
            name: 'Feral Rex',
            species: 'tyrannosaurus',
            entityType: 'enemy_dinosaur',
            gridSize: 2.5,
            width: 320,
            height: 320,
            health: 200,
            damage: 25,
            speed: 60,
            attackType: 'melee',
            xpReward: 100,
            lootTableId: 'rex_enemy',
            packAggro: false,   // Rex is a solo hunter
            threatLevel: 4
        },
        'enemy_spitter': {
            name: 'Acid Spitter',
            species: 'dilophosaurus',
            entityType: 'enemy_dinosaur',
            health: 30,
            damage: 12,
            speed: 70,
            attackType: 'ranged',
            attackRange: 300,
            xpReward: 20,
            lootTableId: 'spitter_enemy',
            packAggro: true,
            threatLevel: 2
        }
    },
    
    // Hostile Soldiers
    soldiers: {
        'enemy_soldier': {
            name: 'Rogue Soldier',
            entityType: 'enemy_soldier',
            health: 60,
            damage: 10,
            speed: 90,
            attackType: 'ranged',
            attackRange: 350,
            weaponType: 'rifle',
            xpReward: 25,
            lootTableId: 'soldier_common',
            packAggro: true,
            threatLevel: 2
        },
        'enemy_brute': {
            name: 'Trench Brute',
            entityType: 'enemy_soldier',
            health: 150,
            damage: 20,
            speed: 50,
            attackType: 'melee',
            weaponType: 'club',
            xpReward: 40,
            lootTableId: 'soldier_brute',
            packAggro: false,   // Brutes fight alone
            threatLevel: 3
        }
    },
    
    // Transition Zone Mixing
    transitionZones: {
        'grasslands_tundra': ['enemy_raptor', 'enemy_soldier'],
        'tundra_desert': ['enemy_soldier', 'enemy_brute'],
        'desert_lava': ['enemy_rex', 'enemy_spitter']
    },
    
    // Attack Type Configs
    attackTypes: {
        melee: {
            range: 100,
            windupTime: 200,
            recoveryTime: 500
        },
        ranged: {
            range: 350,
            projectileSpeed: 400,
            windupTime: 300,
            recoveryTime: 800
        }
    }
};
```

## Acceptance Criteria
- [x] EntityTypes.ENEMY_DINOSAUR and ENEMY_SOLDIER added
- [x] EntityConfig.enemy section created with defaults
- [x] At least 3 enemy dinosaur types defined
- [x] At least 2 hostile soldier types defined
- [x] Each enemy has: health, damage, speed, attackType, xpReward, lootTableId
- [x] **packAggro** flag per enemy type (true/false)
- [x] **threatLevel** (1-5) for UI indicators
- [x] **eliteMultipliers** and spawn chance defined
- [x] **transitionZones** mapping biome borders to enemy mixes
- [x] Attack types (melee/ranged) have separate configs
- [x] All values are config-driven, no hardcoding

## Notes
- packAggro = false for solo hunters (Rex, Brute)
- lootTableId references 07-loot-system.md
- Elite enemies use multipliers, handled in 04-enemy-spawning.md
- Transition zones handled in 01-biome-config.md borders

