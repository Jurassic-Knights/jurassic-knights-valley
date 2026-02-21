/**
 * EquipmentUIFooter - Footer button swap/restore for equipment screen mode
 */
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { ContextActionUI } from './ContextActionUI';
import { WeaponWheelInstance } from './WeaponWheel';
import { getFilterHierarchy } from './EquipmentUIFilterConfig';
import type { IFooterConfig } from '../types/ui';

export interface EquipmentUIFooterContext {
    container: HTMLElement | null;
    selectedMode: string;
    selectedCategory: string;
    originalFooterConfigs: IFooterConfig | null;
    _loadEquipment: () => void;
    _render: () => void;
    _updateFooterActiveStates: () => void;
    close: () => void;
}

export function swapFooterToEquipmentMode(ctx: EquipmentUIFooterContext) {
    if (ContextActionUI) ContextActionUI.suspend();

    const btnInventory = document.getElementById('btn-inventory');
    const btnEquip = document.getElementById('btn-equip');
    const btnMap = document.getElementById('btn-map');
    const btnMagnet = document.getElementById('btn-magnet');
    const btnContext = document.getElementById('btn-context-action');

    if (!ctx.originalFooterConfigs) {
        ctx.originalFooterConfigs = {
            inventory: {
                label: btnInventory?.querySelector('.btn-label')?.textContent,
                iconId: (btnInventory?.querySelector('.btn-icon') as HTMLElement)?.dataset?.iconId,
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

    const applyMode = (mode: string) => {
        ctx.selectedMode = mode;
        ctx.selectedCategory = 'all';
        ctx._loadEquipment();
        ctx._render();
        ctx._updateFooterActiveStates();
    };

    if (btnInventory) {
        btnInventory.dataset.footerOverride = 'equipment';
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
        btnInventory.classList.toggle('active', ctx.selectedMode === 'armor');
        btnInventory.onclick = () => {
            Logger.info('[EquipmentUI] Clicked ARMOR');
            applyMode('armor');
        };
    }

    if (btnEquip) {
        btnEquip.dataset.footerOverride = 'equipment';
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
        btnEquip.classList.toggle('active', ctx.selectedMode === 'weapon');
        btnEquip.onclick = () => {
            Logger.info('[EquipmentUI] Clicked WEAPON');
            applyMode('weapon');
        };
    }

    if (btnMap) {
        btnMap.dataset.footerOverride = 'equipment';
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
        btnMap.classList.toggle('active', ctx.selectedMode === 'tool');
        btnMap.onclick = () => {
            Logger.info('[EquipmentUI] Clicked TOOL');
            applyMode('tool');
        };
    }

    if (btnMagnet) {
        btnMagnet.dataset.footerOverride = 'equipment';
        const label = btnMagnet.querySelector('.btn-label');
        const icon = btnMagnet.querySelector('.btn-icon');
        if (label) label.textContent = 'BACK';
        if (icon) {
            (icon as HTMLElement).dataset.iconId = 'ui_icon_close';
            (icon as HTMLElement).style.backgroundImage =
                `url('${AssetLoader?.getImagePath('ui_icon_close') || ''}')`;
        }
        btnMagnet.classList.remove('active');
        btnMagnet.onclick = () => ctx.close();
    }

    if (btnContext) {
        btnContext.classList.remove('inactive');
        btnContext.dataset.footerOverride = 'equipment';
        const label = btnContext.querySelector('.btn-label') || btnContext.querySelector('#context-label');
        const icon = btnContext.querySelector('.btn-icon') || btnContext.querySelector('#context-icon');
        if (label) label.textContent = 'FILTER';
        if (icon) {
            const path = AssetLoader.getImagePath('ui_icon_settings');
            if (path) {
                (icon as HTMLElement).style.backgroundImage = `url('${path}')`;
                (icon as HTMLElement).style.backgroundSize = 'contain';
            }
        }
        btnContext.onclick = () => {
            const rootCategories = getFilterHierarchy(ctx.selectedMode);
            WeaponWheelInstance.open(rootCategories, (path) => {
                const leaf = path[path.length - 1];
                ctx.selectedCategory = path.length > 1 ? path.map((p) => p.id).join(':') : leaf.id;
                ctx._loadEquipment();
                ctx._render();
            }, btnContext);
        };
    }

    const btnSwap = document.getElementById('btn-weapon-swap');
    if (btnSwap) btnSwap.style.display = 'none';
}

export function restoreFooterButtons(ctx: EquipmentUIFooterContext) {
    if (!ctx.originalFooterConfigs) return;

    const btnInventory = document.getElementById('btn-inventory');
    const btnEquip = document.getElementById('btn-equip');
    const btnMap = document.getElementById('btn-map');
    const btnMagnet = document.getElementById('btn-magnet');
    const btnContext = document.getElementById('btn-context-action');
    const cfg = ctx.originalFooterConfigs;

    const restoreBtn = (
        btn: HTMLElement | null,
        config: { label?: string; iconId?: string } | undefined
    ) => {
        if (!btn || !config) return;
        delete btn.dataset.footerOverride;
        const label = btn.querySelector('.btn-label');
        const icon = btn.querySelector('.btn-icon');
        if (label) label.textContent = config.label ?? '';
        if (icon && config.iconId) {
            (icon as HTMLElement).dataset.iconId = config.iconId;
            (icon as HTMLElement).style.backgroundImage =
                `url('${AssetLoader?.getImagePath(config.iconId) || ''}')`;
        }
        btn.classList.remove('active');
        btn.onclick = null;
    };

    restoreBtn(btnInventory, cfg.inventory);
    restoreBtn(btnEquip, cfg.equip);
    restoreBtn(btnMap, cfg.map);
    restoreBtn(btnMagnet, cfg.magnet);

    if (btnContext) {
        btnContext.classList.remove('inactive');
        btnContext.onclick = null;
    }

    const btnSwap = document.getElementById('btn-weapon-swap');
    if (btnSwap) btnSwap.style.display = '';

    ctx.originalFooterConfigs = null;
    if (ContextActionUI) ContextActionUI.resume();
}
