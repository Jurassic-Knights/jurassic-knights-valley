
import {
    AssetItem,
    CategoryData,
    categoryFilter,
    currentCategoryName,
    selectedAssetId,
    categoryImageSize,
    globalAssetLookup,
    CATEGORY_COLORS,
    setCategoryData,
    categoryData,
    CATEGORY_ICONS,
    imageParams,
} from './state';

// ============================================
// CONSTANTS & COLORS
// ============================================

const TIER_COLORS: Record<string, string> = {
    '1': '#9e9e9e', // Common
    '2': '#4caf50', // Uncommon
    '3': '#2196f3', // Rare
    '4': '#9c27b0', // Epic
    '5': '#ff9800', // Legendary
};

const BIOME_COLORS: Record<string, string> = {
    'grasslands': '#4caf50',
    'tundra': '#3498db',
    'desert': '#e67e22',
    'badlands': '#c0392b',
    'global': '#7f8c8d'
};

const STATUS_COLORS: Record<string, string> = {
    'pending': '#f1c40f',
    'approved': '#2ecc71',
    'declined': '#e74c3c',
    'clean': '#3498db',
    'all': '#7f8c8d'
};

// ============================================
// MAIN RENDERER
// ============================================

export function renderCategoryView(data?: CategoryData | null) {
    // 1. Update State if new data passed
    if (data) {
        setCategoryData(data);
    }

    const activeData = data || categoryData;
    if (!activeData) return;

    // 2. Setup Container
    // 2. Setup Container
    let container = document.getElementById('categoryGrid');

    // If grid is missing (e.g. wiped by loading screen), rebuild layout
    if (!container) {
        const main = document.getElementById('mainContent');
        if (!main) return;

        main.innerHTML = `
            <style>
                .status-stamp {
                    position: absolute;
                    top: 10px;
                    right: -25px;
                    transform: rotate(45deg);
                    padding: 2px 25px;
                    font-size: 0.6rem;
                    font-weight: 900;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    z-index: 10;
                    pointer-events: none;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.3);
                }
                .status-stamp.approved {
                    background: #2ecc71;
                    color: white;
                }
                .status-stamp.declined {
                    background: #e74c3c;
                    color: white;
                }
                .status-stamp.pending {
                    background: #f1c40f;
                    color: #333;
                    text-shadow: none;
                }
            </style>
            <div class="sticky-bar">
                <div class="header-row">
                    <h2 id="categoryTitle" class="category-title">${currentCategoryName.toUpperCase()}</h2>
                    <div id="filterContainer" class="filter-container"></div>
                </div>
            </div>
            <div id="categoryGrid" class="asset-grid"></div>
        `;

        container = document.getElementById('categoryGrid');
        if (!container) return;
    }

    container.innerHTML = '';

    // 3. Render Filters
    const filterContainer = document.getElementById('filterContainer');
    if (filterContainer) {
        // Flatten all items for filter counts/options
        const allItems = activeData.entities || [];
        renderDynamicFilters(filterContainer, allItems, activeData.files || {});
    }

    // 4. Apply Filters
    let items = activeData.entities || [];

    // Filter Logic
    if (categoryFilter.status !== 'all') {
        items = items.filter(i => (i.status || 'pending') === categoryFilter.status);
    }
    if (categoryFilter.biome !== 'all') {
        items = items.filter(i => i.biome === categoryFilter.biome);
    }
    if (categoryFilter.tier !== 'all') {
        items = items.filter(i => String(i.tier || (i.id.match(/_t(\d)_/)?.[1]) || 0) === String(categoryFilter.tier));
    }
    if (categoryFilter.file !== 'all') {
        if (currentCategoryName === 'ground') {
            // For ground, 'file' filter maps to 'category' part of ID
            items = items.filter(i => {
                const parts = i.id.split('_');
                return parts[1] === categoryFilter.file;
            });
        } else {
            // 'file' filter usually maps to source file key in data.files
            // But here we might check if item is in that specific list
            // Or if we have a sourceFile property.
            // Let's use the file map check if data.files is present
            if (activeData.files && activeData.files[categoryFilter.file]) {
                const fileItems = new Set(activeData.files[categoryFilter.file].map(i => i.id));
                items = items.filter(i => fileItems.has(i.id));
            }
        }
    }
    if (categoryFilter.nodeSubtype !== 'all') {
        if (currentCategoryName === 'ground') {
            // For ground, 'nodeSubtype' filter maps to 'material' part of ID
            items = items.filter(i => {
                const parts = i.id.split('_');
                const biomes = ['grasslands', 'tundra', 'desert', 'badlands', 'global'];
                const biomeIndex = parts.findIndex(p => biomes.includes(p));
                if (biomeIndex > 2) {
                    const mat = parts.slice(2, biomeIndex).join('_');
                    return mat === categoryFilter.nodeSubtype;
                }
                return false;
            });
        } else {
            items = items.filter(i => i.nodeSubtype === categoryFilter.nodeSubtype);
        }
    }

    // 5. Render Cards
    const fragment = document.createDocumentFragment();

    // Virtualize? No, pagination/lazy load maybe. For now just render all.
    // If > 500 items, verify performance.

    items.forEach(item => {
        // Determine 'fileName' context (often passed or derived)
        // We'll trust dataset or just use default.
        const fileName = categoryFilter.file !== 'all' ? categoryFilter.file : (findFileForItem(item, activeData.files) || 'unknown');

        const card = createCategoryCard(item, fileName);
        fragment.appendChild(card);
    });

    container.appendChild(fragment);

    // Update Header Counts
    const headerTitle = document.getElementById('categoryTitle');
    if (headerTitle) {
        headerTitle.innerHTML = `${CATEGORY_ICONS[currentCategoryName] || ''} ${currentCategoryName.toUpperCase()} <span style="opacity:0.6; font-size:0.8em">(${items.length})</span>`;
    }
}

function findFileForItem(item: AssetItem, files: Record<string, AssetItem[]> | undefined): string | null {
    if (!files) return null;
    for (const [fName, list] of Object.entries(files)) {
        if (list.some(i => i.id === item.id)) return fName;
    }
    return null;
}


// ============================================
// FILTER RENDERING
// ============================================

function renderDynamicFilters(container: HTMLElement, allItems: AssetItem[], files: Record<string, AssetItem[]>) {
    container.innerHTML = '';

    // 1. STATUS MODULE
    const statusGroup = createFilterModule('Status');
    const statusContent = statusGroup.querySelector('.module-content')!;
    ['all', 'pending', 'approved', 'declined', 'clean'].forEach(status => {
        const color = STATUS_COLORS[status];
        statusContent.appendChild(createFilterBtn(
            status.charAt(0).toUpperCase() + status.slice(1),
            'set-category-status',
            status,
            categoryFilter.status === status,
            color
        ));
    });
    container.appendChild(statusGroup);

    // 2. TIER MODULE (Skip for Ground)
    if (currentCategoryName !== 'ground') {
        const tierGroup = createFilterModule('Tier');
        const tierContent = tierGroup.querySelector('.module-content')!;
        ['all', 1, 2, 3, 4, 5].forEach(t => {
            const label = t === 'all' ? 'All' : `T${t}`;
            // Lookup Tier color
            const color = t === 'all' ? undefined : TIER_COLORS[String(t)];

            tierContent.appendChild(createFilterBtn(
                label,
                'set-category-tier',
                String(t),
                String(categoryFilter.tier) === String(t),
                color
            ));
        });
        container.appendChild(tierGroup);
    }

    // 2.5 GROUND SPECIFIC FILTERS (Category & Material)
    if (currentCategoryName === 'ground') {
        const categories = new Set<string>();
        const materials = new Set<string>();

        allItems.forEach(item => {
            // ID Format: ground_[category]_[material]_[biome]_[index]
            const parts = item.id.split('_');
            if (parts.length >= 4) {
                // ground = 0, category = 1, material = 2... (might be multi-word)
                // Let's assume standard known categories: base, overgrown, interior, vertical, damage
                const groundCats = ['base', 'overgrown', 'interior', 'vertical', 'damage'];
                const cat = parts[1];
                if (groundCats.includes(cat)) {
                    categories.add(cat);
                    // Material is everything between category and biome
                    // Biome is usually known or at end-1
                    // Let's rely on indices assuming biome is 2nd to last if last is number?
                    // Actually, let's just grab the part after category and before biome.
                    // Common biomes: grasslands, tundra, desert, badlands
                    const biomes = ['grasslands', 'tundra', 'desert', 'badlands', 'global'];
                    const biomeIndex = parts.findIndex(p => biomes.includes(p));

                    if (biomeIndex > 2) {
                        const mat = parts.slice(2, biomeIndex).join('_');
                        materials.add(mat);
                    }
                }
            }
        });

        // RENDER CATEGORY FILTER
        if (categories.size > 0) {
            const group = createFilterModule('Category');
            const content = group.querySelector('.module-content')!;

            // Re-purpose 'file' filter for 'category' since we don't use file filter for ground much?
            // User requested explicit badges and filters.
            // Let's use 'nodeSubtype' field in state for 'Category' and 'weaponType' for 'Material' hacks?
            // OR just add new filter fields to state?
            // For now, let's map 'Category' -> 'file' (Type) and 'Material' -> 'nodeSubtype' (Subtype)
            // This reuses existing state fields without schema change.

            content.appendChild(createFilterBtn('All', 'set-category-file', 'all', categoryFilter.file === 'all'));
            [...categories].sort().forEach(c => {
                content.appendChild(createFilterBtn(
                    c.charAt(0).toUpperCase() + c.slice(1),
                    'set-category-file',
                    c,
                    categoryFilter.file === c,
                    '#9b59b6'
                ));
            });
            container.appendChild(group);
        }

        // RENDER MATERIAL FILTER
        if (materials.size > 0) {
            const group = createFilterModule('Material');
            const content = group.querySelector('.module-content')!;

            content.appendChild(createFilterBtn('All', 'set-category-node-subtype', 'all', categoryFilter.nodeSubtype === 'all'));
            [...materials].sort().forEach(m => {
                content.appendChild(createFilterBtn(
                    m.replace(/_/g, ' ').toUpperCase(),
                    'set-category-node-subtype',
                    m,
                    categoryFilter.nodeSubtype === m,
                    '#e67e22'
                ));
            });
            container.appendChild(group);
        }
    }

    // 3. BIOME MODULE
    const biomes = [...new Set(allItems.map((i) => i.biome).filter((b) => b && b !== 'all'))] as string[];
    if (biomes.length > 0) {
        const biomeGroup = createFilterModule('Biome');
        const biomeContent = biomeGroup.querySelector('.module-content')!;

        biomeContent.appendChild(createFilterBtn('All', 'set-category-biome', 'all', categoryFilter.biome === 'all'));

        biomes.forEach(b => {
            const color = BIOME_COLORS[b.toLowerCase()];
            biomeContent.appendChild(createFilterBtn(
                b,
                'set-category-biome',
                b,
                categoryFilter.biome === b,
                color
            ));
        });
        container.appendChild(biomeGroup);
    }

    // 4. TYPE MODULE
    const fileNames = Object.keys(files);
    if (fileNames.length > 1) {
        const fileGroup = createFilterModule('Type');
        const fileContent = fileGroup.querySelector('.module-content')!;

        fileContent.appendChild(createFilterBtn('All', 'set-category-file', 'all', categoryFilter.file === 'all'));

        fileNames.forEach(f => {
            const displayName = f.replace(/^(equipment_|item_|items_|resources_|enemies_|)/, '');
            const color = CATEGORY_COLORS[displayName] || '#7f8c8d';

            fileContent.appendChild(createFilterBtn(
                displayName,
                'set-category-file',
                f,
                categoryFilter.file === f,
                color
            ));
        });
        container.appendChild(fileGroup);
    }

    // 5. NODE SUBTYPE MODULE
    if (currentCategoryName === 'nodes') {
        const subtypes = [...new Set(allItems.map(i => i.nodeSubtype).filter(s => s))];
        if (subtypes.length > 0) {
            const subGroup = createFilterModule('Subtype');
            const subContent = subGroup.querySelector('.module-content')!;

            subContent.appendChild(createFilterBtn('All', 'set-category-node-subtype', 'all', categoryFilter.nodeSubtype === 'all'));

            subtypes.forEach(s => {
                const isActive = categoryFilter.nodeSubtype === s;
                subContent.appendChild(createFilterBtn(
                    s!.charAt(0).toUpperCase() + s!.slice(1),
                    'set-category-node-subtype',
                    s!,
                    isActive,
                    isActive ? '#d35400' : '#e67e22'
                ));
            });
            container.appendChild(subGroup);
        }
    }

    // 5. ACTIONS
    const actionGroup = document.createElement('div');
    actionGroup.className = 'filter-actions';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'filter-reset-btn';
    resetBtn.innerHTML = `<span>❌ RESET</span>`;
    resetBtn.dataset.action = 'reset-filters';
    resetBtn.title = "Clear all active filters";
    actionGroup.appendChild(resetBtn);

    container.appendChild(actionGroup);
}

function createFilterModule(label: string): HTMLElement {
    const group = document.createElement('div');
    group.className = 'filter-module';

    const labelEl = document.createElement('div');
    labelEl.className = 'module-label';
    labelEl.textContent = label;
    group.appendChild(labelEl);

    const content = document.createElement('div');
    content.className = 'module-content';
    group.appendChild(content);

    return group;
}

function createFilterBtn(text: string, action: string, value: string, isActive: boolean, color?: string): HTMLElement {
    const btn = document.createElement('button');
    btn.className = `filter-pill ${isActive ? 'active' : ''}`;
    btn.textContent = text;
    btn.dataset.action = action;
    btn.dataset.value = value;

    // Color Logic
    if (color) {
        if (isActive) {
            btn.style.backgroundColor = color;
            btn.style.color = '#fff';
            btn.style.borderColor = color;
            btn.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
        } else {
            btn.style.color = color;
            btn.style.borderColor = color;
            btn.style.border = `1px solid ${color}40`;
        }
    }

    return btn;
}


// ============================================
// CARD CREATION
// ============================================

export function createCategoryCard(item: AssetItem, fileName: string): HTMLElement {
    const card = document.createElement('div');
    const isSelected = selectedAssetId === item.id;
    card.className = `asset-card ${item.status || 'pending'} ${isSelected ? 'selected' : ''}`;

    // Bind Selection Action
    card.dataset.action = 'select-asset';
    card.dataset.id = item.id;
    card.dataset.file = fileName;
    card.dataset.category = currentCategoryName;

    // Width override
    card.style.width = (categoryImageSize + 24) + 'px';

    // 1. STATUS BAR
    const statusHtml = `<div class="status-indicator ${item.status || 'pending'}"></div>`;

    // 2. IMAGE
    let imgPath = item.files?.clean || item.files?.original || '/images/PH.png';
    if (!imgPath.startsWith('/') && !imgPath.startsWith('http')) {
        imgPath = `/images/${imgPath.replace(/^(assets\/)?images\//, '')}`;
    }

    // Determine Upload Target (Prefer Original)
    let uploadPath = item.files?.original || item.files?.clean || imgPath;
    if (!uploadPath.startsWith('/') && !uploadPath.startsWith('http')) {
        uploadPath = `/images/${uploadPath.replace(/^(assets\/)?images\//, '')}`;
    }

    // Debug: Log render state
    // console.log('[Renderer] Rendering:', item.id, 'Param:', imageParams[item.id]);

    // const debugBorder = imageParams[item.id] ? '2px solid #4caf50' : '1px solid #333';

    const status = item.status || 'pending';
    const stampLabel = status === 'approved' ? 'APPROVED' : status === 'declined' ? 'DECLINED' : 'PENDING';
    const stampClass = status;

    const imgHtml = `
        <div class="card-image-container" style="height:${categoryImageSize}px; position:relative; overflow:hidden;" 
             data-action="image-drop-zone" 
             data-path="${uploadPath}" 
             data-id="${item.id}"
             data-name="${item.name || item.id}" 
             data-status="${item.status || 'pending'}">
             <img src="${imgPath}${imageParams[item.id] ? '?v=' + imageParams[item.id] : ''}" class="asset-image">
             
             <!-- Status Stamp -->
             <div class="status-stamp ${stampClass}">
                ${stampLabel}
             </div>
        </div>`;

    // 3. TIER (Interactive Select)
    const tier = item.tier || (item.id.match(/_t(\d)_/)?.[1] ? parseInt(item.id.match(/_t(\d)_/)![1]) : 0);
    const tierColors: Record<number, string> = { 1: '#b0bec5', 2: '#4caf50', 3: '#2196f3', 4: '#9c27b0', 5: '#f44336' };
    const currentTierColor = tierColors[Number(tier)] || '#666';

    const tierOptions = [1, 2, 3, 4, 5].map(t =>
        `<option value="${t}" ${Number(tier) === t ? 'selected' : ''}>T${t}</option>`
    ).join('');

    const tierHtml = `
        <div class="control-wrapper" title="Tier" style="width:100%;">
            <select class="badge-select" 
                style="width:100%; color:${currentTierColor}; border:1px solid ${currentTierColor}40; background: ${currentTierColor}10; padding:2px 0; text-align:center;" 
                data-action="update-tier" 
                data-category="${currentCategoryName}" 
                data-file="${fileName}" 
                data-id="${item.id}" 
                data-capture-value="true"
                onclick="event.stopPropagation()">
                <option value="0" ${!tier ? 'selected' : ''}>T?</option>
                ${tierOptions}
            </select>
        </div>
    `;

    // 4.5 TYPE BADGE & TIER
    let typeLabel = '';
    let typeColor = '#7f8c8d';
    let showTier = true;
    let groundCategory = '';
    let groundMaterial = '';

    if (currentCategoryName === 'nodes') {
        typeLabel = item.nodeSubtype || 'Generic';
        typeColor = '#d35400'; // Orange/Wood/Earth
    } else if (currentCategoryName === 'items' || currentCategoryName === 'resources') {
        if (item.sourceFile) {
            typeLabel = item.sourceFile.charAt(0).toUpperCase() + item.sourceFile.slice(1);
        } else {
            typeLabel = item.type || (currentCategoryName === 'items' ? 'Item' : 'Resource');
        }
        typeColor = currentCategoryName === 'items' ? '#8e44ad' : '#27ae60';
    } else if (currentCategoryName === 'equipment') {
        typeLabel = item.slot || (item.weaponType ? item.weaponType : 'Gear');
        typeColor = '#2980b9'; // Blue/Gear
    } else if (currentCategoryName === 'ground') {
        showTier = false;
        // Parse ID for badges
        const parts = item.id.split('_');
        if (parts.length >= 4) {
            groundCategory = parts[1]; // base, overgrown...
            const biomes = ['grasslands', 'tundra', 'desert', 'badlands', 'global'];
            const biomeIndex = parts.findIndex(p => biomes.includes(p));
            if (biomeIndex > 2) {
                groundMaterial = parts.slice(2, biomeIndex).join(' ');
            }
        }
    }

    // Simplistic Badge (Mockup for now, could be dropdown later if we have constants)
    let typeHtml = '';

    if (currentCategoryName === 'ground') {
        // RENDER GROUND BADGES (Cat | Mat)
        typeHtml = `
         <div class="control-wrapper" style="width:100%;">
             <span class="badge-static" 
                style="display:block; width:100%; color:#9b59b6; border:1px solid #9b59b640; background:#9b59b610; padding:2px 0; font-size:0.7rem; border-radius:4px; text-transform:uppercase; font-weight:bold;">
                ${groundCategory}
            </span>
        </div>
        <div class="control-wrapper" style="width:100%;">
             <span class="badge-static" 
                style="display:block; width:100%; color:#e67e22; border:1px solid #e67e2240; background:#e67e2210; padding:2px 0; font-size:0.7rem; border-radius:4px; text-transform:uppercase; font-weight:bold;">
                ${groundMaterial}
            </span>
        </div>
        `;
    } else {
        typeHtml = typeLabel ? `
            <div class="control-wrapper" title="Type: ${typeLabel}" style="width:100%;">
                <span class="badge-static" 
                    style="display:block; width:100%; color:${typeColor}; border:1px solid ${typeColor}40; background:${typeColor}10; padding:2px 0; font-size:0.7rem; border-radius:4px; text-transform:uppercase; font-weight:bold; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    ${typeLabel}
                </span>
            </div>
        ` : '<div class="control-wrapper" style="width:100%;"></div>';
    }

    // 4. BIOME (Interactive Select)
    // Valid biomes from BiomeConfig + global
    const biomes = ['grasslands', 'tundra', 'desert', 'badlands', 'global'];
    const rawBiome = item.biome; // Can be undefined
    const displayBiome = rawBiome || 'global'; // Default for selection/color

    // If missing, use a distinct style (e.g. Warning/Red) to prompt user
    const isMissing = !rawBiome;
    const biomeColor = isMissing ? '#e74c3c' : (BIOME_COLORS[displayBiome.toLowerCase()] || '#7f8c8d');

    const biomeOptions = biomes.map(b =>
        `<option value="${b}" ${b === displayBiome ? 'selected' : ''}>${b.toUpperCase()}${isMissing && b === 'global' ? '*' : ''}</option>`
    ).join('');

    const biomeHtml = `
         <div class="control-wrapper" title="${isMissing ? 'Biome Not Set (Defaulting to Global)' : 'Biome'}" style="width:100%;">
            <select class="badge-select" 
                style="width:100%; color:${biomeColor}; border:1px solid ${biomeColor}40; background:${biomeColor}10; padding:2px 0; text-align:center; ${isMissing ? 'font-style:italic;' : ''}" 
                data-action="update-field" 
                data-field="biome" 
                data-category="${currentCategoryName}" 
                data-file="${fileName}" 
                data-id="${item.id}" 
                data-capture-value="true"
                onclick="event.stopPropagation()">
                ${isMissing ? `<option value="" disabled selected>SET BIOME</option>` : ''}
                ${biomeOptions}
            </select>
        </div>
    `;

    // 5. SIZE Label & Buttons
    const size = item.display?.width || 128;
    const sizeMap = [
        { label: 'XS', val: 64 },
        { label: 'S', val: 128 },
        { label: 'M', val: 256 },
        { label: 'L', val: 512 },
        { label: 'XL', val: 1024 }
    ];

    const sizeBadges = sizeMap.map(s => {
        const isActive = size === s.val;
        // Used to be button, let's keep it compact
        return `<button class="size-badge ${isActive ? 'active' : ''}" 
            data-action="update-display-size" 
            data-category="${currentCategoryName}" 
            data-file="${fileName}" 
            data-id="${item.id}" 
            data-value="${s.val}">${s.label}</button>`;
    }).join('');

    const sizeHtml = `<div class="size-controls" style="gap:2px; padding:2px;">${sizeBadges}</div>`;

    // 6. SFX (Interactive Pills with Names)
    let sfxHtml = '';
    if (item.sfx && Object.keys(item.sfx).length > 0) {
        const sfxItems = Object.entries(item.sfx).map(([key, val]) => {
            const hasFile = typeof val === 'object' ? !!val.id : !!val;
            const sfxId = typeof val === 'string' ? val : (val as { id: string }).id;

            // Interactive button to play
            return `<button class="mini-sfx-btn ${hasFile ? 'has-sound' : 'missing'}" 
                data-action="play-sound" 
                data-id="${sfxId}" 
                title="Play ${key}"
                style="margin-bottom:4px; margin-right:4px;">
                <span>🔊</span> <span class="sfx-label">${key}</span>
            </button>`;
        }).join('');
        if (sfxItems) sfxHtml = `<div class="asset-details-row sfx-row" style="flex-wrap:wrap; gap:8px; margin-top:8px;">${sfxItems}</div>`;
    }

    // 7. DROPS
    let dropsHtml = '';
    const drops = item.loot;
    if (drops && drops.length > 0) {
        // Dynamic Drop Size
        const dropSize = Math.max(48, Math.floor((categoryImageSize - 16) / 2));

        const dropItems = drops.map(d => {
            const chance = d.chance !== undefined ? (d.chance <= 1 ? Math.round(d.chance * 100) : d.chance) : 100;
            const dropInfo = globalAssetLookup[d.item] || globalAssetLookup['item_' + d.item] || null;
            const dropImgPath = dropInfo ? `/images/${dropInfo.path}` : '/images/PH.png';

            const dropActionAttrs = dropInfo
                ? `data-action="navigate-asset" data-category="${dropInfo.category}" data-id="${d.item}" style="width:${dropSize}px; height:${dropSize}px; margin-bottom:4px; cursor:pointer;"`
                : `style="width:${dropSize}px; height:${dropSize}px; margin-bottom:4px;"`;

            return `
                <div class="drop-item" ${dropActionAttrs} title="${d.item} (${chance}%)">
                    <img src="${dropImgPath}" onerror="this.src='/images/PH.png'" class="drop-img">
                    <span class="drop-overlay name">${d.item}</span>
                    <span class="drop-overlay chance">${chance}%</span>
                </div>
            `;
        }).join('');
        dropsHtml = `<div class="asset-details-row drops-row" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:8px;">${dropItems}</div>`;
    }

    // 7c. NODE DROPS (Specific to Nodes)
    // Nodes might use 'drops' (Fishing) or 'resourceDrop' (Legacy) or 'loot' (Standard)
    // We normalize this to a single list to display.
    if (currentCategoryName === 'nodes') {
        let nodeDrops: Array<{ id: string, chance?: number }> = [];

        // 1. Check 'drops' array (Fishing style)
        if (item.drops && Array.isArray(item.drops)) {
            nodeDrops = item.drops.map((d) => ({
                id: d.item,
                chance: d.chance
            }));
        }
        // 2. Check 'loot' array (Standard style)
        else if (item.loot && Array.isArray(item.loot)) {
            nodeDrops = item.loot.map((d) => ({
                id: d.item,
                chance: d.chance
            }));
        }
        // 3. Check 'resourceDrop' string (Legacy style)
        else if (item.resourceDrop) {
            nodeDrops = [{ id: item.resourceDrop, chance: 1 }];
        }

        if (nodeDrops.length > 0) {
            // Reuse drop size
            const dropSize = Math.max(48, Math.floor((categoryImageSize - 16) / 2));

            const dropItems = nodeDrops.map(d => {
                const assetInfo = globalAssetLookup[d.id] || null;
                const dropImgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
                const chance = d.chance != null ? (d.chance > 1 ? d.chance : Math.round(d.chance * 100)) : 100;

                // Action attributes for click navigation
                const actionAttrs = assetInfo
                    ? `data-action="navigate-asset" data-category="${assetInfo.category}" data-id="${d.id}" style="cursor:pointer;"`
                    : '';

                return `
                    <div class="drop-item" ${actionAttrs} title="Drops: ${d.id} (${chance}%)" style="width:${dropSize}px; height:${dropSize}px; position:relative; background:#111; border-radius:4px; border:1px solid #444;">
                        <img src="${dropImgPath}" onerror="this.src='/images/PH.png'" class="drop-img" style="width:100%; height:100%; object-fit:contain; display:block;">
                        <span class="drop-overlay name" style="position:absolute; top:2px; left:2px; font-size:9px; background:rgba(0,0,0,0.7); padding:1px 3px; pointer-events:none;">${d.id}</span>
                        <span class="drop-overlay chance" style="position:absolute; bottom:2px; right:2px; font-size:9px; background:rgba(0,0,0,0.7); padding:1px 3px; pointer-events:none; color:#4caf50;">${chance}%</span>
                    </div>
                `;
            }).join('');
            dropsHtml = `<div class="asset-details-row drops-row" style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-top:8px; border-top:1px solid #333; padding-top:4px; ">
                <div style="width:100%; text-align:center; font-size:10px; color:#888; margin-bottom:4px;">DROPS</div>
                ${dropItems}
             </div>`;
        } else {
            // Show N/A if no drops found
            dropsHtml = `<div class="asset-details-row" style="margin-top:8px; border-top:1px solid #333; padding-top:8px; text-align:center; ">
                <div style="font-size:10px; color:#888;">DROPS</div>
                <div style="font-size:12px; color:#666; font-style:italic;">N/A</div>
             </div>`;
        }
    }



    // 8. ACTIONS FOOTER - Increased Spacing
    const actionsHtml = `
        <div class="card-footer" style="display:flex; flex-direction:column; gap:12px; margin-top:auto; padding-top:12px; border-top:1px solid #333;">
            <textarea class="feedback-input" 
                rows="1"
                placeholder="Feedback..." 
                data-action="update-field" 
                data-field="declineNote"
                data-category="${currentCategoryName}" 
                data-file="${fileName}" 
                data-id="${item.id}" 
                data-capture-value="true"
                onclick="event.stopPropagation()"
                style="min-height:32px; width:100%; resize:none; padding:8px; order:1; font-size:0.85rem;">${item.declineNote || ''}</textarea>
            
            <div class="card-actions" style="display:flex; gap:12px; order:2; flex-wrap:wrap;">
                <button class="action-btn approve" data-action="quick-approve" data-id="${item.id}" data-file="${fileName}" data-category="${currentCategoryName}" title="Approve" style="height:40px; font-weight:800; flex:1;">APPROVE</button>
                <button class="action-btn decline" data-action="quick-decline" data-id="${item.id}" data-file="${fileName}" data-category="${currentCategoryName}" title="Decline" style="height:40px; font-weight:800; flex:1;">DECLINE</button>
            </div>
        </div>
    `;

    card.innerHTML = `
        ${statusHtml}
        ${imgHtml}
        <div class="asset-header">
            <input class="name-input" type="text"
                value="${item.name || ''}" 
                placeholder="${item.id}"
                title="Click to edit name"
                data-action="update-field" 
                data-field="name"
                data-category="${currentCategoryName}" 
                data-file="${fileName}" 
                data-id="${item.id}" 
                data-capture-value="true"
                onclick="event.stopPropagation()"
                onfocus="this.select()"
                style="width:100%; background:transparent; border:none; color:#ddd; font-weight:bold; font-size:1rem; margin-bottom:8px; padding:2px 4px; border-radius:4px; text-overflow:ellipsis;">
        </div>
        
        <div class="asset-controls-row" style="display:grid; grid-template-columns: repeat(3, 1fr); gap:4px; margin-bottom:8px;">
            ${showTier ? `<div style="text-align:center;">${tierHtml}</div>` : ''}
            ${showTier ? `<div style="text-align:center;">${typeHtml}</div>` : `<div style="grid-column: span 2; display:grid; grid-template-columns: 1fr 1fr; gap:4px;">${typeHtml}</div>`}
            <div style="text-align:center;">${biomeHtml}</div>
        </div>
        <div style="display:flex; justify-content:center; margin-bottom:12px;">
             ${sizeHtml}
        </div>

        ${sfxHtml}
        ${dropsHtml}
        
        <div class="spacer" style="flex:1"></div>
        ${actionsHtml}
    `;

    return card;
}
