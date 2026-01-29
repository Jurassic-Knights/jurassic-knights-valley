import { h, renderToString } from '../domBuilder';
import { AssetItem, sfxRegenerationQueue, HERO_SFX_TYPES } from '../state';

export function buildSfxHtml(item: AssetItem): string {
    if (!item.sfx) return '';
    const sfxEntries = Object.entries(item.sfx).map(([sfxType, sfxData]) => {
        let sfxId: string;
        let status: string;
        if (typeof sfxData === 'string') {
            sfxId = sfxData;
            status = 'approved';
        } else {
            sfxId = sfxData.id;
            status = sfxData.status || 'pending';
        }

        if (status === 'approved' || status === 'clean') {
            return h('button', {
                'data-action': 'play-sound',
                'data-id': sfxId,
                style: 'padding:3px 6px; font-size:0.65rem; background:#4caf50; border:none; border-radius:4px; cursor:pointer; color:white;',
                title: `Play ${sfxId}`
            }, [`🔊 ${sfxType}`]);
        }
        return h('span', {
            style: 'padding:3px 6px; font-size:0.65rem; background:#666; border-radius:4px; color:#aaa;',
            title: `${sfxId}: ${status}`
        }, [`🔇 ${sfxType}`]);
    });

    const sfxIds = Object.values(item.sfx).map((s) => (typeof s === 'string' ? s : s.id));
    const isInQueue = sfxRegenerationQueue.some((q) => q.assetId === item.id);

    const regenBtn = isInQueue
        ? h('span', {
            style: 'padding:3px 6px; font-size:0.65rem; background:#666; border:none; border-radius:4px; color:#aaa;',
            title: 'Already marked for regeneration'
        }, ['✓ Queued'])
        : h('button', {
            'data-action': 'mark-all-sfx',
            // Note: complex objects like arrays are hard to pass in data attributes.
            // We might need a specialized handler or just JSON stringify safely.
            // But ActionDelegator expects simple strings. 
            // Actually markAllSfxForRegeneration takes (assetId, sfxIds[], btn).
            // Let's defer this complex one or hack it with JSON.
            // Strategy: Store the IDs on the element as a dataset property that we parse.
            'data-asset-id': item.id,
            'data-sfx-ids': JSON.stringify(sfxIds),
            style: 'padding:3px 6px; font-size:0.65rem; background:#ff9800; border:none; border-radius:4px; cursor:pointer; color:white;',
            title: 'Mark all sounds for regeneration'
        }, ['🔄 Regen']);

    const container = h('div', { style: 'display:flex; gap:4px; flex-wrap:wrap; margin:4px 0;' }, [...sfxEntries, regenBtn]);
    return renderToString(container);
}

export function buildVfxHtml(item: AssetItem): string {
    if (!item.vfx) return '';
    const pendingVfx = Object.entries(item.vfx).filter(([, v]) => v.status === 'pending');
    if (pendingVfx.length === 0) return '';

    // Warn about missing VFX
    const container = h('div', {
        style: 'font-size:0.65rem; color:#ff9800; margin:4px 0;'
    }, ['🎬 Missing VFX: ', pendingVfx.map(([k]) => k).join(', ')]);

    return renderToString(container);
}

export function buildHeroSfxHtml(item: AssetItem, _fileName: string): string {
    const existingSfx = item.sfx || {};

    const sfxButtons = HERO_SFX_TYPES.map((sfxType) => {
        const sfxData = existingSfx[sfxType];

        if (sfxData) {
            let sfxId: string;
            let status: string;
            if (typeof sfxData === 'string') {
                sfxId = sfxData;
                status = 'approved';
            } else {
                sfxId = sfxData.id;
                status = sfxData.status || 'pending';
            }

            if (status === 'approved' || status === 'clean') {
                return h('button', {
                    'data-action': 'play-sound',
                    'data-id': sfxId,
                    style: 'padding:3px 6px; font-size:0.65rem; background:#4caf50; border:none; border-radius:4px; cursor:pointer; color:white;',
                    title: `Play ${sfxId}`
                }, [`🔊 ${sfxType}`]);
            }
            return h('span', {
                style: 'padding:3px 6px; font-size:0.65rem; background:#666; border-radius:4px; color:#aaa;',
                title: `${sfxId}: ${status}`
            }, [`🔇 ${sfxType}`]);
        } else {
            return h('span', {
                style: 'padding:3px 6px; font-size:0.65rem; background:#333; border:1px dashed #666; border-radius:4px; color:#888;',
                title: `No ${sfxType} sound defined`
            }, [`➕ ${sfxType}`]);
        }
    });

    const sfxIds = Object.values(existingSfx).map((s) => (typeof s === 'string' ? s : s.id));
    const isInQueue = sfxRegenerationQueue.some((q) => q.assetId === item.id);

    const regenBtn = isInQueue
        ? h('span', {
            style: 'padding:3px 6px; font-size:0.65rem; background:#666; border:none; border-radius:4px; color:#aaa;',
            title: 'Already marked for regeneration'
        }, ['✓ Queued'])
        : h('button', {
            'data-action': 'mark-all-sfx',
            'data-asset-id': item.id,
            'data-sfx-ids': JSON.stringify(sfxIds),
            style: 'padding:3px 6px; font-size:0.65rem; background:#ff9800; border:none; border-radius:4px; cursor:pointer; color:white;',
            title: 'Mark all sounds for regeneration'
        }, ['🔄 Regen']);

    const container = h('div', { style: 'display:flex; gap:4px; flex-wrap:wrap; margin:4px 0;' }, [...sfxButtons, regenBtn]);
    return renderToString(container);
}
