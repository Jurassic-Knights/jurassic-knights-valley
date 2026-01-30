/**
 * Dashboard API Module
 * All server communication functions
 */

import {
    setManifest,
    setDeclineNotes,
    setAssetPrompts,
    setMissingAssets,
    setCategoryData,
    setCurrentCategoryName,
    globalAssetLookup,
    setGlobalAssetLookup,
    setLootSourceMap,
    sfxRegenerationQueue,
    setSfxRegenerationQueue,
    currentCategoryName,
    categoryData,
    type AssetItem,
    type CategoryData,
    type AssetInfo,
} from './state';
import { renderCategoryView } from './categoryRenderer';

// ============================================
// BROADCAST CHANNEL
// ============================================

// Channel for sending updates to the game window
const entityChannel = new BroadcastChannel('game-entity-updates');

function broadcastUpdate(category: string, id: string, updates: Record<string, unknown>) {
    console.log(`[Dashboard] Broadcasting update for ${category}/${id}`, updates);
    entityChannel.postMessage({
        type: 'ENTITY_UPDATE',
        category,
        id,
        updates
    });
}

// ============================================
// API FUNCTIONS
// ============================================

export async function fetchCategory(categoryName: string): Promise<CategoryData> {
    const response = await fetch('/api/get_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName }),
    });
    return response.json();
}

export async function fetchEntities(): Promise<unknown> {
    const response = await fetch('/api/get_entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
    });
    return response.json();
}

export async function changeStatus(path: string, newStatus: string): Promise<void> {
    await fetch('/api/change_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, newStatus }),
    });
}

export async function saveNotes(assetName: string, notes: string): Promise<void> {
    await fetch('/api/save_notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: assetName, notes }),
    });
}

export async function updateCategoryStatus(
    category: string,
    fileName: string,
    itemId: string,
    newStatus: string,
    note = ''
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { status: newStatus, declineNote: note },
            }),
        });
        const result = await response.json();

        if (result.success) {
            // Update local state
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    item.status = newStatus as AssetItem['status'];
                    if (note) item.declineNote = note;
                }
            }
            renderCategoryView();
            console.log(`[Dashboard] Updated ${itemId} status to ${newStatus}`);
            broadcastUpdate(category, itemId, { status: newStatus, declineNote: note });
        } else {
            console.error('[Dashboard] Update failed:', result.error);
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function updateConsumedStatus(
    category: string,
    fileName: string,
    itemId: string,
    newStatus: string,
    note = ''
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { consumedStatus: newStatus, consumedDeclineNote: note },
            }),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    item.consumedStatus = newStatus;
                }
            }
            renderCategoryView();
            console.log(`[Dashboard] Updated ${itemId} consumed status to ${newStatus}`);
            broadcastUpdate(category, itemId, { consumedStatus: newStatus, consumedDeclineNote: note });
        } else {
            console.error('[Dashboard] Update failed:', result.error);
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function updateItemWeapon(
    category: string,
    fileName: string,
    itemId: string,
    newWeapon: string
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { weaponType: newWeapon },
            }),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    item.weaponType = newWeapon;
                }
            }
            console.log(`[Dashboard] Updated ${itemId} weapon to ${newWeapon}`);
            broadcastUpdate(category, itemId, { weaponType: newWeapon });
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function updateItemStat(
    category: string,
    fileName: string,
    itemId: string,
    statKey: string,
    newValue: unknown
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { [`stats.${statKey}`]: newValue },
            }),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item && typeof item.stats === 'object' && item.stats !== null) {
                    (item.stats as Record<string, unknown>)[statKey] = newValue;
                }
            }
            console.log(`[Dashboard] Updated ${itemId} stat ${statKey} to ${newValue}`);
            broadcastUpdate(category, itemId, { [`stats.${statKey}`]: newValue });
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function updateItemField(
    category: string,
    fileName: string,
    itemId: string,
    field: string,
    value: unknown
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { [field]: value },
            }),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    (item as unknown as Record<string, unknown>)[field] = value;
                }
            }
            console.log(`[Dashboard] Updated ${itemId} field ${field}`);
            broadcastUpdate(category, itemId, { [field]: value });
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function updateItemTier(
    category: string,
    fileName: string,
    itemId: string,
    newTier: number
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { tier: newTier },
            }),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    item.tier = newTier;
                }
            }
            renderCategoryView();
            console.log(`[Dashboard] Updated ${itemId} tier to ${newTier}`);
            broadcastUpdate(category, itemId, { tier: newTier });
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function updateDisplayField(
    category: string,
    fileName: string,
    itemId: string,
    field: string,
    value: number
): Promise<void> {
    console.log(`[Dashboard][updateDisplayField] CALLED with:`, { category, fileName, itemId, field, value });
    try {
        const payload = {
            category,
            file: fileName,
            id: itemId,
            updates: { [`display.${field}`]: value },
        };
        console.log(`[Dashboard][updateDisplayField] Sending to /api/update_entity:`, JSON.stringify(payload));

        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        console.log(`[Dashboard][updateDisplayField] Response:`, result);

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    if (!item.display) item.display = {};
                    (item.display as Record<string, number>)[field] = value;
                }
            }
            console.log(`[Dashboard] ✓ Updated ${itemId} display.${field} to ${value}`);
            broadcastUpdate(category, itemId, { [`display.${field}`]: value });
        } else {
            console.error(`[Dashboard] ✗ Update failed:`, result.error || result);
        }
    } catch (err) {
        console.error('[Dashboard] API error in updateDisplayField:', err);
    }
}

export async function updateDisplaySize(
    category: string,
    fileName: string,
    itemId: string,
    size: number
): Promise<void> {
    try {
        const payload = {
            category,
            file: fileName,
            id: itemId,
            updates: {
                'display.width': size,
                'display.height': size
            },
        };

        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    if (!item.display) item.display = {};
                    item.display.width = size;
                    item.display.height = size;
                }
            }
            broadcastUpdate(category, itemId, { 'display.width': size, 'display.height': size });
            renderCategoryView();
        }
    } catch (err) {
        console.error('[Dashboard] API error in updateDisplaySize:', err);
    }
}


export async function updateWeaponMeta(
    category: string,
    fileName: string,
    itemId: string,
    field: string,
    value: string
): Promise<void> {
    try {
        const response = await fetch('/api/update_entity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category,
                file: fileName,
                id: itemId,
                updates: { [field]: value },
            }),
        });
        const result = await response.json();

        if (result.success) {
            const files = categoryData?.files;
            if (files && files[fileName]) {
                const item = files[fileName].find((i) => i.id === itemId);
                if (item) {
                    (item as unknown as Record<string, unknown>)[field] = value;
                }
            }
            renderCategoryView();
            console.log(`[Dashboard] Updated ${itemId} ${field} to ${value}`);
            broadcastUpdate(category, itemId, { [field]: value });
        }
    } catch (err) {
        console.error('[Dashboard] API error:', err);
    }
}

export async function remakeAsset(path: string, name: string, safeId: string): Promise<void> {
    const noteInput = document.getElementById(`notes_${safeId}`) as HTMLInputElement | null;
    const note = noteInput?.value || 'Remake requested';

    try {
        await fetch('/api/change_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, newStatus: 'declined' }),
        });
        await saveNotes(name, `Remake: ${note}`);
        console.log(`[Dashboard] Marked ${name} for remake`);
    } catch (err) {
        console.error('[Dashboard] Remake error:', err);
    }
}



export async function syncEntitiesToJson(): Promise<void> {
    try {
        const btn = document.getElementById('btnSyncEntities') as HTMLButtonElement | null;
        if (btn) {
            btn.disabled = true;
            btn.textContent = '🔄 Syncing...';
        }

        const response = await fetch('/api/sync_entities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const result = await response.json();

        if (btn) {
            btn.disabled = false;
            btn.textContent = '📦 Sync Entities';
        }

        if (result.success) {
            console.log('[Dashboard] Entity sync complete:', result.message);
            alert(`✓ ${result.message}`);
        } else {
            console.error('[Dashboard] Entity sync failed:', result.error);
            alert(`✗ Sync failed: ${result.error}`);
        }
    } catch (err) {
        console.error('[Dashboard] Entity sync error:', err);
    }
}

export async function loadGlobalAssetLookup(): Promise<void> {
    try {
        const categories = [
            'resources', 'items', 'equipment', 'nodes',
            'enemies', 'bosses', 'props', 'buildings'
        ];
        const lookup: Record<string, AssetInfo> = {};
        const sourceMap: Record<string, string[]> = {};

        for (const cat of categories) {
            const response = await fetch('/api/get_category', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: cat }),
            });
            const data = await response.json();

            // Helper to process an item for lookup key and source map
            const processItem = (item: any) => {
                // 1. Build Lookup
                const imgPath = item.files?.clean || item.files?.original;
                if (imgPath) {
                    const displayPath = imgPath.replace(/^(assets\/)?images\//, '');
                    lookup[item.id] = {
                        id: item.id,
                        path: displayPath,
                        name: item.name,
                        category: cat,
                    };
                    if (item.name) {
                        lookup[item.name] = lookup[item.id];
                    }
                }

                // 2. Build Loot Source Map
                // A. Check LOOT (Enemies)
                if (item.loot && Array.isArray(item.loot)) {
                    for (const drop of item.loot) {
                        if (!sourceMap[drop.item]) sourceMap[drop.item] = [];
                        if (!sourceMap[drop.item].includes(item.id)) {
                            sourceMap[drop.item].push(item.id);
                        }
                    }
                }

                // B. Check DROPS (Nodes - New Standard)
                if (item.drops && Array.isArray(item.drops)) {
                    for (const drop of item.drops) {
                        const dropId = drop.item;
                        if (!sourceMap[dropId]) sourceMap[dropId] = [];
                        if (!sourceMap[dropId].includes(item.id)) {
                            sourceMap[dropId].push(item.id);
                        }
                    }
                }

                // C. Check RECIPE (Items - Reverse Ingredient Lookup)
                if (item.recipe) {
                    // Logic to extract ingredients from recipe string/object/array
                    // Simplified: just check if we can parse it easily
                    let ingredients: string[] = [];
                    if (Array.isArray(item.recipe)) {
                        ingredients = item.recipe.map((r: any) => r.item);
                    } else if (typeof item.recipe === 'object') {
                        ingredients = Object.keys(item.recipe);
                    }
                    // String parsing is safer done elsewhere or simplified here

                    for (const ing of ingredients) {
                        if (!sourceMap[ing]) sourceMap[ing] = [];
                        if (!sourceMap[ing].includes(item.id)) {
                            sourceMap[ing].push(item.id); // "Used To Craft" relationship
                        }
                    }
                }

                // D. Check RESOURCE DROP (Nodes - Legacy)
                if (item.resourceDrop) {
                    if (!sourceMap[item.resourceDrop]) sourceMap[item.resourceDrop] = [];
                    if (!sourceMap[item.resourceDrop].includes(item.id)) {
                        sourceMap[item.resourceDrop].push(item.id);
                    }
                }
            };

            // Process 'files' (scanned from disk)
            if (data.files) {
                for (const [, items] of Object.entries(data.files as Record<string, AssetItem[]>)) {
                    for (const item of items) {
                        processItem(item);
                    }
                }
            }

            // Process 'entities' (code definitions, source of truth for logic)
            if (data.entities && Array.isArray(data.entities)) {
                for (const item of data.entities) {
                    processItem(item);
                }
            }
        }

        setGlobalAssetLookup(lookup);
        setLootSourceMap(sourceMap);
        console.log(`[Dashboard] Loaded ${Object.keys(lookup).length} assets and ${Object.keys(sourceMap).length} drop keys`);
    } catch (err) {
        console.error('[Dashboard] Failed to load asset lookup:', err);
    }
}

export function getAssetImage(nameOrId: string): string {
    const info = globalAssetLookup[nameOrId];
    return info ? `/images/${info.path}` : '/images/PH.png';
}

export function getAssetInfo(nameOrId: string): AssetInfo | null {
    return globalAssetLookup[nameOrId] || null;
}

// ============================================
// SFX REGENERATION QUEUE
// ============================================

export async function saveRegenerationQueueToFile(): Promise<void> {
    try {
        await fetch('/api/save_sfx_queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queue: sfxRegenerationQueue }),
        });
    } catch (err) {
        console.error('[Dashboard] Failed to save SFX queue:', err);
    }
}

export function markSfxForRegeneration(sfxId: string, assetId: string): void {
    const existing = sfxRegenerationQueue.find((q) => q.assetId === assetId);
    if (existing) {
        if (!existing.sfxIds.includes(sfxId)) {
            existing.sfxIds.push(sfxId);
        }
    } else {
        sfxRegenerationQueue.push({ assetId, sfxIds: [sfxId] });
    }
    setSfxRegenerationQueue([...sfxRegenerationQueue]);
    saveRegenerationQueueToFile();
}

export function markAllSfxForRegeneration(
    assetId: string,
    sfxIds: string[],
    btnElement?: HTMLElement
): void {
    const existing = sfxRegenerationQueue.find((q) => q.assetId === assetId);
    if (existing) {
        sfxIds.forEach((id) => {
            if (!existing.sfxIds.includes(id)) {
                existing.sfxIds.push(id);
            }
        });
    } else {
        sfxRegenerationQueue.push({ assetId, sfxIds: [...sfxIds] });
    }
    setSfxRegenerationQueue([...sfxRegenerationQueue]);
    saveRegenerationQueueToFile();

    if (btnElement) {
        btnElement.textContent = '✓ Queued';
        btnElement.style.background = '#666';
        (btnElement as HTMLButtonElement).disabled = true;
    }
}

export function getSfxRegenerationQueue(): typeof sfxRegenerationQueue {
    return sfxRegenerationQueue;
}

export function clearSfxRegenerationQueue(): void {
    setSfxRegenerationQueue([]);
    saveRegenerationQueueToFile();
}
