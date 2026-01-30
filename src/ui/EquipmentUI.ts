/**
 * EquipmentUI - Fullscreen equipment management screen (Core)
 *
 * Delegates to:
 * - EquipmentUIRenderer: All HTML/template rendering
 * - EquipmentSlotManager: Equip/unequip/slot logic
 *
 * Owner: UI Engineer
 */

import { GameConstants, getConfig } from '@data/GameConstants';
import { Logger } from '@core/Logger';
import { EquipmentSlotManager } from './EquipmentSlotManager';
import { EventBus } from '@core/EventBus';
import { EntityLoader } from '@entities/EntityLoader';
import { EquipmentUIRenderer } from './EquipmentUIRenderer';
import { AssetLoader } from '@core/AssetLoader';
import { HeroRenderer } from '../rendering/HeroRenderer';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import { WeaponWheelInstance } from './WeaponWheel';
import { ContextActionUI } from './ContextActionUI';
import { GameInstance } from '@core/Game';
import { EntityRegistry } from '@entities/EntityLoader';
import { HeroSkinSelector } from './HeroSkinSelector';
import type { EquipmentItem } from '../types/ui';

class EquipmentUI {
    // Property declarations
    isOpen: boolean;
    selectedMode: string;
    selectedCategory: string;
    selectedItem: EquipmentItem | null;
    container: HTMLElement | null;
    cachedEquipment: EquipmentItem[];
    lastClickedItemId: string | null;
    lastClickTime: number;
    slotSelectionMode: boolean;
    pendingEquipItem: EquipmentItem | null;
    targetEquipSet: number;
    originalFooterConfigs: any = null;
    slots: string[];
    toolSlots: string[];
    modeCategories: Record<string, { id: string; label: string }[]>;

    constructor() {
        this.isOpen = false;
        this.selectedMode = 'armor'; // armor, weapon, tool
        this.selectedCategory = 'all';
        this.selectedItem = null;
        this.container = null;
        this.cachedEquipment = [];

        // Double-click detection (manual because DOM rebuilds break native dblclick)
        this.lastClickedItemId = null;
        this.lastClickTime = 0;

        // Slot selection mode (when both weapon slots are full)
        this.slotSelectionMode = false;
        this.pendingEquipItem = null;

        // Target weapon set for equipping (1 or 2)
        this.targetEquipSet = 1;

        // Original footer button configs (saved on open, restored on close)
        this.originalFooterConfigs = null;

        // Use centralized slot definitions from GameConstants
        const equipCfg = (GameConstants as any)?.Equipment || {};
        this.slots = equipCfg.ALL_SLOTS || [
            'head',
            'body',
            'hands',
            'legs',
            'accessory',
            'hand1',
            'hand2',
            'accessory2'
        ];
        this.toolSlots = equipCfg.TOOL_SLOTS || [
            'tool_mining',
            'tool_woodcutting',
            'tool_harvesting',
            'tool_fishing'
        ];

        // Mode-specific category filters
        this.modeCategories = {
            armor: [
                { id: 'all', label: 'ALL' },
                { id: 'head', label: 'HEAD' },
                { id: 'body', label: 'BODY' },
                { id: 'hands', label: 'HANDS' },
                { id: 'legs', label: 'LEGS' },
                { id: 'accessory', label: 'ACCESSORY' }
            ],
            weapon: [
                { id: 'all', label: 'ALL' },
                { id: 'melee', label: 'MELEE' },
                { id: 'ranged', label: 'RANGED' },
                { id: 'shield', label: 'SHIELD' },
                { id: '1-hand', label: '1-HAND' },
                { id: '2-hand', label: '2-HAND' }
            ],
            tool: [
                { id: 'all', label: 'ALL' },
                { id: 'mining', label: '?? MINING' },
                { id: 'woodcutting', label: '?? WOODCUT' },
                { id: 'harvesting', label: '?? HARVEST' },
                { id: 'fishing', label: '?? FISHING' }
            ]
        };

        // Defer init until DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        // Bind to EQUIP button
        const btnEquip = document.getElementById('btn-equip');
        if (btnEquip) {
            btnEquip.addEventListener('click', () => {
                // Skip if footer is in override mode (equipment/inventory screen has taken over)
                if (btnEquip.dataset.footerOverride) return;
                this.toggle();
            });
        }

        // Create container
        this._createContainer();

        // Register with UIManager for fullscreen exclusivity
        const uiMgr = Registry.get('UIManager');
        if (uiMgr && uiMgr.registerFullscreenUI) {
            uiMgr.registerFullscreenUI(this);
            Logger.info('[EquipmentUI] Registered with UIManager');
        } else {
            Logger.error('[EquipmentUI] Failed to register with UIManager');
        }

        Logger.info('[EquipmentUI] Initialized');
    }

    _createContainer() {
        this.container = DOMUtils.create('div', {
            id: 'equipment-screen',
            className: 'equipment-screen',
            styles: { display: 'none' }
        });

        // Event delegation handlers
        this.container.addEventListener('click', (e) => this._handleClick(e));
        this.container.addEventListener('dblclick', (e) => this._handleDoubleClick(e));

        // Append to #ui-overlay to constrain to game view
        const uiOverlay = document.getElementById('ui-overlay');
        (uiOverlay || document.body).appendChild(this.container);
    }

    // Event delegation - handles ALL clicks in the container
    _handleClick(e: MouseEvent) {
        const target = e.target as HTMLElement;

        // Close button
        if (target.closest('#equip-close') || target.closest('#equip-back')) {
            this.close();
            return;
        }

        // Hero portrait click - open skin selector
        if (target.closest('.equip-character')) {
            HeroSkinSelector.setContainer(this.container);
            HeroSkinSelector.open();
            return;
        }

        // Hero skin selector modal - select skin
        const skinOption = target.closest('.hero-skin-option') as HTMLElement;
        if (skinOption?.dataset.skinId) {
            const charSprite = this.container?.querySelector(
                '.character-sprite'
            ) as HTMLElement | null;
            HeroSkinSelector.selectSkin(skinOption.dataset.skinId, charSprite);
            return;
        }

        // Hero skin selector close
        if (
            target.closest('.hero-skin-modal-close') ||
            target.closest('.hero-skin-modal-backdrop')
        ) {
            HeroSkinSelector.close();
            return;
        }

        // Weapon Wheel Trigger
        if (target.closest('#btn-open-wheel')) {
            const rootCategories = this._getFilterHierarchy();

            WeaponWheelInstance.open(
                rootCategories,
                (path) => {
                    const leaf = path[path.length - 1];
                    if (path.length > 1) {
                        this.selectedCategory = path.map((p) => p.id).join(':');
                    } else {
                        this.selectedCategory = leaf.id;
                    }
                    Logger.info(`[EquipmentUI] Filter selected: ${this.selectedCategory}`);
                    this._loadEquipment();
                    this._render();
                },
                target.closest('#btn-open-wheel') as HTMLElement
            );
            return;
        }

        // Category tabs (fallback or specific buttons)
        const tab = target.closest('.btn-filter') as HTMLElement;
        if (tab?.dataset.category) {
            this.selectedCategory = tab.dataset.category;
            this._render();
            return;
        }

        // Mode buttons (footer)
        const modeBtn = target.closest('.action-btn[data-mode]') as HTMLElement;
        if (modeBtn?.dataset.mode) {
            this.selectedMode = modeBtn.dataset.mode;
            this.selectedCategory = 'all';
            this.selectedItem = null;
            this._loadEquipment();
            this._render();
            return;
        }

        // Weapon set toggle buttons - also sets active weapon set in game
        const setToggle = target.closest('.set-toggle-btn') as HTMLElement;
        if (setToggle?.dataset.targetSet) {
            const targetSet = parseInt(setToggle.dataset.targetSet);
            this.targetEquipSet = targetSet;

            // Also set as active weapon set in the game
            const hero = GameInstance?.hero;
            if (hero?.equipment) {
                hero.equipment.activeWeaponSet = targetSet;
                Logger.info(`[EquipmentUI] Active weapon set changed to Set ${targetSet}`);

                // Emit event for stats update
                if (EventBus) {
                    EventBus.emit('WEAPON_SET_CHANGED', { activeSet: targetSet });
                }
            }

            this._render();
            return;
        }

        // Inventory items - manual double-click detection
        const invItem = target.closest('.inventory-item') as HTMLElement;
        if (invItem?.dataset.id) {
            const itemId = invItem.dataset.id;
            const now = Date.now();
            const DOUBLE_CLICK_THRESHOLD = 400;

            if (
                itemId === this.lastClickedItemId &&
                now - this.lastClickTime < DOUBLE_CLICK_THRESHOLD
            ) {
                // Double-click - EQUIP
                EquipmentSlotManager.equipItem(this, itemId);
                this.lastClickedItemId = null;
                this.lastClickTime = 0;
            } else {
                // First click - SELECT
                this.lastClickedItemId = itemId;
                this.lastClickTime = now;
                this._selectItemNoRender(itemId);
            }
            return;
        }

        // Equipped slots
        const slot = target.closest('.equip-slot') as HTMLElement;
        if (slot?.dataset.slot) {
            const slotId = slot.dataset.slot;

            // Handle slot selection mode first
            if (EquipmentSlotManager.handleSlotSelection(this, slotId)) return;

            const now = Date.now();
            const DOUBLE_CLICK_THRESHOLD = 400;
            const slotKey = `slot_${slotId}`;

            if (
                slotKey === this.lastClickedItemId &&
                now - this.lastClickTime < DOUBLE_CLICK_THRESHOLD
            ) {
                // Double-click - UNEQUIP
                EquipmentSlotManager.unequipSlot(this, slotId);
                this.lastClickedItemId = null;
                this.lastClickTime = 0;
            } else {
                // First click - SELECT
                this.lastClickedItemId = slotKey;
                this.lastClickTime = now;
                this._selectEquippedSlot(slotId);
            }
        }
    }

    _handleDoubleClick(e: MouseEvent) {
        const invItem = (e.target as HTMLElement).closest('.inventory-item');
        if ((invItem as HTMLElement)?.dataset.id) {
            EquipmentSlotManager.equipItem(this, (invItem as HTMLElement).dataset.id!);
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        // Safety: Force close filter wheel overlay if stuck
        WeaponWheelInstance.close();

        // Close other fullscreen UIs first
        const uiMgr = Registry.get('UIManager');
        if (uiMgr && uiMgr.closeOtherFullscreenUIs) {
            uiMgr.closeOtherFullscreenUIs(this);
        }

        // Sync targetEquipSet with hero's active weapon set
        const hero = GameInstance?.hero;
        if (hero?.equipment?.activeWeaponSet) {
            this.targetEquipSet = hero.equipment.activeWeaponSet;
        }

        // Swap footer buttons to equipment mode
        this._swapFooterToEquipmentMode();

        this.isOpen = true;
        this._loadEquipment();
        this._render();
        this.container.style.display = 'flex';
        Logger.info('[EquipmentUI] Opened');
    }

    close() {
        this.isOpen = false;
        this.container.style.display = 'none';

        // Restore original footer buttons
        this._restoreFooterButtons();

        Logger.info('[EquipmentUI] Closed');
    }

    /**
     * Swap footer buttons to equipment mode
     * ARMOR | WEAPON | (center disabled) | TOOL | BACK
     */
    _swapFooterToEquipmentMode() {
        // Suspend context actions
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
                        ?.iconId,
                    onclick: btnInventory?.onclick
                },
                equip: {
                    label: btnEquip?.querySelector('.btn-label')?.textContent,
                    iconId: (btnEquip?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnEquip?.onclick
                },
                map: {
                    label: btnMap?.querySelector('.btn-label')?.textContent,
                    iconId: (btnMap?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnMap?.onclick
                },
                magnet: {
                    label: btnMagnet?.querySelector('.btn-label')?.textContent,
                    iconId: (btnMagnet?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
                    onclick: btnMagnet?.onclick
                }
            };
        }

        // Swap to ARMOR button
        if (btnInventory) {
            btnInventory.dataset.footerOverride = 'equipment'; // Block original handler
            btnInventory.style.zIndex = '10001';
            btnInventory.style.position = 'relative';
            const label = btnInventory.querySelector('.btn-label');
            const icon = btnInventory.querySelector('.btn-icon');
            if (label) label.textContent = 'ARMOR';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_armor';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_armor') || ''}')`;
            }
            btnInventory.classList.toggle('active', this.selectedMode === 'armor');
            btnInventory.onclick = () => {
                Logger.info('[EquipmentUI] Clicked ARMOR');
                this.selectedMode = 'armor';
                this.selectedCategory = 'all';
                this._loadEquipment();
                this._render();
                this._updateFooterActiveStates();
            };
        }

        // Swap to WEAPON button
        if (btnEquip) {
            btnEquip.dataset.footerOverride = 'equipment'; // Block original handler
            btnEquip.style.zIndex = '10001';
            btnEquip.style.position = 'relative';
            const label = btnEquip.querySelector('.btn-label');
            const icon = btnEquip.querySelector('.btn-icon');
            if (label) label.textContent = 'WEAPON';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_weapon';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_weapon') || ''}')`;
            }
            btnEquip.classList.toggle('active', this.selectedMode === 'weapon');
            btnEquip.onclick = () => {
                Logger.info('[EquipmentUI] Clicked WEAPON');
                this.selectedMode = 'weapon';
                this.selectedCategory = 'all';
                this._loadEquipment();
                this._render();
                this._updateFooterActiveStates();
            };
        }

        // Swap to TOOL button
        if (btnMap) {
            btnMap.dataset.footerOverride = 'equipment'; // Block original handler
            btnMap.style.zIndex = '10001';
            btnMap.style.position = 'relative';
            const label = btnMap.querySelector('.btn-label');
            const icon = btnMap.querySelector('.btn-icon');
            if (label) label.textContent = 'TOOL';
            if (icon) {
                (icon as HTMLElement).dataset.iconId = 'ui_icon_pickaxe';
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath('ui_icon_pickaxe') || ''}')`;
            }
            btnMap.classList.toggle('active', this.selectedMode === 'tool');
            btnMap.onclick = () => {
                Logger.info('[EquipmentUI] Clicked TOOL');
                this.selectedMode = 'tool';
                this.selectedCategory = 'all';
                this._loadEquipment();
                this._render();
                this._updateFooterActiveStates();
            };
        }

        // Swap to BACK button
        if (btnMagnet) {
            btnMagnet.dataset.footerOverride = 'equipment'; // Block original handler
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
            btnContext.dataset.footerOverride = 'equipment';

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
                const rootCategories = this._getFilterHierarchy();

                WeaponWheelInstance.open(
                    rootCategories,
                    (path) => {
                        const leaf = path[path.length - 1];
                        if (path.length > 1) {
                            this.selectedCategory = path.map((p) => p.id).join(':');
                        } else {
                            this.selectedCategory = leaf.id;
                        }
                        this._loadEquipment();
                        this._render();
                    },
                    btnContext
                );
            };
        }

        // Hide weapon swap button while in equipment mode
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = 'none';
    }

    /**
     * Get hierarchy filter data based on selected mode
     */
    _getFilterHierarchy() {
        Logger.info(`[EquipmentUI] _getFilterHierarchy: selectedMode=${this.selectedMode}`);
        const rootCategories: any[] = [];

        if (this.selectedMode === 'weapon') {
            rootCategories.push(
                { id: 'all', label: 'ALL', iconId: 'ui_icon_all' },
                {
                    id: '1-hand',
                    label: '1-HAND',
                    iconId: 'ui_icon_1-hand',
                    children: [
                        {
                            id: 'melee',
                            label: 'MELEE',
                            iconId: 'ui_icon_melee',
                            children: [
                                { id: 'sword', label: 'SWORD', iconId: 'ui_icon_sword' },
                                { id: 'axe', label: 'AXE', iconId: 'ui_icon_axe' },
                                { id: 'mace', label: 'MACE', iconId: 'ui_icon_mace' },
                                { id: 'knife', label: 'KNIFE', iconId: 'ui_icon_knife' },
                                { id: 'flail', label: 'FLAIL', iconId: 'ui_icon_flail' },
                                { id: 'shield', label: 'SHIELD', iconId: 'ui_icon_shield' }
                            ]
                        },
                        {
                            id: 'ranged',
                            label: 'RANGED',
                            iconId: 'ui_icon_ranged',
                            children: [
                                { id: 'pistol', label: 'PISTOL', iconId: 'ui_icon_pistol' },
                                {
                                    id: 'submachine_gun',
                                    label: 'SMG',
                                    iconId: 'ui_icon_machine_gun'
                                }
                            ]
                        }
                    ]
                },
                {
                    id: '2-hand',
                    label: '2-HAND',
                    iconId: 'ui_icon_2-hand',
                    children: [
                        {
                            id: 'melee',
                            label: 'MELEE',
                            iconId: 'ui_icon_melee',
                            children: [
                                {
                                    id: 'greatsword',
                                    label: 'GREATSWORD',
                                    iconId: 'ui_icon_greatsword'
                                },
                                { id: 'spear', label: 'SPEAR', iconId: 'ui_icon_spear' },
                                { id: 'war_axe', label: 'WAR AXE', iconId: 'ui_icon_war_axe' },
                                { id: 'war_hammer', label: 'HAMMER', iconId: 'ui_icon_war_hammer' },
                                { id: 'lance', label: 'LANCE', iconId: 'ui_icon_lance' },
                                { id: 'halberd', label: 'HALBERD', iconId: 'ui_icon_halberd' }
                            ]
                        },
                        {
                            id: 'ranged',
                            label: 'RANGED',
                            iconId: 'ui_icon_ranged',
                            children: [
                                { id: 'rifle', label: 'RIFLE', iconId: 'ui_icon_rifle' },
                                { id: 'machine_gun', label: 'MG', iconId: 'ui_icon_machine_gun' },
                                { id: 'shotgun', label: 'SHOTGUN', iconId: 'ui_icon_shotgun' },
                                {
                                    id: 'sniper_rifle',
                                    label: 'SNIPER',
                                    iconId: 'ui_icon_sniper_rifle'
                                },
                                { id: 'bazooka', label: 'BAZOOKA', iconId: 'ui_icon_bazooka' },
                                {
                                    id: 'flamethrower',
                                    label: 'FLAME',
                                    iconId: 'ui_icon_flamethrower'
                                }
                            ]
                        }
                    ]
                }
            );
        } else if (this.selectedMode === 'armor') {
            rootCategories.push(
                { id: 'all', label: 'ALL', iconId: 'ui_icon_all' },
                { id: 'head', label: 'HEAD', iconId: 'ui_icon_helmet' },
                { id: 'body', label: 'BODY', iconId: 'ui_icon_chest' },
                { id: 'hands', label: 'HANDS', iconId: 'ui_icon_gloves' },
                { id: 'legs', label: 'LEGS', iconId: 'ui_icon_legs' },
                { id: 'accessory', label: 'ACC.', iconId: 'ui_icon_accessory' }
            );
        } else {
            // Tools
            rootCategories.push(
                { id: 'all', label: 'ALL', iconId: 'ui_icon_all' },
                { id: 'mining', label: 'MINING', iconId: 'ui_icon_pickaxe' },
                { id: 'woodcutting', label: 'WOOD', iconId: 'ui_icon_wood_axe' },
                { id: 'harvesting', label: 'CROP', iconId: 'ui_icon_harvesting' },
                { id: 'fishing', label: 'FISH', iconId: 'ui_icon_fishing' }
            );
        }
        return rootCategories;
    }

    /**
     * Update footer button active states based on selected mode
     */
    _updateFooterActiveStates() {
        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');

        btnInventory?.classList.toggle('active', this.selectedMode === 'armor');
        btnEquip?.classList.toggle('active', this.selectedMode === 'weapon');
        btnMap?.classList.toggle('active', this.selectedMode === 'tool');
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

        // Restore inventory button
        if (btnInventory && this.originalFooterConfigs.inventory) {
            delete btnInventory.dataset.footerOverride; // Re-enable original handler
            const label = btnInventory.querySelector('.btn-label');
            const icon = btnInventory.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.inventory.label;
            if (icon && this.originalFooterConfigs.inventory.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.inventory.iconId;
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.inventory.iconId) || ''}')`;
            }
            btnInventory.classList.remove('active');
            btnInventory.onclick = null; // Event listener handles it
        }

        // Restore equip button
        if (btnEquip && this.originalFooterConfigs.equip) {
            delete btnEquip.dataset.footerOverride; // Re-enable original handler
            const label = btnEquip.querySelector('.btn-label');
            const icon = btnEquip.querySelector('.btn-icon');
            if (label) label.textContent = this.originalFooterConfigs.equip.label;
            if (icon && this.originalFooterConfigs.equip.iconId) {
                (icon as HTMLElement).dataset.iconId = this.originalFooterConfigs.equip.iconId;
                (icon as HTMLElement).style.backgroundImage =
                    `url('${AssetLoader?.getImagePath(this.originalFooterConfigs.equip.iconId) || ''}')`;
            }
            btnEquip.classList.remove('active');
            btnEquip.onclick = null; // Original toggle() is via addEventListener
        }

        // Restore map button
        if (btnMap && this.originalFooterConfigs.map) {
            delete btnMap.dataset.footerOverride; // Re-enable original handler
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

        // Restore magnet button
        if (btnMagnet && this.originalFooterConfigs.magnet) {
            delete btnMagnet.dataset.footerOverride; // Re-enable original handler
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
            btnContext.onclick = null; // Fix: Clear previous handler to avoid hijacking InventoryUI
        }

        // Show weapon swap button again
        const btnSwap = document.getElementById('btn-weapon-swap');
        if (btnSwap) btnSwap.style.display = '';

        this.originalFooterConfigs = null;

        // Resume context actions
        if (ContextActionUI) ContextActionUI.resume();
    }

    _loadEquipment() {
        const allEquipment = EntityLoader?.getAllEquipment?.() || [];

        // Parse selectedCategory for composite filters
        // NEW FORMAT: "grip:type:subtype" e.g. "1-hand:melee:sword"
        const filterParts = this.selectedCategory?.split(':') || ['all'];
        const grip = filterParts[0]; // 1-hand, 2-hand, or all
        const weaponType = filterParts[1]; // melee, ranged, or undefined
        const subtype = filterParts[2]; // sword, pistol, etc. or undefined

        Logger.info(`[EquipmentUI] Filter: grip=${grip}, type=${weaponType}, subtype=${subtype}`);

        if (this.selectedMode === 'armor') {
            this.cachedEquipment = allEquipment.filter((e) => {
                const catMatch =
                    grip === 'all' ||
                    e.sourceFile === grip ||
                    e.slot === grip ||
                    e.equipSlot === grip;

                return catMatch;
            });
        } else if (this.selectedMode === 'weapon') {
            this.cachedEquipment = allEquipment.filter((e) => {
                // 1. Must be a weapon
                const isWeapon =
                    e.weaponType !== undefined || e.sourceFile === 'weapon' || e.slot === 'weapon';
                if (!isWeapon) return false;

                // 2. Grip Filter (Level 1)
                if (grip !== 'all') {
                    if (e.gripType !== grip) return false;
                }

                // 3. Type Filter (Level 2)
                if (weaponType) {
                    // Special case: Shield counts as melee for filtering purposes
                    const isShieldAsMelee = weaponType === 'melee' && e.weaponType === 'shield';

                    if (!isShieldAsMelee && e.weaponType !== weaponType) return false;
                }

                // 4. Subtype Filter (Level 3)
                if (subtype) {
                    // Match weaponSubtype OR check if ID contains the subtype
                    if (e.weaponSubtype !== subtype && !e.id.includes(subtype)) return false;
                }

                return true;
            });
        } else if (this.selectedMode === 'tool') {
            this.cachedEquipment = allEquipment.filter((e) => {
                const isTool = e.sourceFile === 'tool' || e.slot === 'tool';
                if (!isTool) return false;

                if (grip === 'all') return true;

                // Tool subtypes in ID
                return e.id.includes(grip);
            });
        } else {
            this.cachedEquipment = allEquipment;
        }

        Logger.info(
            `[EquipmentUI] Result: ${this.cachedEquipment.length} items for mode=${this.selectedMode}`
        );
    }

    _render() {
        this.container.innerHTML = EquipmentUIRenderer.renderPanel(this);
        EquipmentUIRenderer.loadIcons(this.container);
    }

    _selectItemNoRender(itemId: string) {
        const item = this.cachedEquipment.find((e) => e.id === itemId);
        this.selectedItem = item || null;

        // Update visual selection without DOM rebuild
        this.container.querySelectorAll('.inventory-item').forEach((el) => {
            el.classList.toggle('selected', (el as HTMLElement).dataset.id === itemId);
        });

        // Update summary bar
        const nameEl = this.container.querySelector('.item-preview-name');
        const statsRow = this.container.querySelector('.item-stats-row');
        if (item && nameEl) {
            nameEl.textContent = item.name;
            if (statsRow) {
                statsRow.innerHTML = EquipmentUIRenderer.renderItemStats(item);
            }
            this.container.querySelector('.equip-summary-bar')?.classList.add('has-item');
            this.container.querySelector('.equip-summary-bar')?.classList.remove('empty');
        }
    }

    _selectItem(itemId: string) {
        const item = this.cachedEquipment.find((e) => e.id === itemId);
        this.selectedItem = item || null;
        this._render();
    }

    _selectEquippedSlot(slotId: string) {
        const hero = GameInstance?.hero;
        const equippedItem = hero?.equipment?.getSlot(slotId);

        if (equippedItem) {
            this.selectedItem = equippedItem;

            // Update slot selection highlight
            this.container.querySelectorAll('.equip-slot').forEach((el) => {
                el.classList.toggle('selected', (el as HTMLElement).dataset.slot === slotId);
            });

            // Clear inventory selections
            this.container.querySelectorAll('.inventory-item').forEach((el) => {
                el.classList.remove('selected');
            });

            // Update summary bar
            const nameEl = this.container.querySelector('.item-preview-name');
            const statsRow = this.container.querySelector('.item-stats-row');
            if (nameEl) {
                nameEl.textContent = equippedItem.name;
                if (statsRow) {
                    statsRow.innerHTML = EquipmentUIRenderer.renderItemStats(equippedItem);
                }
                this.container.querySelector('.equip-summary-bar')?.classList.add('has-item');
                this.container.querySelector('.equip-summary-bar')?.classList.remove('empty');
            }
        }
    }
}

// Create singleton instance
const equipmentUIInstance = new EquipmentUI();
if (Registry) Registry.register('EquipmentUI', equipmentUIInstance);

// ES6 Module Export
export { EquipmentUI, equipmentUIInstance };
