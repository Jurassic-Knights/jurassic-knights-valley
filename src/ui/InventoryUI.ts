/**
 * InventoryPanel - Fullscreen inventory management screen
 *
 * Reuses equipment-screen CSS classes for consistency.
 * Layout matches EquipmentUI: header, tabs (sub-filters), grid, footer (categories).
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { AssetLoader } from '@core/AssetLoader';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import { EntityRegistry } from '@entities/EntityLoader';
import { GameInstance } from '@core/Game';
import { WeaponWheelInstance } from './WeaponWheel';
import type { Hero } from '../gameplay/Hero';
import { IFooterConfig } from '../types/ui';
import type { EntityConfig } from '../types/core';
import {
    swapToInventoryMode,
    restoreFooterButtons,
    updateFooterActiveStates
} from './InventoryUIFooter';

// Define FullscreenUI interface to match UIManager expectation
interface FullscreenUI {
    registerFullscreenUI?: (ui: unknown) => void;
    closeOtherFullscreenUIs?: (ui: unknown) => void;
}

class InventoryPanel {
    // Property declarations
    isOpen: boolean = false;
    container: HTMLDivElement | null = null;
    activeCategory: string = 'all';
    activeType: string = 'all';
    originalFooterConfigs: IFooterConfig | null = null;
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
        /* No-op: already initialized in constructor */
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
        const uiMgr = Registry?.get('UIManager') as FullscreenUI | undefined;
        if (uiMgr && uiMgr.registerFullscreenUI) {
            uiMgr.registerFullscreenUI(this);
        }

        // Listen for inventory updates
        if (EventBus) {
            EventBus.on('INVENTORY_UPDATED', () => {
                if (this.isOpen) this._render();
            });
            if (GameConstants?.Events) {
                EventBus.on(
                    GameConstants.Events.UI_LAYOUT_CHANGED,
                    (data: { format?: string } | null) => {
                        const format = data?.format ?? 'desktop';
                        this.setGridSize(format === 'mobile' ? 3 : 5);
                        this._render();
                    }
                );
            }
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

    _handleClick(e: MouseEvent) {
        const target = e.target;

        // Close or Back button
        if (
            (target as HTMLElement).closest('.equip-close') ||
            (target as HTMLElement).closest('#inv-back')
        ) {
            this.close();
            return;
        }

        const catBtn = (target as HTMLElement).closest('.action-btn[data-category]');
        if (catBtn && (catBtn as HTMLElement).dataset.category) {
            this.activeCategory = (catBtn as HTMLElement).dataset.category!;
            this.activeType = 'all';
            this._render();
            return;
        }

        // Type filter buttons (tabs)
        const typeBtn = (target as HTMLElement).closest('.btn-filter[data-type]');
        if (typeBtn && (typeBtn as HTMLElement).dataset.type) {
            this.activeType = (typeBtn as HTMLElement).dataset.type!;
            this._render();
            return;
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // Safety: Force close filter wheel overlay
        WeaponWheelInstance.close();

        // Close other fullscreen UIs first
        const uiMgr = Registry?.get('UIManager') as FullscreenUI | undefined;
        if (uiMgr && uiMgr.closeOtherFullscreenUIs) {
            uiMgr.closeOtherFullscreenUIs(this);
        }

        this.originalFooterConfigs = swapToInventoryMode(
            {
                onCategoryChange: (cat) => {
                    this.activeCategory = cat;
                    this.activeType = 'all';
                    this._render();
                    updateFooterActiveStates(this.activeCategory);
                },
                onTypeSelected: (type) => {
                    this.activeType = type;
                    this._render();
                },
                onClose: () => this.close(),
                getActiveCategory: () => this.activeCategory,
                getSubTypes: (c) => this.getSubTypes(c),
                getAllSubTypes: () => this.getAllSubTypes()
            },
            this.originalFooterConfigs
        );

        this.isOpen = true;
        this._render();
        if (this.container) this.container.style.display = 'flex';
        Logger.info('[InventoryPanel] Opened');
    }

    close() {
        this.isOpen = false;
        if (this.container) this.container.style.display = 'none';

        restoreFooterButtons(this.originalFooterConfigs);
        this.originalFooterConfigs = null;

        Logger.info('[InventoryPanel] Closed');
    }

    /**
     * Get unique sub-types from EntityRegistry for a category
     */
    getSubTypes(category: string): string[] {
        const items = EntityRegistry?.items as Record<string, EntityConfig>;
        const resources = EntityRegistry?.resources as Record<string, EntityConfig>;

        const registry = category === 'items' ? items : resources;
        if (!registry) return [];

        const types = new Set<string>();
        for (const id in registry) {
            const entry = registry[id];
            if (entry?.sourceFile) {
                types.add(entry.sourceFile as string);
            }
        }
        return Array.from(types).sort();
    }

    /**
     * Get all sub-types across both items and resources
     */
    getAllSubTypes() {
        return [
            ...new Set([...this.getSubTypes('items'), ...this.getSubTypes('resources')])
        ].sort();
    }

    /**
     * Get entity info from EntityRegistry
     */
    getEntityInfo(key: string): (EntityConfig & { category: string }) | null {
        const resReg = EntityRegistry?.resources as Record<string, EntityConfig> | undefined;
        const itemReg = EntityRegistry?.items as Record<string, EntityConfig> | undefined;

        if (resReg?.[key]) {
            return { ...resReg[key], category: 'resources' };
        } else if (itemReg?.[key]) {
            return { ...itemReg[key], category: 'items' };
        }
        return null;
    }

    /**
     * Check if item passes current filters
     */
    passesFilter(key: string) {
        const entity = this.getEntityInfo(key) as { category?: string; sourceFile?: string } | null;
        if (!entity) return true;
        if (this.activeCategory !== 'all' && entity.category !== this.activeCategory) return false;
        if (this.activeType !== 'all' && entity.sourceFile !== this.activeType) return false;
        return true;
    }

    /**
     * Render the fullscreen inventory panel
     * Uses equipment-screen CSS classes for consistent styling
     */
    _render() {
        const hero = GameInstance?.hero as Hero | undefined;
        const inventory = (hero?.inventory || {}) as Record<string, number>;
        const items = Object.entries(inventory).filter(([, v]) => (v as number) > 0);

        // Filter items
        const filteredItems = items.filter(([key]) => this.passesFilter(key));

        // Render Container
        if (this.container) {
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
                                              const entity = this.getEntityInfo(key) as {
                                                  name?: string;
                                              } | null;
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
                </div>
            `;

            // Load icons
            this._loadIcons();
        }
    }

    /**
     * Load icons using AssetLoader
     */
    _loadIcons() {
        this.container?.querySelectorAll('[data-icon-id]').forEach((el) => {
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

    render() {
        this._render();
    }
}

// Create singleton and export
const InventoryUI = new InventoryPanel();
if (Registry) Registry.register('InventoryUI', InventoryUI);

export { InventoryPanel, InventoryUI };
