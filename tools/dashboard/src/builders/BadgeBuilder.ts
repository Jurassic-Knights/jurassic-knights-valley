import { h, renderToString } from '../domBuilder';
import { AssetItem, currentCategoryName } from '../state';

const BIOME_ICONS: Record<string, string> = {
    grasslands: '🌿',
    tundra: '❄️',
    desert: '🏜️',
    badlands: '🌋',
    all: '🌍'
};

const EXTRA_BIOME_COLORS: Record<string, string> = {
    grasslands: '#4caf50',
    tundra: '#00bcd4',
    desert: '#ff9800',
    badlands: '#f44336',
    all: '#666'
};

const TYPE_ICONS: Record<string, string> = {
    dinosaur: '🦖',
    herbivore: '🦕',
    human: '👤',
    saurian: '🦎',
    boss: '👑',
    melee: '🗡️',
    ranged: '🏹',
    enemy: '💀',
};

const TIER_COLORS: Record<number, string> = {
    1: '#9e9e9e',
    2: '#4caf50',
    3: '#2196f3',
    4: '#9c27b0'
};

function getBiomeIcon(biome: string | undefined): string {
    return BIOME_ICONS[biome || ''] || '🌍';
}

function getTypeIcon(type: string | undefined): string {
    return TYPE_ICONS[type || ''] || '📦';
}

export function buildBadgesHtml(item: AssetItem, fileName: string): string {
    const biomeIcon = getBiomeIcon(item.biome);
    const typeIcon = getTypeIcon(item.enemyType || item.type);

    const tierMatch = item.id?.match(/_t(\d)_/);
    const tier = item.tier || (tierMatch ? parseInt(tierMatch[1]) : null);

    if (!item.biome && !item.enemyType && !item.type && !tier) return '';

    const bColor = EXTRA_BIOME_COLORS[item.biome || ''] || '#666';

    const tierDropdown = tier
        ? h('select', {
            className: 'tier-badge',
            onchange: `updateItemTier('${currentCategoryName}', '${fileName}', '${item.id}', parseInt(this.value))`,
            style: `background:${TIER_COLORS[tier] || '#666'} !important;`
        }, [
            h('option', { value: 1, selected: tier === 1, style: 'background:#9e9e9e;' }, ['T1']),
            h('option', { value: 2, selected: tier === 2, style: 'background:#4caf50;' }, ['T2']),
            h('option', { value: 3, selected: tier === 3, style: 'background:#2196f3;' }, ['T3']),
            h('option', { value: 4, selected: tier === 4, style: 'background:#9c27b0;' }, ['T4'])
        ])
        : null;

    const biomeBadge = item.biome
        ? h('span', { className: 'asset-badge', style: `background:${bColor};` }, [biomeIcon, ' ', item.biome])
        : null;

    const typeBadge = (item.enemyType || item.type)
        ? h('span', { className: 'asset-badge asset-badge--light' }, [typeIcon, ' ', item.enemyType || item.type])
        : null;

    const container = h('div', { className: 'asset-flex asset-flex--wrap', style: 'margin:4px 0;' }, [
        tierDropdown,
        biomeBadge,
        typeBadge
    ]);

    return renderToString(container);
}
