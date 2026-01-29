import { h, renderToString } from '../domBuilder';
import { AssetItem, currentCategoryName } from '../state';

export function buildSplitImageHtml(
    item: AssetItem,
    imgPath: string,
    consumedPath: string,
    safeId: string,
    fileName: string
): string {
    const displayPath = imgPath.replace(/^assets\/images\//, '');
    const fullImgUrl = `/images/${displayPath}`;
    const consumedDisplayPath = consumedPath.replace(/^assets\/images\//, '');
    const consumedImgUrl = `/images/${consumedDisplayPath}`;
    const consumedStatus = item.consumedStatus || item.status || 'pending';
    const fullStatus = item.status || 'pending';
    const fullDesc = item.sourceDescription || '';
    const consumedDesc = item.consumedSourceDescription || '';

    // Helper for description preview
    const createDescPreview = (desc: string) => {
        if (!desc) return null;
        return h('div', {
            style: 'font-size:0.5rem; color:var(--accent-yellow); margin:2px 0; max-height:2.5em; overflow:hidden; text-overflow:ellipsis;',
            title: desc
        }, ['📝 ', desc.substring(0, 50), '...']);
    };

    const fullDescPreview = fullStatus !== 'approved' ? createDescPreview(fullDesc) : null;
    const consumedDescPreview = consumedStatus !== 'approved' ? createDescPreview(consumedDesc) : null;

    // Helper for status label color
    const getStatusColor = (status: string) => {
        if (status === 'approved') return '#4caf50';
        if (status === 'declined') return '#f44336';
        if (status === 'clean') return '#64b5f6';
        return '#d4a017';
    };

    const createPane = (imgUrl: string, status: string, label: string, labelColor: string, descPreview: HTMLElement | null, suffix: string, updateFunction: string) => {
        return h('div', { className: 'split-card__pane' }, [
            h('div', { style: 'position:relative;' }, [
                h('img', {
                    src: imgUrl,
                    alt: `${item.name} (${label})`,
                    'data-action': 'open-modal',
                    'data-path': imgUrl,
                    'data-name': `${item.name} (${label})`,
                    'data-status': status,
                    style: 'width:100%; aspect-ratio:1; object-fit:cover; background:#fff; cursor:pointer; border-radius:4px;'
                }),
                h('span', {
                    className: 'asset-overlay__label asset-overlay__label--top-left',
                    style: `background:${labelColor}; color:white;`
                }, [label])
            ]),
            descPreview,
            h('div', {
                style: `font-size:0.55rem; text-align:center; margin:2px 0; color:${getStatusColor(status)};`
            }, [status.toUpperCase()]),
            h('input', {
                type: 'text',
                id: `note_${suffix}_${safeId}`,
                placeholder: 'Note...',
                className: 'notes-input'
            }),
            h('div', { className: 'asset-flex asset-flex--grow', style: 'gap:2px;' }, [
                h('button', {
                    'data-action': updateFunction === 'updateConsumedStatus' ? 'update-consumed-status' : 'update-status',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-value': 'approved',
                    style: 'flex:1; padding:2px; font-size:0.55rem; background:#4caf50; border:none; border-radius:3px; color:white; cursor:pointer;'
                }, ['✓']),
                h('button', {
                    'data-action': updateFunction === 'updateConsumedStatus' ? 'update-consumed-status' : 'decline-item-by-id',
                    // Note: decline-item-by-id is not in delegator yet, it handles note lookup.
                    // Actually, update-consumed-status needs note lookup too?
                    // The old code: 
                    // updateConsumedStatus(..., 'declined', document.getElementById('note_...').value)
                    // declineCategoryItemById(..., 'note_...')
                    // Delegation cannot easily read sibling/id inputs unless we pass the ID.
                    // Strategy: Pass the NOTE INPUT ID in `data-note-input-id`.
                    // And update Delegator to looking it up.
                    'data-note-input-id': `note_${suffix}_${safeId}`,
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-value': 'declined',
                    style: 'flex:1; padding:2px; font-size:0.55rem; background:#f44336; border:none; border-radius:3px; color:white; cursor:pointer;'
                }, ['✗']),
                h('button', {
                    'data-action': updateFunction === 'updateConsumedStatus' ? 'update-consumed-status' : 'remake-item-by-id',
                    'data-note-input-id': `note_${suffix}_${safeId}`,
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-value': 'remake', // special handling needed?
                    // Old code for remake:
                    // updateConsumedStatus(..., 'declined', 'Remake: ' + value)
                    // remakeCategoryItemById(...)
                    style: 'flex:1; padding:2px; font-size:0.55rem; background:#bf9b30; border:none; border-radius:3px; color:white; cursor:pointer;'
                }, ['🔄'])
            ])
        ]);
    };

    const fullPane = createPane(fullImgUrl, fullStatus, 'FULL', '#4caf50', fullDescPreview, 'full', 'updateCategoryStatus');
    const consumedPane = createPane(consumedImgUrl, consumedStatus, 'EMPTY', '#f44336', consumedDescPreview, 'consumed', 'updateConsumedStatus');

    const container = h('div', { className: 'split-card' }, [fullPane, consumedPane]);

    return renderToString(container);
}
