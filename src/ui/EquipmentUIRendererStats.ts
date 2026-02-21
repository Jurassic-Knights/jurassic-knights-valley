/**
 * EquipmentUIRendererStats – Render item stats for equipment panel.
 */
import { AssetLoader } from '@core/AssetLoader';
import type { EquipmentItem } from '../types/ui';

type StatDef = { key: string; label: string; iconId: string };

export function renderItemStats(item: EquipmentItem): string {
    if (!item?.stats) return '<div class="summary-stat empty">No stats</div>';
    const stats = item.stats as Record<string, number>;
    const type = item.type || item.sourceFile;
    let relevantStats: StatDef[] = [];

    if (type === 'weapon' || item.weaponType) {
        relevantStats = [
            { key: 'damage', label: 'DMG', iconId: 'stat_damage' },
            { key: 'attackSpeed', label: 'SPD', iconId: 'stat_attack_speed' },
            { key: 'range', label: 'RNG', iconId: 'stat_range' },
            { key: 'critChance', label: 'CRT%', iconId: 'stat_crit_chance' },
            { key: 'critDamage', label: 'CRT×', iconId: 'stat_crit_damage' }
        ];
    } else if (type === 'armor' || ['head', 'body', 'chest', 'hands', 'legs', 'feet'].includes(item.slot)) {
        relevantStats = [
            { key: 'armor', label: 'ARM', iconId: 'stat_armor' },
            { key: 'health', label: 'HP', iconId: 'stat_health' },
            { key: 'stamina', label: 'STA', iconId: 'stat_stamina' },
            { key: 'speed', label: 'SPD', iconId: 'stat_speed' }
        ];
    } else if (type === 'tool' || item.slot === 'tool') {
        relevantStats = [{ key: 'efficiency', label: 'EFF', iconId: 'stat_efficiency' }];
    } else {
        return Object.entries(stats)
            .map(([key, val]) => `<div class="summary-stat"><span>${key}</span> <span>${val}</span></div>`)
            .join('');
    }

    const statCount = relevantStats.length;
    const gridCols = statCount <= 1 ? '1fr' : statCount <= 4 ? `repeat(${statCount}, 1fr)` : 'repeat(5, 1fr)';

    return `<div class="stats-grid" style="display:grid; grid-template-columns:${gridCols}; gap:4px; width:100%; justify-items:center;">
        ${relevantStats.map((stat) => {
            const value = stats[stat.key];
            const iconPath = AssetLoader?.getImagePath?.(stat.iconId) || '';
            const prefix = value != null && value > 0 ? '+' : '';
            const displayVal = value != null ? (Number.isInteger(value) ? value : value.toFixed(1)) : '';
            return `<div class="summary-stat" title="${stat.label}" style="display:flex; flex-direction:column; align-items:center; gap:0px; min-width:0; width:100%;">
                <img class="stat-icon-img" src="${iconPath}" alt="${stat.label}" style="width:24px;height:24px;object-fit:contain; margin-bottom:2px;">
                <span style="font-size:0.6rem; color:#888; text-transform:uppercase; white-space:nowrap; line-height:1;">${stat.label}</span>
                <span class="text-pixel-outline" style="font-size:0.9rem; width:100%; text-align:center; white-space:nowrap;">${prefix}${displayVal}</span>
            </div>`;
        }).join('')}
    </div>`;
}
