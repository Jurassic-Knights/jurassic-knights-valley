import { h, renderToString } from '../domBuilder';
import { AssetItem, currentCategoryName, WEAPON_TYPES } from '../state';

// Types for Window global
declare global {
    interface Window {
        EquipmentStatsConfig?: {
            categories: string[];
            getStatsByCategory: (category: string) => Array<{
                key: string;
                label: string;
                icon: string;
                type: string;
                default: unknown;
            }>;
        };
    }
}

const STAT_ICONS: Record<string, string> = {
    health: '❤️',
    damage: '⚔️',
    speed: '💨',
    attackRate: '⏱️',
    attackRange: '🎯',
    aggroRange: '👁️',
    xpReward: '⭐',
    threatLevel: '💀',
    attackType: '🗡️',
    packAggro: '🐺',
    defense: '🛡️',
};

export function buildStatsHtml(item: AssetItem, fileName: string): string {
    // Equipment logic
    if (item.sourceCategory === 'equipment' && window.EquipmentStatsConfig) {
        return buildEquipmentStatsHtml(item, fileName);
    }

    // Standard logic
    const statsObj = typeof item.stats === 'object' && item.stats !== null ? item.stats : {};
    const combatObj = typeof item.combat === 'object' && item.combat !== null ? item.combat : {};
    const allStats = { ...statsObj, ...combatObj };

    if (typeof item.stats === 'string' && item.stats) {
        return renderToString(h('div', {
            style: 'font-size:0.8rem; color:var(--text); padding:4px 8px; background:#222; border-radius:6px;'
        }, ['📊 ', item.stats]));
    }

    if (Object.keys(allStats).length === 0) return '';

    const statEntries = Object.entries(allStats).map(([key, val]) => {
        const icon = STAT_ICONS[key] || '📊';

        // Attack Type (Melee/Ranged toggle)
        if (key === 'attackType') {
            const isMelee = val === 'melee';
            return h('div', { className: 'asset-stat-box', title: key }, [
                h('button', {
                    'data-action': 'update-stat',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-key': key,
                    'data-value': 'melee',
                    style: `padding:4px 8px; font-size:0.8rem; background:${isMelee ? '#4caf50' : '#ddd'}; border:none; border-radius:4px; cursor:pointer; color:${isMelee ? 'white' : 'black'};`
                }, ['🗡️']),
                h('button', {
                    'data-action': 'update-stat',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-key': key,
                    'data-value': 'ranged',
                    style: `padding:4px 8px; font-size:0.8rem; background:${!isMelee ? '#2196f3' : '#ddd'}; border:none; border-radius:4px; cursor:pointer; color:${!isMelee ? 'white' : 'black'};`
                }, ['🏹'])
            ]);
        }

        // Boolean Stats
        if (typeof val === 'boolean') {
            return h('div', { className: 'asset-stat-box', title: key }, [
                h('span', { style: 'font-size:1.1rem;' }, [icon]),
                h('input', {
                    type: 'checkbox',
                    checked: val,
                    'data-action': 'update-stat',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-key': key,
                    'data-capture-value': 'true',
                    style: 'width:18px; height:18px; cursor:pointer;'
                }),
                h('span', { style: 'font-size:0.7rem; color:#444;' }, [key])
            ]);
        }

        // Standard Number Stats
        return h('div', { className: 'asset-stat-box', title: key }, [
            h('span', { style: 'font-size:1.1rem;' }, [icon]),
            h('input', {
                type: 'number',
                value: val,
                'data-action': 'update-stat',
                'data-category': currentCategoryName,
                'data-file': fileName,
                'data-id': item.id,
                'data-key': key,
                'data-capture-value': 'true',
                className: 'asset-input asset-input--small'
            })
        ]);
    });

    const container = h('div', { className: 'asset-flex asset-flex--wrap', style: 'margin:8px 0;' }, statEntries);
    return renderToString(container);
}

function buildEquipmentStatsHtml(item: AssetItem, fileName: string): string {
    const config = window.EquipmentStatsConfig!;
    const itemStats = typeof item.stats === 'object' && item.stats !== null ? item.stats : {};

    const children: HTMLElement[] = [];

    // Weapon Type / Grip Type Section
    if (item.sourceFile === 'weapon' || item.sourceFile === 'signature' || item.slot === 'weapon') {
        const wt = item.weaponType || '';
        const gt = item.gripType || '';

        const weaponSection = h('div', { style: 'background:#1a1a1a; padding:8px; border-radius:6px;' }, [
            h('div', { style: 'font-size:0.7rem; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;' }, ['Weapon Type']),
            h('div', { style: 'display:flex; flex-wrap:wrap; gap:6px;' }, [
                createToggle(wt === 'melee', '🗡️ Melee', '#4caf50', 'update-weapon-meta', { field: 'weaponType', value: 'melee', category: currentCategoryName, file: fileName, id: item.id }),
                createToggle(wt === 'ranged', '🏹 Ranged', '#2196f3', 'update-weapon-meta', { field: 'weaponType', value: 'ranged', category: currentCategoryName, file: fileName, id: item.id }),
                createToggle(wt === 'shield', '🛡️ Shield', '#ff9800', 'update-weapon-meta', { field: 'weaponType', value: 'shield', category: currentCategoryName, file: fileName, id: item.id }),
            ]),

            h('div', { style: 'font-size:0.7rem; color:#888; margin:8px 0 6px; text-transform:uppercase; letter-spacing:1px;' }, ['Grip Type']),
            h('div', { style: 'display:flex; flex-wrap:wrap; gap:6px;' }, [
                createToggle(gt === '1-hand', '✋ 1-Hand', '#9c27b0', 'update-weapon-meta', { field: 'gripType', value: '1-hand', category: currentCategoryName, file: fileName, id: item.id }),
                createToggle(gt === '2-hand', '🤲 2-Hand', '#e91e63', 'update-weapon-meta', { field: 'gripType', value: '2-hand', category: currentCategoryName, file: fileName, id: item.id }),
            ])
        ]);

        // SubType Dropdown
        if (wt && wt !== 'shield') {
            const subtypes = WEAPON_TYPES[wt] || [];
            const currentSubtype = item.weaponSubtype || '';
            const options = subtypes.map(st => h('option', { value: st, selected: st === currentSubtype }, [st.replace(/_/g, ' ')]));

            weaponSection.appendChild(h('div', { style: 'font-size:0.7rem; color:#888; margin:8px 0 6px; text-transform:uppercase; letter-spacing:1px;' }, ['Weapon Subtype']));
            weaponSection.appendChild(h('select', {
                'data-action': 'update-weapon-meta',
                'data-category': currentCategoryName,
                'data-file': fileName,
                'data-id': item.id,
                'data-field': 'weaponSubtype',
                'data-capture-value': 'true',
                style: 'padding:6px 10px; font-size:0.8rem; background:#333; color:white; border:1px solid #555; border-radius:4px; width:100%;'
            }, [
                h('option', { value: '' }, ['-- Select Subtype --']),
                ...options
            ]));
        }

        children.push(weaponSection);
    }

    // Configured Stats Sections
    for (const category of config.categories) {
        const categoryStats = config.getStatsByCategory(category);
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

        const statEls = categoryStats.map(stat => {
            const currentValue = (itemStats as Record<string, unknown>)[stat.key];
            const hasValue = currentValue !== undefined && currentValue !== stat.default;
            const displayValue = currentValue ?? stat.default;
            const iconPath = `/images/ui/${stat.icon}_original.png`;

            if (stat.type === 'boolean') {
                return h('div', {
                    style: `display:flex; align-items:center; gap:4px; padding:4px 8px; background:${hasValue ? '#2a2a2a' : '#222'}; border-radius:4px; opacity:${hasValue ? '1' : '0.6'};`,
                    title: stat.label
                }, [
                    h('img', { src: iconPath, alt: stat.label, style: 'width:20px; height:20px; object-fit:contain;' }),
                    h('input', {
                        type: 'checkbox',
                        checked: displayValue === true,
                        'data-action': 'update-stat',
                        'data-category': currentCategoryName,
                        'data-file': fileName,
                        'data-id': item.id,
                        'data-key': stat.key,
                        'data-capture-value': 'true',
                        style: 'width:16px; height:16px; cursor:pointer;'
                    }),
                    h('span', { style: 'font-size:0.65rem; color:var(--text-dim);' }, [stat.label])
                ]);
            } else {
                return h('div', {
                    style: `display:flex; align-items:center; gap:4px; padding:4px 8px; background:${hasValue ? '#2a2a2a' : '#222'}; border-radius:4px; opacity:${hasValue ? '1' : '0.6'};`,
                    title: stat.label
                }, [
                    h('img', { src: iconPath, alt: stat.label, style: 'width:20px; height:20px; object-fit:contain;' }),
                    h('input', {
                        type: 'number',
                        value: displayValue,
                        step: '0.1',
                        'data-action': 'update-stat',
                        'data-category': currentCategoryName,
                        'data-file': fileName,
                        'data-id': item.id,
                        'data-key': stat.key,
                        'data-capture-value': 'true',
                        style: `width:55px; padding:3px; font-size:0.8rem; background:#333; color:var(--text); border:1px solid ${hasValue ? '#555' : '#333'}; border-radius:3px; text-align:center;`
                    })
                ]);
            }
        });

        children.push(h('div', { style: 'background:#1a1a1a; padding:8px; border-radius:6px;' }, [
            h('div', { style: 'font-size:0.7rem; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;' }, [categoryLabel]),
            h('div', { style: 'display:flex; flex-wrap:wrap; gap:6px;' }, statEls)
        ]));
    }

    const container = h('div', { style: 'display:flex; flex-direction:column; gap:8px; margin:8px 0;' }, children);
    return renderToString(container);
}

function createToggle(isActive: boolean, label: string, activeColor: string, action: string, data: Record<string, string>): HTMLElement {
    const props: Record<string, string> = {
        'data-action': action,
        style: `padding:6px 12px; font-size:0.8rem; background:${isActive ? activeColor : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;`
    };
    Object.entries(data).forEach(([k, v]) => props[`data-${k}`] = v);

    return h('button', props, [label]);
}
