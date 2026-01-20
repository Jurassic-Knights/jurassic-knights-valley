/**
 * Dashboard Views Module
 * Landing page, category views, and templates
 */

// Show landing page (main entry point)
async function showLandingPage() {
    document.querySelector('.sticky-bar').style.display = 'none';
    document.querySelector('.stats').style.display = 'none';

    const container = document.getElementById('mainContent');
    const categories = ['hero', 'enemies', 'bosses', 'npcs', 'items', 'equipment', 'resources', 'nodes', 'environment', 'ui'];

    try {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem 2rem;">
                <h1 style="font-size:2.5rem; margin-bottom:1rem;">🦖 Jurassic Knights Asset Dashboard</h1>
                <p style="color:var(--text-dim); font-size:1.1rem; margin-bottom:2rem;">Select a category to view and manage assets</p>
                
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1.5rem; max-width:900px; margin:0 auto 2rem;">
                    ${categories.map(cat => `
                        <button onclick="showCategoryView('${cat}')" style="
                            background:${CATEGORY_COLORS[cat]};
                            border:none;
                            border-radius:12px;
                            padding:1.5rem;
                            cursor:pointer;
                            transition:all 0.2s;
                            text-align:center;
                        " onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform=''">
                            <div style="font-size:3rem; margin-bottom:0.5rem;">${CATEGORY_ICONS[cat]}</div>
                            <div style="font-size:1.2rem; font-weight:bold; color:white; text-transform:capitalize;">${cat}</div>
                        </button>
                    `).join('')}
                </div>
                
                <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
                    <button onclick="showTemplatesView()" class="secondary" style="padding:1rem 2rem;">📝 Templates</button>
                    <button onclick="syncAssetsToGame()" class="secondary" style="padding:1rem 2rem; background:#4caf50;">🔄 Sync to Game</button>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="error"><strong>Server not running.</strong><br>Run: <code>python tools/serve_dashboard.py</code></div>`;
    }
}

// Load manifest (redirects to landing page)
async function loadManifest() {
    showLandingPage();
}

// Show the original image view (restore filter bars)
function showImagesView() {
    document.querySelector('.sticky-bar').style.display = '';
    document.querySelector('.stats').style.display = '';
    currentCategoryName = '';
    categoryData = null;
    loadManifest();
}

// Show category view (enemies, items, npcs, etc.)
async function showCategoryView(categoryName) {
    currentCategoryName = categoryName;

    // Set polling to watch this category for live updates
    if (window.setPollingCategory) {
        window.setPollingCategory(categoryName);
    }

    const container = document.getElementById('mainContent');
    container.innerHTML = '<div class="loading">Loading ' + categoryName + ' data...</div>';

    document.querySelector('.sticky-bar').style.display = 'none';
    document.querySelector('.stats').style.display = 'none';

    try {
        await loadGlobalAssetLookup();
        const resp = await fetch('/api/get_category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: categoryName })
        });
        categoryData = await resp.json();
        renderCategoryView();
    } catch (err) {
        container.innerHTML = '<div class="error">Failed to load ' + categoryName + ': ' + err.message + '</div>';
    }
}

// Navigate to specific asset and highlight it
async function navigateToAsset(category, assetId) {
    window.scrollToAssetId = assetId;
    await showCategoryView(category);

    setTimeout(() => {
        const safeId = assetId.replace(/[^a-zA-Z0-9]/g, '_');
        const targetCard = document.querySelector(`[data-item-id="${safeId}"]`);

        if (targetCard) {
            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            targetCard.style.boxShadow = '0 0 20px 5px #ff9800';
            setTimeout(() => { targetCard.style.boxShadow = ''; }, 2000);
        } else {
            const allCards = document.querySelectorAll('[data-item-id]');
            for (const card of allCards) {
                if (card.dataset.itemId.includes(safeId) || safeId.includes(card.dataset.itemId)) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.boxShadow = '0 0 20px 5px #ff9800';
                    setTimeout(() => { card.style.boxShadow = ''; }, 2000);
                    break;
                }
            }
        }
    }, 300);
}

// Update stats display
function updateStats() {
    if (!manifest || !manifest.counts) return;
    document.getElementById('statPending').textContent = manifest.counts.pending || 0;
    document.getElementById('statApproved').textContent = manifest.counts.approved || 0;
    document.getElementById('statDeclined').textContent = manifest.counts.declined || 0;
    document.getElementById('statClean').textContent = manifest.counts.clean || 0;
    document.getElementById('statMissing').textContent = missingAssets.length || 0;
    document.getElementById('statUnsynced').textContent = unsyncedAssets.length || 0;
}

// Action helpers for category items
function approveCategoryItem(category, fileName, itemId) {
    updateCategoryStatus(category, fileName, itemId, 'approved');
}

function declineCategoryItem(category, fileName, itemId, safeId) {
    const note = document.getElementById('note_' + safeId)?.value || '';
    updateCategoryStatus(category, fileName, itemId, 'declined', note);
}

function remakeCategoryItem(category, fileName, itemId, safeId) {
    const note = document.getElementById('note_' + safeId)?.value || '';
    updateCategoryStatus(category, fileName, itemId, 'declined', 'Remake: ' + note);
}

function declineCategoryItemById(category, fileName, itemId, noteInputId) {
    const note = document.getElementById(noteInputId)?.value || '';
    updateCategoryStatus(category, fileName, itemId, 'declined', note);
}

function remakeCategoryItemById(category, fileName, itemId, noteInputId) {
    const note = document.getElementById(noteInputId)?.value || 'needs redo';
    updateCategoryStatus(category, fileName, itemId, 'declined', 'Remake: ' + note);
}

// Asset action helpers
async function approveAsset(path) {
    await changeStatus(path, 'approved');
}

async function declineAsset(path, name, safeId) {
    const notesInput = document.getElementById('notes_' + safeId);
    const notes = notesInput ? notesInput.value.trim() : '';
    if (notes) await saveNotes(name, notes);
    await changeStatus(path, 'declined');
}

async function declineAssetPrompt(path, name) {
    const notes = prompt('Decline reason (optional):');
    if (notes) await saveNotes(name, notes);
    await changeStatus(path, 'declined');
}

// Auto-refresh for loot view
function startAutoRefresh() {
    if (autoRefreshInterval) return;
    autoRefreshInterval = setInterval(async () => {
        try {
            const resp = await fetch('/api/get_loot', { method: 'POST', body: '{}' });
            const newData = await resp.json();
            const newHash = JSON.stringify(newData);
            if (newHash !== lootDataHash) {
                console.log('🔄 Loot data changed, refreshing...');
                lootData = newData;
                lootDataHash = newHash;
                renderLootView();
            }
        } catch (err) { /* Silently fail */ }
    }, 2000);
    console.log('✅ Auto-refresh enabled (2s polling)');
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏹️ Auto-refresh disabled');
    }
}
