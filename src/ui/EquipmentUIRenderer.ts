/**
 * EquipmentUIRenderer - Rendering logic for EquipmentUI
 * Handles all HTML generation and template rendering.
 *
 * Owner: UI Engineer
 */

import { AssetLoader } from '@core/AssetLoader';
import { GameInstance } from '@core/Game';
// import removed
// import removed
import { RenderConfig } from '@config/RenderConfig';

import type { EquipmentItem } from '../types/ui';
import type { EquipmentUI } from './EquipmentUI';
import { EquipmentManager } from '../systems/EquipmentManager';
import { renderItemStats } from './EquipmentUIRendererStats';

class EquipmentUIRenderer {
    /**
     * Render the main equipment panel
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @returns {string} HTML string
     */
    static renderPanel(ui: EquipmentUI) {
        const hero = GameInstance?.hero;
        const stats = hero?.components?.stats;
        const equipment = hero?.equipment;

        // No hero = no stats. Don't fake numbers; the panel simply doesn't have data to show.
        const hasHero = !!hero;
        const health = hasHero ? (hero!.health ?? '') : '';
        const maxHealth = hasHero ? (hero!.maxHealth ?? '') : '';
        const defense = hasHero && stats ? (stats.getDefense?.() ?? '') : '';
        const attack = hasHero && stats ? (stats.getAttack?.() ?? '') : '';
        const critChance = hasHero && stats ? (stats.getCritChance?.() ?? '') : '';
        const hand1Range = hasHero && stats ? (stats.getWeaponRange?.('hand1') ?? '') : '';
        const hand2Range = hasHero && stats ? (stats.getWeaponRange?.('hand2') ?? '') : '';
        const speedBonus = hasHero && equipment ? (equipment.getStatBonus?.('speed') ?? '') : '';

        // Selected item stats
        const item = ui.selectedItem as EquipmentItem | null;
        const itemName = item?.name || 'Select Equipment';

        return `
            <div class="equip-panel">
                <!-- Top Section: Character + Hero Stats -->
                <div class="equip-header">
                    <div class="equip-character">
                        <div class="character-sprite" data-skin-id="${EquipmentUIRenderer.getCurrentSkinId()}"></div>
                    </div>
                    <div class="equip-stats-panel">
                        <div class="equip-item-name">Knight</div>
                        ${hasHero
                ? `
                        <div class="stat-row"><span class="stat-icon">🛡️</span> HP <span class="stat-bar health"></span><span class="stat-value">${health}/${maxHealth}</span></div>
                        <div class="stat-row"><span class="stat-icon">⚔️</span> Armor <span class="stat-bar armor"></span><span class="stat-value">${defense}</span></div>
                        <div class="stat-row"><span class="stat-icon">🗡️</span> Attack <span class="stat-bar attack"></span><span class="stat-value">${attack}</span></div>
                        <div class="stat-grid">
                            <div class="mini-stat"><span class="stat-icon">👟</span> SPD <span>${speedBonus}</span></div>
                            <div class="mini-stat"><span class="stat-icon">🛡️</span> DEF <span>${defense}</span></div>
                            <div class="mini-stat"><span class="stat-icon">💥</span> CRIT <span>${critChance}%</span></div>
                            <div class="mini-stat"><span class="stat-icon">🏹</span> RNG <span>${hand1Range}/${hand2Range}</span></div>
                        </div>
                        `
                : '<div class="stat-row" style="color:#666;">No knight</div>'
            }
                    </div>
                </div>

                <!-- Selected Item Stats Bar -->
                <div class="equip-summary-bar ${item ? 'has-item' : 'empty'}" style="width:100%; padding:0; background:rgba(0,0,0,0.5); display:flex; flex-direction:row; align-items:stretch; min-height:${RenderConfig.UI.Equipment.SLOT_SIZE}px;">
                    <div class="item-preview-name text-pixel-outline" style="
                        font-size: ${RenderConfig.UI.Equipment.FONTS.ITEM_NAME_SIZE}; 
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0 12px; 
                        width: 30%; 
                        background: ${RenderConfig.UI.Equipment.COLORS.SELECTED_BG};
                        border-right: 1px solid ${RenderConfig.UI.Equipment.COLORS.SELECTED_BORDER};
                        box-sizing: border-box;
                        text-align: center;
                    ">${itemName}</div>
                    <div class="item-stats-row" style="flex:1; padding:4px 8px; box-sizing: border-box; display:flex; align-items:center;">
                        ${item ? renderItemStats(item) : '<div class="summary-stat empty" style="width:100%; text-align:center; color:#666;">Double-tap to equip</div>'}
                    </div>
                </div>

                <!-- Equipped Slots Grid -->
                <div class="equipped-slots">
                    ${EquipmentUIRenderer.renderEquippedSlots(ui, equipment)}
                </div>

                <!-- Inventory Grid -->
                <div class="equip-inventory">
                    ${EquipmentUIRenderer.renderInventoryGrid(ui)}
                </div>

                <!-- Category Tabs (filter buttons at bottom) -->
                <!-- Moved to Action Button -->
                <div class="equip-tabs"></div>
            </div>
        `;
    }

    /**
     * Render equipped slots grid
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @param {EquipmentManager} equipment - Hero equipment manager
     * @returns {string} HTML string
     */
    static renderEquippedSlots(ui: EquipmentUI, equipment: EquipmentManager | undefined) {
        // Tool mode: show 4 dedicated tool slots in a single row
        if (ui.selectedMode === 'tool') {
            const toolSlotLabels: Record<string, string> = {
                tool_mining: '⛏️ Mining',
                tool_woodcutting: '🪓 Woodcut',
                tool_harvesting: '🌾 Harvest',
                tool_fishing: '🎣 Fishing'
            };

            return `
                <div class="slot-row tool-slots">
                    ${['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing'].map((slot) => EquipmentUIRenderer.renderSlot(ui, slot, toolSlotLabels[slot], equipment)).join('')}
                </div>
            `;
        }

        // Weapon mode: show Set 1 and Set 2 weapon slots with labels and toggle
        if (ui.selectedMode === 'weapon') {
            const targetSet = ui.targetEquipSet || 1;
            const weaponSlotLabels: Record<string, string> = {
                hand1: 'Main',
                hand2: 'Off',
                hand1_alt: 'Main',
                hand2_alt: 'Off'
            };

            return `
                <div class="weapon-set-toggle">
                    <button class="set-toggle-btn ${targetSet === 1 ? 'active' : ''}" data-target-set="1">SET 1</button>
                    <button class="set-toggle-btn ${targetSet === 2 ? 'active' : ''}" data-target-set="2">SET 2</button>
                </div>
                <div class="weapon-sets-container">
                    <div class="weapon-set">
                        <div class="slot-row weapon-slots-pair">
                            ${['hand1', 'hand2'].map((slot) => EquipmentUIRenderer.renderSlot(ui, slot, weaponSlotLabels[slot], equipment)).join('')}
                        </div>
                    </div>
                    <div class="weapon-set">
                        <div class="slot-row weapon-slots-pair">
                            ${['hand1_alt', 'hand2_alt'].map((slot) => EquipmentUIRenderer.renderSlot(ui, slot, weaponSlotLabels[slot], equipment)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Armor mode: show armor and accessory slots only
        const armorSlotLabels: Record<string, string> = {
            head: 'Helmet',
            body: 'Armor',
            hands: 'Gloves',
            legs: 'Legs',
            accessory: 'Acc 1',
            accessory2: 'Acc 2'
        };

        return `
            <div class="slot-row">
                ${['head', 'body', 'hands', 'legs'].map((slot) => EquipmentUIRenderer.renderSlot(ui, slot, armorSlotLabels[slot], equipment)).join('')}
            </div>
            <div class="slot-row">
                ${['accessory', 'accessory2'].map((slot) => EquipmentUIRenderer.renderSlot(ui, slot, armorSlotLabels[slot], equipment)).join('')}
            </div>
        `;
    }

    /**
     * Render a single equipment slot
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @param {string} slotId - Slot identifier
     * @param {string} label - Display label
     * @param {EquipmentManager} equipment - Hero equipment manager
     * @returns {string} HTML string
     */
    static renderSlot(ui: EquipmentUI, slotId: string, label: string, equipment: EquipmentManager | undefined) {
        const item = equipment?.getSlot?.(slotId) as EquipmentItem | undefined;
        const imgPath = item ? EquipmentUIRenderer.getItemIcon(item.id) : '';

        // Check if this is hand2 and hand1 has a 2-hand weapon (disable hand2)
        const hand1Item = equipment?.getSlot?.('hand1') as EquipmentItem | undefined;
        const isDisabledByTwoHand = slotId === 'hand2' && hand1Item?.gripType === '2-hand';

        // Add slot-selectable class for weapon slots during selection mode
        const isSelectable =
            ui.slotSelectionMode &&
            (slotId === 'hand1' || slotId === 'hand2') &&
            !isDisabledByTwoHand;
        const selectableClass = isSelectable ? 'slot-selectable' : '';
        const disabledClass = isDisabledByTwoHand ? 'slot-disabled' : '';

        // SVG marching ants animation for selectable slots
        const marchingAntsSvg = isSelectable
            ? `
            <svg class="marching-ants-border" viewBox="0 0 60 60" preserveAspectRatio="none">
                <rect x="2" y="2" width="56" height="56" rx="6" ry="6" />
            </svg>
        `
            : '';

        // Slash overlay for disabled slots
        const slashOverlay = isDisabledByTwoHand
            ? `
            <div class="slot-disabled-slash"></div>
        `
            : '';

        return `
            <div class="equip-slot ${selectableClass} ${disabledClass}" data-slot="${slotId}">
                <div class="slot-label text-pixel-outline">${label}</div>
                <div class="slot-icon ${item ? 'filled' : 'empty'}" style="${imgPath ? `background-image: url('${imgPath}')` : ''}">
                    ${marchingAntsSvg}
                    ${slashOverlay}
                </div>
            </div>
        `;
    }

    /**
     * Render inventory grid with filtering
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @returns {string} HTML string
     */
    static renderInventoryGrid(ui: EquipmentUI) {
        // cachedEquipment is already filtered by _loadEquipment based on mode + category + modifier
        const filtered = ui.cachedEquipment as EquipmentItem[];

        if (filtered.length === 0) {
            return '<div class="empty-inventory">No equipment available</div>';
        }

        return `
            <div class="inventory-grid">
                ${filtered
                .map(
                    (item: EquipmentItem) => `
                    <div class="inventory-item ${ui.selectedItem?.id === item.id ? 'selected' : ''}" data-id="${item.id}">
                        <div class="item-icon" style="background-image: url('${EquipmentUIRenderer.getItemIcon(item.id)}')"></div>
                    </div>
                `
                )
                .join('')}
            </div>
        `;
    }

    /**
     * Get item icon path
     * @param {string} itemId - Item identifier
     * @returns {string} Image path
     */
    static getItemIcon(itemId: string) {
        if (AssetLoader && AssetLoader.getImagePath) {
            return AssetLoader.getImagePath(itemId);
        }
        return '';
    }

    /**
     * Get the currently selected hero skin ID
     * @returns {string} Skin ID (defaults to hero_t1_01)
     */
    static getCurrentSkinId() {
        return localStorage.getItem('heroSelectedSkin') || 'hero_t1_01';
    }

    /**
     * Get the image path for a hero skin
     * @param {string} skinId - Skin ID
     * @returns {string} Image path
     */
    static getSkinImagePath(skinId: string | undefined) {
        if (!skinId) return '';
        if (AssetLoader && AssetLoader.getImagePath) {
            return AssetLoader.getImagePath(skinId);
        }
        // Fallback (should normally be handled by AssetLoader)
        return '';
    }

    /**
     * Load icons using AssetLoader
     * @param {HTMLElement} container - Container element
     */
    static loadIcons(container: HTMLElement) {
        // const loader = AssetLoader as any;
        // if (loader?.loadIcons) {
        //     loader.loadIcons(container);
        // }

        // Also load hero skin portrait
        const skinEl = container.querySelector('.character-sprite[data-skin-id]') as HTMLElement;
        if (skinEl) {
            const skinId = skinEl.dataset.skinId;
            const path = EquipmentUIRenderer.getSkinImagePath(skinId);
            if (path) {
                skinEl.style.backgroundImage = `url('${path}')`;
                skinEl.style.backgroundSize = 'cover';
                skinEl.style.backgroundPosition = 'center';
            }
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    (window as Window).EquipmentUIRenderer = EquipmentUIRenderer;
}

// ES6 Module Export
export { EquipmentUIRenderer };
