---
status: pending
priority: 1
depends_on: []
estimated_complexity: medium
---

# Egg & Mount Config

## Scope
Define egg tiers, mount types, and mount perk configurations. This is the data layer that all other packages depend on.

## Files to Modify
- `src/config/EntityConfig.js` - Add egg and mount configurations

## Files to Create
- None (all config goes in EntityConfig.js per project conventions)

## Implementation Details

### 1. Add Egg Configuration to EntityConfig.js

```javascript
// Add to EntityConfig
eggs: {
    tiers: {
        1: { name: 'Common Egg', combineCost: 3, hatchTime: 30, color: '#8B7355' },
        2: { name: 'Uncommon Egg', combineCost: 3, hatchTime: 60, color: '#4CAF50' },
        3: { name: 'Rare Egg', combineCost: 3, hatchTime: 120, color: '#2196F3' },
        4: { name: 'Epic Egg', combineCost: 3, hatchTime: 240, color: '#9C27B0' },
        5: { name: 'Legendary Egg', combineCost: null, hatchTime: 480, color: '#FF9800' }
    },
    dropChance: 0.05, // 5% base chance from any dinosaur
    maxTier: 5
},
```

### 2. Add Mount Configuration to EntityConfig.js

```javascript
mounts: {
    defaults: {
        speedMultiplier: 1.5,
        gridSize: 2.0,
        staminaDrain: 0.5 // per second when mounted
    },
    types: {
        // ID follows technical guidelines: mount_t{tier}_{index}
        'mount_t1_01': {
            name: 'Swift Raptor',
            tier: 1,
            species: 'velociraptor',
            perks: ['speed_boost'],
            speedMultiplier: 1.8,
            staminaDrain: 0.3
        },
        'mount_t2_01': {
            name: 'Armored Trike',
            tier: 2,
            species: 'triceratops',
            perks: ['resource_gather'],
            speedMultiplier: 1.2,
            staminaDrain: 0.6,
            resourceBonus: 0.5 // 50% more resources
        },
        'mount_t3_01': {
            name: 'War Rex',
            tier: 3,
            species: 'tyrannosaurus',
            perks: ['instant_kill_resource'],
            speedMultiplier: 1.0,
            staminaDrain: 1.0,
            instantKillChance: 0.25 // 25% chance to instant-kill resource node
        }
    },
    perks: {
        'speed_boost': { description: 'Increased movement speed' },
        'resource_gather': { description: 'Bonus resource yield' },
        'instant_kill_resource': { description: 'Chance to instantly destroy resource nodes' }
    }
},
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **EntityConfig.js**: Add `eggs` section with tier definitions
- [ ] **EntityConfig.js**: Add `mounts` section with type definitions
- [ ] No new files created, no index.html changes needed

## Acceptance Criteria
- [ ] `EntityConfig.eggs.tiers` has all 5 tiers defined
- [ ] `EntityConfig.mounts.types` has at least 3 mount types
- [ ] All mount IDs follow `mount_t{tier}_{index}` pattern
- [ ] Perk definitions are config-driven, not hardcoded

## Notes
- Follow technical_guidelines.md: IDs are decoupled from display names
- Tiers 1-5 match existing item tier patterns in the game
- Combine cost of 3 eggs feels reasonable for progression
