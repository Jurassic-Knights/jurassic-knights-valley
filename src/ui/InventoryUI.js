/**
 * InventoryPanel - Manages the Player Inventory
 */
class InventoryPanel extends UIPanel {
    constructor() {
        super('modal-inventory', {
            dockable: true,
            defaultDock: 'ui-hud-right'
        });
        this.gridColumns = 3; // Default
        this.init();
    }

    init() {
        console.log('[InventoryPanel] Initializing...');

        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.bindEvents());
        } else {
            this.bindEvents();
        }
    }

    bindEvents() {
        console.log('[InventoryPanel] Binding events...');

        // Setup Binds
        const btnInventory = document.getElementById('btn-inventory');
        if (btnInventory) {
            const toggleFn = (e) => {
                if (!e) return;
                console.log(`[InventoryPanel] Button Triggered via ${e.type}. Current State: ${this.isOpen}`);

                if (e.type === 'touchstart') {
                    e.preventDefault();
                    this.toggle();
                } else if (e.type === 'click') {
                    // Prevent double-fire if needed, though simple toggle is usually fine handled this way
                    this.toggle();
                }
            };

            // Remove old listeners to be safe
            btnInventory.replaceWith(btnInventory.cloneNode(true));
            const newBtn = document.getElementById('btn-inventory');

            newBtn.addEventListener('click', toggleFn);
            newBtn.addEventListener('touchstart', toggleFn, { passive: false });
            console.log('[InventoryPanel] Button Listeners Attached');
        } else {
            console.error('[InventoryPanel] Button not found!');
        }

        const btnClose = document.getElementById('btn-close-inventory');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.close());
        }

        if (window.EventBus) {
            EventBus.on('INVENTORY_UPDATED', () => {
                if (this.isOpen) this.render();
            });
        }
    }

    /**
     * Override Open to render
     */
    onOpen() {
        this.render();
    }

    /**
     * Set Grid Size for Layouts
     */
    setGridSize(cols) {
        this.gridColumns = cols;
        const grid = document.getElementById('inventory-grid');
        if (grid) {
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        }
    }

    /**
     * Render items
     */
    render() {
        const grid = document.getElementById('inventory-grid');
        if (!grid) return;

        grid.innerHTML = '';
        const hero = window.GameInstance?.hero;
        if (!hero || !hero.inventory) {
            grid.innerHTML = '<div style="color:white; padding:10px;">No inventory data.</div>';
            return;
        }

        const items = Object.entries(hero.inventory);
        if (items.length === 0) {
            grid.innerHTML = '<div style="color:#aaa; grid-column: 1/-1; text-align:center; padding: 20px;">Inventory Empty</div>';
            return;
        }

        for (const [key, amount] of items) {
            if (amount <= 0) continue;

            const slot = document.createElement('div');
            slot.className = 'inventory-slot';

            let name = key;
            if (window.EntityRegistry?.resources?.[key]) {
                name = EntityRegistry.resources[key].name;
            } else if (window.Resource && Resource.TYPES && Resource.TYPES[key]) {
                name = Resource.TYPES[key].name;
            }

            const iconId = `drop_${key}`;
            const iconPath = window.AssetLoader ? AssetLoader.getImagePath(iconId) : null;
            const bgStyle = iconPath
                ? `background-image: url('${iconPath}'); background-size: contain; background-repeat: no-repeat; background-position: center;`
                : `background-color: #333;`;

            slot.innerHTML = `
                <div class="inv-count">${amount}</div>
                <div class="inv-icon" style="${bgStyle}"></div>
                <div class="inv-name">${name}</div>
            `;
            grid.appendChild(slot);
        }
    }
}

// Preserve global access for legacy calls
window.InventoryUI = new InventoryPanel();
if (window.Registry) Registry.register('InventoryUI', window.InventoryUI);
