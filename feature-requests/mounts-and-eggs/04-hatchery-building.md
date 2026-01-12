---
status: pending
priority: 2
depends_on: [01-egg-mount-config.md, 03-egg-inventory.md]
estimated_complexity: high
---

# Hatchery Building System

## Scope
Create the Hatchery building where players can incubate eggs at the home outpost. This is a new building system since no buildings exist yet.

## Files to Modify
- `src/config/EntityConfig.js` - Add building configuration
- `src/config/EntityTypes.js` - Add BUILDING type

## Files to Create
- `src/gameplay/Building.js` - Base building class
- `src/gameplay/HatcheryBuilding.js` - Hatchery-specific logic
- `src/systems/BuildingSystem.js` - Building manager system

## Implementation Details

### 1. Add EntityTypes

In `EntityTypes.js`:
```javascript
BUILDING: 'building',
HATCHERY: 'hatchery',
```

### 2. Add Building Config to EntityConfig.js

```javascript
buildings: {
    defaults: {
        gridSize: 2,
        interactionRange: 150,
        requiresHomeOutpost: true
    },
    types: {
        'hatchery': {
            name: 'Dino Hatchery',
            gridSize: 3,
            incubationSlots: 1, // Can incubate 1 egg at a time
            // Breeding slot: store mount to generate eggs
            breedingSlots: 2,
            eggGenerationTime: 300 // 5 minutes to generate egg from stored mount
        }
    }
},
```

### 3. Create Building.js (Base Class)

```javascript
/**
 * Building - Base class for interactive structures
 */
class Building extends Entity {
    constructor(config = {}) {
        super({
            entityType: EntityTypes.BUILDING,
            ...config
        });
        
        this.buildingType = config.buildingType || 'generic';
        this.interactionRange = config.interactionRange || 150;
    }

    canInteract(hero) {
        return this.distanceTo(hero) <= this.interactionRange;
    }

    interact(hero) {
        // Override in subclasses
        console.log(`Interacting with ${this.buildingType}`);
    }
}

window.Building = Building;
```

### 4. Create HatcheryBuilding.js

```javascript
/**
 * HatcheryBuilding - Incubates eggs into mounts
 * 
 * Features:
 * - Incubation: Put egg in, wait, get mount
 * - Breeding: Store active mounts to generate new eggs
 */
class HatcheryBuilding extends Building {
    constructor(config = {}) {
        const hatcheryConfig = EntityConfig.buildings.types.hatchery;
        super({
            buildingType: 'hatchery',
            ...hatcheryConfig,
            ...config
        });
        
        // Incubation state
        this.incubatingEgg = null; // { tier: number, startTime: number }
        this.incubationTimer = 0;
        
        // Breeding state (mounts stored here generate eggs)
        this.storedMounts = []; // Array of mount IDs
        this.breedingTimers = {}; // { mountId: timeRemaining }
    }

    /**
     * Start incubating an egg
     * @param {number} tier - Egg tier
     * @returns {boolean} Success
     */
    startIncubation(tier, hero) {
        if (this.incubatingEgg) return false;
        if (!hero.components.eggInventory.removeEgg(tier)) return false;
        
        const tierConfig = EntityConfig.eggs.tiers[tier];
        this.incubatingEgg = { tier: tier };
        this.incubationTimer = tierConfig.hatchTime;
        
        EventBus.emit(GameConstants.Events.INCUBATION_STARTED, {
            tier: tier,
            duration: tierConfig.hatchTime
        });
        
        return true;
    }

    /**
     * Check and complete incubation
     */
    update(dt) {
        // Incubation progress
        if (this.incubatingEgg) {
            this.incubationTimer -= dt / 1000;
            if (this.incubationTimer <= 0) {
                this.completeIncubation();
            }
        }
        
        // Breeding progress (stored mounts generate eggs)
        for (const mountId of this.storedMounts) {
            if (!this.breedingTimers[mountId]) {
                this.breedingTimers[mountId] = EntityConfig.buildings.types.hatchery.eggGenerationTime;
            }
            this.breedingTimers[mountId] -= dt / 1000;
            if (this.breedingTimers[mountId] <= 0) {
                this.generateEggFromMount(mountId);
            }
        }
    }

    completeIncubation() {
        const tier = this.incubatingEgg.tier;
        const mount = this.selectMountForTier(tier);
        
        EventBus.emit(GameConstants.Events.EGG_HATCHED, {
            tier: tier,
            mountId: mount
        });
        
        this.incubatingEgg = null;
        this.incubationTimer = 0;
    }

    selectMountForTier(tier) {
        // Select random mount of appropriate tier
        const mounts = Object.entries(EntityConfig.mounts.types)
            .filter(([id, m]) => m.tier <= tier);
        if (mounts.length === 0) return 'mount_t1_01';
        
        // Higher tier = better chance at higher tier mounts
        const weighted = mounts.filter(([id, m]) => 
            Math.random() < (tier - m.tier + 1) / tier
        );
        const selection = weighted.length > 0 ? weighted : mounts;
        return selection[Math.floor(Math.random() * selection.length)][0];
    }

    storeMountForBreeding(mountId, hero) {
        if (this.storedMounts.length >= EntityConfig.buildings.types.hatchery.breedingSlots) {
            return false;
        }
        // Remove from hero's mount inventory
        if (!hero.components.mountInventory?.removeMount(mountId)) return false;
        
        this.storedMounts.push(mountId);
        this.breedingTimers[mountId] = EntityConfig.buildings.types.hatchery.eggGenerationTime;
        return true;
    }

    generateEggFromMount(mountId) {
        const mountConfig = EntityConfig.mounts.types[mountId];
        const eggTier = mountConfig?.tier || 1;
        
        EventBus.emit(GameConstants.Events.EGG_GENERATED, {
            tier: eggTier,
            fromMount: mountId
        });
        
        // Reset timer
        this.breedingTimers[mountId] = EntityConfig.buildings.types.hatchery.eggGenerationTime;
    }

    interact(hero) {
        EventBus.emit(GameConstants.Events.HATCHERY_OPENED, {
            building: this,
            hero: hero
        });
    }
}

window.HatcheryBuilding = HatcheryBuilding;
```

### 5. Create BuildingSystem.js

```javascript
/**
 * BuildingSystem - Manages all buildings
 */
class BuildingSystem {
    constructor() {
        this.buildings = [];
    }

    init(game) {
        this.game = game;
        
        // Spawn hatchery at home outpost
        this.spawnHatchery();
        
        console.log('[BuildingSystem] Initialized');
    }

    spawnHatchery() {
        // Place at home outpost (coordinates from IslandManager)
        const homeOutpost = { x: 512, y: 512 }; // TODO: Get from IslandManager
        
        const hatchery = new HatcheryBuilding({
            x: homeOutpost.x + 200,
            y: homeOutpost.y + 200
        });
        
        this.buildings.push(hatchery);
    }

    update(dt) {
        for (const building of this.buildings) {
            if (building.update) building.update(dt);
        }
    }

    getBuildings() {
        return this.buildings;
    }

    getBuildingAt(x, y, range = 150) {
        return this.buildings.find(b => 
            Math.hypot(b.x - x, b.y - y) <= range
        );
    }
}

window.BuildingSystem = new BuildingSystem();
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **index.html**: Add scripts for `Building.js`, `HatcheryBuilding.js`, `BuildingSystem.js`
- [ ] **SystemConfig.js**: Register `{ global: 'BuildingSystem', priority: 45, init: true }`
- [ ] **EntityTypes.js**: Add BUILDING and HATCHERY types
- [ ] **GameConstants.js**: Add INCUBATION_STARTED, EGG_HATCHED, EGG_GENERATED, HATCHERY_OPENED events
- [ ] **GameRenderer.js**: Add building rendering (or defer to separate package)
- [ ] **Verify**: Hatchery spawns at home outpost

## Acceptance Criteria
- [ ] Hatchery spawns near home outpost
- [ ] `startIncubation()` consumes egg and starts timer
- [ ] Timer completion triggers `EGG_HATCHED` event
- [ ] Stored mounts generate eggs over time
- [ ] Building has interact range check

## Notes
- This is a NEW system - buildings don't exist yet
- Hatchery is first building, architecture should support more
- Incubation times are in seconds (configurable)
- Breeding = storing tamed mounts to passively generate eggs
