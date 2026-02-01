/**
 * Category Renderer Module
 * Core rendering functions for category view grid
 */

import {
    categoryData,
    categoryFilter,
    categoryImageSize,
    categorySort,
    currentCategoryName,
    CATEGORY_ICONS,
    CATEGORY_COLORS,
    isHeroCategory,
    type AssetItem,
} from './state';
import {
    buildSplitImageHtml,
    buildActionsHtml,
    buildStatsHtml,
    buildDropsHtml,
    buildRecipeHtml,
    buildSourceHtml,
    buildResourceDropHtml,
    buildBadgesHtml,
    buildRoleDropdownHtml,
    buildWeaponDropdownHtml,
    buildGenderBodyTypeHtml,
    buildLoreDescriptionHtml,
    buildSpeciesDropdownHtml,
    buildSizeScaleHtml,
    buildSfxHtml,
    buildVfxHtml,
    buildOtherFieldsHtml,
    buildHeroSfxHtml,
} from './builders';

// ============================================
// SORTING
// ============================================

function sortCategoryItems(items: AssetItem[]): AssetItem[] {
    const sorted = [...items];

    if (categorySort === 'tier') {
        sorted.sort((a, b) => {
            const tierA = a.tier || (a.id?.match(/_t(\d)_/)?.[1] ? parseInt(a.id!.match(/_t(\d)_/)![1]) : 99);
            const tierB = b.tier || (b.id?.match(/_t(\d)_/)?.[1] ? parseInt(b.id!.match(/_t(\d)_/)![1]) : 99);
            if (tierA !== tierB) return tierA - tierB;
            return (a.id || '').localeCompare(b.id || '');
        });
    } else if (categorySort === 'newest' || categorySort === 'oldest') {
        sorted.sort((a, b) => {
            const timeA = a.imageModifiedTime || 0;
            const timeB = b.imageModifiedTime || 0;
            return categorySort === 'newest' ? timeB - timeA : timeA - timeB;
        });
    }

    return sorted;
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

export function renderCategoryView(): void {
    const container = document.getElementById('mainContent');
    if (!container) return;
    container.innerHTML = '';

    if (!categoryData || categoryData.error) {
        container.innerHTML = '<div class="error">' + (categoryData?.error || 'No data') + '</div>';
        return;
    }

    const config = categoryData._config || {};
    const queue = categoryData.asset_queue || {};
    const files = categoryData.files || {};

    // Count stats
    const stats = { pending: 0, approved: 0, declined: 0, clean: 0, missing: 0 };
    Object.values(files)
        .flat()
        .forEach((item) => {
            const status = (item.status || 'pending') as keyof typeof stats;
            if (status in stats) stats[status]++;
        });

    // Count missing VFX/SFX
    const missingVfx = (queue.vfx || []).filter((v) => v.status === 'pending').length;
    const missingSfx = (queue.sfx || []).filter((s) => s.status === 'pending').length;

    // Get unique filter values
    const allItems = Object.values(files).flat();
    const biomes = [...new Set(allItems.map((i) => i.biome).filter((b) => b && b !== 'all'))] as string[];
    const tiers = (
        [
            ...new Set(
                allItems
                    .map((i) => {
                        if (i.tier) return i.tier;
                        const match = i.id?.match(/_t(\d)_/);
                        return match ? parseInt(match[1]) : null;
                    })
                    .filter((t) => t)
            ),
        ] as number[]
    ).sort();
    const fileNames = Object.keys(files);

    container.innerHTML = `
        <div style="padding:1rem; background:var(--bg-panel); margin-bottom:1rem; border-radius:8px;">
            <h2 style="color:${CATEGORY_COLORS[currentCategoryName] || '#fff'}; margin-bottom:0.5rem;">${CATEGORY_ICONS[currentCategoryName] || '📁'} ${currentCategoryName.toUpperCase()} Registry</h2>
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
                <button class="filter-btn ${categoryFilter.status === 'all' ? 'active' : ''}" data-action="set-category-status" data-value="all">All</button>
                <button class="filter-btn ${categoryFilter.status === 'pending' ? 'active' : ''}" data-action="set-category-status" data-value="pending">Pending</button>
                <button class="filter-btn ${categoryFilter.status === 'approved' ? 'active' : ''}" data-action="set-category-status" data-value="approved">Approved</button>
                <button class="filter-btn ${categoryFilter.status === 'declined' ? 'active' : ''}" data-action="set-category-status" data-value="declined">Declined</button>
                <button class="filter-btn ${categoryFilter.status === 'clean' ? 'active' : ''}" data-action="set-category-status" data-value="clean">Clean</button>
            </div>
            ${fileNames.length > 1
            ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Files:</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.file === 'all' ? 'active' : ''}" data-action="set-category-file" data-value="all" style="background:#666;">All</button>
                ${fileNames
                .map((f) => {
                    const displayName = f.replace(/^(equipment_|item_|items_|resources_|enemies_|)/, '');
                    return `<button class="filter-btn ${categoryFilter.file === f ? 'active' : ''}" data-action="set-category-file" data-value="${f}">${displayName}</button>`;
                })
                .join('')}
            </div>
            `
            : ''
        }
            ${biomes.length > 0
            ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Biomes (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.biome === 'all' ? 'active' : ''}" data-action="set-category-biome" data-value="all" style="background:#666;">Clear</button>
                ${biomes.map((b) => `<button class="filter-btn ${categoryFilter.biome === b ? 'active' : ''}" data-action="set-category-biome" data-value="${b}" style="background:${b === 'grasslands' ? '#4caf50' : b === 'tundra' ? '#00bcd4' : b === 'desert' ? '#ff9800' : '#f44336'};">${b}</button>`).join('')}
            </div>
            `
            : ''
        }
            ${tiers.length > 0
            ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Tiers (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.tier === 'all' ? 'active' : ''}" data-action="set-category-tier" data-value="all" style="background:#666;">Clear</button>
                ${tiers.map((t) => `<button class="filter-btn ${categoryFilter.tier === t ? 'active' : ''}" data-action="set-category-tier" data-value="${t}" style="background:${t === 1 ? '#9e9e9e' : t === 2 ? '#4caf50' : t === 3 ? '#2196f3' : '#9c27b0'};">T${t}</button>`).join('')}
            </div>
            `
            : ''
        }
            ${currentCategoryName === 'nodes'
            ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Node Type (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.nodeSubtype === 'all' ? 'active' : ''}" data-action="set-category-subtype" data-value="all" style="background:#666;">All</button>
                <button class="filter-btn ${categoryFilter.nodeSubtype === 'mining' ? 'active' : ''}" data-action="set-category-subtype" data-value="mining" style="background:#795548;">⛏️ Mining</button>
                <button class="filter-btn ${categoryFilter.nodeSubtype === 'woodcutting' ? 'active' : ''}" data-action="set-category-subtype" data-value="woodcutting" style="background:#4caf50;">🪓 Woodcutting</button>
                <button class="filter-btn ${categoryFilter.nodeSubtype === 'harvesting' ? 'active' : ''}" data-action="set-category-subtype" data-value="harvesting" style="background:#ff9800;">🌾 Harvesting</button>
                <button class="filter-btn ${categoryFilter.nodeSubtype === 'fishing' ? 'active' : ''}" data-action="set-category-subtype" data-value="fishing" style="background:#2196f3;">🎣 Fishing</button>
            </div>
            `
            : ''
        }
            ${currentCategoryName === 'equipment'
            ? `
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Weapon Type (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.weaponType === 'all' ? 'active' : ''}" data-action="set-category-weapon" data-value="all" style="background:#666;">Clear</button>
                <button class="filter-btn ${categoryFilter.weaponType === 'melee' ? 'active' : ''}" data-action="set-category-weapon" data-value="melee" style="background:#e91e63;">⚔️ Melee</button>
                <button class="filter-btn ${categoryFilter.weaponType === 'ranged' ? 'active' : ''}" data-action="set-category-weapon" data-value="ranged" style="background:#ff9800;">🔫 Ranged</button>
                <button class="filter-btn ${categoryFilter.weaponType === 'shield' ? 'active' : ''}" data-action="set-category-weapon" data-value="shield" style="background:#2196f3;">🛡️ Shield</button>
            </div>
            <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.5rem;">Hands (additive filter):</div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.5rem;">
                <button class="filter-btn ${categoryFilter.hands === 'all' ? 'active' : ''}" data-action="set-category-hands" data-value="all" style="background:#666;">Clear</button>
                <button class="filter-btn ${categoryFilter.hands === '1-hand' ? 'active' : ''}" data-action="set-category-hands" data-value="1-hand" style="background:#4caf50;">✋ 1-Hand</button>
                <button class="filter-btn ${categoryFilter.hands === '2-hand' ? 'active' : ''}" data-action="set-category-hands" data-value="2-hand" style="background:#9c27b0;">🤲 2-Hand</button>
            </div>
            `
            : ''
        }
            <div style="display:flex; align-items:center; gap:1rem; margin-top:0.5rem;">
                <span style="font-size:0.8rem; color:var(--text-dim);">🔍 Image Size:</span>
                <input type="range" id="imageSizeSlider" min="100" max="400" value="${categoryImageSize}" 
                    data-action="set-category-size" data-capture-value="true"
                    style="width:200px; accent-color:var(--accent-green);">
                <span id="imageSizeValue" style="font-size:0.8rem; color:var(--text-dim);">${categoryImageSize}px</span>
                <span style="margin-left:2rem; font-size:0.8rem; color:var(--text-dim);">📊 Sort:</span>
                <button class="filter-btn ${categorySort === 'tier' ? 'active' : ''}" data-action="set-category-sort" data-value="tier" style="background:#666;">By Tier</button>
                <button class="filter-btn ${categorySort === 'newest' ? 'active' : ''}" data-action="set-category-sort" data-value="newest" style="background:#666;">Newest First</button>
                <button class="filter-btn ${categorySort === 'oldest' ? 'active' : ''}" data-action="set-category-sort" data-value="oldest" style="background:#666;">Oldest First</button>
            </div>
        </div>
    `;

    // Render each file's data with filtering
    for (const [fileName, items] of Object.entries(files)) {
        if (!Array.isArray(items) || items.length === 0) continue;
        if (categoryFilter.file !== 'all' && categoryFilter.file !== fileName) continue;

        // Apply filters
        let filteredItems = items;
        if (categoryFilter.status !== 'all')
            filteredItems = filteredItems.filter((i) => (i.status || 'pending') === categoryFilter.status);
        if (categoryFilter.biome !== 'all')
            filteredItems = filteredItems.filter((i) => i.biome === categoryFilter.biome || i.biome === 'all');
        if (categoryFilter.tier !== 'all')
            filteredItems = filteredItems.filter((i) => {
                const tier = i.tier || (i.id?.match(/_t(\d)_/)?.[1] ? parseInt(i.id!.match(/_t(\d)_/)![1]) : null);
                return tier === categoryFilter.tier;
            });
        if (categoryFilter.weaponType !== 'all')
            filteredItems = filteredItems.filter((i) => i.weaponType === categoryFilter.weaponType);
        if (categoryFilter.hands !== 'all')
            filteredItems = filteredItems.filter((i) => i.gripType === categoryFilter.hands);
        if (categoryFilter.nodeSubtype !== 'all')
            filteredItems = filteredItems.filter(
                (i) => (i as AssetItem & { nodeSubtype?: string }).nodeSubtype === categoryFilter.nodeSubtype
            );

        if (filteredItems.length === 0) continue;

        // Sort items
        filteredItems = sortCategoryItems(filteredItems);

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

        const grid = section.querySelector('.asset-grid')!;
        filteredItems.forEach((item) => {
            const card = createCategoryCard(item, fileName);
            grid.appendChild(card);
        });
    }
}

// ============================================
// CARD CREATION
// ============================================

function createCategoryCard(item: AssetItem, fileName: string): HTMLElement {
    const card = document.createElement('div');
    card.className = 'asset-card ' + (item.status || 'pending');

    const hasConsumedVersion = !!(item.files?.consumed_clean || item.files?.consumed_original);
    const cardWidth = hasConsumedVersion ? categoryImageSize * 2 + 20 : categoryImageSize;

    card.style.width = cardWidth + 'px';
    card.style.minWidth = cardWidth + 'px';
    const safeId = (item.id || '').replace(/[^a-zA-Z0-9]/g, '_');
    card.dataset.itemId = safeId;
    const hasImage = !!(item.files?.clean || item.files?.original);

    // Image preview
    const imgSize = categoryImageSize + 'px';
    let imgHtml = `<div style="width:${imgSize}; height:${imgSize}; background:var(--bg-dark); display:flex; align-items:center; justify-content:center;"><span style="font-size:3rem;">📦</span></div>`;
    const imgPath = item.files?.clean || item.files?.original;
    const consumedPath = item.files?.consumed_clean || item.files?.consumed_original;

    if (imgPath && consumedPath) {
        imgHtml = buildSplitImageHtml(item, imgPath, consumedPath, safeId, fileName);
    } else if (imgPath) {
        const displayPath = imgPath.replace(/^(assets\/)?images\//, '');
        const fullImgUrl = `/images/${displayPath}`;
        imgHtml = `<img class="asset-image" src="${fullImgUrl}" alt="${item.name}" 
            data-action="open-modal"
            data-path="${fullImgUrl}"
            data-name="${item.name}"
            data-status="${item.status || 'pending'}"
            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
            style="width:${imgSize}; height:${imgSize}; object-fit:cover; background:var(--bg-dark); cursor:pointer;">
        <div style="width:${imgSize}; height:${imgSize}; background:var(--bg-dark); display:none; align-items:center; justify-content:center;"><span style="font-size:3rem;">📦</span></div>`;
    }

    // Description preview
    const hasConsumedFiles = !!(item.files?.consumed_clean || item.files?.consumed_original);
    const descPreview =
        !hasConsumedFiles && item.sourceDescription
            ? `<div style="font-size:0.65rem; color:var(--accent-yellow); margin-top:0.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${item.sourceDescription.replace(/"/g, '&quot;')}">📝 ${item.sourceDescription.substring(0, 40)}...</div>`
            : '';

    // Build actions
    const actionsHtml = buildActionsHtml(item, safeId, fileName, hasImage);

    // HERO CATEGORY: Simplified card
    if (isHeroCategory(currentCategoryName)) {
        const heroSfxHtml = buildHeroSfxHtml(item, fileName);

        card.innerHTML = `
            ${imgHtml}
            <div class="asset-info" style="padding:0.5rem;">
                <div class="asset-name" style="margin-bottom:0.1rem; font-size:0.85rem;">🛡️ ${item.name || item.id}</div>
                <div style="font-size:0.65rem; color:#444; margin-bottom:0.3rem; font-family:monospace;">${item.id}</div>
                <div style="font-size:0.6rem; color:#666; margin-bottom:0.3rem;">Hero Skin Variant</div>
                ${heroSfxHtml}
                <span class="asset-status status-${item.status || 'pending'}" style="margin-top:0.5rem;">${item.status || 'pending'}</span>
                ${descPreview}
                ${actionsHtml}
            </div>
        `;
        return card;
    }

    // STANDARD CATEGORIES: Full card
    const statsHtml = buildStatsHtml(item, fileName);
    const dropsHtml = buildDropsHtml(item);
    const recipeHtml = buildRecipeHtml(item);
    const sourceHtml = buildSourceHtml(item);
    const resourceDropHtml = buildResourceDropHtml(item);
    const badgesHtml = buildBadgesHtml(item, fileName);
    const roleDropdownHtml = buildRoleDropdownHtml(item, fileName);
    const weaponDropdownHtml = buildWeaponDropdownHtml(item, fileName);
    const genderBodyTypeHtml = buildGenderBodyTypeHtml(item, fileName);
    const speciesDropdownHtml = buildSpeciesDropdownHtml(item, fileName);
    const sizeScaleHtml = buildSizeScaleHtml(item, fileName);
    const loreDescriptionHtml = buildLoreDescriptionHtml(item, fileName);
    const sfxHtml = buildSfxHtml(item);
    const vfxHtml = buildVfxHtml(item);
    const otherFieldsHtml = buildOtherFieldsHtml(item);

    card.innerHTML = `
        ${imgHtml}
        <div class="asset-info" style="padding:0.5rem;">
            <div class="asset-name" style="margin-bottom:0.1rem; font-size:0.85rem;">${item.name || item.id}</div>
            <div style="font-size:0.65rem; color:#444; margin-bottom:0.3rem; font-family:monospace;">${item.id}</div>
            ${badgesHtml}
            ${roleDropdownHtml}
            ${weaponDropdownHtml}
            ${genderBodyTypeHtml}
            ${speciesDropdownHtml}
            ${sizeScaleHtml}
            ${loreDescriptionHtml}
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
