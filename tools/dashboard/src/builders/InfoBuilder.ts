import { h, renderToString } from '../domBuilder';
import { AssetItem, currentCategoryName, categoryImageSize, lootSourceMap } from '../state';
import { getAssetInfo } from '../api';

export function buildLoreDescriptionHtml(item: AssetItem, fileName: string): string {
    const showForCategories = ['enemies', 'bosses', 'npcs'];
    if (!showForCategories.includes(currentCategoryName)) return '';

    const currentDesc = item.description || '';
    const charPerLine = 50;
    const lines = Math.ceil(currentDesc.length / charPerLine) || 1;
    const rows = Math.max(2, Math.min(lines + 1, 8));

    const container = h('div', { style: 'margin:8px 0;' }, [
        h('div', { style: 'font-size:0.65rem; color:var(--accent-cyan); margin-bottom:4px;' }, ['📖 Lore Description:']),
        h('textarea', {
            placeholder: 'What is this character? What do they do?',
            rows: rows,
            className: 'asset-input asset-input--full',
            style: 'resize:vertical; line-height:1.4;',
            'data-action': 'update-field',
            'data-category': currentCategoryName,
            'data-file': fileName,
            'data-id': item.id,
            'data-field': 'description',
            'data-capture-value': 'true'
        }, [currentDesc])
    ]);

    return renderToString(container);
}


export function buildSizeScaleHtml(item: AssetItem, fileName: string): string {
    const showForCategories = ['enemies', 'bosses', 'nodes', 'resources', 'environment', 'npcs'];
    if (!showForCategories.includes(currentCategoryName)) return '';

    const display = item.display || {};
    const width = display.width || 128;
    const height = display.height || 128; // Default 128x128

    const SIZES = [
        { label: 'XS', size: 64, color: '#9e9e9e' },
        { label: 'S', size: 128, color: '#4caf50' },
        { label: 'M', size: 256, color: '#2196f3' },
        { label: 'L', size: 512, color: '#9c27b0' },
        { label: 'XL', size: 1024, color: '#e91e63' },
    ];

    const currentSize = (width === height) ? width : -1;

    const sizeButtons = SIZES.map(s => {
        const isActive = currentSize === s.size;
        return h('button', {
            'data-action': 'update-display-size',
            'data-category': currentCategoryName,
            'data-file': fileName,
            'data-id': item.id,
            'data-value': s.size,
            style: `
                padding: 4px 8px;
                font-size: 0.7rem;
                background: ${isActive ? s.color : '#333'};
                border: 1px solid ${s.color};
                border-radius: 4px;
                color: ${isActive ? 'white' : '#aaa'};
                cursor: pointer;
                min-width: 30px;
                opacity: ${isActive ? '1' : '0.7'};
            `,
            title: `${s.size}x${s.size}px`
        }, [s.label]);
    });

    // Show custom dimensions if not matching standard sizes
    const customLabel = (currentSize === -1)
        ? h('span', { style: 'font-size:0.6rem; color:#888; font-family:monospace;' }, [`(${width}x${height})`])
        : null;

    const container = h('div', { className: 'asset-flex asset-flex--wrap', style: 'margin:4px 0; gap:4px;' }, [
        ...sizeButtons,
        customLabel
    ]);

    return renderToString(container);
}


export function buildDropsHtml(item: AssetItem): string {
    const loot = item.loot || item.drops;
    if (!loot || loot.length === 0) return '';

    // Increase size for better visibility (was 0.3)
    const dropSize = Math.max(48, Math.floor(categoryImageSize * 0.4));

    const dropImages = loot.map((drop: any) => {
        const dropId = drop.item;
        const dropChance = drop.chance != null ? (drop.chance > 1 ? drop.chance : Math.round(drop.chance * 100)) : 100;

        const assetInfo = getAssetInfo(dropId);
        const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
        const dropCategory = assetInfo?.category || 'items';
        const dropAssetId = assetInfo?.id || dropId;

        return h('div', {
            className: 'asset-overlay',
            title: `Click to view ${dropId}`,
            'data-action': 'navigate-asset',
            'data-category': dropCategory,
            'data-id': dropAssetId,
            style: `width:${dropSize}px; height:${dropSize}px; position: relative;`
        }, [
            h('img', {
                className: 'asset-overlay__img',
                src: imgPath,
                onerror: "this.src='/images/PH.png'",
                style: `width:100%; height:100%; object-fit:contain; display:block;`
            }),
            h('span', { className: 'asset-overlay__label asset-overlay__label--bottom-right' }, [`${dropChance}%`]),
            // Removed ID label to declutter visual, rely on title/tooltip
            // h('span', { className: 'asset-overlay__label asset-overlay__label--top-left' }, [dropId])
        ]);
    });

    const container = h('div', { style: 'margin:8px 0;' }, [
        h('div', { style: 'font-size:0.7rem; color:var(--text-dim); margin-bottom:4px;' }, ['📦 Drops:']),
        h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap;' }, dropImages)
    ]);

    return renderToString(container);
}

export function buildRecipeHtml(item: AssetItem): string {
    if (!item.recipe) return '';

    let parsedRecipe: Array<{ item: string; amount: number }> = [];
    if (Array.isArray(item.recipe)) {
        parsedRecipe = item.recipe.map((r: any) => ({ item: r.item, amount: r.amount || 1 }));
    } else if (typeof item.recipe === 'string') {
        const parts = item.recipe.split('+').map((p) => p.trim());
        for (const part of parts) {
            const match = part.match(/^(\d+)x\s+(.+)$/i);
            if (match) parsedRecipe.push({ amount: parseInt(match[1]), item: match[2].trim() });
            else parsedRecipe.push({ amount: 1, item: part });
        }
    } else if (typeof item.recipe === 'object') {
        for (const [itemId, amount] of Object.entries(item.recipe)) {
            parsedRecipe.push({ item: itemId, amount: amount as number });
        }
    }

    if (parsedRecipe.length === 0) return '';

    const recipeSize = Math.max(35, Math.floor(categoryImageSize * 0.25));
    const recipeImages = parsedRecipe.map((ingredient) => {
        const ingName = ingredient.item;
        const ingAmount = ingredient.amount || 1;

        const assetInfo = getAssetInfo(ingName);
        const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
        const ingCategory = assetInfo?.category || 'resources';
        const ingAssetId = assetInfo?.id || ingName;

        return h('div', {
            className: 'asset-overlay',
            title: `Click: ${ingName}`,
            'data-action': 'navigate-asset',
            'data-category': ingCategory,
            'data-id': ingAssetId
        }, [
            h('img', {
                className: 'asset-overlay__img',
                src: imgPath,
                onerror: "this.src='/images/PH.png'",
                style: `width:${recipeSize}px; height:${recipeSize}px;`
            }),
            h('span', { className: 'asset-overlay__label asset-overlay__label--bottom-right-small' }, [`x${ingAmount}`]),
            h('span', { className: 'asset-overlay__label asset-overlay__label--top-left' }, [ingName])
        ]);
    });

    const container = h('div', { style: 'margin:8px 0;' }, [
        h('div', { style: 'font-size:0.7rem; color:var(--accent-yellow); margin-bottom:4px;' }, ['🔨 Recipe:']),
        h('div', { style: 'display:flex; gap:6px; flex-wrap:wrap;' }, recipeImages)
    ]);

    return renderToString(container);
}

export function buildSourceHtml(item: AssetItem): string {
    if (currentCategoryName !== 'resources' && currentCategoryName !== 'items') return '';

    // 1. Explicit Source (Legacy/Specific)
    const explicitSource = item.source;

    // 2. Dynamic Sources (Reverse Lookup from Drops)
    const simpleId = item.id.replace(/^(item_|items_|resource_|resources_|equipment_|node_|nodes_)/, '');
    const dynamicSources = [
        ...(lootSourceMap[item.id] || []),
        ...(lootSourceMap[simpleId] || [])
    ];

    // Combine and Deduplicate
    const allSources = new Set<string>();
    if (explicitSource) allSources.add(explicitSource);
    dynamicSources.forEach(s => allSources.add(s));

    if (allSources.size === 0) return '';

    const sourceImages = Array.from(allSources).map(sourceId => {
        const assetInfo = getAssetInfo(sourceId);
        const sourceName = assetInfo ? assetInfo.name || sourceId : sourceId;
        const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
        const category = assetInfo?.category || 'nodes'; // Default to nodes if unknown, or maybe 'enemies'
        // If it's an enemy, category should be enemies. assetInfo will have it. 
        // If missing assetInfo, we can't deep link easily, but we can guess.

        return h('div', {
            className: 'asset-overlay',
            title: `Source: ${sourceName}`,
            'data-action': 'navigate-asset',
            'data-category': category,
            'data-id': sourceId
        }, [
            h('img', {
                className: 'asset-overlay__img',
                src: imgPath,
                onerror: "this.src='/images/PH.png'",
                style: `width:40px; height:40px; border:2px solid var(--accent-cyan);`
            }),
            h('span', { className: 'asset-overlay__label asset-overlay__label--top-left' }, [sourceName])
        ]);
    });

    const container = h('div', { style: 'margin:8px 0;' }, [
        h('div', { style: 'font-size:0.7rem; color:var(--accent-cyan); margin-bottom:4px;' }, ['⛏️ Sources / Drops From:']),
        h('div', { style: 'display:flex; gap:8px; flex-wrap:wrap;' }, sourceImages)
    ]);

    return renderToString(container);
}

export function buildResourceDropHtml(item: AssetItem): string {
    if (!item.resourceDrop || currentCategoryName !== 'nodes') return '';

    const dropSize = Math.max(40, Math.floor(categoryImageSize * 0.3));
    const dropName = item.resourceDrop;
    const resourceInfo = getAssetInfo(dropName);
    const imgPath = resourceInfo ? `/images/${resourceInfo.path}` : '/images/PH.png';
    const dropCategory = resourceInfo?.category || 'resources';
    const dropAssetId = resourceInfo?.id || dropName;
    const resourceName = resourceInfo?.name || dropName;

    const container = h('div', { style: 'margin:8px 0;' }, [
        h('div', { style: 'font-size:0.7rem; color:#4caf50; margin-bottom:4px;' }, ['🪨 Drops:']),
        h('div', { style: 'display:flex; gap:8px; align-items:center;' }, [
            h('div', {
                style: 'position:relative; cursor:pointer;',
                title: `Click to view ${resourceName}`,
                'data-action': 'navigate-asset',
                'data-category': dropCategory,
                'data-id': dropAssetId
            }, [
                h('img', {
                    src: imgPath,
                    onerror: "this.src='/images/PH.png'",
                    style: `width:${dropSize}px; height:${dropSize}px; object-fit:contain; background:#222; border-radius:6px; border:2px solid #4caf50;`
                }),
                h('span', {
                    style: 'position:absolute; bottom:2px; left:2px; font-size:0.55rem; background:#000d; padding:1px 4px; border-radius:3px;'
                }, [resourceName])
            ])
        ])
    ]);

    return renderToString(container);
}

export function buildFilePathsHtml(item: AssetItem, fileName: string): string {
    const originalPath = item.files?.original || '';
    const cleanPath = item.files?.clean || '';

    // Create editable field for Original Image
    // Use data-field="files.original" for dot-notation update
    const container = h('div', { style: 'margin:8px 0; border-top:1px solid #333; padding-top:8px;' }, [
        h('div', { style: 'font-size:0.65rem; color:var(--text-dim); margin-bottom:4px; text-transform:uppercase;' }, ['📁 Image Path (Original):']),
        h('div', { style: 'display:flex; gap:6px;' }, [
            h('div', {
                style: 'flex:1; font-family:monospace; font-size:0.7rem; color:#888; background:#111; padding:4px; border:1px solid #333; overflow:hidden; white-space:nowrap; text-overflow:ellipsis;',
                title: originalPath
            }, [originalPath || 'No path set']),
            h('button', {
                className: 'action-btn',
                style: 'font-size:0.7rem; padding:2px 8px; background:#2196f3; color:white; border:none; border-radius:3px; cursor:pointer;',
                title: 'Paste image from clipboard to overwrite this file',
                'data-action': 'paste-image-to-path',
                'data-path': originalPath,
                'data-file': fileName,
                'data-id': item.id
            }, ['📋 Paste & Overwrite'])
        ]),
        // Optional: show clean path as read-only or editable if needed
        // Optional: show clean path as read-only or editable if needed
        cleanPath ? h('div', { style: 'font-size:0.6rem; color:#555; margin-top:2px; font-style:italic;' }, [`Clean: ${cleanPath}`]) : null
    ]);

    return renderToString(container);
}

export function buildOtherFieldsHtml(item: AssetItem): string {
    const skipFields = [
        'id', 'name', 'status', 'vfx', 'sfx', 'sourceDescription', 'declineNote', 'files',
        'groupId', 'stats', 'drops', 'biome', 'enemyType', 'type', 'tier', 'display',
        'role', 'weaponType', 'weaponSubtype', 'sfx', 'vfx', 'combat', 'recipe', 'source',
        'resourceDrop', 'species', 'gender', 'bodyType', 'loot', 'consumedStatus',
        'consumedSourceDescription', 'sourceFile', 'sourceCategory'
    ];

    const fields = Object.entries(item)
        .filter(([key, val]) => !skipFields.includes(key) && val !== null && val !== undefined)
        .map(([key, val]) => {
            let displayVal: string;
            if (Array.isArray(val)) displayVal = val.length + ' items';
            else if (typeof val === 'object') displayVal = '...';
            else displayVal = String(val);

            return h('span', { style: 'font-size:0.6rem; color:var(--text-dim);' }, [`${key}: ${displayVal}`]);
        });

    if (fields.length === 0) return '';

    // Join with bullets manually since h() creates elements
    const children: any[] = [];
    fields.forEach((f, i) => {
        children.push(f);
        if (i < fields.length - 1) children.push(' • ');
    });

    const container = h('div', {}, children);
    return renderToString(container);
}
