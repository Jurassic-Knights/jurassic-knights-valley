/**
 * Card Builders Module
 * Helper functions to build HTML components for asset cards
 */

import {
    currentCategoryName,
    categoryImageSize,
    sfxRegenerationQueue,
    WEAPON_TYPES,
    COMBAT_ROLES,
    HERO_SFX_TYPES,
    DINOSAUR_SPECIES,
    HERBIVORE_SPECIES,
    SAURIAN_SPECIES,
    isHeroCategory,
    type AssetItem,
} from './state';
import { getAssetInfo } from './api';

// ============================================
// TYPES
// ============================================

declare global {
    interface Window {
        EquipmentStatsConfig?: {
            categories: string[];
            getStatsByCategory: (category: string) => Array<{
                key: string;
                label: string;
                icon: string;
                type: string;
                default: unknown;
            }>;
        };
    }
}

// ============================================
// SPLIT IMAGE HTML
// ============================================

export function buildSplitImageHtml(
    item: AssetItem,
    imgPath: string,
    consumedPath: string,
    safeId: string,
    fileName: string
): string {
    const displayPath = imgPath.replace(/^assets\/images\//, '');
    const fullImgUrl = `/images/${displayPath}`;
    const consumedDisplayPath = consumedPath.replace(/^assets\/images\//, '');
    const consumedImgUrl = `/images/${consumedDisplayPath}`;
    const consumedStatus = item.consumedStatus || item.status || 'pending';
    const fullStatus = item.status || 'pending';
    const fullDesc = item.sourceDescription || '';
    const consumedDesc = item.consumedSourceDescription || '';
    const fullDescPreview = fullDesc
        ? `<div style="font-size:0.5rem; color:var(--accent-yellow); margin:2px 0; max-height:2.5em; overflow:hidden; text-overflow:ellipsis;" title="${fullDesc.replace(/"/g, '&quot;')}">📝 ${fullDesc.substring(0, 50)}...</div>`
        : '';
    const consumedDescPreview = consumedDesc
        ? `<div style="font-size:0.5rem; color:var(--accent-yellow); margin:2px 0; max-height:2.5em; overflow:hidden; text-overflow:ellipsis;" title="${consumedDesc.replace(/"/g, '&quot;')}">📝 ${consumedDesc.substring(0, 50)}...</div>`
        : '';

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

// ============================================
// ACTIONS HTML
// ============================================

export function buildActionsHtml(item: AssetItem, safeId: string, fileName: string, hasImage: boolean): string {
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

// ============================================
// STATS HTML
// ============================================

export function buildStatsHtml(item: AssetItem, fileName: string): string {
    // For equipment: use EquipmentStatsConfig to show ALL possible stats
    if (item.sourceCategory === 'equipment' && window.EquipmentStatsConfig) {
        return buildEquipmentStatsHtml(item, fileName);
    }

    // For enemies/other: use existing logic with item's actual stats
    const statsObj = typeof item.stats === 'object' && item.stats !== null ? item.stats : {};
    const combatObj = typeof item.combat === 'object' && item.combat !== null ? item.combat : {};
    const allStats = { ...statsObj, ...combatObj };

    // If stats was a string (legacy), just display it
    if (typeof item.stats === 'string' && item.stats) {
        return `<div style="font-size:0.8rem; color:var(--text); padding:4px 8px; background:#222; border-radius:6px;">📊 ${item.stats}</div>`;
    }

    if (Object.keys(allStats).length === 0) return '';

    const statIcons: Record<string, string> = {
        health: '❤️',
        damage: '⚔️',
        speed: '💨',
        attackRate: '⏱️',
        attackRange: '🎯',
        aggroRange: '👁️',
        xpReward: '⭐',
        threatLevel: '💀',
        attackType: '🗡️',
        packAggro: '🐺',
        defense: '🛡️',
    };

    const statEntries = Object.entries(allStats)
        .map(([key, val]) => {
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
            <input type="number" value="${val}" onchange="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${key}', this.value)" style="width:65px; padding:4px; font-size:0.9rem; font-weight:bold; background:#333; color:var(--text); border:1px solid #555; border-radius:4px; text-align:center;">
        </div>`;
        })
        .join('');
    return `<div style="display:flex; flex-wrap:wrap; gap:8px; margin:8px 0;">${statEntries}</div>`;
}

function buildEquipmentStatsHtml(item: AssetItem, fileName: string): string {
    const config = window.EquipmentStatsConfig!;
    const itemStats = typeof item.stats === 'object' && item.stats !== null ? item.stats : {};

    let html = '<div style="display:flex; flex-direction:column; gap:8px; margin:8px 0;">';

    // Add weaponType and gripType toggles for weapons
    if (item.sourceFile === 'weapon' || item.sourceFile === 'signature' || item.slot === 'weapon') {
        const wt = item.weaponType || '';
        const gt = item.gripType || '';

        html += `<div style="background:#1a1a1a; padding:8px; border-radius:6px;">`;
        html += `<div style="font-size:0.7rem; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">Weapon Type</div>`;
        html += `<div style="display:flex; flex-wrap:wrap; gap:6px;">`;

        html += `<button onclick="updateWeaponMeta('${currentCategoryName}', '${fileName}', '${item.id}', 'weaponType', 'melee')" style="padding:6px 12px; font-size:0.8rem; background:${wt === 'melee' ? '#4caf50' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">🗡️ Melee</button>`;
        html += `<button onclick="updateWeaponMeta('${currentCategoryName}', '${fileName}', '${item.id}', 'weaponType', 'ranged')" style="padding:6px 12px; font-size:0.8rem; background:${wt === 'ranged' ? '#2196f3' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">🏹 Ranged</button>`;
        html += `<button onclick="updateWeaponMeta('${currentCategoryName}', '${fileName}', '${item.id}', 'weaponType', 'shield')" style="padding:6px 12px; font-size:0.8rem; background:${wt === 'shield' ? '#ff9800' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">🛡️ Shield</button>`;

        html += `</div>`;
        html += `<div style="font-size:0.7rem; color:#888; margin:8px 0 6px; text-transform:uppercase; letter-spacing:1px;">Grip Type</div>`;
        html += `<div style="display:flex; flex-wrap:wrap; gap:6px;">`;

        html += `<button onclick="updateWeaponMeta('${currentCategoryName}', '${fileName}', '${item.id}', 'gripType', '1-hand')" style="padding:6px 12px; font-size:0.8rem; background:${gt === '1-hand' ? '#9c27b0' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">✋ 1-Hand</button>`;
        html += `<button onclick="updateWeaponMeta('${currentCategoryName}', '${fileName}', '${item.id}', 'gripType', '2-hand')" style="padding:6px 12px; font-size:0.8rem; background:${gt === '2-hand' ? '#e91e63' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">🤲 2-Hand</button>`;

        html += `</div>`;

        // Weapon Subtype dropdown
        if (wt && wt !== 'shield') {
            const subtypes = WEAPON_TYPES[wt] || [];
            const currentSubtype = item.weaponSubtype || '';
            const subtypeOptions = subtypes
                .map((st) => {
                    const selected = st === currentSubtype ? 'selected' : '';
                    const displayName = st.replace(/_/g, ' ');
                    return `<option value="${st}" ${selected}>${displayName}</option>`;
                })
                .join('');

            html += `<div style="font-size:0.7rem; color:#888; margin:8px 0 6px; text-transform:uppercase; letter-spacing:1px;">Weapon Subtype</div>`;
            html += `<select onchange="updateWeaponMeta('${currentCategoryName}', '${fileName}', '${item.id}', 'weaponSubtype', this.value)" style="padding:6px 10px; font-size:0.8rem; background:#333; color:white; border:1px solid #555; border-radius:4px; width:100%;">`;
            html += `<option value="">-- Select Subtype --</option>`;
            html += subtypeOptions;
            html += `</select>`;
        }

        html += `</div>`;
    }

    for (const category of config.categories) {
        const categoryStats = config.getStatsByCategory(category);
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

        html += `<div style="background:#1a1a1a; padding:8px; border-radius:6px;">`;
        html += `<div style="font-size:0.7rem; color:#888; margin-bottom:6px; text-transform:uppercase; letter-spacing:1px;">${categoryLabel}</div>`;
        html += `<div style="display:flex; flex-wrap:wrap; gap:6px;">`;

        for (const stat of categoryStats) {
            const currentValue = (itemStats as Record<string, unknown>)[stat.key];
            const hasValue = currentValue !== undefined && currentValue !== stat.default;
            const displayValue = currentValue ?? stat.default;
            const iconPath = `/images/ui/${stat.icon}_original.png`;

            if (stat.type === 'boolean') {
                const isChecked = displayValue === true;
                html += `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:${hasValue ? '#2a2a2a' : '#222'}; border-radius:4px; opacity:${hasValue ? '1' : '0.6'};" title="${stat.label}">
                    <img src="${iconPath}" alt="${stat.label}" style="width:20px; height:20px; object-fit:contain;">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${stat.key}', this.checked)" style="width:16px; height:16px; cursor:pointer;">
                    <span style="font-size:0.65rem; color:var(--text-dim);">${stat.label}</span>
                </div>`;
            } else {
                html += `<div style="display:flex; align-items:center; gap:4px; padding:4px 8px; background:${hasValue ? '#2a2a2a' : '#222'}; border-radius:4px; opacity:${hasValue ? '1' : '0.6'};" title="${stat.label}">
                    <img src="${iconPath}" alt="${stat.label}" style="width:20px; height:20px; object-fit:contain;">
                    <input type="number" value="${displayValue}" step="0.1" onchange="updateItemStat('${currentCategoryName}', '${fileName}', '${item.id}', '${stat.key}', parseFloat(this.value) || 0)" style="width:55px; padding:3px; font-size:0.8rem; background:#333; color:var(--text); border:1px solid ${hasValue ? '#555' : '#333'}; border-radius:3px; text-align:center;">
                </div>`;
            }
        }

        html += '</div></div>';
    }

    html += '</div>';
    return html;
}

// ============================================
// DROPS & RECIPE HTML
// ============================================

export function buildDropsHtml(item: AssetItem): string {
    const loot = item.loot;
    if (!loot || loot.length === 0) return '';

    const dropSize = Math.max(40, Math.floor(categoryImageSize * 0.3));
    const dropImages = loot
        .map((drop) => {
            const dropId = drop.item;
            const dropChance = drop.chance != null ? (drop.chance > 1 ? drop.chance : Math.round(drop.chance * 100)) : 100;

            const assetInfo = getAssetInfo(dropId);
            const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
            const dropCategory = assetInfo?.category || 'items';
            const dropAssetId = assetInfo?.id || dropId;
            return `<div style="position:relative; cursor:pointer;" title="Click to view ${dropId}" onclick="navigateToAsset('${dropCategory}', '${dropAssetId}')">
            <img src="${imgPath}" onerror="this.src='/images/PH.png'" style="width:${dropSize}px; height:${dropSize}px; object-fit:contain; background:#222; border-radius:6px; border:2px solid #555;">
            <span style="position:absolute; bottom:2px; right:2px; font-size:0.7rem; background:#000d; padding:2px 6px; border-radius:4px; font-weight:bold;">${dropChance}%</span>
            <span style="position:absolute; top:2px; left:2px; font-size:0.55rem; background:#000d; padding:1px 4px; border-radius:3px;">${dropId}</span>
        </div>`;
        })
        .join('');
    return `<div style="margin:8px 0;"><div style="font-size:0.7rem; color:var(--text-dim); margin-bottom:4px;">📦 Drops:</div><div style="display:flex; gap:8px; flex-wrap:wrap;">${dropImages}</div></div>`;
}

export function buildRecipeHtml(item: AssetItem): string {
    if (!item.recipe) return '';

    let parsedRecipe: Array<{ item: string; amount: number }> = [];
    if (Array.isArray(item.recipe)) {
        parsedRecipe = item.recipe.map((r) => ({ item: r.item, amount: r.amount || 1 }));
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
    const recipeImages = parsedRecipe
        .map((ingredient) => {
            const ingName = ingredient.item;
            const ingAmount = ingredient.amount || 1;
            const assetInfo = getAssetInfo(ingName);
            const imgPath = assetInfo ? `/images/${assetInfo.path}` : '/images/PH.png';
            const ingCategory = assetInfo?.category || 'resources';
            const ingAssetId = assetInfo?.id || ingName;
            return `<div style="position:relative; cursor:pointer;" title="Click: ${ingName}" onclick="navigateToAsset('${ingCategory}', '${ingAssetId}')">
            <img src="${imgPath}" onerror="this.src='/images/PH.png'" style="width:${recipeSize}px; height:${recipeSize}px; object-fit:contain; background:#333; border-radius:4px; border:1px solid #666;">
            <span style="position:absolute; bottom:0; right:0; font-size:0.65rem; background:#000d; padding:1px 4px; border-radius:3px; font-weight:bold;">x${ingAmount}</span>
            <span style="position:absolute; top:2px; left:2px; font-size:0.5rem; background:#000d; padding:1px 3px; border-radius:2px;">${ingName}</span>
        </div>`;
        })
        .join('');
    return `<div style="margin:8px 0;"><div style="font-size:0.7rem; color:var(--accent-yellow); margin-bottom:4px;">🔨 Recipe:</div><div style="display:flex; gap:6px; flex-wrap:wrap;">${recipeImages}</div></div>`;
}

// ============================================
// SOURCE & RESOURCE DROP HTML
// ============================================

export function buildSourceHtml(item: AssetItem): string {
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

export function buildResourceDropHtml(item: AssetItem): string {
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

// ============================================
// BADGES HTML
// ============================================

export function buildBadgesHtml(item: AssetItem, fileName: string): string {
    const biomeIcons: Record<string, string> = { grasslands: '🌿', tundra: '❄️', desert: '🏜️', badlands: '🌋', all: '🌍' };
    const typeIcons: Record<string, string> = {
        dinosaur: '🦖',
        herbivore: '🦕',
        human: '👤',
        saurian: '🦎',
        boss: '👑',
        melee: '🗡️',
        ranged: '🏹',
        enemy: '💀',
    };
    const biomeIcon = biomeIcons[item.biome || ''] || '🌍';
    const typeIcon = typeIcons[item.enemyType || ''] || typeIcons[item.type || ''] || '📦';
    const tierMatch = item.id?.match(/_t(\d)_/);
    const tier = item.tier || (tierMatch ? parseInt(tierMatch[1]) : null);
    const tierColors: Record<number, string> = { 1: '#9e9e9e', 2: '#4caf50', 3: '#2196f3', 4: '#9c27b0' };

    if (!item.biome && !item.enemyType && !item.type && !tier) return '';

    const tierDropdown = tier
        ? `
        <select onchange="updateItemTier('${currentCategoryName}', '${fileName}', '${item.id}', parseInt(this.value))" 
            style="font-size:0.75rem; font-weight:bold; background:${tierColors[tier] || '#666'}; padding:2px 8px; border-radius:10px; color:white; border:none; cursor:pointer; appearance:none; text-align:center; min-width:40px;">
            <option value="1" ${tier === 1 ? 'selected' : ''} style="background:#9e9e9e;">T1</option>
            <option value="2" ${tier === 2 ? 'selected' : ''} style="background:#4caf50;">T2</option>
            <option value="3" ${tier === 3 ? 'selected' : ''} style="background:#2196f3;">T3</option>
            <option value="4" ${tier === 4 ? 'selected' : ''} style="background:#9c27b0;">T4</option>
        </select>`
        : '';

    return `<div style="display:flex; gap:6px; margin:4px 0; flex-wrap:wrap;">
        ${tierDropdown}
        ${item.biome ? `<span style="font-size:0.7rem; background:#333; padding:2px 6px; border-radius:10px;" title="${item.biome}">${biomeIcon} ${item.biome}</span>` : ''}
        ${item.enemyType || item.type ? `<span style="font-size:0.7rem; background:#333; padding:2px 6px; border-radius:10px;" title="${item.enemyType || item.type}">${typeIcon}</span>` : ''}
    </div>`;
}

// ============================================
// ROLE & WEAPON DROPDOWNS
// ============================================

export function buildRoleDropdownHtml(item: AssetItem, fileName: string): string {
    const isHumanOrSaurian =
        ['human', 'saurian'].includes(item.enemyType || '') || ['human', 'saurian'].includes(item.sourceFile || '');
    if (!isHumanOrSaurian) return '';

    const currentRole = item.role || 'medium';
    const options = COMBAT_ROLES.map((role) => {
        const selected = role === currentRole ? 'selected' : '';
        return `<option value="${role}" ${selected}>${role}</option>`;
    }).join('');

    return `<div style="margin:4px 0; display:flex; gap:6px; align-items:center;">
        <span style="font-size:0.65rem; color:var(--text-dim);">🛡️ Role:</span>
        <select onchange="updateItemField('${currentCategoryName}', '${fileName}', '${item.id}', 'role', this.value)" style="padding:3px 6px; font-size:0.7rem; background:#333; color:var(--text); border:1px solid #555; border-radius:4px;">
            ${options}
        </select>
        <span style="font-size:0.6rem; color:#888;">${currentRole === 'light' ? 'cloth/leather' : currentRole === 'medium' ? 'partial plate' : currentRole === 'heavy' ? 'full plate' : currentRole === 'utility' ? 'tool-focused' : 'ornate/unique'}</span>
    </div>`;
}

export function buildWeaponDropdownHtml(item: AssetItem, fileName: string): string {
    const isHumanOrSaurian =
        ['human', 'saurian'].includes(item.enemyType || '') || ['human', 'saurian'].includes(item.sourceFile || '');
    const attackType =
        (item.combat as Record<string, unknown>)?.attackType || (item.stats as Record<string, unknown>)?.attackType;
    if (!isHumanOrSaurian || !attackType) return '';

    const weapons = WEAPON_TYPES[attackType as string] || [];
    const currentWeapon = item.weaponType || '';
    const options = weapons
        .map((w) => {
            const selected = w === currentWeapon ? 'selected' : '';
            const displayName = w.replace(/_/g, ' ');
            return `<option value="${w}" ${selected}>${displayName}</option>`;
        })
        .join('');

    return `<div style="margin:4px 0;">
        <label style="font-size:0.65rem; color:var(--text-dim);">⚔️ Weapon:</label>
        <select onchange="updateItemWeapon('${currentCategoryName}', '${fileName}', '${item.id}', this.value)" style="padding:3px 6px; font-size:0.7rem; background:#333; color:var(--text); border:1px solid #555; border-radius:4px; margin-left:4px;">
            <option value="">-- Select --</option>
            ${options}
        </select>
    </div>`;
}

// ============================================
// GENDER, BODY TYPE, SPECIES, SIZE
// ============================================

export function buildGenderBodyTypeHtml(item: AssetItem, fileName: string): string {
    const isHumanEnemy =
        item.enemyType === 'human' || item.sourceFile === 'human' || (item.id && item.id.includes('human'));
    const isNPC = item.type === 'merchant' || item.category === 'merchant' || item.sourceCategory === 'npcs';
    if (!isHumanEnemy && !isNPC) return '';

    const currentGender = item.gender || 'male';
    const currentBodyType = item.bodyType || 'medium';
    const bodyTypes = ['medium', 'skinny', 'fat', 'muscle'];

    const bodyOptions = bodyTypes
        .map((bt) => {
            const selected = bt === currentBodyType ? 'selected' : '';
            return `<option value="${bt}" ${selected}>${bt}</option>`;
        })
        .join('');

    return `<div style="margin:4px 0; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
        <div style="display:flex; gap:2px; align-items:center;">
            <span style="font-size:0.65rem; color:var(--text-dim);">👤 Gender:</span>
            <button onclick="updateItemField('${currentCategoryName}', '${fileName}', '${item.id}', 'gender', 'male')" style="padding:3px 8px; font-size:0.65rem; background:${currentGender === 'male' ? '#2196f3' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">♂ Male</button>
            <button onclick="updateItemField('${currentCategoryName}', '${fileName}', '${item.id}', 'gender', 'female')" style="padding:3px 8px; font-size:0.65rem; background:${currentGender === 'female' ? '#e91e63' : '#333'}; border:none; border-radius:4px; cursor:pointer; color:white;">♀ Female</button>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
            <span style="font-size:0.65rem; color:var(--text-dim);">🏋️ Body:</span>
            <select onchange="updateItemField('${currentCategoryName}', '${fileName}', '${item.id}', 'bodyType', this.value)" style="padding:3px 6px; font-size:0.65rem; background:#333; color:var(--text); border:1px solid #555; border-radius:4px;">
                ${bodyOptions}
            </select>
        </div>
    </div>`;
}

export function buildLoreDescriptionHtml(item: AssetItem, fileName: string): string {
    const showForCategories = ['enemies', 'bosses', 'npcs'];
    if (!showForCategories.includes(currentCategoryName)) return '';

    const currentDesc = item.description || '';
    const escapedDesc = currentDesc.replace(/"/g, '&quot;');

    const charPerLine = 50;
    const lines = Math.ceil(currentDesc.length / charPerLine) || 1;
    const rows = Math.max(2, Math.min(lines + 1, 8));

    return `<div style="margin:8px 0;">
        <div style="font-size:0.65rem; color:var(--accent-cyan); margin-bottom:4px;">📖 Lore Description:</div>
        <textarea 
            placeholder="What is this character? What do they do?"
            rows="${rows}"
            style="width:100%; padding:6px; font-size:0.65rem; background:#222; color:var(--text); border:1px solid #555; border-radius:4px; resize:vertical; line-height:1.4;"
            onchange="updateItemField('${currentCategoryName}', '${fileName}', '${item.id}', 'description', this.value)"
        >${escapedDesc}</textarea>
    </div>`;
}

export function buildSpeciesDropdownHtml(item: AssetItem, fileName: string): string {
    const sourceFile = item.sourceFile || '';
    if (!['dinosaur', 'saurian', 'herbivore'].includes(sourceFile)) return '';

    let speciesList: string[] = [];
    if (sourceFile === 'dinosaur') speciesList = DINOSAUR_SPECIES;
    else if (sourceFile === 'herbivore') speciesList = HERBIVORE_SPECIES;
    else if (sourceFile === 'saurian') speciesList = SAURIAN_SPECIES;

    const currentSpecies = item.species || '';
    const options = speciesList
        .map((species) => {
            const selected = species === currentSpecies ? 'selected' : '';
            return `<option value="${species}" ${selected}>${species}</option>`;
        })
        .join('');

    return `<div style="margin:4px 0; display:flex; gap:6px; align-items:center;">
        <span style="font-size:0.65rem; color:var(--text-dim);">🦖 Species:</span>
        <select onchange="updateItemField('${currentCategoryName}', '${fileName}', '${item.id}', 'species', this.value)" style="padding:3px 6px; font-size:0.7rem; background:#333; color:var(--text); border:1px solid #555; border-radius:4px;">
            <option value="">-- Select --</option>
            ${options}
        </select>
        ${currentSpecies ? `<span style="font-size:0.7rem; color:#4caf50; font-weight:bold;">${currentSpecies}</span>` : ''}
    </div>`;
}

export function buildSizeScaleHtml(item: AssetItem): string {
    const showForCategories = ['enemies', 'bosses'];
    if (!showForCategories.includes(currentCategoryName)) return '';

    const display = item.display || {};
    const sizeScale = display.sizeScale || 1.0;
    const width = display.width || 128;
    const height = display.height || 128;

    const fileName = item.sourceFile || 'unknown';

    let scaleColor = '#4caf50';
    if (sizeScale < 0.8) scaleColor = '#ff9800';
    else if (sizeScale < 1.0) scaleColor = '#ffc107';
    else if (sizeScale > 2.0) scaleColor = '#9c27b0';
    else if (sizeScale > 1.5) scaleColor = '#2196f3';

    return `<div style="margin:4px 0; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <div style="display:flex; gap:4px; align-items:center;">
            <span style="font-size:0.65rem; color:var(--text-dim);">📐 Scale:</span>
            <input type="number" value="${sizeScale}" step="0.1" min="0.1" max="5.0"
                onchange="updateDisplayField('${currentCategoryName}', '${fileName}', '${item.id}', 'sizeScale', parseFloat(this.value) || 1.0)"
                onblur="updateDisplayField('${currentCategoryName}', '${fileName}', '${item.id}', 'sizeScale', parseFloat(this.value) || 1.0)"
                style="width:60px; padding:4px; font-size:0.8rem; font-weight:bold; background:#333; color:${scaleColor}; border:1px solid #555; border-radius:4px; text-align:center;">
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
            <span style="font-size:0.65rem; color:var(--text-dim);">📏 W×H:</span>
            <input type="number" value="${width}" step="16" min="32" max="1024"
                onchange="updateDisplayField('${currentCategoryName}', '${fileName}', '${item.id}', 'width', parseInt(this.value) || 128)"
                onblur="updateDisplayField('${currentCategoryName}', '${fileName}', '${item.id}', 'width', parseInt(this.value) || 128)"
                style="width:55px; padding:3px; font-size:0.7rem; background:#333; color:#888; border:1px solid #444; border-radius:4px; text-align:center;">
            <span style="color:#666;">×</span>
            <input type="number" value="${height}" step="16" min="32" max="1024"
                onchange="updateDisplayField('${currentCategoryName}', '${fileName}', '${item.id}', 'height', parseInt(this.value) || 128)"
                onblur="updateDisplayField('${currentCategoryName}', '${fileName}', '${item.id}', 'height', parseInt(this.value) || 128)"
                style="width:55px; padding:3px; font-size:0.7rem; background:#333; color:#888; border:1px solid #444; border-radius:4px; text-align:center;">
        </div>
    </div>`;
}

// ============================================
// SFX & VFX HTML
// ============================================

export function buildSfxHtml(item: AssetItem): string {
    if (!item.sfx) return '';
    const sfxEntries = Object.entries(item.sfx)
        .map(([sfxType, sfxData]) => {
            let sfxId: string;
            let status: string;
            if (typeof sfxData === 'string') {
                sfxId = sfxData;
                status = 'approved';
            } else {
                sfxId = sfxData.id;
                status = sfxData.status || 'pending';
            }

            if (status === 'approved' || status === 'clean') {
                return `<button onclick="playSound('${sfxId}')" style="padding:3px 6px; font-size:0.65rem; background:#4caf50; border:none; border-radius:4px; cursor:pointer; color:white;" title="Play ${sfxId}">🔊 ${sfxType}</button>`;
            }
            return `<span style="padding:3px 6px; font-size:0.65rem; background:#666; border-radius:4px; color:#aaa;" title="${sfxId}: ${status}">🔇 ${sfxType}</span>`;
        })
        .join('');

    const sfxIds = Object.values(item.sfx).map((s) => (typeof s === 'string' ? s : s.id));
    const isInQueue = sfxRegenerationQueue.some((q) => q.assetId === item.id);
    const regenBtn = isInQueue
        ? `<span style="padding:3px 6px; font-size:0.65rem; background:#666; border:none; border-radius:4px; color:#aaa;" title="Already marked for regeneration">✓ Queued</span>`
        : `<button onclick="markAllSfxForRegeneration('${item.id}', ${JSON.stringify(sfxIds).replace(/"/g, '&quot;')}, this)" style="padding:3px 6px; font-size:0.65rem; background:#ff9800; border:none; border-radius:4px; cursor:pointer; color:white;" title="Mark all sounds for regeneration">🔄 Regen</button>`;
    return `<div style="display:flex; gap:4px; flex-wrap:wrap; margin:4px 0;">${sfxEntries}${regenBtn}</div>`;
}

export function buildVfxHtml(item: AssetItem): string {
    if (!item.vfx) return '';
    const pendingVfx = Object.entries(item.vfx).filter(([, v]) => v.status === 'pending');
    if (pendingVfx.length === 0) return '';
    return `<div style="font-size:0.65rem; color:#ff9800; margin:4px 0;">🎬 Missing VFX: ${pendingVfx.map(([k]) => k).join(', ')}</div>`;
}

export function buildOtherFieldsHtml(item: AssetItem): string {
    const skipFields = [
        'id',
        'name',
        'status',
        'vfx',
        'sfx',
        'sourceDescription',
        'declineNote',
        'files',
        'groupId',
        'stats',
        'drops',
        'biome',
        'enemyType',
        'type',
        'tier',
    ];
    return Object.entries(item)
        .filter(([key, val]) => !skipFields.includes(key) && val !== null && val !== undefined)
        .map(([key, val]) => {
            let displayVal: string;
            if (Array.isArray(val)) displayVal = val.length + ' items';
            else if (typeof val === 'object') displayVal = '...';
            else displayVal = String(val);
            return `<span style="font-size:0.6rem; color:var(--text-dim);">${key}: ${displayVal}</span>`;
        })
        .join(' • ');
}

// ============================================
// HERO SFX HTML
// ============================================

export function buildHeroSfxHtml(item: AssetItem, _fileName: string): string {
    const existingSfx = item.sfx || {};

    const sfxButtons = HERO_SFX_TYPES.map((sfxType) => {
        const sfxData = existingSfx[sfxType];

        if (sfxData) {
            let sfxId: string;
            let status: string;
            if (typeof sfxData === 'string') {
                sfxId = sfxData;
                status = 'approved';
            } else {
                sfxId = sfxData.id;
                status = sfxData.status || 'pending';
            }

            if (status === 'approved' || status === 'clean') {
                return `<button onclick="playSound('${sfxId}')" style="padding:3px 6px; font-size:0.65rem; background:#4caf50; border:none; border-radius:4px; cursor:pointer; color:white;" title="Play ${sfxId}">🔊 ${sfxType}</button>`;
            }
            return `<span style="padding:3px 6px; font-size:0.65rem; background:#666; border-radius:4px; color:#aaa;" title="${sfxId}: ${status}">🔇 ${sfxType}</span>`;
        } else {
            return `<span style="padding:3px 6px; font-size:0.65rem; background:#333; border:1px dashed #666; border-radius:4px; color:#888;" title="No ${sfxType} sound defined">➕ ${sfxType}</span>`;
        }
    }).join('');

    const sfxIds = Object.values(existingSfx).map((s) => (typeof s === 'string' ? s : s.id));
    const isInQueue = sfxRegenerationQueue.some((q) => q.assetId === item.id);
    const regenBtn = isInQueue
        ? `<span style="padding:3px 6px; font-size:0.65rem; background:#666; border:none; border-radius:4px; color:#aaa;" title="Already marked for regeneration">✓ Queued</span>`
        : `<button onclick="markAllSfxForRegeneration('${item.id}', ${JSON.stringify(sfxIds).replace(/"/g, '&quot;')}, this)" style="padding:3px 6px; font-size:0.65rem; background:#ff9800; border:none; border-radius:4px; cursor:pointer; color:white;" title="Mark all sounds for regeneration">🔄 Regen</button>`;

    return `<div style="display:flex; gap:4px; flex-wrap:wrap; margin:4px 0;">${sfxButtons}${regenBtn}</div>`;
}

// Re-export isHeroCategory
export { isHeroCategory };
