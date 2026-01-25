/**
 * EquipmentUIRenderer - Rendering logic for EquipmentUI
 * Handles all HTML generation and template rendering.
 * 
 * Owner: UI Engineer
 */

import { AssetLoader } from '../core/AssetLoader';
import { GameInstance } from '../core/Game';
import { EntityRegistry } from '../entities/EntityLoader';
import { Registry } from '../core/Registry';


class EquipmentUIRenderer {
    /**
     * Render the main equipment panel
     * @param {EquipmentUI} ui - The EquipmentUI instance
     * @returns {string} HTML string
     */
    static renderPanel(ui) {
        const hero = GameInstance?.hero;
        const stats = hero?.components?.stats;
        const equipment = hero?.equipment;

        // Hero stats
        const health = hero?.health ?? 100;
        const maxHealth = hero?.maxHealth ?? 100;
        const defense = stats?.getDefense?.() ?? 0;
        const attack = stats?.getAttack?.() ?? 10;
        const critChance = stats?.getCritChance?.() ?? 0;
        const hand1Range = stats?.getWeaponRange?.('hand1') ?? 80;
        const hand2Range = stats?.getWeaponRange?.('hand2') ?? 80;
        const speedBonus = equipment?.getStatBonus?.('speed') ?? 0;

        // Selected item stats
        const item = ui.selectedItem;
        const itemStats = item?.stats || {};
        const itemName = item?.name || 'Select Equipment';
        const itemDamage = itemStats.damage || 0;
        const itemArmor = itemStats.armor || 0;
        const itemSpeed = itemStats.speed || 0;

        return `
            <div class="equip-panel">
                <!-- Top Section: Character + Hero Stats -->
                <div class="equip-header">
                    <div class="equip-character">
                        <div class="character-sprite" data-skin-id="${EquipmentUIRenderer.getCurrentSkinId()}"></div>
                    </div>
                    <div class="equip-stats-panel">
                        <div class="equip-item-name">Knight</div>
                        <div class="stat-row"><span class="stat-icon">??</span> HP <span class="stat-bar health"></span><span class="stat-value">${health}/${maxHealth}</span></div>
                        <div class="stat-row"><span class="stat-icon">???</span> Armor <span class="stat-bar armor"></span><span class="stat-value">${defense}</span></div>
                        <div class="stat-row"><span class="stat-icon">??</span> Attack <span class="stat-bar attack"></span><span class="stat-value">${attack}</span></div>
                        <div class="stat-grid">
                            <div class="mini-stat"><span class="stat-icon">??</span> SPD <span>${speedBonus}</span></div>
                            <div class="mini-stat"><span class="stat-icon">???</span> DEF <span>${defense}</span></div>
                            <div class="mini-stat"><span class="stat-icon">??</span> CRIT <span>${critChance}%</span></div>
                            <div class="mini-stat"><span class="stat-icon">??</span> RNG <span>${hand1Range}/${hand2Range}</span></div>
                        </div>
                    </div>
                </div>

                <!-- Selected Item Stats Bar -->
                <div class="equip-summary-bar ${item ? 'has-item' : 'empty'}" style="width:100%; padding:0; background:rgba(0,0,0,0.5); display:flex; flex-direction:row; align-items:stretch; min-height:60px;">
                    <div class="item-preview-name" style="
                        font-size: 1.0rem; 
                        font-weight: 800; 
                        color: #ffc107; 
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0 12px; 
                        width: 30%; 
                        background: rgba(255,193,7,0.1);
                        border-right: 1px solid rgba(255,193,7,0.2);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        box-sizing: border-box;
                        text-align: center;
                        line-height: 1.2;
                    ">${itemName}</div>
                    <div class="item-stats-row" style="flex:1; padding:4px 8px; box-sizing: border-box; display:flex; align-items:center;">
                        ${item ? EquipmentUIRenderer.renderItemStats(item) : '<div class="summary-stat empty" style="width:100%; text-align:center; color:#666;">Double-tap to equip</div>'}
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
    static renderEquippedSlots(ui, equipment) {
        // Tool mode: show 4 dedicated tool slots in a single row
        if (ui.selectedMode === 'tool') {
            const toolSlotLabels = {
                tool_mining: '?? Mining',
                tool_woodcutting: '?? Woodcut',
                tool_harvesting: '?? Harvest',
                tool_fishing: '?? Fishing'
            };

            return `
                <div class="slot-row tool-slots">
                    ${['tool_mining', 'tool_woodcutting', 'tool_harvesting', 'tool_fishing'].map(slot => EquipmentUIRenderer.renderSlot(ui, slot, toolSlotLabels[slot], equipment)).join('')}
                </div>
            `;
        }

        // Weapon mode: show Set 1 and Set 2 weapon slots with labels and toggle
        if (ui.selectedMode === 'weapon') {
            const targetSet = ui.targetEquipSet || 1;
            const weaponSlotLabels = {
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
                            ${['hand1', 'hand2'].map(slot => EquipmentUIRenderer.renderSlot(ui, slot, weaponSlotLabels[slot], equipment)).join('')}
                        </div>
                    </div>
                    <div class="weapon-set">
                        <div class="slot-row weapon-slots-pair">
                            ${['hand1_alt', 'hand2_alt'].map(slot => EquipmentUIRenderer.renderSlot(ui, slot, weaponSlotLabels[slot], equipment)).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        // Armor mode: show armor and accessory slots only
        const armorSlotLabels = {
            head: 'Helmet', body: 'Armor', hands: 'Gloves', legs: 'Legs',
            accessory: 'Acc 1', accessory2: 'Acc 2'
        };

        return `
            <div class="slot-row">
                ${['head', 'body', 'hands', 'legs'].map(slot => EquipmentUIRenderer.renderSlot(ui, slot, armorSlotLabels[slot], equipment)).join('')}
            </div>
            <div class="slot-row">
                ${['accessory', 'accessory2'].map(slot => EquipmentUIRenderer.renderSlot(ui, slot, armorSlotLabels[slot], equipment)).join('')}
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
    static renderSlot(ui, slotId, label, equipment) {
        const item = equipment?.getSlot?.(slotId);
        const imgPath = item ? EquipmentUIRenderer.getItemIcon(item.id) : '';

        // Check if this is hand2 and hand1 has a 2-hand weapon (disable hand2)
        const hand1Item = equipment?.getSlot?.('hand1');
        const isDisabledByTwoHand = slotId === 'hand2' && hand1Item?.gripType === '2-hand';

        // Add slot-selectable class for weapon slots during selection mode
        const isSelectable = ui.slotSelectionMode && (slotId === 'hand1' || slotId === 'hand2') && !isDisabledByTwoHand;
        const selectableClass = isSelectable ? 'slot-selectable' : '';
        const disabledClass = isDisabledByTwoHand ? 'slot-disabled' : '';

        // SVG marching ants animation for selectable slots
        const marchingAntsSvg = isSelectable ? `
            <svg class="marching-ants-border" viewBox="0 0 60 60" preserveAspectRatio="none">
                <rect x="2" y="2" width="56" height="56" rx="6" ry="6" />
            </svg>
        ` : '';

        // Slash overlay for disabled slots
        const slashOverlay = isDisabledByTwoHand ? `
            <div class="slot-disabled-slash"></div>
        ` : '';

        return `
            <div class="equip-slot ${selectableClass} ${disabledClass}" data-slot="${slotId}">
                <div class="slot-label">${label}</div>
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
    static renderInventoryGrid(ui) {
        // cachedEquipment is already filtered by _loadEquipment based on mode + category + modifier
        const filtered = ui.cachedEquipment;

        if (filtered.length === 0) {
            return '<div class="empty-inventory">No equipment available</div>';
        }

        return `
            <div class="inventory-grid">
                ${filtered.map(item => `
                    <div class="inventory-item ${ui.selectedItem?.id === item.id ? 'selected' : ''}" data-id="${item.id}">
                        <div class="item-icon" style="background-image: url('${EquipmentUIRenderer.getItemIcon(item.id)}')"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Get item icon path
     * @param {string} itemId - Item identifier
     * @returns {string} Image path
     */
    static getItemIcon(itemId) {
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
    static getSkinImagePath(skinId) {
        const skinData = EntityRegistry?.hero?.[skinId];
        if (skinData?.files?.clean) {
            return 'assets/' + skinData.files.clean;
        }
        if (skinData?.files?.original) {
            return 'assets/' + skinData.files.original;
        }
        return '';
    }

    /**
     * Load icons using AssetLoader
     * @param {HTMLElement} container - Container element
     */
    static loadIcons(container) {
        const loader = AssetLoader as any;
        if (loader?.loadIcons) {
            loader.loadIcons(container);
        }

        // Also load hero skin portrait
        const skinEl = container.querySelector('.character-sprite[data-skin-id]');
        if (skinEl) {
            const skinId = skinEl.dataset.skinId;
            const path = EquipmentUIRenderer.getSkinImagePath(skinId);
            if (path) {
                skinEl.style.backgroundImage = `url(${path})`;
                skinEl.style.backgroundSize = 'cover';
                skinEl.style.backgroundPosition = 'center';
            }
        }
    }

    /**
     * Render all stats for an equipment item with icons
     * Shows ALL relevant stats (including 0 values) for the item type
     * @param {EquipmentItem} item - Equipment item
     * @returns {string} HTML string
     */
    static renderItemStats(item) {
        if (!item?.stats) {
            return '<div class="summary-stat empty">No stats</div>';
        }

        const stats = item.stats;
        const type = item.type || item.sourceFile;

        // Define stats to show based on equipment type
        type StatDef = { key: string; label: string; iconId: string };
        let relevantStats: StatDef[] = [];

        if (type === 'weapon' || item.weaponType) {
            // Weapon stats
            relevantStats = [
                { key: 'damage', label: 'DMG', iconId: 'stat_damage' },
                { key: 'attackSpeed', label: 'SPD', iconId: 'stat_attack_speed' },
                { key: 'range', label: 'RNG', iconId: 'stat_range' },
                { key: 'critChance', label: 'CRT%', iconId: 'stat_crit_chance' },
                { key: 'critDamage', label: 'CRT×', iconId: 'stat_crit_damage' },
            ];
        } else if (type === 'armor' || ['head', 'body', 'chest', 'hands', 'legs', 'feet'].includes(item.slot)) {
            // Armor stats
            relevantStats = [
                { key: 'armor', label: 'ARM', iconId: 'stat_armor' },
                { key: 'health', label: 'HP', iconId: 'stat_health' },
                { key: 'stamina', label: 'STA', iconId: 'stat_stamina' },
                { key: 'speed', label: 'SPD', iconId: 'stat_speed' },
            ];
        } else if (type === 'tool' || item.slot === 'tool') {
            // Tool stats
            relevantStats = [
                { key: 'efficiency', label: 'EFF', iconId: 'stat_efficiency' },
            ];
        } else {
            // Generic - show any stats present
            return Object.entries(stats)
                .map(([key, val]) => `<div class="summary-stat"><span>${key}</span> <span>${val}</span></div>`)
                .join('');
        }

        // Render each stat with icon - fixed width grid, no layout shift
        const statCount = relevantStats.length;
        // Grid columns based on stat count: weapons=5, armor=4, tools=1
        const gridCols = statCount <= 1 ? '1fr' : statCount <= 4 ? `repeat(${statCount}, 1fr)` : 'repeat(5, 1fr)';

        return `<div class="stats-grid" style="display:grid; grid-template-columns:${gridCols}; gap:4px; width:100%; justify-items:center;">
            ${relevantStats.map(stat => {
            const value = stats[stat.key] ?? 0;
            const iconPath = AssetLoader?.getImagePath?.(stat.iconId) || '';
            const prefix = value > 0 ? '+' : '';
            // Format value: show 1 decimal for decimals, integer otherwise
            const displayVal = Number.isInteger(value) ? value : value.toFixed(1);
            return `
                    <div class="summary-stat" title="${stat.label}" style="display:flex; flex-direction:column; align-items:center; gap:0px; min-width:0; width:100%;">
                        <img class="stat-icon-img" src="${iconPath}" alt="${stat.label}" style="width:24px;height:24px;object-fit:contain; margin-bottom:2px;">
                        <span style="font-size:0.6rem; color:#888; text-transform:uppercase; white-space:nowrap; line-height:1;">${stat.label}</span>
                        <span style="font-size:0.9rem; font-weight:bold; color:#fff; width:100%; text-align:center; white-space:nowrap;">${prefix}${displayVal}</span>
                    </div>
                `;
        }).join('')}
        </div>`;
    }
}

// Export
if (typeof window !== 'undefined') {
    (window as any).EquipmentUIRenderer = EquipmentUIRenderer;
}

// ES6 Module Export
export { EquipmentUIRenderer };
