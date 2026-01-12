---
status: pending
priority: 2
depends_on: [01-egg-mount-config.md]
estimated_complexity: medium
---

# Egg Inventory Component

## Scope
Create an EggInventory component to store and manage collected eggs separately from main inventory.

## Files to Modify
- None

## Files to Create
- `src/components/EggInventoryComponent.js` - Egg storage and combining logic

## Implementation Details

### 1. Create EggInventoryComponent.js

```javascript
/**
 * EggInventoryComponent
 * Manages egg collection and combining for a Hero entity.
 * 
 * Responsibilities:
 * - Store collected eggs (separate from main inventory)
 * - Combine eggs of same tier to upgrade
 * - Track egg counts per tier
 */
class EggInventoryComponent {
    constructor(owner, config = {}) {
        this.owner = owner;
        this.maxSlots = config.maxSlots || 20;
        
        // Eggs stored by tier: { 1: 2, 2: 1, 3: 0, ... }
        this.eggs = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };
    }

    /**
     * Add an egg to inventory
     * @param {number} tier - Egg tier (1-5)
     * @returns {boolean} - Success
     */
    addEgg(tier) {
        if (tier < 1 || tier > 5) return false;
        if (this.getTotalEggs() >= this.maxSlots) return false;
        
        this.eggs[tier]++;
        EventBus.emit(GameConstants.Events.EGG_COLLECTED, {
            tier: tier,
            total: this.eggs[tier]
        });
        return true;
    }

    /**
     * Remove an egg from inventory
     * @param {number} tier - Egg tier
     * @returns {boolean} - Success
     */
    removeEgg(tier) {
        if (this.eggs[tier] <= 0) return false;
        this.eggs[tier]--;
        return true;
    }

    /**
     * Combine eggs to create higher tier
     * @param {number} tier - Current tier to combine
     * @returns {boolean} - Success
     */
    combineEggs(tier) {
        const config = EntityConfig.eggs.tiers[tier];
        if (!config || !config.combineCost) return false;
        
        const nextTier = tier + 1;
        if (nextTier > EntityConfig.eggs.maxTier) return false;
        if (this.eggs[tier] < config.combineCost) return false;
        
        // Consume eggs
        this.eggs[tier] -= config.combineCost;
        
        // Create upgraded egg
        this.eggs[nextTier]++;
        
        EventBus.emit(GameConstants.Events.EGG_COMBINED, {
            fromTier: tier,
            toTier: nextTier,
            remaining: this.eggs[tier]
        });
        
        return true;
    }

    /**
     * Check if combining is possible
     */
    canCombine(tier) {
        const config = EntityConfig.eggs.tiers[tier];
        if (!config || !config.combineCost) return false;
        if (tier >= EntityConfig.eggs.maxTier) return false;
        return this.eggs[tier] >= config.combineCost;
    }

    /**
     * Get total egg count
     */
    getTotalEggs() {
        return Object.values(this.eggs).reduce((a, b) => a + b, 0);
    }

    /**
     * Get eggs of specific tier
     */
    getEggCount(tier) {
        return this.eggs[tier] || 0;
    }
}

window.EggInventoryComponent = EggInventoryComponent;
```

### 2. Add Events to GameConstants.js

```javascript
// In GameConstants.Events:
EGG_COLLECTED: 'eggCollected',
EGG_COMBINED: 'eggCombined',
EGG_HATCHED: 'eggHatched',
```

### 3. Integrate with Hero.js

Add to Hero constructor:

```javascript
// Egg Inventory
if (window.EggInventoryComponent) {
    this.components.eggInventory = new EggInventoryComponent(this, {
        maxSlots: 20
    });
}
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **index.html**: Add `<script src="src/components/EggInventoryComponent.js"></script>` 
- [ ] **GameConstants.js**: Add egg-related events
- [ ] **Hero.js**: Initialize EggInventoryComponent
- [ ] **Verify**: Manually call `hero.components.eggInventory.addEgg(1)` in console

## Acceptance Criteria
- [ ] EggInventoryComponent tracks eggs by tier
- [ ] `addEgg()` increments count and emits event
- [ ] `combineEggs()` consumes 3 eggs and creates 1 higher tier
- [ ] `canCombine()` returns correct boolean
- [ ] Hero has eggInventory component after construction

## Notes
- Eggs are NOT in main inventory - separate component
- Combining requires exact cost from config (default 3)
- Max tier cannot be combined further
