/**
 * Inspector Renderer Module
 * Handles the "Property Panel" on the right side
 */

import { categoryData, selectedAssetId, currentInspectorTab, imageParams } from './state';
import {
    buildRoleDropdownHtml,
    buildWeaponDropdownHtml,
    buildGenderBodyTypeHtml,
    buildSpeciesDropdownHtml,
    buildSizeScaleHtml,
    buildLoreDescriptionHtml,
    buildStatsHtml,
    buildSfxHtml,
    buildVfxHtml,
    buildDropsHtml,
    buildRecipeHtml,
    buildSourceHtml,
    buildUsageHtml,
    buildResourceDropHtml,
    buildOtherFieldsHtml,
    buildFilePathsHtml,
    buildPromptHtml
} from './builders';

export function renderInspector(): void {
    const container = document.getElementById('inspectorContent');
    const placeholder = document.querySelector('.inspector-placeholder') as HTMLElement;

    if (!container || !placeholder) return;

    if (!selectedAssetId) {
        container.style.display = 'none';
        placeholder.style.display = 'flex';
        return;
    }

    // Find the asset
    let asset = null;
    let fileName = '';
    if (categoryData && categoryData.files) {
        for (const [fName, items] of Object.entries(categoryData.files)) {
            const found = items.find(i => i.id === selectedAssetId);
            if (found) {
                asset = found;
                fileName = fName;
                break;
            }
        }
    }

    if (!asset) {
        container.style.display = 'none';
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `<p>Asset not found: ${selectedAssetId}</p>`;
        return;
    }

    // Hide placeholder, show content
    placeholder.style.display = 'none';
    container.style.display = 'block';

    // Build Inspector HTML
    // We reuse the builders, but wrapping them in our new CSS structure

    const imgSrc = asset.files?.clean || asset.files?.original || '/images/PH.png';
    const displaySrc = imgSrc.startsWith('assets/') ? imgSrc.replace('assets/', '/') : imgSrc;

    // Upload Target: Prefer Original
    const rawOriginal = asset.files?.original || asset.files?.clean || '/images/PH.png';
    const uploadSrc = rawOriginal.startsWith('assets/') ? rawOriginal.replace('assets/', '/') : rawOriginal;

    container.innerHTML = `
        <div class="inspector-header">
            <h2 class="inspector-title">${asset.name || asset.id}</h2>
            <div class="inspector-subtitle">${asset.id}</div>
            <div style="margin-top:10px; display:flex; gap:10px;">
                <span class="status-badge ${asset.status || 'pending'}">${asset.status || 'pending'}</span>
                <button class="btn-icon" data-action="copy-id" data-id="${asset.id}" title="Copy ID">📋</button>
            </div>
        </div>

        <div style="text-align:center; margin-bottom:20px; background:#111; padding:10px; border-radius:6px;" data-action="image-drop-zone" data-path="${uploadSrc}" data-id="${asset.id}">
            <img src="${displaySrc}${asset?.id && imageParams[asset.id] ? '?t=' + imageParams[asset.id] : ''}" style="max-width:100%; max-height:200px; object-fit:contain;">
        </div>

        <div class="inspector-tabs">
            <button class="tab-btn ${currentInspectorTab === 'general' ? 'active' : ''}" data-action="switch-tab" data-tab="general">General</button>
            <button class="tab-btn ${currentInspectorTab === 'data' ? 'active' : ''}" data-action="switch-tab" data-tab="data">Data</button>
            <button class="tab-btn ${currentInspectorTab === 'relations' ? 'active' : ''}" data-action="switch-tab" data-tab="relations">Relations</button>
        </div>

        <div id="tab-general" class="tab-content" style="display:${currentInspectorTab === 'general' ? 'block' : 'none'};">
            ${buildRoleDropdownHtml(asset, fileName)}
            ${buildWeaponDropdownHtml(asset, fileName)}
            ${buildGenderBodyTypeHtml(asset, fileName)}
            ${buildSpeciesDropdownHtml(asset, fileName)}
            ${buildSizeScaleHtml(asset, fileName)}
            ${buildLoreDescriptionHtml(asset, fileName)}
            ${buildOtherFieldsHtml(asset)}
        </div>

        <div id="tab-data" class="tab-content" style="display:${currentInspectorTab === 'data' ? 'block' : 'none'};">
            ${buildStatsHtml(asset, fileName)}
            ${buildPromptHtml(asset)}
            <div class="field-group">
                <label class="field-label">Display Config (JSON)</label>
                <textarea class="field-textarea" readonly style="color:#aaa; font-family:monospace;">${JSON.stringify(asset.display || {}, null, 2)}</textarea>
            </div>
            ${buildFilePathsHtml(asset, fileName)}
        </div>

        <div id="tab-relations" class="tab-content" style="display:${currentInspectorTab === 'relations' ? 'block' : 'none'};">
            ${buildDropsHtml(asset)}
            ${buildUsageHtml(asset)}
            ${buildRecipeHtml(asset)}
            ${buildSourceHtml(asset)}
            ${buildResourceDropHtml(asset)}
            <div style="margin-top:20px; border-top:1px solid #333; padding-top:10px;">
                 ${buildSfxHtml(asset)}
                 ${buildVfxHtml(asset)}
            </div>
        </div>
    `;

    // Re-bind inline handlers if builders generated them? 
    // No, builders generate HTML strings. 
    // The EventDelegator (ActionDelegator) handles clicks.
    // However, some builders might produce inputs that rely on 'onchange'.
    // We should ensure builders use data-attributes or standard IDs that ActionDelegator listens to.
    // For now, the existing builders use inline onchange="..." which refers to global functions exposed in main.ts.
    // Since main.ts exports them, they should work IF they are on window.
    // But `main.ts` exports them, it doesn't necessarily put them on window unless we explicitly do so.
    // The previous implementation relied on main.ts being a module, but maybe the build process bundled them?
    // Actually, `categoryRenderer` generated HTML with `onchange="updateItem..."`.
    // If we are using valid ES modules without a bundler exposing to window, these inline handlers WILL FAIL.
    // I noticed `ActionDelegator` handles `data-action`.
    // The previous "fix" (Conversation 1) migrated many things to `data-action`.
    // I need to check `builders/index.ts` or specific builders to see if they use `data-action` or `onchange`.
}
