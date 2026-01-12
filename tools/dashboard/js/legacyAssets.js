/**
 * Legacy Assets Module
 * Functions for manifest-based asset rendering (original dashboard functionality)
 */

function buildCategoryFilters() {
    if (!manifest || !manifest.assets) return;

    const categoryStats = {};
    manifest.assets.forEach(a => {
        if (!categoryStats[a.category]) {
            categoryStats[a.category] = { total: 0, clean: 0, pending: 0, approved: 0 };
        }
        categoryStats[a.category].total++;
        if (a.status === 'clean') categoryStats[a.category].clean++;
        if (a.status === 'pending') categoryStats[a.category].pending++;
        if (a.status === 'approved') categoryStats[a.category].approved++;
    });

    const sorted = Object.keys(categoryStats).sort();
    const totalAssets = manifest.assets.length;
    const totalClean = manifest.assets.filter(a => a.status === 'clean').length;

    const container = document.getElementById('categoryFilters');
    container.innerHTML = `<button class="filter-btn secondary ${currentCategory === 'all' ? 'active' : ''}" data-category="all">All (${totalClean}/${totalAssets})</button>`;
    sorted.forEach(cat => {
        const stats = categoryStats[cat];
        const btn = document.createElement('button');
        btn.className = `filter-btn secondary ${currentCategory === cat ? 'active' : ''}`;
        btn.dataset.category = cat;
        btn.textContent = `${cat} (${stats.clean}/${stats.total})`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = cat;
            renderAssets();
        });
        container.appendChild(btn);
    });

    container.querySelector('[data-category="all"]').addEventListener('click', () => {
        document.querySelectorAll('[data-category]').forEach(b => b.classList.remove('active'));
        container.querySelector('[data-category="all"]').classList.add('active');
        currentCategory = 'all';
        renderAssets();
    });
}

function renderAssets() {
    const container = document.getElementById('mainContent');
    container.innerHTML = '';

    if (currentFilter === 'missing') {
        if (missingAssets.length === 0) {
            container.innerHTML = '<div class="loading" style="color: var(--accent-green);">✓ No missing assets! All AssetLoader IDs have valid files.</div>';
            return;
        }
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category';
        categoryEl.innerHTML = `<div class="category-header"><h2 class="category-title">⚠️ Missing Assets in AssetLoader.js</h2><span style="color: var(--accent)">${missingAssets.length} assets pointing to PH.png</span></div><div class="asset-grid"></div>`;
        container.appendChild(categoryEl);
        const grid = categoryEl.querySelector('.asset-grid');
        missingAssets.forEach(item => {
            const card = document.createElement('div');
            card.className = 'asset-card declined';
            card.innerHTML = `<div style="padding:1rem; background:var(--bg-dark); height:100px; display:flex; align-items:center; justify-content:center;"><span style="font-size:2rem;">❓</span></div><div class="asset-info"><div class="asset-name" style="color:var(--accent-yellow);">${item.id}</div><div style="font-size:0.7rem; color:var(--text-dim); margin-top:0.25rem;">Expected: ${item.expectedFile}</div></div>`;
            grid.appendChild(card);
        });
        return;
    }

    if (!manifest || !manifest.assets) return;

    const categories = {};
    manifest.assets.forEach(asset => {
        if (currentFilter !== 'all' && asset.status !== currentFilter) return;
        if (currentCategory !== 'all' && asset.category !== currentCategory) return;
        if (!categories[asset.category]) categories[asset.category] = [];
        categories[asset.category].push(asset);
    });

    const sortedCategories = Object.keys(categories).sort();
    for (const category of sortedCategories) {
        const assets = categories[category];
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category';
        categoryEl.innerHTML = `<div class="category-header"><h2 class="category-title">${category}</h2><span style="color: var(--text-dim)">${assets.length} assets</span></div><div class="asset-grid"></div>`;
        container.appendChild(categoryEl);
        const grid = categoryEl.querySelector('.asset-grid');
        assets.forEach(asset => grid.appendChild(createAssetCard(asset)));
    }
    if (sortedCategories.length === 0) container.innerHTML = '<div class="loading">No assets match the current filter.</div>';
}

function createAssetCard(asset) {
    const card = document.createElement('div');
    card.className = `asset-card ${asset.status}`;
    card.dataset.path = asset.path;
    const safeId = asset.name.replace(/[^a-zA-Z0-9]/g, '_');
    const imgPath = BASE_PATH + asset.path;
    const existingNotes = declineNotes[asset.name] || '';

    let actionsHtml = '';
    let notesInputHtml = '';

    if (asset.status === 'pending') {
        notesInputHtml = `<input type="text" id="notes_${safeId}" class="notes-input" placeholder="Decline reason..." value="${existingNotes}" style="width:100%; margin-top:0.5rem; padding:0.3rem; font-size:0.7rem; background:var(--bg-dark); color:var(--text); border:1px solid var(--text-dim); border-radius:3px;">`;
        actionsHtml = `<div class="asset-actions"><button class="approve" onclick="approveAsset('${asset.path}')">✓ Approve</button><button class="decline" onclick="declineAsset('${asset.path}', '${asset.name}', '${safeId}')">✗ Decline</button></div>`;
    } else if (asset.status === 'approved') {
        actionsHtml = `<div class="asset-actions"><button class="decline" onclick="declineAssetPrompt('${asset.path}', '${asset.name}')">✗ Decline</button></div>`;
    } else if (asset.status === 'declined') {
        const notesDisplay = existingNotes ? `<div style="font-size:0.7rem; color:var(--accent-yellow); margin-top:0.3rem; font-style:italic;">📝 ${existingNotes}</div>` : '';
        actionsHtml = `${notesDisplay}<div class="asset-actions"><button class="approve" onclick="approveAsset('${asset.path}')">✓ Re-approve</button></div>`;
    } else if (asset.status === 'clean') {
        notesInputHtml = `<input type="text" id="notes_${safeId}" class="notes-input" placeholder="Remake instructions..." value="${existingNotes}" style="width:100%; margin-top:0.5rem; padding:0.3rem; font-size:0.7rem; background:var(--bg-dark); color:var(--text); border:1px solid var(--text-dim); border-radius:3px;">`;
        actionsHtml = `<div class="asset-actions"><button class="secondary" onclick="remakeAsset('${asset.path}', '${asset.name}', '${safeId}')" style="background:#ff9800;">🔄 Remake</button></div>`;
    }

    let baseNameForPrompt = asset.name.replace('_approved', '').replace('_declined', '');
    if (baseNameForPrompt.includes('_clean')) {
        baseNameForPrompt = baseNameForPrompt.replace('_clean', '_original');
    }
    const prompt = assetPrompts[baseNameForPrompt] || assetPrompts[asset.name] || '';
    const promptPreview = prompt ? `<div class="prompt-preview" title="${prompt.replace(/"/g, '&quot;')}">📝 ${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}</div>` : '';

    card.innerHTML = `<img class="asset-image" src="${imgPath}" alt="${asset.name}" onclick="openModal('${imgPath}', '${asset.name}', '${asset.status}')" onerror="this.style.display='none'"><div class="asset-info"><div class="asset-name">${asset.name}</div><span class="asset-status status-${asset.status}">${asset.status}</span>${promptPreview}${notesInputHtml}${actionsHtml}</div>`;
    return card;
}
