---
status: complete
priority: 3
depends_on: [04-enemy-spawning.md, 05-enemy-ai.md]
estimated_complexity: medium
---

# 07 - Loot Table System

## Scope
Implement loot tables for enemies. When enemies die, they drop resources/items based on their loot table configuration.

## Files to Modify
- `src/config/EntityConfig.js` - Add loot tables section

## Files to Create
- `src/gameplay/LootSystem.js` - Loot generation logic

## Implementation Details

### EntityConfig.js - Loot Tables
```javascript
EntityConfig.lootTables = {
    // Common drops
    'common_feral': {
        guaranteedDrops: [],
        randomDrops: [
            { itemId: 'primal_meat', weight: 50, amount: { min: 1, max: 2 } },
            { itemId: 'scrap_metal', weight: 30, amount: { min: 1, max: 1 } },
            { itemId: 'gold', weight: 20, amount: { min: 5, max: 15 } }
        ],
        dropCount: { min: 1, max: 2 }  // Number of random drops
    },
    
    // Raptor specific
    'raptor_feral': {
        guaranteedDrops: [
            { itemId: 'primal_meat', amount: 1 }
        ],
        randomDrops: [
            { itemId: 'raptor_claw', weight: 30, amount: { min: 1, max: 1 } },
            { itemId: 'primal_meat', weight: 50, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 20, amount: { min: 10, max: 25 } }
        ],
        dropCount: { min: 1, max: 2 }
    },
    
    // T-Rex drops
    'rex_feral': {
        guaranteedDrops: [
            { itemId: 'primal_meat', amount: 3 },
            { itemId: 'iron_ore', amount: 2 }
        ],
        randomDrops: [
            { itemId: 'rex_tooth', weight: 20, amount: { min: 1, max: 1 } },
            { itemId: 'fossil_fuel', weight: 40, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 40, amount: { min: 50, max: 100 } }
        ],
        dropCount: { min: 2, max: 3 }
    },
    
    // Soldier drops
    'soldier_common': {
        guaranteedDrops: [],
        randomDrops: [
            { itemId: 'scrap_metal', weight: 40, amount: { min: 1, max: 3 } },
            { itemId: 'iron_ore', weight: 30, amount: { min: 1, max: 2 } },
            { itemId: 'gold', weight: 30, amount: { min: 20, max: 40 } }
        ],
        dropCount: { min: 1, max: 2 }
    },
    
    // Boss loot tables
    'boss_grasslands': {
        guaranteedDrops: [
            { itemId: 'alpha_fang', amount: 1 },
            { itemId: 'gold', amount: 500 }
        ],
        randomDrops: [
            { itemId: 'rare_hide', weight: 50, amount: { min: 1, max: 2 } },
            { itemId: 'primal_essence', weight: 30, amount: { min: 1, max: 1 } },
            { itemId: 'equipment_crate', weight: 20, amount: { min: 1, max: 1 } }
        ],
        dropCount: { min: 2, max: 3 }
    }
};
```

### LootSystem.js
```javascript
/**
 * LootSystem
 * Handles loot generation from enemies based on loot tables.
 */
const LootSystem = {
    init(game) {
        this.game = game;
        this.initListeners();
        console.log('[LootSystem] Initialized');
    },
    
    initListeners() {
        if (window.EventBus) {
            EventBus.on('ENEMY_KILLED', (data) => this.onEnemyKilled(data));
        }
    },
    
    onEnemyKilled(data) {
        const { enemy, lootTableId } = data;
        if (!lootTableId) return;
        
        // NEW: Elite enemies get multiplied drops
        const lootMultiplier = enemy.isElite ? 
            EntityConfig.enemy.eliteMultipliers.lootDrops : 1;
        
        const drops = this.generateLoot(lootTableId, enemy.level, lootMultiplier);
        this.spawnDrops(enemy.x, enemy.y, drops);
    },
    
    /**
     * Generate loot from a loot table
     * @param {string} tableId
     * @param {number} level - Enemy level for scaling
     * @param {number} lootMultiplier - Elite multiplier
     * @returns {Array<{itemId: string, amount: number}>}
     */
    generateLoot(tableId, level = 1, lootMultiplier = 1) {
        const table = EntityConfig.lootTables[tableId];
        if (!table) {
            console.warn(`[LootSystem] Unknown loot table: ${tableId}`);
            return [];
        }
        
        const drops = [];
        
        // Guaranteed drops
        for (const drop of table.guaranteedDrops || []) {
            drops.push({
                itemId: drop.itemId,
                amount: Math.floor(this.scaleAmount(drop.amount, level) * lootMultiplier)
            });
        }
        
        // Random drops (elite = more drops)
        const dropCount = Math.floor(
            this.randomRange(table.dropCount.min, table.dropCount.max) * lootMultiplier
        );
        for (let i = 0; i < dropCount; i++) {
            const drop = this.weightedRandom(table.randomDrops);
            if (drop) {
                const amount = this.randomRange(drop.amount.min, drop.amount.max);
                drops.push({
                    itemId: drop.itemId,
                    amount: Math.floor(this.scaleAmount(amount, level) * lootMultiplier)
                });
            }
        }
        
        return drops;
    },
    
    /**
     * Scale drop amount based on enemy level
     */
    scaleAmount(baseAmount, level) {
        const scaling = 1 + (level - 1) * 0.1; // +10% per level
        return Math.floor(baseAmount * scaling);
    },
    
    /**
     * Spawn drops at location
     */
    spawnDrops(x, y, drops) {
        if (!window.SpawnManager) return;
        
        const spacing = 40;
        let offsetIndex = 0;
        
        for (const drop of drops) {
            const angle = (offsetIndex / drops.length) * Math.PI * 2;
            const offsetX = Math.cos(angle) * spacing;
            const offsetY = Math.sin(angle) * spacing;
            
            SpawnManager.spawnDrop(x + offsetX, y + offsetY, drop.itemId, drop.amount);
            offsetIndex++;
        }
        
        // Emit event
        if (window.EventBus) {
            EventBus.emit('LOOT_DROPPED', { x, y, drops });
        }
    },
    
    /**
     * Weighted random selection
     */
    weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item;
        }
        return items[items.length - 1];
    },
    
    randomRange(min, max) {
        return min + Math.floor(Math.random() * (max - min + 1));
    }
};

window.LootSystem = LootSystem;
if (window.Registry) Registry.register('LootSystem', LootSystem);
```

### Events.js Addition
```javascript
LOOT_DROPPED: 'LOOT_DROPPED',     // { x, y, drops }
```

### SystemConfig.js Addition
```javascript
{ global: 'LootSystem', priority: 22, init: true },
```

## Acceptance Criteria
- [x] EntityConfig.lootTables section created
- [x] Loot tables have guaranteedDrops and randomDrops
- [x] LootSystem.js listens for ENEMY_DIED
- [x] generateLoot() uses weighted random selection
- [x] Drops scale with enemy level
- [x] Drops spawn in circular pattern around death location
- [x] LOOT_DROPPED event emitted
- [x] At least 4 loot tables defined (common, raptor, rex, soldier)
- [x] SystemConfig updated

## Notes
- Equipment drops (equipment_crate) are placeholder for future system
- Boss loot tables referenced by 09-boss-system.md
- New item IDs (raptor_claw, rex_tooth, etc.) may need registry additions
