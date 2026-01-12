---
status: pending
priority: 1
depends_on: []
estimated_complexity: low
---

# Egg Loot Drops

## Scope
Add eggs as rare drops from dinosaur kills. Integrates with existing LootSystem.

## Files to Modify
- `src/config/EntityConfig.js` - Add egg drops to existing loot tables

## Files to Create
- None

## Implementation Details

### 1. Add Egg Item Definition

In EntityConfig.js items section (if exists) or create new section:

```javascript
// Add egg item template
items: {
    // ... existing items ...
    'egg_t1': { name: 'Common Egg', type: 'egg', tier: 1, stackable: false },
    'egg_t2': { name: 'Uncommon Egg', type: 'egg', tier: 2, stackable: false },
    'egg_t3': { name: 'Rare Egg', type: 'egg', tier: 3, stackable: false },
    'egg_t4': { name: 'Epic Egg', type: 'egg', tier: 4, stackable: false },
    'egg_t5': { name: 'Legendary Egg', type: 'egg', tier: 5, stackable: false }
},
```

### 2. Update Existing Loot Tables

Add egg drops to existing enemy loot tables with low weight:

```javascript
// In lootTables.common_feral:
randomDrops: [
    { itemId: 'primal_meat', weight: 50, amount: { min: 1, max: 2 } },
    { itemId: 'scrap_metal', weight: 30, amount: { min: 1, max: 1 } },
    { itemId: 'gold', weight: 20, amount: { min: 5, max: 15 } },
    { itemId: 'egg_t1', weight: 3, amount: { min: 1, max: 1 } } // NEW: ~3% chance
],

// In lootTables.raptor_enemy:
{ itemId: 'egg_t1', weight: 5, amount: { min: 1, max: 1 } }, // ~5% chance

// In lootTables.rex_enemy:
{ itemId: 'egg_t2', weight: 4, amount: { min: 1, max: 1 } }, // Higher tier from boss-like enemies

// In lootTables.soldier_brute:
{ itemId: 'egg_t1', weight: 2, amount: { min: 1, max: 1 } }, // Soldiers can drop eggs too
```

### 3. Tier Drop Rules (Config-Driven)

Add to EntityConfig.eggs section:

```javascript
dropRules: {
    // Minimum enemy level/tier to drop each egg tier
    'egg_t1': { minEnemyTier: 1 },
    'egg_t2': { minEnemyTier: 2 },
    'egg_t3': { minEnemyTier: 3 },
    'egg_t4': { minEnemyTier: 4 },
    'egg_t5': { minEnemyTier: 5, bossOnly: true }
}
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **EntityConfig.js**: Add egg item definitions
- [ ] **EntityConfig.js**: Update loot tables with egg drops
- [ ] **Verify**: Kill a dinosaur and confirm eggs can drop

## Acceptance Criteria
- [ ] Eggs appear in loot tables with appropriate weights
- [ ] Different enemy types drop different tier eggs
- [ ] Drop rates are configurable (not hardcoded)
- [ ] Existing LootSystem handles egg drops without modification

## Notes
- Eggs should be rare (~3-5% base chance)
- Higher tier enemies drop higher tier eggs
- Legendary eggs only from bosses (future boss system)
