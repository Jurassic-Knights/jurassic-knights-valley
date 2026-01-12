---
status: pending
priority: 2
depends_on: [01-egg-mount-config.md]
estimated_complexity: medium
---

# Mount Inventory Component

## Scope
Create a MountInventory component to store hatched mounts. Track which mount is currently active.

## Files to Modify
- `src/gameplay/Hero.js` - Add MountInventoryComponent

## Files to Create
- `src/components/MountInventoryComponent.js` - Mount storage and selection

## Implementation Details

### 1. Create MountInventoryComponent.js

```javascript
/**
 * MountInventoryComponent
 * Manages collected mounts for a Hero.
 * 
 * Responsibilities:
 * - Store hatched mounts
 * - Track active/equipped mount
 * - Provide mount data to MountSystem
 */
class MountInventoryComponent {
    constructor(owner, config = {}) {
        this.owner = owner;
        this.maxMounts = config.maxMounts || 10;
        
        // Stored mounts: Array of mount instance data
        // { id: 'mount_t1_01', name: 'Swift Raptor', tier: 1, ... }
        this.mounts = [];
        
        // Currently equipped mount (null if on foot)
        this.activeMount = null;
    }

    /**
     * Add a new mount to inventory
     * @param {string} mountId - Mount type ID from EntityConfig
     * @returns {object|null} - Created mount instance or null if full
     */
    addMount(mountId) {
        if (this.mounts.length >= this.maxMounts) return null;
        
        const mountConfig = EntityConfig.mounts.types[mountId];
        if (!mountConfig) {
            console.warn(`[MountInventory] Unknown mount: ${mountId}`);
            return null;
        }
        
        const mountInstance = {
            id: mountId,
            instanceId: `${mountId}_${Date.now()}`, // Unique instance
            name: mountConfig.name,
            tier: mountConfig.tier,
            species: mountConfig.species,
            perks: [...mountConfig.perks],
            // Copy stats from config
            speedMultiplier: mountConfig.speedMultiplier,
            staminaDrain: mountConfig.staminaDrain,
            resourceBonus: mountConfig.resourceBonus || 0,
            instantKillChance: mountConfig.instantKillChance || 0
        };
        
        this.mounts.push(mountInstance);
        
        EventBus.emit(GameConstants.Events.MOUNT_OBTAINED, {
            mount: mountInstance
        });
        
        return mountInstance;
    }

    /**
     * Remove a mount from inventory
     * @param {string} instanceId - Unique mount instance ID
     * @returns {boolean} Success
     */
    removeMount(instanceId) {
        const idx = this.mounts.findIndex(m => m.instanceId === instanceId);
        if (idx === -1) return false;
        
        // Can't remove active mount
        if (this.activeMount?.instanceId === instanceId) {
            this.dismount();
        }
        
        this.mounts.splice(idx, 1);
        return true;
    }

    /**
     * Equip a mount
     * @param {string} instanceId - Mount instance to equip
     * @returns {boolean} Success
     */
    equipMount(instanceId) {
        const mount = this.mounts.find(m => m.instanceId === instanceId);
        if (!mount) return false;
        
        this.activeMount = mount;
        
        EventBus.emit(GameConstants.Events.MOUNT_EQUIPPED, {
            mount: mount
        });
        
        return true;
    }

    /**
     * Dismount (go on foot)
     */
    dismount() {
        if (!this.activeMount) return;
        
        const prev = this.activeMount;
        this.activeMount = null;
        
        EventBus.emit(GameConstants.Events.MOUNT_DISMOUNTED, {
            mount: prev
        });
    }

    /**
     * Toggle mount on/off
     */
    toggleMount() {
        if (this.activeMount) {
            this.dismount();
        } else if (this.mounts.length > 0) {
            // Equip first available
            this.equipMount(this.mounts[0].instanceId);
        }
    }

    /**
     * Get active mount or null
     */
    getActiveMount() {
        return this.activeMount;
    }

    /**
     * Check if currently mounted
     */
    isMounted() {
        return this.activeMount !== null;
    }

    /**
     * Get all mounts
     */
    getAllMounts() {
        return [...this.mounts];
    }

    /**
     * Get mount count
     */
    getMountCount() {
        return this.mounts.length;
    }
}

window.MountInventoryComponent = MountInventoryComponent;
```

### 2. Add Events to GameConstants.js

```javascript
// Mount Events
MOUNT_OBTAINED: 'mountObtained',
MOUNT_EQUIPPED: 'mountEquipped',
MOUNT_DISMOUNTED: 'mountDismounted',
```

### 3. Integrate with Hero.js

Add to Hero constructor:

```javascript
// Mount Inventory
if (window.MountInventoryComponent) {
    this.components.mountInventory = new MountInventoryComponent(this, {
        maxMounts: 10
    });
}
```

Add getter to Hero class:

```javascript
// Mount Accessors
get activeMount() { 
    return this.components.mountInventory?.getActiveMount() || null; 
}

get isMounted() {
    return this.components.mountInventory?.isMounted() || false;
}
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **index.html**: Add `<script src="src/components/MountInventoryComponent.js"></script>`
- [ ] **GameConstants.js**: Add mount events
- [ ] **Hero.js**: Initialize MountInventoryComponent
- [ ] **Hero.js**: Add activeMount/isMounted getters
- [ ] **Verify**: `hero.components.mountInventory.addMount('mount_t1_01')` works

## Acceptance Criteria
- [ ] Can add mounts with `addMount()`
- [ ] Can equip/dismount with `equipMount()`/`dismount()`
- [ ] `isMounted()` returns correct state
- [ ] Events fire on mount/dismount
- [ ] Mount instances have unique instanceIds

## Notes
- Mounts are stored as instances, not just IDs
- Each mount instance is unique (same type can appear multiple times)
- Active mount affects hero stats through MountSystem
