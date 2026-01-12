/**
 * Dashboard API Module
 * All server communication functions
 */

// Fetch category data from server
async function fetchCategory(categoryName) {
    const resp = await fetch('/api/get_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName })
    });
    return await resp.json();
}

// Change asset status (approve/decline)
async function changeStatus(path, newStatus) {
    const resp = await fetch('/api/change_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, newStatus })
    });
    return await resp.json();
}

// Save decline notes
async function saveNotes(assetName, notes) {
    await fetch('/api/save_notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetName, notes })
    });
    declineNotes[assetName] = notes;
}

// Update category item status
async function updateCategoryStatus(category, fileName, itemId, newStatus, note = '') {
    try {
        const payload = { category, file: fileName, id: itemId, status: newStatus, note };
        const response = await fetch('/api/update_category_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            // Update the card in-place
            const safeId = itemId.replace(/[^a-zA-Z0-9]/g, '_');
            const card = document.querySelector(`[data-item-id="${safeId}"]`);
            if (card && categoryData && categoryData.files && categoryData.files[fileName]) {
                const item = categoryData.files[fileName].find(i => i.id === itemId);
                if (item) {
                    item.status = newStatus;
                    if (note) item.declineNote = note;
                    const newCard = createCategoryCard(item, fileName);
                    newCard.dataset.itemId = safeId;
                    card.replaceWith(newCard);
                }
            }
        } else {
            alert('Failed: ' + result.error);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error updating status');
    }
}

// Update consumed version status
async function updateConsumedStatus(category, fileName, itemId, newStatus, note = '') {
    try {
        const payload = { category, file: fileName, id: itemId, status: newStatus, note };
        const response = await fetch('/api/update_consumed_status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
            const safeId = itemId.replace(/[^a-zA-Z0-9]/g, '_');
            const card = document.querySelector(`[data-item-id="${safeId}"]`);
            if (card) {
                const statusDivs = card.querySelectorAll('div[style*="text-align:center"]');
                if (statusDivs.length > 1) {
                    const consumedStatusDiv = statusDivs[1];
                    const color = newStatus === 'approved' ? '#4caf50' : newStatus === 'declined' ? '#f44336' : '#d4a017';
                    consumedStatusDiv.style.color = color;
                    consumedStatusDiv.textContent = newStatus.toUpperCase();
                }
            }
        } else {
            alert('Failed: ' + result.error);
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Error updating consumed status');
    }
}

// Update item weapon type
async function updateItemWeapon(category, fileName, itemId, newWeapon) {
    try {
        const resp = await fetch('/api/update_item_weapon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, file: fileName, id: itemId, weapon: newWeapon })
        });
        const result = await resp.json();
        if (result.success) {
            console.log(`✅ Updated weapon for ${itemId} to ${newWeapon}`);
            if (categoryData && categoryData.files && categoryData.files[fileName]) {
                const item = categoryData.files[fileName].find(i => i.id === itemId);
                if (item) item.weaponType = newWeapon;
            }
        } else {
            alert('Failed to update weapon: ' + result.error);
        }
    } catch (err) {
        alert('Error updating weapon: ' + err.message);
    }
}

// Update item stat
async function updateItemStat(category, fileName, itemId, statKey, newValue) {
    console.log(`updateItemStat called: ${category}/${fileName}/${itemId}.${statKey} = ${newValue}`);
    try {
        let typedValue = newValue;
        if (newValue === 'true' || newValue === true) typedValue = true;
        else if (newValue === 'false' || newValue === false) typedValue = false;
        else if (!isNaN(newValue) && newValue !== '' && typeof newValue !== 'string') typedValue = parseFloat(newValue);

        const resp = await fetch('/api/update_item_stat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, file: fileName, id: itemId, statKey, value: typedValue })
        });
        const result = await resp.json();
        if (result.success) {
            if (categoryData && categoryData.files && categoryData.files[fileName]) {
                const item = categoryData.files[fileName].find(i => i.id === itemId);
                if (item && item.stats) {
                    item.stats[statKey] = typedValue;
                    const safeId = itemId.replace(/[^a-zA-Z0-9]/g, '_');
                    const oldCard = document.querySelector(`[data-item-id="${safeId}"]`);
                    if (oldCard) {
                        const newCard = createCategoryCard(item, fileName);
                        newCard.dataset.itemId = safeId;
                        oldCard.replaceWith(newCard);
                    }
                }
            }
            console.log(`Updated ${itemId}.stats.${statKey} = ${typedValue}`);
        } else {
            alert('Failed to save: ' + result.error);
        }
    } catch (err) {
        console.error('Error saving stat:', err);
        alert('Error saving stat: ' + err.message);
    }
}

// Remake asset
async function remakeAsset(path, name, safeId) {
    const notesInput = document.getElementById('notes_' + safeId);
    const notes = notesInput ? notesInput.value.trim() : '';
    if (notes) {
        const originalName = name.replace('_clean.png', '_original.png');
        await saveNotes(originalName, notes);
    }
    const resp = await fetch('/api/remake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cleanPath: path, notes: notes })
    });
    const result = await resp.json();
    if (result.success) {
        await loadManifest();
    } else {
        alert('Error: ' + result.error);
    }
}

// Sync assets to game
async function syncAssetsToGame() {
    const btn = document.getElementById('btnSyncToGame');
    const originalText = btn.textContent;
    btn.textContent = '⏳ Syncing...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/sync_assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();

        if (result.success) {
            btn.textContent = `✅ Synced! (${result.images} images, ${result.audio} audio)`;
            btn.style.background = '#4caf50';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 3000);
        } else {
            throw new Error(result.error || 'Sync failed');
        }
    } catch (error) {
        console.error('Sync error:', error);
        btn.textContent = '❌ Sync Failed';
        btn.style.background = '#f44336';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '#4caf50';
            btn.disabled = false;
        }, 3000);
    }
}

// Load global asset lookup for drop/recipe images
async function loadGlobalAssetLookup() {
    if (assetLookupLoaded) return;
    try {
        const [itemsResp, resourcesResp, nodesResp] = await Promise.all([
            fetch('/api/get_category', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'items' }) }),
            fetch('/api/get_category', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'resources' }) }),
            fetch('/api/get_category', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: 'nodes' }) })
        ]);
        const itemsData = await itemsResp.json();
        const resourcesData = await resourcesResp.json();
        const nodesData = await nodesResp.json();

        // Build lookup from items
        for (const [fileName, items] of Object.entries(itemsData.files || {})) {
            if (!Array.isArray(items)) continue;
            items.forEach(item => {
                const nameKey = (item.name || '').toLowerCase().replace(/\s+/g, '_');
                const imgPath = item.files?.clean || item.files?.original || '';
                const displayPath = imgPath.replace('assets/images/', '');
                globalAssetLookup[nameKey] = { id: item.id, category: 'items', file: fileName, path: displayPath, name: item.name };
                globalAssetLookup[item.id] = { id: item.id, category: 'items', file: fileName, path: displayPath, name: item.name };
            });
        }
        // Build lookup from resources
        for (const [fileName, items] of Object.entries(resourcesData.files || {})) {
            if (!Array.isArray(items)) continue;
            items.forEach(item => {
                const nameKey = (item.name || '').toLowerCase().replace(/\s+/g, '_');
                const imgPath = item.files?.clean || item.files?.original || '';
                const displayPath = imgPath.replace('assets/images/', '');
                globalAssetLookup[nameKey] = { id: item.id, category: 'resources', file: fileName, path: displayPath, name: item.name };
                globalAssetLookup[item.id] = { id: item.id, category: 'resources', file: fileName, path: displayPath, name: item.name };
            });
        }
        // Build lookup from nodes
        for (const [fileName, items] of Object.entries(nodesData.files || {})) {
            if (!Array.isArray(items)) continue;
            items.forEach(item => {
                const nameKey = (item.name || '').toLowerCase().replace(/\s+/g, '_');
                const imgPath = item.files?.clean || item.files?.original || '';
                const displayPath = imgPath.replace('assets/images/', '');
                globalAssetLookup[`node_${nameKey}`] = { id: item.id, category: 'nodes', file: fileName, path: displayPath, name: item.name };
                globalAssetLookup[item.id] = { id: item.id, category: 'nodes', file: fileName, path: displayPath, name: item.name };
                globalAssetLookup[item.name] = { id: item.id, category: 'nodes', file: fileName, path: displayPath, name: item.name };
            });
        }
        assetLookupLoaded = true;
        console.log('Global asset lookup loaded:', Object.keys(globalAssetLookup).length, 'entries');
    } catch (e) {
        console.error('Failed to load global asset lookup:', e);
    }
}

// Get asset image path from semantic name or ID
function getAssetImage(nameOrId) {
    const key = (nameOrId || '').toLowerCase().replace(/\s+/g, '_');
    const asset = globalAssetLookup[key] || globalAssetLookup[nameOrId];
    if (asset && asset.path) return `/images/${asset.path}`;
    return '/images/PH.png';
}

function getAssetInfo(nameOrId) {
    const key = (nameOrId || '').toLowerCase().replace(/\s+/g, '_');
    return globalAssetLookup[key] || globalAssetLookup[nameOrId] || null;
}

// SFX regeneration queue management
async function saveRegenerationQueueToFile() {
    try {
        await fetch('/api/save_sfx_regen_queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queue: sfxRegenerationQueue })
        });
    } catch (err) {
        console.warn('Could not save SFX regeneration queue to server:', err);
    }
}

function markSfxForRegeneration(sfxId, assetId) {
    const existing = sfxRegenerationQueue.find(item => item.sfxId === sfxId);
    if (existing) {
        alert(`${sfxId} is already marked for regeneration.`);
        return;
    }
    sfxRegenerationQueue.push({
        sfxId: sfxId,
        assetId: assetId,
        markedAt: new Date().toISOString()
    });
    localStorage.setItem('sfxRegenerationQueue', JSON.stringify(sfxRegenerationQueue));
    saveRegenerationQueueToFile();
    alert(`✅ Marked ${sfxId} for regeneration.\n\nUse /sound-regenerate workflow to regenerate all marked sounds.`);
}

function markAllSfxForRegeneration(assetId, sfxIds) {
    let addedCount = 0;
    for (const sfxId of sfxIds) {
        const existing = sfxRegenerationQueue.find(item => item.sfxId === sfxId);
        if (!existing) {
            sfxRegenerationQueue.push({
                sfxId: sfxId,
                assetId: assetId,
                markedAt: new Date().toISOString()
            });
            addedCount++;
        }
    }
    if (addedCount === 0) {
        alert(`All sounds for ${assetId} are already marked for regeneration.`);
        return;
    }
    localStorage.setItem('sfxRegenerationQueue', JSON.stringify(sfxRegenerationQueue));
    saveRegenerationQueueToFile();
    alert(`✅ Marked ${addedCount} sounds for ${assetId} for regeneration.\n\nQueue now has ${sfxRegenerationQueue.length} total sounds.\n\nUse /sound-regenerate workflow to regenerate.`);
}

function getSfxRegenerationQueue() {
    return sfxRegenerationQueue;
}

function clearSfxRegenerationQueue() {
    sfxRegenerationQueue = [];
    localStorage.setItem('sfxRegenerationQueue', '[]');
    saveRegenerationQueueToFile();
}
