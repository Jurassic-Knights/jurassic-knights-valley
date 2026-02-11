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
    saveAssetPrompt
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
    showConfigView
} from './views';
import { openModal, toggleComparisonView, closeModal } from './modals';
import { playSound } from './AudioManager';
import { showTemplatesView } from './templates';
import { showMapEditorView, saveMapFromPanel } from './mapEditorView';
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
    resetCategoryFilters
} from './filters';
import {
    setSelectedAssetId,
    setCurrentInspectorTab,
    setImageParam,
    categoryData,
    assetPrompts,
    selectedAssetId
} from './state';
import { renderCategoryView } from './categoryRenderer';
import { renderInspector } from './inspectorRenderer';

// Helper to switch tabs in inspector
function switchInspectorTab(tabName: string, target: HTMLElement) {
    // 0. Update State
    setCurrentInspectorTab(tabName);

    // 1. Update Buttons
    const container = target.closest('.inspector-tabs');
    if (container) {
        container.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        target.classList.add('active');
    }

    // 2. toggle Content
    const inspector = document.getElementById('inspectorPanel'); // Check if ID is correct, inspectorRenderer uses ID 'inspectorContent' but parent is probably panel
    // Actually inspectorRenderer uses 'inspectorContent'. Let's check where 'inspectorPanel' is coming from.
    // The previous code had 'inspectorPanel'. I will assume it renders into a container.
    // However, looking at inspectorRenderer.ts: const container = document.getElementById('inspectorContent');
    // So we should query inside 'inspectorContent' or just query document.

    // Safer to query document for the active content
    document
        .querySelectorAll('.tab-content')
        .forEach((el) => ((el as HTMLElement).style.display = 'none'));
    const activeContent = document.getElementById(`tab-${tabName}`);
    if (activeContent) activeContent.style.display = 'block';
}

// Action Handler Signature
type ActionHandler = (dataset: DOMStringMap, target: HTMLElement) => void | Promise<void>;

const actions: Record<string, ActionHandler> = {
    // Navigation
    'navigate-asset': (d) => navigateToAsset(d.category!, d.id!),
    'navigate-category': (d) => showCategoryView(d.category!),
    'toggle-templates': () => showTemplatesView(),
    'toggle-config': () => showConfigView(),
    'toggle-map-editor': () => {
        const container = document.getElementById('map-editor-container');
        if (container && container.style.display === 'block') {
            // It's open, so close it (go back to manifest/dashboard)
            // Just simulate navigating back or loading manifest
            import('./views').then(({ loadManifest }) => {
                loadManifest();
            });
            import('./mapEditorView').then(({ hideMapEditorView }) => {
                hideMapEditorView();
            });
            // Update URL to remove view=map
            // loadManifest does this? loadManifest sets view=dashboard implicitly?
            // loadManifest currently pushes state? Let's check views.ts logic if needed.
            // For now, loadManifest is the safe "home" action.
        } else {
            showMapEditorView();
        }
    },
    'refresh-manifest': () => loadManifest(),
    'save-map-data': () => saveMapFromPanel(),

    // Selection & Inspector
    'select-asset': (d) => {
        setSelectedAssetId(d.id!);
        // Re-render grid to update selection highlight
        renderCategoryView();
        // Render inspector
        renderInspector();
    },
    'switch-tab': (d, t) => switchInspectorTab(d.tab!, t),
    'copy-id': (d) => {
        navigator.clipboard.writeText(d.id!);
        // Visual feedback?
        console.log('Copied ID:', d.id);
    },

    // Status
    'approve-item': (d) => approveCategoryItem(d.category!, d.file!, d.id!),
    'decline-item': (d) => declineCategoryItem(d.category!, d.file!, d.id!, d.safeId!),
    'remake-item': (d) => remakeCategoryItem(d.category!, d.file!, d.id!, d.safeId!),

    // Quick Actions (Legacy Assets)
    'approve-asset': (d) => approveAsset(d.path!),
    'decline-asset': (d) => declineAsset(d.path!, d.name!, d.safeId!),
    'decline-asset-prompt': (d) => declineAssetPrompt(d.path!, d.name!),
    'remake-asset': (d) => remakeAsset(d.path!, d.name!, d.safeId!),

    // Quick Actions (Category Cards)
    'quick-approve': async (d, t) => {
        // Prevent selecting the card when clicking the button
        // (Handled by stopPropagation in delegator, but good to note)
        await approveCategoryItem(d.category!, d.file!, d.id!);
    },
    'quick-decline': async (d, t) => {
        // Try to find a sibling input in the card footer
        const footer = t.closest('.card-footer');
        const input = footer?.querySelector('.feedback-input') as HTMLInputElement;

        const reason = input ? input.value : '';

        // If reason is empty, we still proceed with decline status.
        // User explicitly requested NO POPUP.
        await updateCategoryStatus(d.category!, d.file!, d.id!, 'declined', reason);
    },

    // Field Updates
    'update-status': (d) => updateCategoryStatus(d.category!, d.file!, d.id!, d.value!),
    // 'update-consumed-status' handled globally below to support notes
    'update-tier': (d) => updateItemTier(d.category!, d.file!, d.id!, parseInt(d.value!)),
    'update-weapon': (d) => updateItemWeapon(d.category!, d.file!, d.id!, d.value!),
    'update-field': (d) =>
        updateItemField(d.category!, d.file!, d.id!, d.field!, parseValue(d.value!)),

    'update-prompt': async (d) => {
        const prompt = d.value || '';
        const assetId = d.id!;

        // Optimistic update
        assetPrompts[assetId] = prompt;

        await saveAssetPrompt(assetId, prompt);
        console.log(`[Delegator] Asset prompt saved for ${assetId}`);
    },

    'paste-image-to-path': async (d) => {
        const path = d.path;
        if (!path) {
            alert('No original file path set for this asset. Set one in the source code first.');
            return;
        }

        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    // Same logic as uploadImageFile
                    // Read content
                    await uploadImageFile(
                        await item.getType(
                            item.types.includes('image/png') ? 'image/png' : 'image/jpeg'
                        ),
                        path,
                        d.id
                    ); // d.id might be undefined if not on a card with ID, but path is key.
                    // If d.id is missing, we can try to infer or just pass undefined (grid won't auto-refresh specific card but full render will catch it)
                    return;
                }
            }
            alert('No image found on clipboard!');
        } catch (err) {
            console.error(err);
            alert('Failed to read clipboard. Ensure you accepted permissions.');
        }
    },
    'update-display': (d) =>
        updateDisplayField(d.category!, d.file!, d.id!, d.field!, parseFloat(d.value!)),
    'update-display-size': (d) =>
        updateDisplaySize(d.category!, d.file!, d.id!, parseInt(d.value!)),

    // Stats
    'update-stat': (d) => updateItemStat(d.category!, d.file!, d.id!, d.key!, parseValue(d.value!)),

    // Modals
    'open-modal': (d) => openModal(d.path!, d.name!, d.status!),
    'image-drop-zone': (d) => {
        // If not selected, select it first
        if (d.id && d.id !== selectedAssetId) {
            setSelectedAssetId(d.id);
            renderCategoryView();
            renderInspector();
        } else {
            // If already selected (or no ID), open modal
            openModal(d.path!, d.name!, d.status!);
        }
    },
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
    'set-category-node-subtype': (d) => setCategoryNodeSubtypeFilter(d.value!),
    'set-category-size': (d) => setCategoryImageSize(parseInt(d.value!)),
    'set-category-sort': (d) => setCategorySortOrder(d.value!),
    'reset-filters': () => resetCategoryFilters(),

    // Advanced Image Actions (Split View)
    'decline-item-by-id': (d) =>
        declineCategoryItemById(d.category!, d.file!, d.id!, d.noteInputId!),
    'remake-item-by-id': (d) => remakeCategoryItemById(d.category!, d.file!, d.id!, d.noteInputId!),

    // Complex Consumed Status Updates (requires note lookup)
    'update-consumed-status': (d) => {
        const note = d.noteInputId
            ? (document.getElementById(d.noteInputId) as HTMLInputElement)?.value
            : '';
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

let abortController: AbortController | null = null;

export function disposeDelegation() {
    if (abortController) {
        abortController.abort();
        abortController = null;
        console.log('[Delegator] Cleaned up event listeners');
    }
}

export function initEventDelegation() {
    // Clean up existing if any (prevents dupes)
    disposeDelegation();

    abortController = new AbortController();
    const signal = abortController.signal;

    document.body.addEventListener(
        'click',
        async (e) => {
            // Log all clicks for debugging
            // console.log('[Delegator] Click on:', e.target);

            const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement;
            if (!target) return;

            const actionName = target.dataset.action;
            console.log('[ActionDelegator] Action triggering:', actionName, target.dataset);

            if (actionName && actions[actionName]) {
                e.stopPropagation(); // Prevent bubbling if handled
                try {
                    await actions[actionName](target.dataset, target);
                } catch (err) {
                    console.error(`[Delegator] Action '${actionName}' failed:`, err);
                }
            }
        },
        { signal }
    );

    // Handle Input Changes (delegated change events)
    document.body.addEventListener(
        'input',
        (e) => {
            const target = e.target as HTMLElement;
            if (target && target.matches('textarea.feedback-input')) {
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
            }
        },
        { signal }
    );

    // Drag & Drop Delegation
    document.body.addEventListener(
        'dragover',
        (e) => {
            const trg = e.target as HTMLElement;
            const target = trg.closest('[data-action="image-drop-zone"]');

            // Debug Log - throttling
            if (Math.random() < 0.05) {
                console.log('[DragDebug] Target:', trg.tagName, trg.className, 'Zone:', target);
            }

            if (target) {
                e.preventDefault(); // Allow drop
                e.dataTransfer!.dropEffect = 'copy';
                (target as HTMLElement).style.borderColor = '#2196f3';
                (target as HTMLElement).style.background = '#2196f322';
            }
        },
        { signal }
    );

    document.body.addEventListener(
        'dragleave',
        (e) => {
            const target = (e.target as HTMLElement).closest('[data-action="image-drop-zone"]');
            if (target) {
                (target as HTMLElement).style.borderColor = '#444';
                (target as HTMLElement).style.background = '#1a1a1a';
            }
        },
        { signal }
    );

    document.body.addEventListener(
        'drop',
        async (e) => {
            const trg = e.target as HTMLElement;
            const target = trg.closest('[data-action="image-drop-zone"]') as HTMLElement;

            console.log('[Delegator] DROP Event on:', trg.tagName, trg.className, 'Zone:', target);

            if (target) {
                e.preventDefault();
                e.stopPropagation();
                target.style.borderColor = '#444';
                target.style.background = '#1a1a1a';

                // Check for file
                const path = target.dataset.path;
                const id = target.dataset.id;

                if (!path) {
                    console.warn('[Delegator] Drop: No original file path set.');
                    return;
                }

                if (e.dataTransfer?.files.length) {
                    const file = e.dataTransfer.files[0];
                    if (!file.type.startsWith('image/')) {
                        console.warn('[Delegator] Dropped file is not an image.');
                        return;
                    }

                    // Read & Upload
                    await uploadImageFile(file, path, id);
                }
            }
        },
        { signal }
    );

    document.body.addEventListener(
        'change',
        async (e) => {
            const target = (e.target as HTMLElement).closest('[data-action]') as
                | HTMLInputElement
                | HTMLSelectElement;
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
        },
        { signal }
    );
}

// Utility for Upload
// Utility for Upload
async function uploadImageFile(blob: Blob, path: string, assetId?: string) {
    try {
        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;

            if (!path) return;

            // Show loading state immediately
            if (assetId) {
                const card = document.querySelector(`.asset-card[data-id="${assetId}"]`);
                if (card) {
                    const gridImg = card.querySelector('img.asset-image') as HTMLImageElement;
                    if (gridImg) gridImg.style.opacity = '0.5';
                }
            }
            const inspectorImg = document.querySelector(
                '.inspector-placeholder img, .inspector-content img'
            ) as HTMLImageElement;
            if (inspectorImg) inspectorImg.style.opacity = '0.5';

            // Helper to refresh UI
            const preloadAndRefresh = async (targetPath: string, targetId: string | undefined) => {
                // Normalize path for browser request
                let checkPath = targetPath;
                if (!checkPath.startsWith('/')) checkPath = '/' + checkPath;
                checkPath =
                    '/images/' + checkPath.replace(/^(assets\/)?images\//, '').replace(/^\//, '');

                const timestamp = Date.now();

                // Update state
                if (targetId) setImageParam(targetId, timestamp);

                const checkUrl = `${checkPath}?t=${timestamp}`;
                console.log('[Delegator] Preload checking URL:', checkUrl);

                // Retry logic for Windows FS latency
                const maxAttempts = 20;
                for (let i = 0; i < maxAttempts; i++) {
                    const success = await new Promise<boolean>((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(true);
                        img.onerror = () => resolve(false);
                        img.src = checkUrl;
                    });

                    if (success) {
                        console.log('[Delegator] Preload success! Triggering re-render.');
                        renderCategoryView();
                        renderInspector();
                        return;
                    }
                    await new Promise((r) => setTimeout(r, 250));
                }
                console.warn('[Delegator] Preload failed, forcing render anyway.');
                renderCategoryView();
                renderInspector();
            };

            try {
                // Normalize path for upload (remove leading slash)
                const cleanPath = path.replace(/^\//, '');
                const body = {
                    path: cleanPath,
                    image: base64
                };

                const response = await fetch('/api/upload_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                const result = await response.json();

                if (result.success !== false) {
                    console.log('[Delegator] Image uploaded successfully to:', cleanPath);

                    // --- SYNC CHECK: If uploading Original, also update Clean (if exists) ---
                    if (assetId && typeof categoryData !== 'undefined' && categoryData?.files) {
                        // Find asset
                        let asset: { id: string; [key: string]: unknown } | null = null;
                        for (const list of Object.values(categoryData.files)) {
                            const found = list.find((i: { id: string }) => i.id === assetId);
                            if (found) {
                                asset = found;
                                break;
                            }
                        }

                        if (asset && asset.files) {
                            const originalFile = asset.files.original || '';
                            const cleanFile = asset.files.clean || '';

                            // Check if we just uploaded the Original
                            // Note: cleanPath is relative (images/...), asset.files are relative usually
                            const isOriginal =
                                cleanPath.endsWith(originalFile) ||
                                originalFile.endsWith(cleanPath);

                            if (isOriginal && cleanFile && cleanFile !== originalFile) {
                                console.log('[Delegator] Syncing Clean image:', cleanFile);
                                // Silent upload to clean path
                                await fetch('/api/upload_image', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        path: cleanFile,
                                        image: base64
                                    })
                                }).catch((e) => console.warn('[Delegator] Clean Sync Failed', e));
                            }
                        }
                    }
                    // -----------------------------------------------------------------------

                    // Wait for file system to settle
                    await new Promise((resolve) => setTimeout(resolve, 500));

                    await preloadAndRefresh(path, assetId);
                } else {
                    console.error('[Delegator] Upload failed:', result.message);
                    alert('Upload failed: ' + (result.message || 'Unknown error'));
                    renderCategoryView(); // Restore opacity
                }
            } catch (err) {
                console.error('[Delegator] Upload Exception:', err);
                alert('Upload error occurred');
                renderCategoryView();
            }
        }; // Closes the outer reader.onload
        reader.readAsDataURL(blob); // Use the `blob` parameter here
    } catch (err) {
        console.error('[Delegator] Upload Exception:', err);
        alert('Upload error occurred');
        renderCategoryView();
    }
}
