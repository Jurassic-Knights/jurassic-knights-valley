
import {
    updateCategoryStatus,
    updateConsumedStatus,
    updateItemWeapon,
    updateItemStat,
    updateItemField,
    updateItemTier,
    updateDisplayField,
    updateDisplaySize,
    updateWeaponMeta,
    markSfxForRegeneration,
    markAllSfxForRegeneration,
    saveRegenerationQueueToFile,
    remakeAsset,
} from './api';
import {
    navigateToAsset,
    approveCategoryItem,
    declineCategoryItem,
    remakeCategoryItem,
    approveAsset,
    declineAsset,
    declineAssetPrompt,
    declineCategoryItemById,
    remakeCategoryItemById,
    showCategoryView,
    loadManifest,
    showConfigView,
} from './views';
import { openModal, toggleComparisonView, closeModal } from './modals';
import { playSound } from './AudioManager';
import { showTemplatesView } from './templates';
import { showMapEditorView, saveMapData } from './mapEditorView';
import {
    setCategoryStatusFilter,
    setCategoryBiomeFilter,
    setCategoryTierFilter,
    setCategoryFileFilter,
    setCategoryWeaponTypeFilter,
    setCategoryHandsFilter,
    setCategoryNodeSubtypeFilter,
    setCategoryImageSize,
    setCategorySortOrder,
} from './filters';

// Action Handler Signature
type ActionHandler = (dataset: DOMStringMap, target: HTMLElement) => void | Promise<void>;

const actions: Record<string, ActionHandler> = {
    // Navigation
    'navigate-asset': (d) => navigateToAsset(d.category!, d.id!),
    'navigate-category': (d) => showCategoryView(d.category!),
    'toggle-templates': () => showTemplatesView(),
    'toggle-config': () => showConfigView(),
    'toggle-map-editor': () => showMapEditorView(),
    'refresh-manifest': () => loadManifest(),
    'save-map-data': () => saveMapData(),

    // Status
    'approve-item': (d) => approveCategoryItem(d.category!, d.file!, d.id!),
    'decline-item': (d) => declineCategoryItem(d.category!, d.file!, d.id!, d.safeId!),
    'remake-item': (d) => remakeCategoryItem(d.category!, d.file!, d.id!, d.safeId!),

    // Quick Actions (Legacy Assets)
    'approve-asset': (d) => approveAsset(d.path!),
    'decline-asset': (d) => declineAsset(d.path!, d.name!, d.safeId!),
    'decline-asset-prompt': (d) => declineAssetPrompt(d.path!, d.name!),
    'remake-asset': (d) => remakeAsset(d.path!, d.name!, d.safeId!),

    // Field Updates
    'update-status': (d) => updateCategoryStatus(d.category!, d.file!, d.id!, d.value!),
    // 'update-consumed-status' handled globally below to support notes
    'update-tier': (d) => updateItemTier(d.category!, d.file!, d.id!, parseInt(d.value!)),
    'update-weapon': (d) => updateItemWeapon(d.category!, d.file!, d.id!, d.value!),
    'update-field': (d) => updateItemField(d.category!, d.file!, d.id!, d.field!, parseValue(d.value!)),
    'update-display': (d) => updateDisplayField(d.category!, d.file!, d.id!, d.field!, parseFloat(d.value!)),
    'update-display-size': (d) => updateDisplaySize(d.category!, d.file!, d.id!, parseInt(d.value!)),

    // Stats
    'update-stat': (d) => updateItemStat(d.category!, d.file!, d.id!, d.key!, parseValue(d.value!)),

    // Modals
    'open-modal': (d) => openModal(d.path!, d.name!, d.status!),
    'close-modal': () => closeModal(),
    'toggle-comparison': () => toggleComparisonView(),

    // Audio
    'play-sound': (d) => playSound(d.id!),
    'mark-sfx': (d) => markSfxForRegeneration(d.sfxId!, d.assetId!),
    'mark-all-sfx': (d, t) => markAllSfxForRegeneration(d.assetId!, JSON.parse(d.sfxIds!), t),

    // Filters & Sorting
    'set-category-status': (d) => setCategoryStatusFilter(d.value!),
    'set-category-biome': (d) => setCategoryBiomeFilter(d.value!),
    'set-category-tier': (d) => setCategoryTierFilter(parseInt(d.value!) || d.value!), // Tier can be 'all' (string) or number
    'set-category-file': (d) => setCategoryFileFilter(d.value!),
    'set-category-weapon': (d) => setCategoryWeaponTypeFilter(d.value!),
    'set-category-hands': (d) => setCategoryHandsFilter(d.value!),
    'set-category-subtype': (d) => setCategoryNodeSubtypeFilter(d.value!),
    'set-category-size': (d) => setCategoryImageSize(parseInt(d.value!)),
    'set-category-sort': (d) => setCategorySortOrder(d.value!),

    // Advanced Image Actions (Split View)
    'decline-item-by-id': (d) => declineCategoryItemById(d.category!, d.file!, d.id!, d.noteInputId!),
    'remake-item-by-id': (d) => remakeCategoryItemById(d.category!, d.file!, d.id!, d.noteInputId!),

    // Complex Consumed Status Updates (requires note lookup)
    'update-consumed-status': (d) => {
        const note = d.noteInputId ? (document.getElementById(d.noteInputId) as HTMLInputElement)?.value : '';
        let val = d.value!;
        let finalNote = note;

        // Special handling for 'remake' value in consumed status
        if (val === 'remake') {
            val = 'declined';
            finalNote = 'Remake: ' + (note || 'needs redo');
        }

        updateConsumedStatus(d.category!, d.file!, d.id!, val, finalNote);
    }
};

function parseValue(val: string): string | number | boolean {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val)) && val.trim() !== '') return Number(val);
    return val;
}

export function initEventDelegation() {
    document.body.addEventListener('click', async (e) => {
        const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
        if (!target) return;

        const actionName = target.dataset.action;
        if (actionName && actions[actionName]) {
            e.stopPropagation(); // Prevent bubbling if handled
            try {
                await actions[actionName](target.dataset, target);
            } catch (err) {
                console.error(`[Delegator] Action '${actionName}' failed:`, err);
            }
        }
    });

    // Handle Input Changes (delegated change events)
    document.body.addEventListener('change', async (e) => {
        const target = (e.target as HTMLElement).closest('[data-action]') as HTMLInputElement | HTMLSelectElement;
        if (!target) return;

        const actionName = target.dataset.action;
        // For inputs, we often want to use the input's current value as the payload
        // Override dataset.value with actual input value
        if (target.dataset.captureValue === 'true') {
            target.dataset.value = target.value;
        }

        if (actionName && actions[actionName]) {
            try {
                await actions[actionName](target.dataset, target);
            } catch (err) {
                console.error(`[Delegator] Change Action '${actionName}' failed:`, err);
            }
        }
    });
}
