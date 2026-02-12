/**
 * EquipmentUIClickHandler - Event delegation for equipment screen clicks
 */
import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameInstance } from '@core/Game';
import { WeaponWheelInstance } from './WeaponWheel';
import { HeroSkinSelector } from './HeroSkinSelector';
import { EquipmentSlotManager } from './EquipmentSlotManager';
import { getFilterHierarchy } from './EquipmentUIFilterConfig';
import type { EquipmentUI } from './EquipmentUI';

const DOUBLE_CLICK_THRESHOLD = 400;

export function handleEquipmentUIClick(ui: EquipmentUI, e: MouseEvent) {
    const target = e.target as HTMLElement;

    if (target.closest('#equip-close') || target.closest('#equip-back')) {
        ui.close();
        return;
    }

    if (target.closest('.equip-character')) {
        HeroSkinSelector.setContainer(ui.container);
        HeroSkinSelector.open();
        return;
    }

    const skinOption = target.closest('.hero-skin-option') as HTMLElement;
    if (skinOption?.dataset.skinId) {
        const charSprite = ui.container?.querySelector('.character-sprite') as HTMLElement | null;
        HeroSkinSelector.selectSkin(skinOption.dataset.skinId, charSprite);
        return;
    }

    if (target.closest('.hero-skin-modal-close') || target.closest('.hero-skin-modal-backdrop')) {
        HeroSkinSelector.close();
        return;
    }

    if (target.closest('#btn-open-wheel')) {
        const rootCategories = getFilterHierarchy(ui.selectedMode);
        WeaponWheelInstance.open(
            rootCategories,
            (path) => {
                const leaf = path[path.length - 1];
                ui.selectedCategory = path.length > 1 ? path.map((p) => p.id).join(':') : leaf.id;
                Logger.info(`[EquipmentUI] Filter selected: ${ui.selectedCategory}`);
                ui._loadEquipment();
                ui._render();
            },
            target.closest('#btn-open-wheel') as HTMLElement
        );
        return;
    }

    const tab = target.closest('.btn-filter') as HTMLElement;
    if (tab?.dataset.category) {
        ui.selectedCategory = tab.dataset.category;
        ui._render();
        return;
    }

    const modeBtn = target.closest('.action-btn[data-mode]') as HTMLElement;
    if (modeBtn?.dataset.mode) {
        ui.selectedMode = modeBtn.dataset.mode;
        ui.selectedCategory = 'all';
        ui.selectedItem = null;
        ui._loadEquipment();
        ui._render();
        return;
    }

    const setToggle = target.closest('.set-toggle-btn') as HTMLElement;
    if (setToggle?.dataset.targetSet) {
        const targetSet = parseInt(setToggle.dataset.targetSet);
        const hero = GameInstance?.hero;
        if (hero?.equipment) {
            hero.equipment.activeWeaponSet = targetSet;
            Logger.info(`[EquipmentUI] Active weapon set changed to Set ${targetSet}`);
            if (EventBus) EventBus.emit('WEAPON_SET_CHANGED', { activeSet: targetSet });
        }
        ui._render();
        return;
    }

    const invItem = target.closest('.inventory-item') as HTMLElement;
    if (invItem?.dataset.id) {
        const itemId = invItem.dataset.id;
        const now = Date.now();
        if (
            itemId === ui.lastClickedItemId &&
            now - ui.lastClickTime < DOUBLE_CLICK_THRESHOLD
        ) {
            EquipmentSlotManager.equipItem(ui, itemId);
            ui.lastClickedItemId = null;
            ui.lastClickTime = 0;
        } else {
            ui.lastClickedItemId = itemId;
            ui.lastClickTime = now;
            ui._selectItemNoRender(itemId);
        }
        return;
    }

    const slot = target.closest('.equip-slot') as HTMLElement;
    if (slot?.dataset.slot) {
        const slotId = slot.dataset.slot;
        if (EquipmentSlotManager.handleSlotSelection(ui, slotId)) return;

        const now = Date.now();
        const slotKey = `slot_${slotId}`;
        if (
            slotKey === ui.lastClickedItemId &&
            now - ui.lastClickTime < DOUBLE_CLICK_THRESHOLD
        ) {
            EquipmentSlotManager.unequipSlot(ui, slotId);
            ui.lastClickedItemId = null;
            ui.lastClickTime = 0;
        } else {
            ui.lastClickedItemId = slotKey;
            ui.lastClickTime = now;
            ui._selectEquippedSlot(slotId);
        }
    }
}
