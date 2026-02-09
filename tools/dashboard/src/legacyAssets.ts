/**
 * Legacy Assets Module
 * Functions for manifest-based asset rendering (original dashboard functionality)
 */

import { h, renderToString } from './domBuilder';
import {
    manifest,
    declineNotes,
    assetPrompts,
    currentFilter,
    currentCategory,
    missingAssets,
    setCurrentCategory,
    BASE_PATH,
} from './state';

// ============================================
// CATEGORY FILTERS
// ============================================

export function buildCategoryFilters(): void {
    if (!manifest || !manifest.assets) return;

    const categoryStats: Record<string, { total: number; clean: number; pending: number; approved: number }> = {};
    manifest.assets.forEach((a) => {
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
    const totalClean = manifest.assets.filter((a) => a.status === 'clean').length;

    const container = document.getElementById('categoryFilters');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // "All" button
    const allBtn = h('button', {
        className: `filter-btn secondary ${currentCategory === 'all' ? 'active' : ''}`,
        'data-action': 'filter-category',
        'data-category': 'all'
    }, [`All (${totalClean}/${totalAssets})`]);
    container.appendChild(allBtn);

    // Category buttons
    sorted.forEach((cat) => {
        const stats = categoryStats[cat];
        const btn = h('button', {
            className: `filter-btn secondary ${currentCategory === cat ? 'active' : ''}`,
            'data-action': 'filter-category',
            'data-category': cat
        }, [`${cat} (${stats.clean}/${stats.total})`]);
        container.appendChild(btn);
    });
}

// ============================================
// RENDER ASSETS
// ============================================

export function renderAssets(): void {
    const container = document.getElementById('mainContent');
    if (!container) return;
    container.innerHTML = '';

    if (currentFilter === 'missing') {
        if (missingAssets.length === 0) {
            container.innerHTML =
                '<div class="loading" style="color: var(--accent-green);">✓ No missing assets! All AssetLoader IDs have valid files.</div>';
            return;
        }

        const cards = missingAssets.map(item => {
            return h('div', { className: 'asset-card declined' }, [
                h('div', { style: 'padding:1rem; background:#eee; height:100px; display:flex; align-items:center; justify-content:center;' }, [
                    h('span', { style: 'font-size:2rem;' }, ['❓'])
                ]),
                h('div', { className: 'asset-info' }, [
                    h('div', { className: 'asset-name', style: 'color:var(--ink-red);' }, [item.id]),
                    h('div', { style: 'font-size:0.7rem; color:#000; margin-top:0.25rem;' }, [`Expected: ${item.expectedFile}`])
                ])
            ]);
        });

        const categoryEl = h('div', { className: 'category' }, [
            h('div', { className: 'category-header' }, [
                h('h2', { className: 'category-title' }, ['⚠️ Missing Assets in AssetLoader.js']),
                h('span', { style: 'color: var(--accent)' }, [`${missingAssets.length} assets pointing to PH.png`])
            ]),
            h('div', { className: 'asset-grid' }, cards)
        ]);

        container.appendChild(categoryEl);
        return;
    }

    if (!manifest || !manifest.assets) return;

    const categories: Record<string, typeof manifest.assets> = {};
    manifest.assets.forEach((asset) => {
        if (currentFilter !== 'all' && asset.status !== currentFilter) return;
        if (currentCategory !== 'all' && asset.category !== currentCategory) return;
        if (!categories[asset.category]) categories[asset.category] = [];
        categories[asset.category].push(asset);
    });

    const sortedCategories = Object.keys(categories).sort();
    for (const category of sortedCategories) {
        const assets = categories[category];

        const cards = assets.map(asset => createAssetCard(asset));

        const categoryEl = h('div', { className: 'category' }, [
            h('div', { className: 'category-header' }, [
                h('h2', { className: 'category-title' }, [category]),
                h('span', { style: 'color: var(--text-dim)' }, [`${assets.length} assets`])
            ]),
            h('div', { className: 'asset-grid' }, cards)
        ]);

        container.appendChild(categoryEl);
    }

    if (sortedCategories.length === 0)
        container.innerHTML = '<div class="loading">No assets match the current filter.</div>';
}

// ============================================
// CREATE ASSET CARD
// ============================================

function createAssetCard(asset: { path: string; name: string; status: string }): HTMLElement {
    const safeId = asset.name.replace(/[^a-zA-Z0-9]/g, '_');
    const imgPath = BASE_PATH + asset.path;
    const existingNotes = declineNotes[asset.name] || '';

    let actions: HTMLElement[] = [];
    let notesInput: HTMLElement | null = null;

    // Common approve button
    const approveBtn = h('button', {
        className: 'approve',
        'data-action': 'approve-asset',
        'data-path': asset.path
    }, ['✓ Approve']);

    // Common decline button
    const declineBtn = h('button', {
        className: 'decline',
        'data-action': 'decline-asset',
        'data-path': asset.path,
        'data-name': asset.name,
        'data-safe-id': safeId,
        // declineAsset reads the note from input. ID is needed.
        // Wait, `declineAsset(path, name, safeId)` does:
        // note = document.getElementById(`notes_${safeId}`).value
        // So simply passing safeId is enough for it to find the input if we name it correctly.
    }, ['✗ Decline']);

    if (asset.status === 'pending') {
        notesInput = h('input', {
            type: 'text',
            id: `notes_${safeId}`,
            className: 'notes-input',
            placeholder: 'Decline reason...',
            value: existingNotes
        });
        actions = [approveBtn, declineBtn];
    } else if (asset.status === 'approved') {
        const declinePromptBtn = h('button', {
            className: 'decline',
            'data-action': 'decline-asset-prompt',
            'data-path': asset.path,
            'data-name': asset.name
        }, ['✗ Decline']);
        actions = [declinePromptBtn];
    } else if (asset.status === 'declined') {
        actions = [h('button', {
            className: 'approve',
            'data-action': 'approve-asset',
            'data-path': asset.path
        }, ['✓ Re-approve'])];
    } else if (asset.status === 'clean') {
        notesInput = h('input', {
            type: 'text',
            id: `notes_${safeId}`,
            className: 'notes-input',
            placeholder: 'Remake instructions...',
            value: existingNotes
        });

        const remakeBtn = h('button', {
            className: 'secondary',
            'data-action': 'remake-asset',
            'data-path': asset.path,
            'data-name': asset.name,
            'data-safe-id': safeId,
            style: 'background:var(--brass); color:white;'
        }, ['🔄 Remake']);

        actions = [remakeBtn];
    }

    // Prompt Preview
    let baseNameForPrompt = asset.name.replace('_approved', '').replace('_declined', '');
    if (baseNameForPrompt.includes('_clean')) {
        baseNameForPrompt = baseNameForPrompt.replace('_clean', '_original');
    }
    const prompt = assetPrompts[baseNameForPrompt] || assetPrompts[asset.name] || '';
    const promptPreview = prompt
        ? h('div', {
            className: 'prompt-preview',
            title: prompt.replace(/"/g, '&quot;')
        }, [`📝 ${prompt.substring(0, 40)}${prompt.length > 40 ? '...' : ''}`])
        : null;

    // Notes Display for Declined
    const notesDisplay = (asset.status === 'declined' && existingNotes)
        ? h('div', {
            style: 'font-size:0.7rem; color:var(--ink-red); margin-top:0.3rem; font-style:italic;'
        }, [`📝 ${existingNotes}`])
        : null;


    const cardChildren: HTMLElement[] = [
        h('div', { className: 'asset-name' }, [asset.name]),
        h('span', { className: `asset-status status-${asset.status}` }, [asset.status]),
        promptPreview,
        notesDisplay,
        notesInput,
        h('div', { className: 'asset-actions' }, actions)
    ];

    const card = h('div', {
        className: `asset-card ${asset.status}`,
        'data-path': asset.path
    }, [
        h('img', {
            className: 'asset-image',
            src: imgPath,
            alt: asset.name,
            'data-action': 'open-modal',
            'data-path': imgPath,
            'data-name': asset.name,
            'data-status': asset.status,
            // onerror must still be inline or handled via delegation on 'error' event (not bubbly)
            // delegation doesn't capture 'error'. 
            // We can keep inline onerror="this.style.display='none'" as it is standard self-contained logic
            onerror: "this.style.display='none'"
        }),
        h('div', { className: 'asset-info' }, cardChildren)
    ]);

    return card;
}
