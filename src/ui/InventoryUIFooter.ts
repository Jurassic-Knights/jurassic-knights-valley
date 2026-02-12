/**
 * InventoryUIFooter – Footer button swap/restore for inventory mode.
 */
import { AssetLoader } from '@core/AssetLoader';
import { ContextActionUI } from './ContextActionUI';
import { WeaponWheelInstance } from './WeaponWheel';
import type { IFooterConfig } from '../types/ui';

export interface InventoryFooterCallbacks {
    onCategoryChange: (category: string) => void;
    onTypeSelected: (type: string) => void;
    onClose: () => void;
    getActiveCategory: () => string;
    getSubTypes: (category: string) => string[];
    getAllSubTypes: () => string[];
}

function setButtonLabelIcon(btn: HTMLElement | null, label: string, iconId: string) {
    if (!btn) return;
    const labelEl = btn.querySelector('.btn-label');
    const iconEl = btn.querySelector('.btn-icon');
    if (labelEl) labelEl.textContent = label;
    if (iconEl) {
        (iconEl as HTMLElement).dataset.iconId = iconId;
        const path = AssetLoader?.getImagePath(iconId);
        if (path) (iconEl as HTMLElement).style.backgroundImage = `url('${path}')`;
    }
}

export function swapToInventoryMode(
    callbacks: InventoryFooterCallbacks,
    originalConfigs: IFooterConfig | null
): IFooterConfig {
    if (ContextActionUI) ContextActionUI.suspend();

    const btnInventory = document.getElementById('btn-inventory');
    const btnEquip = document.getElementById('btn-equip');
    const btnMap = document.getElementById('btn-map');
    const btnMagnet = document.getElementById('btn-magnet');
    const btnContext = document.getElementById('btn-context-action');

    const configs: IFooterConfig = originalConfigs ?? {
        inventory: {
            label: btnInventory?.querySelector('.btn-label')?.textContent ?? undefined,
            iconId: (btnInventory?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
        },
        equip: {
            label: btnEquip?.querySelector('.btn-label')?.textContent ?? undefined,
            iconId: (btnEquip?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
        },
        map: {
            label: btnMap?.querySelector('.btn-label')?.textContent ?? undefined,
            iconId: (btnMap?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
        },
        magnet: {
            label: btnMagnet?.querySelector('.btn-label')?.textContent ?? undefined,
            iconId: (btnMagnet?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId
        }
    };

    const active = callbacks.getActiveCategory();

    if (btnInventory) {
        btnInventory.dataset.footerOverride = 'inventory';
        setButtonLabelIcon(btnInventory, 'ALL', 'ui_icon_inventory');
        btnInventory.classList.toggle('active', active === 'all');
        btnInventory.onclick = () => {
            callbacks.onCategoryChange('all');
        };
    }
    if (btnEquip) {
        btnEquip.dataset.footerOverride = 'inventory';
        setButtonLabelIcon(btnEquip, 'ITEMS', 'ui_icon_crafting');
        btnEquip.classList.toggle('active', active === 'items');
        btnEquip.onclick = () => callbacks.onCategoryChange('items');
    }
    if (btnMap) {
        btnMap.dataset.footerOverride = 'inventory';
        setButtonLabelIcon(btnMap, 'RES', 'ui_icon_resources');
        btnMap.classList.toggle('active', active === 'resources');
        btnMap.onclick = () => callbacks.onCategoryChange('resources');
    }
    if (btnMagnet) {
        btnMagnet.dataset.footerOverride = 'inventory';
        setButtonLabelIcon(btnMagnet, 'BACK', 'ui_icon_close');
        btnMagnet.classList.remove('active');
        btnMagnet.onclick = () => callbacks.onClose();
    }
    if (btnContext) {
        btnContext.classList.remove('inactive');
        btnContext.dataset.footerOverride = 'inventory';
        const labelEl = btnContext.querySelector('.btn-label') || btnContext.querySelector('#context-label');
        const iconEl = btnContext.querySelector('.btn-icon') || btnContext.querySelector('#context-icon');
        if (labelEl) labelEl.textContent = 'FILTER';
        if (iconEl) {
            const path = AssetLoader.getImagePath('ui_icon_settings');
            if (path) {
                (iconEl as HTMLElement).style.backgroundImage = `url('${path}')`;
                (iconEl as HTMLElement).style.backgroundSize = 'contain';
            }
        }
        btnContext.onclick = () => {
            const subTypes = active === 'all' ? callbacks.getAllSubTypes() : callbacks.getSubTypes(active);
            const menuItems = [
                { id: 'all', label: 'ALL', iconId: 'ui_icon_inventory' },
                ...subTypes.map((t) => ({ id: t, label: t.toUpperCase(), iconId: `ui_icon_${t}` }))
            ];
            WeaponWheelInstance.open(menuItems, (path) => {
                const leaf = path[path.length - 1];
                callbacks.onTypeSelected(leaf?.id ?? 'all');
            }, btnContext);
        };
    }

    const btnSwap = document.getElementById('btn-weapon-swap');
    if (btnSwap) btnSwap.style.display = 'none';

    return configs;
}

export function restoreFooterButtons(configs: IFooterConfig | null): void {
    if (!configs) return;

    const restore = (btn: HTMLElement | null, cfg: { label?: string; iconId?: string }) => {
        if (!btn || !cfg) return;
        delete btn.dataset.footerOverride;
        const labelEl = btn.querySelector('.btn-label');
        const iconEl = btn.querySelector('.btn-icon');
        if (labelEl) labelEl.textContent = cfg.label ?? '';
        if (iconEl && cfg.iconId) {
            (iconEl as HTMLElement).dataset.iconId = cfg.iconId;
            const path = AssetLoader?.getImagePath(cfg.iconId);
            if (path) (iconEl as HTMLElement).style.backgroundImage = `url('${path}')`;
        }
        btn.classList.remove('active');
        btn.onclick = null;
    };

    restore(document.getElementById('btn-inventory'), configs.inventory ?? {});
    restore(document.getElementById('btn-equip'), configs.equip ?? {});
    restore(document.getElementById('btn-map'), configs.map ?? {});
    restore(document.getElementById('btn-magnet'), configs.magnet ?? {});

    const btnContext = document.getElementById('btn-context-action');
    if (btnContext) {
        btnContext.classList.remove('inactive');
        btnContext.onclick = null;
    }

    const btnSwap = document.getElementById('btn-weapon-swap');
    if (btnSwap) btnSwap.style.display = '';

    if (ContextActionUI) ContextActionUI.resume();
}

export function updateFooterActiveStates(activeCategory: string): void {
    document.getElementById('btn-inventory')?.classList.toggle('active', activeCategory === 'all');
    document.getElementById('btn-equip')?.classList.toggle('active', activeCategory === 'items');
    document.getElementById('btn-map')?.classList.toggle('active', activeCategory === 'resources');
}
