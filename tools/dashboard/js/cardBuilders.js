/**
 * Card Builders Module
 * Helper functions to build HTML components for asset cards
 */

function buildSplitImageHtml(item, imgPath, consumedPath, safeId, fileName) {
    const displayPath = imgPath.replace(/^assets\/images\//, '');
    const fullImgUrl = `/images/${displayPath}`;
    const consumedDisplayPath = consumedPath.replace(/^assets\/images\//, '');
    const consumedImgUrl = `/images/${consumedDisplayPath}`;
    const consumedStatus = item.consumedStatus || item.status || 'pending';
    const fullStatus = item.status || 'pending';
    const fullDesc = item.sourceDescription || '';
    const consumedDesc = item.consumedSourceDescription || '';
    const fullDescPreview = fullDesc ? `<div style="font-size:0.5rem; color:var(--accent-yellow); margin:2px 0; max-height:2.5em; overflow:hidden; text-overflow:ellipsis;" title="${fullDesc.replace(/"/g, '&quot;')}">📝 ${fullDesc.substring(0, 50)}...</div>` : '';
    const consumedDescPreview = consumedDesc ? `<div style="font-size:0.5rem; color:var(--accent-yellow); margin:2px 0; max-height:2.5em; overflow:hidden; text-overflow:ellipsis;" title="${consumedDesc.replace(/"/g, '&quot;')}">📝 ${consumedDesc.substring(0, 50)}...</div>` : '';

    return `<div style="display:flex; gap:4px; width:100%;">
        <div style="flex:1; background:#1a1a1a; border-radius:6px; padding:4px;">
            <div style="position:relative;">
                <img src="${fullImgUrl}" alt="${item.name}" onclick="openModal('${fullImgUrl}', '${item.name} (Full)', '${fullStatus}')"
                    style="width:100%; aspect-ratio:1; object-fit:cover; background:var(--bg-dark); cursor:pointer; border-radius:4px;">
                <span style="position:absolute; top:2px; left:2px; font-size:0.55rem; font-weight:bold; background:#4caf50; padding:1px 4px; border-radius:3px; color:white;">FULL</span>
            </div>
            ${fullDescPreview}
            <div style="font-size:0.55rem; text-align:center; margin:2px 0; color:${fullStatus === 'approved' ? '#4caf50' : fullStatus === 'declined' ? '#f44336' : fullStatus === 'clean' ? '#64b5f6' : '#d4a017'};">${fullStatus.toUpperCase()}</div>
            <input type="text" id="note_full_${safeId}" placeholder="Note..." style="width:100%; padding:2px 4px; font-size:0.55rem; background:#222; color:#fff; border:1px solid #444; border-radius:3px; margin-bottom:2px;">
            <div style="display:flex; gap:2px;">
                <button onclick="updateCategoryStatus('${currentCategoryName}', '${fileName}', '${item.id}', 'approved')" style="flex:1; padding:2px; font-size:0.55rem; background:#4caf50; border:none; border-radius:3px; color:white; cursor:pointer;">✓</button>
                <button onclick="declineCategoryItemById('${currentCategoryName}', '${fileName}', '${item.id}', 'note_full_${safeId}')" style="flex:1; padding:2px; font-size:0.55rem; background:#f44336; border:none; border-radius:3px; color:white; cursor:pointer;">✗</button>
                <button onclick="remakeCategoryItemById('${currentCategoryName}', '${fileName}', '${item.id}', 'note_full_${safeId}')" style="flex:1; padding:2px; font-size:0.55rem; background:#ff9800; border:none; border-radius:3px; color:white; cursor:pointer;">🔄</button>
            </div>
        </div>
        <div style="flex:1; background:#1a1a1a; border-radius:6px; padding:4px;">
            <div style="position:relative;">
                <img src="${consumedImgUrl}" alt="${item.name} (Empty)" onclick="openModal('${consumedImgUrl}', '${item.name} (Empty)', '${consumedStatus}')"
                    style="width:100%; aspect-ratio:1; object-fit:cover; background:var(--bg-dark); cursor:pointer; border-radius:4px;">
                <span style="position:absolute; top:2px; left:2px; font-size:0.55rem; font-weight:bold; background:#f44336; padding:1px 4px; border-radius:3px; color:white;">EMPTY</span>
            </div>
            ${consumedDescPreview}
            <div style="font-size:0.55rem; text-align:center; margin:2px 0; color:${consumedStatus === 'approved' ? '#4caf50' : consumedStatus === 'declined' ? '#f44336' : consumedStatus === 'clean' ? '#64b5f6' : '#d4a017'};">${consumedStatus.toUpperCase()}</div>
            <input type="text" id="note_consumed_${safeId}" placeholder="Note..." style="width:100%; padding:2px 4px; font-size:0.55rem; background:#222; color:#fff; border:1px solid #444; border-radius:3px; margin-bottom:2px;">
            <div style="display:flex; gap:2px;">
                <button onclick="updateConsumedStatus('${currentCategoryName}', '${fileName}', '${item.id}', 'approved')" style="flex:1; padding:2px; font-size:0.55rem; background:#4caf50; border:none; border-radius:3px; color:white; cursor:pointer;">✓</button>
                <button onclick="updateConsumedStatus('${currentCategoryName}', '${fileName}', '${item.id}', 'declined', document.getElementById('note_consumed_${safeId}')?.value)" style="flex:1; padding:2px; font-size:0.55rem; background:#f44336; border:none; border-radius:3px; color:white; cursor:pointer;">✗</button>
                <button onclick="updateConsumedStatus('${currentCategoryName}', '${fileName}', '${item.id}', 'declined', 'Remake: ' + (document.getElementById('note_consumed_${safeId}')?.value || 'needs redo'))" style="flex:1; padding:2px; font-size:0.55rem; background:#ff9800; border:none; border-radius:3px; color:white; cursor:pointer;">🔄</button>
            </div>
        </div>
    </div>`;
}

function buildActionsHtml(item, safeId, fileName, hasImage) {
    if (item.status === 'pending' || (item.status === 'approved' && hasImage)) {
        return `
            <input type="text" id="note_${safeId}" placeholder="Decline reason..." style="width:100%; margin-top:0.5rem; padding:0.3rem; font-size:0.7rem; background:var(--bg-dark); color:var(--text); border:1px solid var(--text-dim); border-radius:3px;">
            <div class="asset-actions">
                <button class="approve" onclick="updateCategoryStatus('${currentCategoryName}', '${fileName}', '${item.id}', 'approved')">✓ Approve</button>
                <button class="decline" onclick="declineCategoryItem('${currentCategoryName}', '${fileName}', '${item.id}', '${safeId}')">✗ Decline</button>
            </div>
        `;
    } else if (item.status === 'declined') {
        return `
            <div style="font-size:0.7rem; color:var(--accent-yellow); margin-top:0.3rem; font-style:italic;">📝 ${item.declineNote || 'No reason'}</div>
            <div class="asset-actions">
                <button class="approve" onclick="updateCategoryStatus('${currentCategoryName}', '${fileName}', '${item.id}', 'approved')">✓ Re-approve</button>
            </div>
        `;
    } else if (item.status === 'clean') {
        return `
            <input type="text" id="note_${safeId}" placeholder="Remake instructions..." style="width:100%; margin-top:0.5rem; padding:0.3rem; font-size:0.7rem; background:var(--bg-dark); color:var(--text); border:1px solid var(--text-dim); border-radius:3px;">
            <div class="asset-actions">
                <button class="secondary" onclick="remakeCategoryItem('${currentCategoryName}', '${fileName}', '${item.id}', '${safeId}')" style="background:#ff9800;">🔄 Remake</button>
            </div>
        `;
    }
    return '';
}

function buildStatsHtml(item, fileName) {
    if (!item.stats) return '';
    const statIcons = { health: '❤️', damage: '⚔️', speed: '💨', attackRate: '⏱️', attackRange: '🎯', aggroRange: '👁️', xpReward: '⭐', threatLevel: '💀', attackType: '🗡️', packAggro: '🐺' };
    const statEntries = Object.entries(item.stats).map(([key, val]) => {
        const icon = statIcons[key] || '📊';
        if (key === 'attackType') {
            const isMelee = val === 'melee';
            return `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:#222; border-radius:6px;" title="${key}">
                <button onclick="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${key}', 'melee')" style="padding:4px 8px; font-size:0.8rem; background:${isMelee ? '#4caf50' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">🗡️</button>
                <button onclick="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${key}', 'ranged')" style="padding:4px 8px; font-size:0.8rem; background:${!isMelee ? '#2196f3' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">🏹</button>
            </div>`;
        }
        if (typeof val === 'boolean') {
            return `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:#222; border-radius:6px;" title="${key}">
                <span style="font-size:1.1rem;">${icon}</span>
                <input type="checkbox" ${val ? 'checked' : ''} onchange="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${key}', this.checked)" style="width:18px; height:18px; cursor:pointer;">
                <span style="font-size:0.7rem; color:var(--text-dim);">${key}</span>
            </div>`;
        }
        return `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:#222; border-radius:6px;" title="${key}">
            <span style="font-size:1.1rem;">${icon}</span>
            <input type="number" value="${val}" onchange="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${key}', this.value)" style="width:50px; padding:4px; font-size:0.9rem; font-weight:bold; background:#333; color:var(--text); border:1px solid #555; border-radius:4px; text-align:center;">
        </div>`;
    }).join('');
    return `<div style="display:flex; flex-wrap:wrap; gap:8px; margin:8px 0;">${statEntries}</div>`;
}

function buildDropsHtml(item) {
    if (!item.drops || item.drops.length === 0) return '';
    const dropSize = Math.max(40, Math.floor(categoryImageSize * 0.3));
    const dropImages = item.drops.map(drop => {
        const dropId = drop.id || drop;
        const assetInfo = getAssetInfo(dropId);
        const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
        const dropCategory = assetInfo?.category || 'items';
        const dropAssetId = assetInfo?.id || dropId;
        return `<div style="position:relative; cursor:pointer;" title="Click to view ${dropId}" onclick="navigateToAsset('${dropCategory}', '${dropAssetId}')">
            <img src="${imgPath}" onerror="this.src='/images/PH.png'" style="width:${dropSize}px; height:${dropSize}px; object-fit:contain; background:#222; border-radius:6px; border:2px solid #555;">
            <span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem; background:#000d; padding:2px 6px; border-radius:4px; font-weight:bold;">${drop.chance || 100}%</span>
            <span style="position:absolute; top:2px; left:2px; font-size:0.55rem; background:#000d; padding:1px 4px; border-radius:3px;">${dropId}</span>
        </div>`;
    }).join('');
    return `<div style="margin:8px 0;"><div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:4px;">📦 Drops:</div><div style="display:flex; gap:8px; flex-wrap:wrap;">${dropImages}</div></div>`;
}

function buildRecipeHtml(item) {
    if (!item.recipe) return '';
    let parsedRecipe = [];
    if (Array.isArray(item.recipe)) {
        parsedRecipe = item.recipe;
    } else if (typeof item.recipe === 'string') {
        const parts = item.recipe.split('+').map(p => p.trim());
        for (const part of parts) {
            const match = part.match(/^(\d+)x\s+(.+)$/i);
            if (match) parsedRecipe.push({ amount: parseInt(match[1]), item: match[2].trim() });
            else parsedRecipe.push({ amount: 1, item: part });
        }
    }
    if (parsedRecipe.length === 0) return '';
    const recipeSize = Math.max(35, Math.floor(categoryImageSize * 0.25));
    const recipeImages = parsedRecipe.map(ingredient => {
        const ingName = ingredient.item || ingredient.name || ingredient;
        const ingAmount = ingredient.amount || ingredient.count || 1;
        const assetInfo = getAssetInfo(ingName);
        const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
        const ingCategory = assetInfo?.category || 'resources';
        const ingAssetId = assetInfo?.id || ingName;
        return `<div style="position:relative; cursor:pointer;" title="Click: ${ingName}" onclick="navigateToAsset('${ingCategory}', '${ingAssetId}')">
            <img src="${imgPath}" onerror="this.src='/images/PH.png'" style="width:${recipeSize}px; height:${recipeSize}px; object-fit:contain; background:#333; border-radius:4px; border:1px solid #666;">
            <span style="position:absolute; bottom:0; right:0; font-size:0.65rem; background:#000d; padding:1px 4px; border-radius:3px; font-weight:bold;">x${ingAmount}</span>
            <span style="position:absolute; top:2px; left:2px; font-size:0.5rem; background:#000d; padding:1px 3px; border-radius:2px;">${ingName}</span>
        </div>`;
    }).join('');
    return `<div style="margin:8px 0;"><div style="font-size:0.7rem; color:var(--accent-yellow); margin-bottom:4px;">🔨 Recipe:</div><div style="display:flex; gap:6px; flex-wrap:wrap;">${recipeImages}</div></div>`;
}

function buildSourceHtml(item) {
    if (!item.source || currentCategoryName !== 'resources') return '';
    const sourceSize = Math.max(40, Math.floor(categoryImageSize * 0.3));
    const sourceName = item.source;
    const nodeInfo = getAssetInfo(sourceName);
    const imgPath = nodeInfo ? `/images/${nodeInfo.path}` : '/images/PH.png';
    const nodeCategory = nodeInfo?.category || 'nodes';
    const nodeAssetId = nodeInfo?.id || sourceName;
    return `<div style="margin:8px 0;">
        <div style="font-size:0.7rem; color:var(--accent-cyan); margin-bottom:4px;">⛏️ Source:</div>
        <div style="display:flex; gap:8px; align-items:center;">
            <div style="position:relative; cursor:pointer;" title="Click to view ${sourceName}" onclick="navigateToAsset('${nodeCategory}', '${nodeAssetId}')">
                <img src="${imgPath}" onerror="this.src='/images/PH.png'" style="width:${sourceSize}px; height:${sourceSize}px; object-fit:contain; background:#222; border-radius:6px; border:2px solid #17a2b8;">
                <span style="position:absolute; top:2px; left:2px; font-size:0.55rem; background:#000d; padding:1px 4px; border-radius:3px;">${sourceName}</span>
            </div>
        </div>
    </div>`;
}

function buildResourceDropHtml(item) {
    if (!item.resourceDrop || currentCategoryName !== 'nodes') return '';
    const dropSize = Math.max(40, Math.floor(categoryImageSize * 0.3));
    const dropName = item.resourceDrop;
    const resourceInfo = getAssetInfo(dropName);
    const imgPath = resourceInfo ? `/images/${resourceInfo.path}` : '/images/PH.png';
    const dropCategory = resourceInfo?.category || 'resources';
    const dropAssetId = resourceInfo?.id || dropName;
    const resourceName = resourceInfo?.name || dropName;
    return `<div style="margin:8px 0;">
        <div style="font-size:0.7rem; color:#4caf50; margin-bottom:4px;">🪨 Drops:</div>
        <div style="display:flex; gap:8px; align-items:center;">
            <div style="position:relative; cursor:pointer;" title="Click to view ${resourceName}" onclick="navigateToAsset('${dropCategory}', '${dropAssetId}')">
                <img src="${imgPath}" onerror="this.src='/images/PH.png'" style="width:${dropSize}px; height:${dropSize}px; object-fit:contain; background:#222; border-radius:6px; border:2px solid #4caf50;">
                <span style="position:absolute; bottom:2px; left:2px; font-size:0.55rem; background:#000d; padding:1px 4px; border-radius:3px;">${resourceName}</span>
            </div>
        </div>
    </div>`;
}

function buildBadgesHtml(item) {
    const biomeIcons = { grasslands: '🌿', tundra: '❄️', desert: '🏜️', badlands: '🌋', all: '🌍' };
    const typeIcons = { dinosaur: '🦖', herbivore: '🦕', human: '👤', saurian: '🦎', boss: '👑', melee: '🗡️', ranged: '🏹', enemy: '💀' };
    const biomeIcon = biomeIcons[item.biome] || '🌍';
    const typeIcon = typeIcons[item.enemyType] || typeIcons[item.type] || '📦';
    const tierMatch = item.id?.match(/_t(\d)_/);
    const tier = item.tier || (tierMatch ? parseInt(tierMatch[1]) : null);
    const tierColors = { 1: '#9e9e9e', 2: '#4caf50', 3: '#2196f3', 4: '#9c27b0' };
    if (!item.biome && !item.enemyType && !item.type && !tier) return '';
    return `<div style="display:flex; gap:6px; margin:4px 0; flex-wrap:wrap;">
        ${tier ? `<span style="font-size:0.75rem; font-weight:bold; background:${tierColors[tier] || '#666'}; padding:2px 8px; border-radius:10px; color:white;">T${tier}</span>` : ''}
        ${item.biome ? `<span style="font-size:0.7rem; background:#333; padding:2px 6px; border-radius:10px;" title="${item.biome}">${biomeIcon} ${item.biome}</span>` : ''}
        ${item.enemyType || item.type ? `<span style="font-size:0.7rem; background:#333; padding:2px 6px; border-radius:10px;" title="${item.enemyType || item.type}">${typeIcon}</span>` : ''}
    </div>`;
}

function buildWeaponDropdownHtml(item, fileName) {
    if ((item.enemyType !== 'human' && item.enemyType !== 'saurian') || !item.stats?.attackType) return '';
    const attackType = item.stats.attackType;
    const weapons = WEAPON_TYPES[attackType] || [];
    const currentWeapon = item.weaponType || '';
    const options = weapons.map(w => {
        const selected = w === currentWeapon ? 'selected' : '';
        const displayName = w.replace(/_/g, ' ');
        return `<option value="${w}" ${selected}>${displayName}</option>`;
    }).join('');
    return `<div style="margin:4px 0;">
        <label style="font-size:0.65rem; color:var(--text-dim);">⚔️ Weapon:</label>
        <select onchange="updateItemWeapon('${currentCategoryName}', '${fileName}', '${item.id}', this.value)" style="padding:3px 6px; font-size:0.7rem; background:#333; color:var(--text); border:1px solid #555; border-radius:4px; margin-left:4px;">
            <option value="">-- Select --</option>
            ${options}
        </select>
    </div>`;
}

function buildSfxHtml(item) {
    if (!item.sfx) return '';
    const sfxEntries = Object.entries(item.sfx).map(([sfxType, sfxData]) => {
        const status = sfxData.status || 'pending';
        const sfxId = sfxData.id;
        if (status === 'approved' || status === 'clean') {
            return `<button onclick="playSound('${sfxId}')" style="padding:3px 6px; font-size:0.65rem; background:#4caf50; border:none; border-radius:4px; cursor:pointer; color:white;" title="Play ${sfxId}">🔊 ${sfxType}</button>`;
        }
        return `<span style="padding:3px 6px; font-size:0.65rem; background:#666; border-radius:4px; color:#aaa;" title="${sfxId}: ${status}">🔇 ${sfxType}</span>`;
    }).join('');
    const isInQueue = sfxRegenerationQueue.some(q => q.assetId === item.id);
    const regenBtn = isInQueue
        ? `<span style="padding:3px 6px; font-size:0.65rem; background:#666; border:none; border-radius:4px; color:#aaa;" title="Already marked for regeneration">✓ Queued</span>`
        : `<button onclick="markAllSfxForRegeneration('${item.id}', ${JSON.stringify(Object.values(item.sfx).map(s => s.id)).replace(/"/g, '&quot;')}, this)" style="padding:3px 6px; font-size:0.65rem; background:#ff9800; border:none; border-radius:4px; cursor:pointer; color:white;" title="Mark all sounds for regeneration">🔄 Regen</button>`;
    return `<div style="display:flex; gap:4px; flex-wrap:wrap; margin:4px 0;">${sfxEntries}${regenBtn}</div>`;
}

function buildVfxHtml(item) {
    if (!item.vfx) return '';
    const pendingVfx = Object.entries(item.vfx).filter(([k, v]) => v.status === 'pending');
    if (pendingVfx.length === 0) return '';
    return `<div style="font-size:0.65rem; color:#ff9800; margin:4px 0;">🎬 Missing VFX: ${pendingVfx.map(([k]) => k).join(', ')}</div>`;
}

function buildOtherFieldsHtml(item) {
    const skipFields = ['id', 'name', 'status', 'vfx', 'sfx', 'sourceDescription', 'declineNote', 'files', 'groupId', 'stats', 'drops', 'biome', 'enemyType', 'type', 'tier'];
    return Object.entries(item)
        .filter(([key, val]) => !skipFields.includes(key) && val !== null && val !== undefined)
        .map(([key, val]) => {
            let displayVal = val;
            if (Array.isArray(val)) displayVal = val.length + ' items';
            else if (typeof val === 'object') displayVal = '...';
            return `<span style="font-size:0.6rem; color:var(--text-dim);">${key}: ${displayVal}</span>`;
        }).join(' • ');
}
