import { h, renderToString } from '../domBuilder';
import { AssetItem, currentCategoryName } from '../state';

export function buildActionsHtml(item: AssetItem, safeId: string, fileName: string, hasImage: boolean): string {
    if (item.status === 'pending' || (item.status === 'approved' && hasImage)) {
        const container = [
            h('input', {
                type: 'text',
                id: `note_${safeId}`,
                placeholder: 'Decline reason...',
                className: 'notes-input'
            }),
            h('div', { className: 'asset-actions' }, [
                h('button', {
                    className: 'approve',
                    'data-action': 'approve-item',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id
                }, ['✓ Approve']),
                h('button', {
                    className: 'decline',
                    'data-action': 'decline-item',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-safe-id': safeId
                }, ['✗ Decline'])
            ])
        ];
        return container.map(el => renderToString(el)).join('');
    } else if (item.status === 'declined') {
        const container = [
            h('div', {
                style: 'font-size:0.7rem; color:var(--ink-red); margin-top:0.3rem; font-style:italic;'
            }, ['📝 ', item.declineNote || 'No reason']),
            h('div', { className: 'asset-actions' }, [
                h('button', {
                    className: 'approve',
                    'data-action': 'approve-item',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id
                }, ['✓ Re-approve'])
            ])
        ];
        return container.map(el => renderToString(el)).join('');
    } else if (item.status === 'clean') {
        const container = [
            h('input', {
                type: 'text',
                id: `note_${safeId}`,
                placeholder: 'Remake instructions...',
                className: 'notes-input'
            }),
            h('div', { className: 'asset-actions' }, [
                h('button', {
                    className: 'secondary',
                    'data-action': 'remake-item',
                    'data-category': currentCategoryName,
                    'data-file': fileName,
                    'data-id': item.id,
                    'data-safe-id': safeId,
                    style: 'background:var(--brass); color:white;'
                }, ['🔄 Remake'])
            ])
        ];
        return container.map(el => renderToString(el)).join('');
    }
    return '';
}
