---
status: pending
priority: 3
depends_on: [05-mount-inventory.md]
estimated_complexity: high
---

# Mount System (Perks & Movement)

## Scope
Create the MountSystem that applies mount perks to gameplay - speed boost, resource bonuses, instant kill chance, and stamina drain.

## Files to Modify
- `src/systems/HeroSystem.js` - Integrate mount speed modifier
- `src/gameplay/ResourceNode.js` (if exists) - Handle instant kill perk

## Files to Create
- `src/systems/MountSystem.js` - Mount perk application logic

## Implementation Details

### 1. Create MountSystem.js

```javascript
/**
 * MountSystem
 * Applies mount perks to hero gameplay.
 * 
 * Responsibilities:
 * - Apply speed multiplier when mounted
 * - Drain stamina while mounted
 * - Apply resource bonuses (gather perk)
 * - Handle instant-kill resource chance
 */
class MountSystem {
    constructor() {
        this.hero = null;
        this.baseHeroSpeed = 700; // Cache original speed
    }

    init(game) {
        this.game = game;
        this.hero = game.hero;
        this.baseHeroSpeed = this.hero?.speed || 700;

        // Listen for mount events
        EventBus.on(GameConstants.Events.MOUNT_EQUIPPED, (data) => this.onMountEquipped(data));
        EventBus.on(GameConstants.Events.MOUNT_DISMOUNTED, (data) => this.onMountDismounted(data));
        
        // Listen for resource mining to apply perks
        EventBus.on(GameConstants.Events.RESOURCE_MINE_START, (data) => this.onResourceMineStart(data));
        EventBus.on(GameConstants.Events.RESOURCE_COLLECTED, (data) => this.onResourceCollected(data));

        console.log('[MountSystem] Initialized');
    }

    update(dt) {
        if (!this.hero) return;
        
        const mount = this.hero.components.mountInventory?.getActiveMount();
        if (!mount) return;
        
        // Drain stamina while mounted
        const staminaDrain = (mount.staminaDrain || 0.5) * (dt / 1000);
        if (this.hero.stamina > 0) {
            this.hero.stamina = Math.max(0, this.hero.stamina - staminaDrain);
        }
        
        // Auto-dismount if stamina runs out
        if (this.hero.stamina <= 0) {
            this.hero.components.mountInventory.dismount();
            EventBus.emit(GameConstants.Events.UI_NOTIFICATION, {
                message: 'Too exhausted to ride!',
                type: 'warning'
            });
        }
    }

    onMountEquipped(data) {
        if (!this.hero) return;
        
        const mount = data.mount;
        
        // Apply speed multiplier
        const speedMult = mount.speedMultiplier || 1.5;
        this.hero.speed = this.baseHeroSpeed * speedMult;
        
        console.log(`[MountSystem] Mounted ${mount.name}, speed: ${this.hero.speed}`);
        
        // Play mount sound
        if (window.AudioManager) {
            AudioManager.playSFX('sfx_mount_equip');
        }
    }

    onMountDismounted(data) {
        if (!this.hero) return;
        
        // Restore base speed
        this.hero.speed = this.baseHeroSpeed;
        
        console.log(`[MountSystem] Dismounted, speed: ${this.hero.speed}`);
    }

    /**
     * Handle instant-kill resource perk
     */
    onResourceMineStart(data) {
        if (!this.hero) return;
        
        const mount = this.hero.components.mountInventory?.getActiveMount();
        if (!mount) return;
        
        // Check for instant kill perk
        if (mount.instantKillChance && Math.random() < mount.instantKillChance) {
            // Instantly destroy resource
            EventBus.emit(GameConstants.Events.RESOURCE_INSTANT_KILL, {
                resource: data.resource,
                mount: mount
            });
            
            EventBus.emit(GameConstants.Events.UI_NOTIFICATION, {
                message: `${mount.name} smashed the resource!`,
                type: 'success'
            });
        }
    }

    /**
     * Apply resource bonus perk
     */
    onResourceCollected(data) {
        if (!this.hero) return;
        
        const mount = this.hero.components.mountInventory?.getActiveMount();
        if (!mount || !mount.resourceBonus) return;
        
        // Add bonus resources
        const bonusAmount = Math.floor(data.amount * mount.resourceBonus);
        if (bonusAmount > 0 && this.hero.components.inventory) {
            this.hero.components.inventory.addItem(data.itemId, bonusAmount);
            
            EventBus.emit(GameConstants.Events.UI_NOTIFICATION, {
                message: `+${bonusAmount} ${data.itemId} (mount bonus)`,
                type: 'info'
            });
        }
    }

    /**
     * Get current mount speed multiplier
     */
    getSpeedMultiplier() {
        const mount = this.hero?.components.mountInventory?.getActiveMount();
        return mount?.speedMultiplier || 1.0;
    }

    /**
     * Check if hero has specific perk active
     */
    hasPerk(perkName) {
        const mount = this.hero?.components.mountInventory?.getActiveMount();
        if (!mount) return false;
        return mount.perks.includes(perkName);
    }
}

window.MountSystem = new MountSystem();
```

### 2. Add Events to GameConstants.js

```javascript
// Resource Events (if not exists)
RESOURCE_MINE_START: 'resourceMineStart',
RESOURCE_INSTANT_KILL: 'resourceInstantKill',
```

### 3. Update HeroSystem.js (Speed Integration)

If HeroSystem directly modifies speed, ensure it respects MountSystem:

```javascript
// In HeroSystem.updateMovement():
// Speed is now a property on Hero that MountSystem modifies
// No changes needed if HeroSystem reads hero.speed directly
```

### 4. Add Mount Toggle to Input

In InputSystem or wherever keybinds are handled:

```javascript
// Add 'M' key to toggle mount
if (key === 'M' || key === 'm') {
    const hero = game.hero;
    if (hero?.components.mountInventory) {
        hero.components.mountInventory.toggleMount();
    }
}
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **index.html**: Add `<script src="src/systems/MountSystem.js"></script>`
- [ ] **SystemConfig.js**: Register `{ global: 'MountSystem', priority: 50, init: true }`
- [ ] **GameConstants.js**: Add resource events if missing
- [ ] **InputSystem.js** or keybind handler: Add 'M' to toggle mount
- [ ] **Verify**: Mount a dino and confirm speed changes

## Acceptance Criteria
- [ ] Mounted hero moves faster (configurable multiplier)
- [ ] Stamina drains while mounted
- [ ] Auto-dismount when stamina hits 0
- [ ] Resource bonus perk adds extra items
- [ ] Instant kill perk has chance to destroy resource instantly
- [ ] 'M' key toggles mount on/off

## Notes
- MountSystem modifies `hero.speed` directly
- Base speed is cached on init to restore on dismount
- Perks are checked by name from mount config
- Stamina drain prevents infinite riding
