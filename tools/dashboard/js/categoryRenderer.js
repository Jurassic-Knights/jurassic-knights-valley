/**
 * Category Renderer Module
 * Core rendering functions for category view grid
 * 
 * Dependencies:
 * - filters.js (filter setters)
 * - cardBuilders.js (build*Html helpers)
 */

function renderCategoryView() {
    const container = document.getElementById('mainContent');
    container.innerHTML = '';

    if (!categoryData || categoryData.error) {
        container.innerHTML = '<div class="error">' + (categoryData?.error || 'No data') + '</div>';
        return;
    }

    const config = categoryData._config || {};
    const queue = categoryData.asset_queue || {};
    const files = categoryData.files || {};

    // Count stats
    let stats = { pending: 0, approved: 0, declined: 0, clean: 0, missing: 0 };
    Object.values(files).flat().forEach(item => {
        stats[item.status || 'pending']++;
    });

    // Count missing VFX/SFX
    const missingVfx = (queue.vfx || []).filter(v => v.status === 'pending').length;
    const missingSfx = (queue.sfx || []).filter(s => s.status === 'pending').length;

    const categoryIcons = { npcs: '👤', buildings: '🏠', ui: '🖼️', props: '🌲', vfx: '✨', audio: '🔊', enemies: '🦖', items: '⚔️', resources: '🪨', nodes: '⛏️', environment: '🌲' };
    const categoryColors = { npcs: '#4caf50', buildings: '#ff9800', ui: '#03a9f4', props: '#8bc34a', vfx: '#e91e63', audio: '#9c27b0', enemies: '#e91e63', items: '#9c27b0', resources: '#ff9800', nodes: '#6d4c41', environment: '#8bc34a' };

    // Get unique filter values from all items
    const allItems = Object.values(files).flat();
    const biomes = [...new Set(allItems.map(i => i.biome).filter(b => b && b !== 'all'))];
    const tiers = [...new Set(allItems.map(i => {
        if (i.tier) return i.tier;
        const match = i.id?.match(/_t(\d)_/);
        return match ? parseInt(match[1]) : null;
    }).filter(t => t))].sort();
    const fileNames = Object.keys(files);

    container.innerHTML = `
        <div style="padding:1rem; background:var(--bg-panel); margin-bottom:1rem; border-radius:8px;">
            <h2 style="color:${categoryColors[currentCategoryName] || '#fff'}; margin-bottom:0.5rem;">${categoryIcons[currentCategoryName] || '📁'} ${currentCategoryName.toUpperCase()} Registry</h2>
            <div style="font-size:0.9rem; color:var(--text-dim); margin-bottom:0.5rem;">${config.description || ''}</div>
            <div style="display:flex; gap:2rem; flex-wrap:wrap; margin-bottom:1rem;">
                <span style="color:var(--accent-yellow);">⏳ Pending: ${stats.pending}</span>
                <span style="color:var(--accent-green);">✓ Approved: ${stats.approved}</span>
                <span style="color:#64b5f6;">🧹 Clean: ${stats.clean}</span>
                <span style="color:var(--accent);">✗ Declined: ${stats.declined}</span>
                <span style="color:#ff9800;">🎬 Pending VFX: ${missingVfx}</span>
                <span style="color:#9c27b0;">🔊 Pending SFX: ${missingSfx}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Status:</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.status === 'all' ? 'active' : ''}" onclick="setCategoryStatusFilter('all')" style="background:#666;">All</button>
                <button class="filter-btn ${categoryFilter.status === 'pending' ? 'active' : ''}" onclick="setCategoryStatusFilter('pending')" style="background:#d4a017;">Pending</button>
                <button class="filter-btn ${categoryFilter.status === 'approved' ? 'active' : ''}" onclick="setCategoryStatusFilter('approved')" style="background:#4caf50;">Approved</button>
                <button class="filter-btn ${categoryFilter.status === 'declined' ? 'active' : ''}" onclick="setCategoryStatusFilter('declined')" style="background:#f44336;">Declined</button>
                <button class="filter-btn ${categoryFilter.status === 'clean' ? 'active' : ''}" onclick="setCategoryStatusFilter('clean')" style="background:#64b5f6;">Clean</button>
            </div>
            ${fileNames.length > 1 ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Files:</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.file === 'all' ? 'active' : ''}" onclick="setCategoryFileFilter('all')" style="background:#666;">All</button>
                ${fileNames.map(f => {
        const displayName = f.replace(/^(equipment_|item_|items_|resources_|enemies_|)/, '');
        return `<button class="filter-btn ${categoryFilter.file === f ? 'active' : ''}" onclick="setCategoryFileFilter('${f}')">${displayName}</button>`;
    }).join('')}
            </div>
            ` : ''}
            ${biomes.length > 0 ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Biomes (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.biome === 'all' ? 'active' : ''}" onclick="setCategoryBiomeFilter('all')" style="background:#666;">Clear</button>
                ${biomes.map(b => `<button class="filter-btn ${categoryFilter.biome === b ? 'active' : ''}" onclick="setCategoryBiomeFilter('${b}')" style="background:${b === 'grasslands' ? '#4caf50' : b === 'tundra' ? '#00bcd4' : b === 'desert' ? '#ff9800' : '#f44336'};">${b}</button>`).join('')}
            </div>
            ` : ''}
            ${tiers.length > 0 ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Tiers (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.tier === 'all' ? 'active' : ''}" onclick="setCategoryTierFilter('all')" style="background:#666;">Clear</button>
                ${tiers.map(t => `<button class="filter-btn ${categoryFilter.tier === t ? 'active' : ''}" onclick="setCategoryTierFilter(${t})" style="background:${t === 1 ? '#9e9e9e' : t === 2 ? '#4caf50' : t === 3 ? '#2196f3' : '#9c27b0'};">T${t}</button>`).join('')}
            </div>
            ` : ''}
            ${currentCategoryName === 'equipment' ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Weapon Type (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.weaponType === 'all' ? 'active' : ''}" onclick="setCategoryWeaponTypeFilter('all')" style="background:#666;">Clear</button>
                <button class="filter-btn ${categoryFilter.weaponType === 'melee' ? 'active' : ''}" onclick="setCategoryWeaponTypeFilter('melee')" style="background:#e91e63;">⚔️ Melee</button>
                <button class="filter-btn ${categoryFilter.weaponType === 'ranged' ? 'active' : ''}" onclick="setCategoryWeaponTypeFilter('ranged')" style="background:#ff9800;">🔫 Ranged</button>
                <button class="filter-btn ${categoryFilter.weaponType === 'shield' ? 'active' : ''}" onclick="setCategoryWeaponTypeFilter('shield')" style="background:#2196f3;">🛡️ Shield</button>
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Hands (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.hands === 'all' ? 'active' : ''}" onclick="setCategoryHandsFilter('all')" style="background:#666;">Clear</button>
                <button class="filter-btn ${categoryFilter.hands === 1 ? 'active' : ''}" onclick="setCategoryHandsFilter(1)" style="background:#4caf50;">1-Hand</button>
                <button class="filter-btn ${categoryFilter.hands === 2 ? 'active' : ''}" onclick="setCategoryHandsFilter(2)" style="background:#9c27b0;">2-Hand</button>
            </div>
            ` : ''}
            <div style="display:flex; align-items:center; gap:1rem; margin-top:0.5rem;">
                <span style="font-size:0.8rem; color:var(--text-dim);">🔍 Image Size:</span>
                <input type="range" id="imageSizeSlider" min="100" max="400" value="${categoryImageSize}" 
                    oninput="setCategoryImageSize(this.value)" 
                    style="width:200px; accent-color:var(--accent-green);">
                <span id="imageSizeValue" style="font-size:0.8rem; color:var(--text-dim);">${categoryImageSize}px</span>
            </div>
        </div>
    `;

    // Render each file's data with filtering
    for (const [fileName, items] of Object.entries(files)) {
        if (!Array.isArray(items) || items.length === 0) continue;
        if (categoryFilter.file !== 'all' && categoryFilter.file !== fileName) continue;

        // Apply filters
        let filteredItems = items;
        if (categoryFilter.status !== 'all') filteredItems = filteredItems.filter(i => (i.status || 'pending') === categoryFilter.status);
        if (categoryFilter.biome !== 'all') filteredItems = filteredItems.filter(i => i.biome === categoryFilter.biome || i.biome === 'all');
        if (categoryFilter.tier !== 'all') filteredItems = filteredItems.filter(i => {
            const tier = i.tier || (i.id?.match(/_t(\d)_/)?.[1] ? parseInt(i.id.match(/_t(\d)_/)[1]) : null);
            return tier === categoryFilter.tier;
        });
        if (categoryFilter.weaponType !== 'all') filteredItems = filteredItems.filter(i => i.weaponType === categoryFilter.weaponType);
        if (categoryFilter.hands !== 'all') filteredItems = filteredItems.filter(i => i.hands === categoryFilter.hands);

        if (filteredItems.length === 0) continue;

        const section = document.createElement('div');
        section.className = 'category';
        section.innerHTML = `
            <div class="category-header">
                <h2 class="category-title">${fileName}</h2>
                <span style="color: var(--text-dim)">${filteredItems.length} items</span>
            </div>
            <div class="asset-grid"></div>
        `;
        container.appendChild(section);

        const grid = section.querySelector('.asset-grid');
        filteredItems.forEach(item => {
            const card = createCategoryCard(item, fileName);
            grid.appendChild(card);
        });
    }
}

function createCategoryCard(item, fileName) {
    const card = document.createElement('div');
    card.className = 'asset-card ' + (item.status || 'pending');

    const hasConsumedVersion = !!(item.files?.consumed_clean || item.files?.consumed_original);
    const cardWidth = hasConsumedVersion ? (categoryImageSize * 2 + 20) : categoryImageSize;

    card.style.width = cardWidth + 'px';
    card.style.minWidth = cardWidth + 'px';
    const safeId = (item.id || '').replace(/[^a-zA-Z0-9]/g, '_');
    card.dataset.itemId = safeId;
    const hasImage = !!(item.files?.clean || item.files?.original);

    // Image preview with dynamic sizing
    const imgSize = categoryImageSize + 'px';
    let imgHtml = `<div style="width:${imgSize}; height:${imgSize}; background:var(--bg-dark); display:flex; align-items:center; justify-content:center;"><span style="font-size:3rem;">📦</span></div>`;
    const imgPath = item.files?.clean || item.files?.original;
    const consumedPath = item.files?.consumed_clean || item.files?.consumed_original;

    if (imgPath && consumedPath) {
        imgHtml = buildSplitImageHtml(item, imgPath, consumedPath, safeId, fileName);
    } else if (imgPath) {
        const displayPath = imgPath.replace(/^assets\/images\//, '');
        const fullImgUrl = `/images/${displayPath}`;
        imgHtml = `<img class="asset-image" src="${fullImgUrl}" alt="${item.name}" 
            onclick="openModal('${fullImgUrl}', '${item.name}', '${item.status || 'pending'}')"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
            style="width:${imgSize}; height:${imgSize}; object-fit:cover; background:var(--bg-dark); cursor:pointer;">
        <div style="width:${imgSize}; height:${imgSize}; background:var(--bg-dark); display:none; align-items:center; justify-content:center;"><span style="font-size:3rem;">📦</span></div>`;
    }

    // Source description preview
    const hasConsumedFiles = !!(item.files?.consumed_clean || item.files?.consumed_original);
    const descPreview = (!hasConsumedFiles && item.sourceDescription) ?
        `<div style="font-size:0.65rem; color:var(--accent-yellow); margin-top:0.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.sourceDescription.replace(/"/g, '&quot;')}">📝 ${item.sourceDescription.substring(0, 40)}...</div>` : '';

    // Build all card components using helpers from cardBuilders.js
    const actionsHtml = buildActionsHtml(item, safeId, fileName, hasImage);
    const statsHtml = buildStatsHtml(item, fileName);
    const dropsHtml = buildDropsHtml(item);
    const recipeHtml = buildRecipeHtml(item);
    const sourceHtml = buildSourceHtml(item);
    const resourceDropHtml = buildResourceDropHtml(item);
    const badgesHtml = buildBadgesHtml(item);
    const weaponDropdownHtml = buildWeaponDropdownHtml(item, fileName);
    const sfxHtml = buildSfxHtml(item);
    const vfxHtml = buildVfxHtml(item);
    const otherFieldsHtml = buildOtherFieldsHtml(item);

    card.innerHTML = `
        ${imgHtml}
        <div class="asset-info" style="padding:0.5rem;">
            <div style="font-weight:bold; color:#9c27b0; margin-bottom:0.1rem; font-size:0.85rem;">${item.name || item.id}</div>
            <div style="font-size:0.65rem; color:var(--text-dim); margin-bottom:0.3rem; font-family:monospace;">${item.id}</div>
            ${badgesHtml}
            ${weaponDropdownHtml}
            ${sfxHtml}
            ${vfxHtml}
            ${statsHtml}
            ${dropsHtml}
            ${recipeHtml}
            ${sourceHtml}
            ${resourceDropHtml}
            ${otherFieldsHtml ? `<div style="margin:4px 0;">${otherFieldsHtml}</div>` : ''}
            <span class="asset-status status-${item.status || 'pending'}" style="margin-top:0.5rem;">${item.status || 'pending'}</span>
            ${descPreview}
            ${actionsHtml}
        </div>
    `;
    return card;
}
