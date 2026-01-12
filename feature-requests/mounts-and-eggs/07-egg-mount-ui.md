---
status: pending
priority: 4
depends_on: [03-egg-inventory.md, 04-hatchery-building.md, 05-mount-inventory.md]
estimated_complexity: high
---

# Egg & Mount UI

## Scope
Create UI panels for egg inventory, hatchery interaction, and mount selection.

## Files to Modify
- `css/ui-hud.css` or `css/components.css` - Add styles
- `index.html` - Add UI containers

## Files to Create
- `src/ui/EggUI.js` - Egg inventory display and combining
- `src/ui/HatcheryUI.js` - Hatchery interaction panel
- `src/ui/MountUI.js` - Mount selection and status

## Implementation Details

### 1. Create EggUI.js

```javascript
/**
 * EggUI - Displays egg inventory and combine interface
 */
class EggUI {
    constructor() {
        this.container = null;
        this.isOpen = false;
    }

    init(game) {
        this.game = game;
        this.hero = game.hero;
        this.createContainer();
        
        // Listen for events
        EventBus.on(GameConstants.Events.EGG_COLLECTED, () => this.refresh());
        EventBus.on(GameConstants.Events.EGG_COMBINED, () => this.refresh());
        
        console.log('[EggUI] Initialized');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'egg-ui';
        this.container.className = 'panel egg-panel hidden';
        this.container.innerHTML = `
            <div class="panel-header">
                <h3>🥚 Eggs</h3>
                <button class="close-btn" onclick="EggUI.close()">×</button>
            </div>
            <div class="egg-grid" id="egg-grid"></div>
        `;
        document.body.appendChild(this.container);
    }

    open() {
        this.isOpen = true;
        this.container.classList.remove('hidden');
        this.refresh();
    }

    close() {
        this.isOpen = false;
        this.container.classList.add('hidden');
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    refresh() {
        if (!this.isOpen) return;
        
        const eggInv = this.hero?.components.eggInventory;
        if (!eggInv) return;
        
        const grid = this.container.querySelector('#egg-grid');
        grid.innerHTML = '';
        
        for (let tier = 1; tier <= 5; tier++) {
            const count = eggInv.getEggCount(tier);
            const tierConfig = EntityConfig.eggs.tiers[tier];
            const canCombine = eggInv.canCombine(tier);
            
            const slot = document.createElement('div');
            slot.className = 'egg-slot';
            slot.style.borderColor = tierConfig.color;
            slot.innerHTML = `
                <div class="egg-icon" style="background:${tierConfig.color}">🥚</div>
                <div class="egg-info">
                    <span class="tier-name">${tierConfig.name}</span>
                    <span class="count">×${count}</span>
                </div>
                ${canCombine ? `<button class="combine-btn" onclick="EggUI.combine(${tier})">Combine (${tierConfig.combineCost}→1)</button>` : ''}
            `;
            grid.appendChild(slot);
        }
    }

    combine(tier) {
        const eggInv = this.hero?.components.eggInventory;
        if (eggInv?.combineEggs(tier)) {
            this.refresh();
            if (window.AudioManager) AudioManager.playSFX('sfx_ui_unlock');
        }
    }
}

window.EggUI = new EggUI();
```

### 2. Create MountUI.js

```javascript
/**
 * MountUI - Mount selection and status display
 */
class MountUI {
    constructor() {
        this.container = null;
        this.isOpen = false;
    }

    init(game) {
        this.game = game;
        this.hero = game.hero;
        this.createContainer();
        this.createMountIndicator();
        
        EventBus.on(GameConstants.Events.MOUNT_OBTAINED, () => this.refresh());
        EventBus.on(GameConstants.Events.MOUNT_EQUIPPED, () => this.refreshIndicator());
        EventBus.on(GameConstants.Events.MOUNT_DISMOUNTED, () => this.refreshIndicator());
        
        console.log('[MountUI] Initialized');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'mount-ui';
        this.container.className = 'panel mount-panel hidden';
        this.container.innerHTML = `
            <div class="panel-header">
                <h3>🦖 Mounts</h3>
                <button class="close-btn" onclick="MountUI.close()">×</button>
            </div>
            <div class="mount-grid" id="mount-grid"></div>
        `;
        document.body.appendChild(this.container);
    }

    createMountIndicator() {
        // HUD indicator showing current mount
        this.indicator = document.createElement('div');
        this.indicator.id = 'mount-indicator';
        this.indicator.className = 'mount-indicator hidden';
        this.indicator.innerHTML = '<span class="mount-icon">🦖</span><span class="mount-name">--</span>';
        document.body.appendChild(this.indicator);
    }

    open() {
        this.isOpen = true;
        this.container.classList.remove('hidden');
        this.refresh();
    }

    close() {
        this.isOpen = false;
        this.container.classList.add('hidden');
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    refresh() {
        if (!this.isOpen) return;
        
        const mountInv = this.hero?.components.mountInventory;
        if (!mountInv) return;
        
        const grid = this.container.querySelector('#mount-grid');
        grid.innerHTML = '';
        
        const mounts = mountInv.getAllMounts();
        const activeId = mountInv.getActiveMount()?.instanceId;
        
        for (const mount of mounts) {
            const isActive = mount.instanceId === activeId;
            const slot = document.createElement('div');
            slot.className = `mount-slot ${isActive ? 'active' : ''}`;
            slot.innerHTML = `
                <div class="mount-icon">🦖</div>
                <div class="mount-info">
                    <span class="mount-name">${mount.name}</span>
                    <span class="mount-tier">T${mount.tier}</span>
                    <span class="mount-perks">${mount.perks.join(', ')}</span>
                </div>
                <button class="equip-btn" onclick="MountUI.equip('${mount.instanceId}')">
                    ${isActive ? 'Dismount' : 'Mount'}
                </button>
            `;
            grid.appendChild(slot);
        }
        
        if (mounts.length === 0) {
            grid.innerHTML = '<div class="empty-msg">No mounts yet. Hatch some eggs!</div>';
        }
    }

    refreshIndicator() {
        const mount = this.hero?.components.mountInventory?.getActiveMount();
        if (mount) {
            this.indicator.classList.remove('hidden');
            this.indicator.querySelector('.mount-name').textContent = mount.name;
        } else {
            this.indicator.classList.add('hidden');
        }
    }

    equip(instanceId) {
        const mountInv = this.hero?.components.mountInventory;
        if (!mountInv) return;
        
        const currentId = mountInv.getActiveMount()?.instanceId;
        if (currentId === instanceId) {
            mountInv.dismount();
        } else {
            mountInv.equipMount(instanceId);
        }
        this.refresh();
    }
}

window.MountUI = new MountUI();
```

### 3. Create HatcheryUI.js

```javascript
/**
 * HatcheryUI - Hatchery building interaction panel
 */
class HatcheryUI {
    constructor() {
        this.container = null;
        this.hatchery = null;
    }

    init(game) {
        this.game = game;
        this.hero = game.hero;
        this.createContainer();
        
        EventBus.on(GameConstants.Events.HATCHERY_OPENED, (data) => this.open(data.building));
        EventBus.on(GameConstants.Events.EGG_HATCHED, () => this.refresh());
        
        console.log('[HatcheryUI] Initialized');
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'hatchery-ui';
        this.container.className = 'panel hatchery-panel hidden';
        this.container.innerHTML = `
            <div class="panel-header">
                <h3>🏠 Dino Hatchery</h3>
                <button class="close-btn" onclick="HatcheryUI.close()">×</button>
            </div>
            <div class="hatchery-content" id="hatchery-content"></div>
        `;
        document.body.appendChild(this.container);
    }

    open(hatchery) {
        this.hatchery = hatchery;
        this.container.classList.remove('hidden');
        this.refresh();
    }

    close() {
        this.container.classList.add('hidden');
        this.hatchery = null;
    }

    refresh() {
        if (!this.hatchery) return;
        
        const content = this.container.querySelector('#hatchery-content');
        const eggInv = this.hero?.components.eggInventory;
        
        // Incubation Section
        let incubationHTML = '<div class="section"><h4>Incubation</h4>';
        if (this.hatchery.incubatingEgg) {
            const tier = this.hatchery.incubatingEgg.tier;
            const timeLeft = Math.ceil(this.hatchery.incubationTimer);
            incubationHTML += `
                <div class="incubating">
                    <span>Hatching T${tier} Egg...</span>
                    <span class="timer">${timeLeft}s remaining</span>
                </div>
            `;
        } else {
            incubationHTML += '<div class="egg-select">';
            for (let tier = 1; tier <= 5; tier++) {
                const count = eggInv?.getEggCount(tier) || 0;
                if (count > 0) {
                    incubationHTML += `
                        <button onclick="HatcheryUI.incubate(${tier})">
                            Hatch T${tier} Egg (${count})
                        </button>
                    `;
                }
            }
            incubationHTML += '</div>';
        }
        incubationHTML += '</div>';
        
        // Breeding Section
        let breedingHTML = '<div class="section"><h4>Breeding</h4>';
        breedingHTML += `<p>Store mounts here to generate eggs over time.</p>`;
        breedingHTML += `<p>Slots: ${this.hatchery.storedMounts.length}/2</p>`;
        breedingHTML += '</div>';
        
        content.innerHTML = incubationHTML + breedingHTML;
    }

    incubate(tier) {
        if (this.hatchery?.startIncubation(tier, this.hero)) {
            this.refresh();
            if (window.AudioManager) AudioManager.playSFX('sfx_ui_click');
        }
    }
}

window.HatcheryUI = new HatcheryUI();
```

### 4. Add CSS Styles

Add to `css/ui-hud.css` or create new `css/mounts.css`:

```css
/* Egg/Mount Panels */
.egg-panel, .mount-panel, .hatchery-panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    max-height: 80vh;
    background: var(--color-metal-dark);
    border: 2px solid var(--color-accent-bronze);
    z-index: 1000;
}

.panel.hidden { display: none; }

.panel-header {
    display: flex;
    justify-content: space-between;
    padding: var(--space-sm);
    background: var(--color-metal-mid);
    border-bottom: 1px solid var(--color-accent-iron);
}

.egg-grid, .mount-grid {
    display: grid;
    gap: var(--space-sm);
    padding: var(--space-md);
}

.egg-slot, .mount-slot {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm);
    background: var(--color-mud);
    border: 2px solid var(--color-accent-iron);
}

.mount-slot.active {
    border-color: var(--color-accent-gold);
    background: rgba(201, 168, 108, 0.2);
}

.mount-indicator {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    padding: var(--space-xs) var(--space-sm);
    border-radius: 4px;
    color: var(--color-text-gold);
}
```

## Integration Checklist
**CRITICAL: These steps MUST be completed for the feature to work!**

- [ ] **index.html**: Add scripts for `EggUI.js`, `MountUI.js`, `HatcheryUI.js`
- [ ] **index.html or css**: Add mount CSS styles
- [ ] **SystemConfig.js**: Register UI systems with `{ global: 'EggUI', priority: 90, init: true }`
- [ ] **Keybinds**: Add 'E' for eggs, 'J' for mounts (or use footer buttons)
- [ ] **Verify**: Open egg panel, combine eggs, see mount indicator

## Acceptance Criteria
- [ ] Egg panel shows all tiers with counts
- [ ] Combine button appears when 3+ eggs of same tier
- [ ] Mount panel lists all owned mounts
- [ ] Equip/dismount buttons work
- [ ] Mount indicator shows on HUD when mounted
- [ ] Hatchery UI opens on building interact
- [ ] Incubation progress displays

## Notes
- UI follows existing panel patterns (see InventoryUI)
- Colors from variables.css theme
- Simple DOM-based UI, not canvas
- Keybinds TBD (E for eggs, J for mounts, or footer buttons)
