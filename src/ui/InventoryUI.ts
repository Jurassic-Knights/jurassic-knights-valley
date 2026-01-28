/**
 * InventoryPanel - Fullscreen inventory management screen
 *
 * Reuses equipment-screen CSS classes for consistency.
 * Layout matches EquipmentUI: header, tabs (sub-filters), grid, footer (categories).
 */

import { Logger } from '@core/Logger';
// UIManager accessed via Registry to avoid circular dependency
import { EventBus } from '@core/EventBus';
import { AssetLoader } from '@core/AssetLoader';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import { EntityRegistry } from '@entities/EntityLoader';
import { GameInstance } from '@core/Game';
import { WeaponWheelInstance } from './WeaponWheel';
import { ContextActionUI } from './ContextActionUI';

class InventoryPanel {
    // Property declarations
    isOpen: boolean = false;
    container: HTMLDivElement | null = null;
    activeCategory: string = 'all';
    activeType: string = 'all';
    originalFooterConfigs: any = null;
    gridSize: number = 5;

    constructor() {
        // Defer init until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    /**
     * Public init() for SystemConfig bootloader compatibility.
     * Actual initialization is handled in constructor via _init().
     */
    init() {
        // No-op: already initialized in constructor
    }

    _init() {
        // Bind to inventory button
        const btnInventory = document.getElementById('btn-inventory');
        if (btnInventory) {
            btnInventory.addEventListener('click', () => {
                // Skip if footer is in override mode (equipment/inventory screen has taken over)
                if (btnInventory.dataset.footerOverride) return;
                this.toggle();
            });
            btnInventory.addEventListener(
                'touchstart',
                (e) => {
                    // Skip if footer is in override mode
                    if (btnInventory.dataset.footerOverride) return;
                    e.preventDefault();
                    this.toggle();
                },
                { passive: false }
            );
        }

        // Create container (reuses equipment-screen class for same positioning)
        this._createContainer();

        // Register with UIManager for fullscreen exclusivity
        const uiMgr = Registry?.get('UIManager');
        if (uiMgr && uiMgr.registerFullscreenUI) {
            uiMgr.registerFullscreenUI(this);
        }

        // Listen for inventory updates
        if (EventBus) {
            EventBus.on('INVENTORY_UPDATED', () => {
                if (this.isOpen) this._render();
            });
        }

        Logger.info('[InventoryPanel] Initialized');
    }

    _createContainer() {
        this.container = DOMUtils.create('div', {
            id: 'inventory-screen',
            className: 'equipment-screen',
            styles: { display: 'none' }
        }) as HTMLDivElement;

        // Event delegation
        this.container.addEventListener('click', (e) => this._handleClick(e));

        // Append to #ui-overlay to constrain to game view
        const uiOverlay = document.getElementById('ui-overlay');
        (uiOverlay || document.body).appendChild(this.container);
    }

    _handleClick(e) {
        const target = e.target;

        // Close or Back button
        if (target.closest('.equip-close') || target.closest('#inv-back')) {
            this.close();
            return;
        }

        // Category buttons (footer)
        const catBtn = target.closest('.action-btn[data-category]');
        if (catBtn?.dataset.category) {
            this.activeCategory = catBtn.dataset.category;
            this.activeType = 'all';
            this._render();
            return;
        }

        // Type filter buttons (tabs)
        const typeBtn = target.closest('.btn-filter[data-type]');
        if (typeBtn?.dataset.type) {
            this.activeType = typeBtn.dataset.type;
            this._render();
            return;
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        // Safety: Force close filter wheel overlay
        WeaponWheelInstance.close();

        // Close other fullscreen UIs first
        const uiMgr = Registry?.get('UIManager');
        if (uiMgr && uiMgr.closeOtherFullscreenUIs) {
            uiMgr.closeOtherFullscreenUIs(this);
        }

        // Swap footer buttons to inventory mode
        this._swapFooterToInventoryMode();

        this.isOpen = true;
        this._render();
        this.container.style.display = 'flex';
        Logger.info('[InventoryPanel] Opened');
    }

    close() {
        this.isOpen = false;
        this.container.style.display = 'none';

        // Restore original footer buttons
        this._restoreFooterButtons();

        Logger.info('[InventoryPanel] Closed');
    }

    /**
     * Swap footer buttons to inventory mode
     * ALL | ITEMS | (center disabled) | RESOURCES | BACK
     */
    _swapFooterToInventoryMode() {
        // Suspend context actions (Rest, Forge, etc.)
        if (ContextActionUI) ContextActionUI.suspend();

        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');
        const btnMagnet = document.getElementById('btn-magnet');
        const btnContext = document.getElementById('btn-context-action');

        // Save original configs if not already saved
        if (!this.originalFooterConfigs) {
            this.originalFooterConfigs = {
                inventory: {
                    label: btnInventory?.querySelector('.btn-label')?.textContent,
                    iconId: (btnInventory?.querySelector('.btn-icon') as HTMLElement)?.dataset
                        ?.iconId
                },
                equip: {
                    label: btnEquip?.querySelector('.btn-label')?.textContent,
                    iconId: (btnEquip?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
                },
                map: {
                    label: btnMap?.querySelector('.btn-label')?.textContent,
                    iconId: (btnMap?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
                },
                magnet: {
                    label: btnMagnet?.querySelector('.btn-label')?.textContent,
                    iconId: (btnMagnet?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
                }
            };
        }

        // Swap to ALL button
        if (btnInventory) {
            btnInventory.dataset.footerOverride = 'inventory';
            const label = btnInventory.querySelector('.btn-label');
            const icon = btnInventory.querySelector('.btn-icon');
            if (label) label.textContent = 'ALL';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_inventory';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_inventory') || ''}')`;
            }
            btnInventory.classList.toggle('active', this.activeCategory === 'all');
            btnInventory.onclick = () => {
                this.activeCategory = 'all';
                this.activeType = 'all';
                this._render();
                this._updateFooterActiveStates();
            };
        }

        // Swap to ITEMS button
        if (btnEquip) {
            btnEquip.dataset.footerOverride = 'inventory';
            const label = btnEquip.querySelector('.btn-label');
            const icon = btnEquip.querySelector('.btn-icon');
            if (label) label.textContent = 'ITEMS';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_crafting';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_crafting') || ''}')`;
            }
            btnEquip.classList.toggle('active', this.activeCategory === 'items');
            btnEquip.onclick = () => {
                this.activeCategory = 'items';
                this.activeType = 'all';
                this._render();
                this._updateFooterActiveStates();
            };
        }

        // Swap to RESOURCES button
        if (btnMap) {
            btnMap.dataset.footerOverride = 'inventory';
            const label = btnMap.querySelector('.btn-label');
            const icon = btnMap.querySelector('.btn-icon');
            if (label) label.textContent = 'RES';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_resources';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_resources') || ''}')`;
            }
            btnMap.classList.toggle('active', this.activeCategory === 'resources');
            btnMap.onclick = () => {
                this.activeCategory = 'resources';
                this.activeType = 'all';
                this._render();
                this._updateFooterActiveStates();
            };
        }

        // Swap to BACK button
        if (btnMagnet) {
            btnMagnet.dataset.footerOverride = 'inventory';
            const label = btnMagnet.querySelector('.btn-label');
            const icon = btnMagnet.querySelector('.btn-icon');
            if (label) label.textContent = 'BACK';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_close';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_close') || ''}')`;
            }
            btnMagnet.classList.remove('active');
            btnMagnet.onclick = () => this.close();
        }

        // Context Button -> Filter Trigger
        if (btnContext) {
            btnContext.classList.remove('inactive');
            btnContext.dataset.footerOverride = 'inventory';

            const label =
                btnContext.querySelector('.btn-label') ||
                btnContext.querySelector('#context-label');
            const icon =
                btnContext.querySelector('.btn-icon') || btnContext.querySelector('#context-icon');

            if (label) label.textContent = 'FILTER';
            if (icon) {
                const path = AssetLoader.getImagePath('ui_icon_settings');
                if (path) {
                    (icon as HTMLElement).style.backgroundImage = `url('${path}')`;
                    (icon as HTMLElement).style.backgroundSize = 'contain';
                }
            }

            btnContext.onclick = () => {
                const subTypes =
                    this.activeCategory === 'all'
                        ? this.getAllSubTypes()
                        : this.getSubTypes(this.activeCategory);

                const menuItems = [
                    { id: 'all', label: 'ALL', iconId: 'ui_icon_inventory' },
                    ...subTypes.map((t) => ({
                        id: t as string,
                        label: (t as string).toUpperCase(),
                        iconId: `ui_icon_${t}`
                    }))
                ];

                WeaponWheelInstance.open(
                    menuItems,
                    (path) => {
                        const leaf = path[path.length - 1];
                        this.activeType = leaf.id; // Just take leaf ID
                        this._render();
                    },
                    btnContext
                );
            };
        }

        // Hide weapon swap button while in inventory mode
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = 'none';
    }

    /**
     * Update footer button active states based on selected category
     */
    _updateFooterActiveStates() {
        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');

        btnInventory?.classList.toggle('active', this.activeCategory === 'all');
        btnEquip?.classList.toggle('active', this.activeCategory === 'items');
        btnMap?.classList.toggle('active', this.activeCategory === 'resources');
    }

    /**
     * Restore footer buttons to original state
     */
    _restoreFooterButtons() {
        if (!this.originalFooterConfigs) return;

        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');
        const btnMagnet = document.getElementById('btn-magnet');
        const btnContext = document.getElementById('btn-context-action');

        // Restore all buttons
        if (btnInventory && this.originalFooterConfigs.inventory) {
            delete btnInventory.dataset.footerOverride;
            const label = btnInventory.querySelector('.btn-label');
            const icon = btnInventory.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.inventory.label;
            if (icon && this.originalFooterConfigs.inventory.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.inventory.iconId;
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.inventory.iconId) || ''}')`;
            }
            btnInventory.classList.remove('active');
            btnInventory.onclick = null;
        }

        if (btnEquip && this.originalFooterConfigs.equip) {
            delete btnEquip.dataset.footerOverride;
            const label = btnEquip.querySelector('.btn-label');
            const icon = btnEquip.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.equip.label;
            if (icon && this.originalFooterConfigs.equip.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.equip.iconId;
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.equip.iconId) || ''}')`;
            }
            btnEquip.classList.remove('active');
            btnEquip.onclick = null;
        }

        if (btnMap && this.originalFooterConfigs.map) {
            delete btnMap.dataset.footerOverride;
            const label = btnMap.querySelector('.btn-label');
            const icon = btnMap.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.map.label;
            if (icon && this.originalFooterConfigs.map.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.map.iconId;
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.map.iconId) || ''}')`;
            }
            btnMap.classList.remove('active');
            btnMap.onclick = null;
        }

        if (btnMagnet && this.originalFooterConfigs.magnet) {
            delete btnMagnet.dataset.footerOverride;
            const label = btnMagnet.querySelector('.btn-label');
            const icon = btnMagnet.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.magnet.label;
            if (icon && this.originalFooterConfigs.magnet.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.magnet.iconId;
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.magnet.iconId) || ''}')`;
            }
            btnMagnet.classList.remove('active');
            btnMagnet.onclick = null;
        }

        // Re-enable context button
        if (btnContext) {
            btnContext.classList.remove('inactive');
            btnContext.onclick = null; // CLEAR HANDLER to prevent hijacking InventoryUI
        }

        // Show weapon swap button again
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = '';

        this.originalFooterConfigs = null;

        // Resume context actions
        if (ContextActionUI) ContextActionUI.resume();
    }

    /**
     * Get unique sub-types from EntityRegistry for a category
     */
    getSubTypes(category) {
        const registry = category === 'items' ? EntityRegistry?.items : EntityRegistry?.resources;
        if (!registry) return [];

        const types = new Set();
        for (const id in registry) {
            if (registry[id]?.sourceFile) {
                types.add(registry[id].sourceFile);
            }
        }
        return Array.from(types).sort();
    }

    /**
     * Get all sub-types across both items and resources
     */
    getAllSubTypes() {
        const itemTypes = this.getSubTypes('items');
        const resourceTypes = this.getSubTypes('resources');
        return [...new Set([...itemTypes, ...resourceTypes])].sort();
    }

    /**
     * Get entity info from EntityRegistry
     */
    getEntityInfo(key) {
        if (EntityRegistry?.resources?.[key]) {
            return { ...EntityRegistry.resources[key], category: 'resources' };
        } else if (EntityRegistry?.items?.[key]) {
            return { ...EntityRegistry.items[key], category: 'items' };
        }
        return null;
    }

    /**
     * Check if item passes current filters
     */
    passesFilter(key) {
        const entity = this.getEntityInfo(key);
        if (!entity) return true;

        if (this.activeCategory !== 'all' && entity.category !== this.activeCategory) {
            return false;
        }

        if (this.activeType !== 'all' && entity.sourceFile !== this.activeType) {
            return false;
        }

        return true;
    }

    /**
     * Render the fullscreen inventory panel
     * Uses equipment-screen CSS classes for consistent styling
     */
    _render() {
        const hero = GameInstance?.hero;
        const inventory = hero?.inventory || {};
        const items = Object.entries(inventory).filter(([k, v]) => (v as number) > 0);

        // Get sub-types for current category
        let subTypes: any[] = [];
        if (this.activeCategory === 'all') {
            subTypes = this.getAllSubTypes();
        } else {
            subTypes = this.getSubTypes(this.activeCategory);
        }

        // Filter items
        const filteredItems = items.filter(([key]) => this.passesFilter(key));

        // Count items per category for badges
        const itemCount = items
            .filter(([k]) => this.getEntityInfo(k)?.category === 'items')
            .reduce((a, [, v]) => a + (v as number), 0);
        const resourceCount = items
            .filter(([k]) => this.getEntityInfo(k)?.category === 'resources')
            .reduce((a, [, v]) => a + (v as number), 0);
        const totalCount = items.reduce((a, [, v]) => a + (v as number), 0);

        this.container.innerHTML = `
            <div class="equip-panel">
                <!-- Header -->
                <div class="equip-header" style="justify-content: center; padding: 12px;">
                    <div class="equip-item-name" style="font-size: 14px; margin: 0;">INVENTORY</div>
                </div>

                <!-- Inventory Grid (reuses equip-inventory) -->
                <div class="equip-inventory">
                    <div class="inventory-grid">
                        ${
                            filteredItems.length === 0
                                ? '<div class="empty-inventory">No items match filter</div>'
                                : filteredItems
                                      .map(([key, amount]) => {
                                          const entity = this.getEntityInfo(key);
                                          const name = entity?.name || key;
                                          return `
                                    <div class="inventory-item" data-id="${key}" title="${name}">
                                        <div class="item-icon" data-icon-id="${key}"></div>
                                        <div class="item-count">${amount}</div>
                                    </div>
                                `;
                                      })
                                      .join('')
                        }
                    </div>
                </div>

                <!-- Sub-filter Tabs (at bottom) -->
                <!-- Sub-filter Tabs REMOVED (Moved to Weapon Wheel) -->
                <!-- <div class="equip-tabs" style="display:none;"></div> -->
            </div>
        `;

        // Load icons
        this._loadIcons();
    }

    /**
     * Load icons using AssetLoader
     */
    _loadIcons() {
        this.container.querySelectorAll('[data-icon-id]').forEach((el) => {
            const id = (el as HTMLElement).dataset.iconId;
            const path = AssetLoader?.getImagePath(id);
            if (path) {
                (el as HTMLElement).style.backgroundImage = `url('${path}')`;
                (el as HTMLElement).style.backgroundSize = 'contain';
                (el as HTMLElement).style.backgroundRepeat = 'no-repeat';
                (el as HTMLElement).style.backgroundPosition = 'center';
            }
        });
    }

    /**
     * Set grid size for layout strategies
     */
    setGridSize(size: number) {
        this.gridSize = size;
        if (this.isOpen) this._render();
    }

    /**
     * Public render method for external access
     */
    render() {
        this._render();
    }
}

// Create singleton and export
const InventoryUI = new InventoryPanel();
if (Registry) Registry.register('InventoryUI', InventoryUI);

export { InventoryPanel, InventoryUI };
