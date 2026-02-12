/**
 * EquipmentUI - Fullscreen equipment management screen (Core)
 *
 * Delegates to:
 * - EquipmentUIRenderer: All HTML/template rendering
 * - EquipmentSlotManager: Equip/unequip/slot logic
 * - EquipmentUIFilterConfig: Filter hierarchy
 * - EquipmentUIFooter: Footer swap/restore
 * - EquipmentUIClickHandler: Event delegation
 */
import { GameConstants } from '@data/GameConstants';
import { Logger } from '@core/Logger';
import { EquipmentSlotManager } from './EquipmentSlotManager';
import { EntityLoader } from '@entities/EntityLoader';
import { EquipmentUIRenderer } from './EquipmentUIRenderer';
import { Registry } from '@core/Registry';
import { DOMUtils } from '@core/DOMUtils';
import { GameInstance } from '@core/Game';
import { HeroSkinSelector } from './HeroSkinSelector';
import { MODE_CATEGORIES } from './EquipmentUIFilterConfig';
import { getFilterHierarchy } from './EquipmentUIFilterConfig';
import { WeaponWheelInstance } from './WeaponWheel';
import { swapFooterToEquipmentMode, restoreFooterButtons } from './EquipmentUIFooter';
import { handleEquipmentUIClick } from './EquipmentUIClickHandler';
import type { EquipmentItem, IFooterConfig } from '../types/ui';

export interface FilterCategory {
    id: string;
    label: string;
    iconId?: string;
    children?: FilterCategory[];
}

class EquipmentUI {
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
    originalFooterConfigs: IFooterConfig | null = null;
    slots: string[];
    toolSlots: string[];
    modeCategories: Record<string, FilterCategory[]>;

    constructor() {
        this.isOpen = false;
        this.selectedMode = 'armor';
        this.selectedCategory = 'all';
        this.selectedItem = null;
        this.container = null;
        this.cachedEquipment = [];
        this.lastClickedItemId = null;
        this.lastClickTime = 0;
        this.slotSelectionMode = false;
        this.pendingEquipItem = null;
        this.targetEquipSet = 1;
        this.originalFooterConfigs = null;

        const equipCfg = GameConstants?.Equipment || { ALL_SLOTS: undefined, TOOL_SLOTS: undefined };
        this.slots = equipCfg.ALL_SLOTS || ['head', 'body', 'hands', 'legs', 'accessory', 'hand1', 'hand2', 'accessory2'];
        this.toolSlots = equipCfg.TOOL_SLOTS || ['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing'];
        this.modeCategories = MODE_CATEGORIES;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._init());
        } else {
            this._init();
        }
    }

    _init() {
        const btnEquip = document.getElementById('btn-equip');
        if (btnEquip) {
            btnEquip.addEventListener('click', () => {
                if (btnEquip.dataset.footerOverride) return;
                this.toggle();
            });
        }

        this._createContainer();

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

        this.container.addEventListener('click', (e) => handleEquipmentUIClick(this, e));
        this.container.addEventListener('dblclick', (e) => {
            const invItem = (e.target as HTMLElement).closest('.inventory-item');
            if ((invItem as HTMLElement)?.dataset.id) {
                EquipmentSlotManager.equipItem(this, (invItem as HTMLElement).dataset.id!);
            }
        });

        const uiOverlay = document.getElementById('ui-overlay');
        (uiOverlay || document.body).appendChild(this.container);
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        WeaponWheelInstance.close();

        const uiMgr = Registry.get('UIManager');
        if (uiMgr && uiMgr.closeOtherFullscreenUIs) {
            uiMgr.closeOtherFullscreenUIs(this);
        }

        const hero = GameInstance?.hero;
        if (hero?.equipment?.activeWeaponSet) {
            this.targetEquipSet = hero.equipment.activeWeaponSet;
        }

        swapFooterToEquipmentMode(this);
        this.isOpen = true;
        this._loadEquipment();
        this._render();
        this.container!.style.display = 'flex';
        Logger.info('[EquipmentUI] Opened');
    }

    close() {
        this.isOpen = false;
        this.container!.style.display = 'none';
        restoreFooterButtons(this);
        Logger.info('[EquipmentUI] Closed');
    }

    _getFilterHierarchy(): FilterCategory[] {
        return getFilterHierarchy(this.selectedMode);
    }

    _updateFooterActiveStates() {
        const btnInventory = document.getElementById('btn-inventory');
        const btnEquip = document.getElementById('btn-equip');
        const btnMap = document.getElementById('btn-map');
        btnInventory?.classList.toggle('active', this.selectedMode === 'armor');
        btnEquip?.classList.toggle('active', this.selectedMode === 'weapon');
        btnMap?.classList.toggle('active', this.selectedMode === 'tool');
    }

    _loadEquipment() {
        const allEquipment = EntityLoader?.getAllEquipment?.() || [];
        const filterParts = this.selectedCategory?.split(':') || ['all'];
        const grip = filterParts[0];
        const weaponType = filterParts[1];
        const subtype = filterParts[2];

        if (this.selectedMode === 'armor') {
            this.cachedEquipment = allEquipment.filter((e) =>
                grip === 'all' || e.sourceFile === grip || e.slot === grip || e.equipSlot === grip
            );
        } else if (this.selectedMode === 'weapon') {
            this.cachedEquipment = allEquipment.filter((e) => {
                const isWeapon = e.weaponType !== undefined || e.sourceFile === 'weapon' || e.slot === 'weapon';
                if (!isWeapon) return false;
                if (grip !== 'all' && e.gripType !== grip) return false;
                if (weaponType) {
                    const isShieldAsMelee = weaponType === 'melee' && e.weaponType === 'shield';
                    if (!isShieldAsMelee && e.weaponType !== weaponType) return false;
                }
                if (subtype && e.weaponSubtype !== subtype && !e.id.includes(subtype)) return false;
                return true;
            });
        } else if (this.selectedMode === 'tool') {
            this.cachedEquipment = allEquipment.filter((e) => {
                const isTool = e.sourceFile === 'tool' || e.slot === 'tool';
                if (!isTool) return false;
                return grip === 'all' || e.id.includes(grip);
            });
        } else {
            this.cachedEquipment = allEquipment;
        }
    }

    _render() {
        this.container!.innerHTML = EquipmentUIRenderer.renderPanel(this);
        EquipmentUIRenderer.loadIcons(this.container!);
    }

    _selectItemNoRender(itemId: string) {
        const item = this.cachedEquipment.find((e) => e.id === itemId);
        this.selectedItem = item || null;

        this.container!.querySelectorAll('.inventory-item').forEach((el) => {
            el.classList.toggle('selected', (el as HTMLElement).dataset.id === itemId);
        });

        const nameEl = this.container!.querySelector('.item-preview-name');
        const statsRow = this.container!.querySelector('.item-stats-row');
        if (item && nameEl) {
            nameEl.textContent = item.name;
            if (statsRow) statsRow.innerHTML = EquipmentUIRenderer.renderItemStats(item);
            this.container!.querySelector('.equip-summary-bar')?.classList.add('has-item');
            this.container!.querySelector('.equip-summary-bar')?.classList.remove('empty');
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

            this.container!.querySelectorAll('.equip-slot').forEach((el) => {
                el.classList.toggle('selected', (el as HTMLElement).dataset.slot === slotId);
            });

            this.container!.querySelectorAll('.inventory-item').forEach((el) => {
                el.classList.remove('selected');
            });

            const nameEl = this.container!.querySelector('.item-preview-name');
            const statsRow = this.container!.querySelector('.item-stats-row');
            if (nameEl) {
                nameEl.textContent = equippedItem.name;
                if (statsRow) statsRow.innerHTML = EquipmentUIRenderer.renderItemStats(equippedItem);
                this.container!.querySelector('.equip-summary-bar')?.classList.add('has-item');
                this.container!.querySelector('.equip-summary-bar')?.classList.remove('empty');
            }
        }
    }
}

const equipmentUIInstance = new EquipmentUI();
if (Registry) Registry.register('EquipmentUI', equipmentUIInstance);

export { EquipmentUI, equipmentUIInstance };
