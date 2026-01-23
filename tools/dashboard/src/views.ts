/**
 * Dashboard Views Module
 * Landing page, category views, and templates
 */

import {
    CATEGORY_ICONS,
    CATEGORY_COLORS,
    setCategoryData,
    setCurrentCategoryName,
    categoryData,
    currentCategoryName,
    setCategoryFilterValue,
} from './state';
import { fetchCategory, updateCategoryStatus, loadGlobalAssetLookup } from './api';
import { renderCategoryView } from './categoryRenderer';

// ============================================
// POLLING STATE
// ============================================

declare global {
    interface Window {
        pollingInterval: ReturnType<typeof setInterval> | null;
        lastDataHash: string | null;
        currentViewCategory: string | null;
        setPollingCategory: (category: string | null) => void;
    }
}

window.pollingInterval = null;
window.lastDataHash = null;
window.currentViewCategory = null;

window.setPollingCategory = function (category: string | null): void {
    window.currentViewCategory = category;
    window.lastDataHash = null;
    console.log('[LiveSync] Now watching:', category);
};

// ============================================
// LANDING PAGE
// ============================================

export function showLandingPage(): void {
    const container = document.getElementById('mainContent');
    if (!container) return;

    const categories = ['enemies', 'bosses', 'npcs', 'equipment', 'items', 'resources', 'nodes', 'hero'];

    container.innerHTML = `
        <div style="padding:2rem; text-align:center;">
            <h2 style="margin-bottom:1rem;">🦖 Entity Registry Dashboard</h2>
            <p style="color:var(--text-dim); margin-bottom:2rem;">Select a category to view and manage entities</p>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; max-width:1000px; margin:0 auto;">
                ${categories
            .map(
                (cat) => `
                    <button onclick="showCategoryView('${cat}')" 
                        style="padding:1.5rem; font-size:1.2rem; background:${CATEGORY_COLORS[cat] || '#666'}; 
                               border:none; border-radius:8px; cursor:pointer; color:white; 
                               display:flex; flex-direction:column; align-items:center; gap:0.5rem;
                               transition:transform 0.2s, box-shadow 0.2s;"
                        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 20px rgba(0,0,0,0.3)';"
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
                        <span style="font-size:2rem;">${CATEGORY_ICONS[cat] || '📁'}</span>
                        <span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    </button>
                `
            )
            .join('')}
            </div>
        </div>
    `;

    window.setPollingCategory(null);
}

export function loadManifest(): void {
    showLandingPage();
}

export function showImagesView(): void {
    showLandingPage();
}

// ============================================
// CATEGORY VIEW
// ============================================

export async function showCategoryView(categoryName: string): Promise<void> {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading category data...</div>';
    setCurrentCategoryName(categoryName);

    // Reset filters when switching categories
    setCategoryFilterValue({
        status: 'all',
        biome: 'all',
        tier: 'all',
        file: 'all',
        weaponType: 'all',
        hands: 'all',
        nodeSubtype: 'all',
    });

    try {
        // Load asset lookup if not loaded
        await loadGlobalAssetLookup();

        const data = await fetchCategory(categoryName);
        setCategoryData(data);
        renderCategoryView();

        // Set polling for live updates
        window.setPollingCategory(categoryName);
    } catch (err) {
        container.innerHTML = `<div class="error">Error loading category: ${(err as Error).message}</div>`;
    }
}

// ============================================
// NAVIGATION
// ============================================

export async function navigateToAsset(category: string, assetId: string): Promise<void> {
    // Switch to category view
    await showCategoryView(category);

    // Wait for render and scroll to asset
    setTimeout(() => {
        const safeId = assetId.replace(/[^a-zA-Z0-9]/g, '_');
        const card = document.querySelector(`[data-item-id="${safeId}"]`) as HTMLElement | null;
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.outline = '3px solid var(--accent)';
            setTimeout(() => {
                card.style.outline = '';
            }, 2000);
        }
    }, 500);
}

// ============================================
// STATS
// ============================================

export function updateStats(): void {
    // Stats are now rendered inline in category view
    // This function is kept for compatibility
}

// ============================================
// ACTION HELPERS
// ============================================

export function approveCategoryItem(category: string, fileName: string, itemId: string): void {
    updateCategoryStatus(category, fileName, itemId, 'approved');
}

export function declineCategoryItem(category: string, fileName: string, itemId: string, safeId: string): void {
    const noteInput = document.getElementById(`note_${safeId}`) as HTMLInputElement | null;
    const note = noteInput?.value || '';
    updateCategoryStatus(category, fileName, itemId, 'declined', note);
}

export function remakeCategoryItem(category: string, fileName: string, itemId: string, safeId: string): void {
    const noteInput = document.getElementById(`note_${safeId}`) as HTMLInputElement | null;
    const note = noteInput?.value || 'Remake requested';
    updateCategoryStatus(category, fileName, itemId, 'declined', `Remake: ${note}`);
}

export function declineCategoryItemById(
    category: string,
    fileName: string,
    itemId: string,
    noteInputId: string
): void {
    const noteInput = document.getElementById(noteInputId) as HTMLInputElement | null;
    const note = noteInput?.value || '';
    updateCategoryStatus(category, fileName, itemId, 'declined', note);
}

export function remakeCategoryItemById(
    category: string,
    fileName: string,
    itemId: string,
    noteInputId: string
): void {
    const noteInput = document.getElementById(noteInputId) as HTMLInputElement | null;
    const note = noteInput?.value || 'Remake requested';
    updateCategoryStatus(category, fileName, itemId, 'declined', `Remake: ${note}`);
}

// ============================================
// ASSET HELPERS (for legacy assets view)
// ============================================

export function approveAsset(path: string): void {
    import('./api').then(({ changeStatus }) => {
        changeStatus(path, 'approved').then(() => loadManifest());
    });
}

export function declineAsset(path: string, name: string, safeId: string): void {
    const noteInput = document.getElementById(`notes_${safeId}`) as HTMLInputElement | null;
    const note = noteInput?.value || '';

    import('./api').then(({ changeStatus, saveNotes }) => {
        changeStatus(path, 'declined').then(() => {
            if (note) saveNotes(name, note);
            loadManifest();
        });
    });
}

export function declineAssetPrompt(path: string, name: string): void {
    const note = prompt('Reason for declining:');
    if (note) {
        import('./api').then(({ changeStatus, saveNotes }) => {
            changeStatus(path, 'declined').then(() => {
                saveNotes(name, note);
                loadManifest();
            });
        });
    }
}

// ============================================
// AUTO REFRESH
// ============================================

let autoRefreshInterval: ReturnType<typeof setInterval> | null = null;

export function startAutoRefresh(): void {
    if (autoRefreshInterval) return;

    autoRefreshInterval = setInterval(async () => {
        if (!window.currentViewCategory) return;

        try {
            const response = await fetch('/api/get_category?_=' + Date.now(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
                body: JSON.stringify({ category: window.currentViewCategory }),
            });
            const data = await response.json();
            const newHash = JSON.stringify(data.entities || []);

            if (window.lastDataHash !== null && newHash !== window.lastDataHash) {
                console.log('[LiveSync] Data changed, refreshing...');
                setCategoryData(data);
                renderCategoryView();
            }
            window.lastDataHash = newHash;
        } catch {
            // Ignore polling errors
        }
    }, 1500);
}

export function stopAutoRefresh(): void {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}
