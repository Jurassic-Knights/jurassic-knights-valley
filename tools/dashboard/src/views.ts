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
    categoryFilter,
    saveCategoryFiltersCache,
    getCategoryFiltersFromCache,
} from './state';
import { fetchCategory, updateCategoryStatus, loadGlobalAssetLookup } from './api';
import { renderCategoryView } from './categoryRenderer';
import { renderConfigView } from './configRenderer';

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

    const categories = ['enemies', 'bosses', 'npcs', 'equipment', 'items', 'resources', 'nodes', 'environment', 'ground', 'ui', 'config', 'hero'];

    container.innerHTML = `
        <div style="padding:2rem; text-align:center;">
            <h2 style="margin-bottom:1rem;">🦖 Entity Registry Dashboard</h2>
            <p style="color:var(--text-dim); margin-bottom:2rem;">Select a category to view and manage entities</p>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; max-width:1000px; margin:0 auto;">
                ${categories
            .map(
                (cat) => `
                    <button data-action="navigate-category" data-category="${cat}" 
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

export async function showCategoryView(categoryName: string, pushState: boolean = true): Promise<void> {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading category data...</div>';
    setCurrentCategoryName(categoryName);

    // Always try to hide map editor first
    import('@dashboard/mapEditorView').then(({ hideMapEditorView }) => hideMapEditorView());

    // Update URL History
    if (pushState) {
        const url = new URL(window.location.href);
        url.searchParams.set('category', categoryName);
        url.searchParams.delete('view'); // Clear view param
        window.history.pushState({ category: categoryName }, '', url.toString());
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(btn => {
        const btnCat = btn.getAttribute('data-category');
        // Clear all action-based buttons (like map editor) if switching to category
        if (btn.dataset.action !== 'navigate-category' && btn.dataset.action !== 'toggle-config') {
            btn.classList.remove('active');
        }

        if (btnCat === categoryName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 0. Save current category-specific filters before switching
    if (currentCategoryName) {
        saveCategoryFiltersCache(currentCategoryName, {
            file: categoryFilter.file,
            weaponType: categoryFilter.weaponType,
            hands: categoryFilter.hands,
            nodeSubtype: categoryFilter.nodeSubtype
        });
    }

    // Restore specific filters for new category (or default to all)
    // Shared filters (status, biome, tier) remains from global state
    const cached = getCategoryFiltersFromCache(categoryName);
    setCategoryFilterValue({
        file: cached.file || 'all',
        weaponType: cached.weaponType || 'all',
        hands: cached.hands || 'all',
        nodeSubtype: cached.nodeSubtype || 'all'
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
    // Wait for render and scroll to asset
    setTimeout(() => {
        // Use exact ID match as stored in dataset.id in categoryRenderer
        const card = document.querySelector(`.asset-card[data-id="${assetId}"]`) as HTMLElement | null;
        if (card) {
            card.scrollIntoView({ behavior: 'auto', block: 'center' });

            // Remove class if it exists to restart animation
            card.classList.remove('highlight-flash');
            void card.offsetWidth; // Trigger reflow
            card.classList.add('highlight-flash');

            setTimeout(() => {
                card.classList.remove('highlight-flash');
            }, 2000);
        } else {
            console.warn(`[Navigation] Target card not found for ID: ${assetId}`);
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

export function showConfigView(pushState: boolean = true): void {
    const mainContent = document.getElementById('mainContent');
    // Ensure map editor is hidden
    import('@dashboard/mapEditorView').then(({ hideMapEditorView }) => hideMapEditorView());

    if (mainContent) {
        // Update URL History
        if (pushState) {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'config');
            url.searchParams.delete('category'); // Clear category param
            window.history.pushState({ view: 'config' }, '', url.toString());
        }

        // Hide stats and filters when showing config
        const stats = document.querySelector('.stats') as HTMLElement;
        const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
        if (stats) stats.style.display = 'none';
        if (stickyBar) stickyBar.style.display = 'none';

        // Sidebar Active State
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-action') === 'toggle-config') {
                btn.classList.add('active');
            }
        });

        renderConfigView(mainContent);

        // Stop polling when in config
        window.setPollingCategory(null);
    }
}
