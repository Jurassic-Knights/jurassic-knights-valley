/**
 * Dashboard Main Entry Point
 * Initialization and global exports for legacy onclick handlers
 */

// Re-export everything from modules for global access
import {
    sfxRegenerationQueue,
    setCategoryData,
} from './state';
import {
    saveRegenerationQueueToFile,
    loadGlobalAssetLookup,
    fetchPrompts,
} from './api';
import { setAssetPrompts } from './state';
import { initModalHandlers } from './modals';
import {
    loadManifest,
    showCategoryView,
    showConfigView,
} from './views';
import { renderCategoryView } from './categoryRenderer';
import { renderAssets } from './legacyAssets';

import { initEventDelegation, disposeDelegation } from './ActionDelegator';
import { initResizeHandle } from './ResizePanels';

// ============================================
// LIVE POLLING
// ============================================

function startLivePolling(): void {
    // Prevent multiple intervals
    stopLivePolling();

    window.pollingInterval = setInterval(async () => {
        if (!window.currentViewCategory) {
            return;
        }

        try {
            const response = await fetch('/api/get_category?_=' + Date.now(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
                body: JSON.stringify({ category: window.currentViewCategory }),
            });
            const data = await response.json();
            const entities = data.entities || [];
            const newHash = JSON.stringify(entities);

            if (window.lastDataHash !== null && newHash !== window.lastDataHash) {
                console.log('[LiveSync] Entity data changed! Refreshing view...');
                setCategoryData(data);
                renderCategoryView();
            }
            window.lastDataHash = newHash;
        } catch {
            // Ignore polling errors
        }
    }, 1500);
    console.log('[LiveSync] Started polling every 1.5s');
}

function stopLivePolling(): void {
    if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
        window.pollingInterval = null;
        console.log('[LiveSync] Stopped polling');
    }
}

// ============================================
// EQUIPMENT STATS CONFIG
// Defines ALL stats for each equipment category
// ============================================

window.EquipmentStatsConfig = {
    categories: ['offense', 'defense', 'utility'],
    getStatsByCategory: (category: string) => {
        const stats: Record<string, Array<{ key: string; label: string; icon: string; type: string; default: number | boolean }>> = {
            offense: [
                { key: 'damage', label: 'Damage', icon: 'stat_damage', type: 'number', default: 0 },
                { key: 'attackSpeed', label: 'Attack Speed', icon: 'stat_attack_speed', type: 'number', default: 1.0 },
                { key: 'range', label: 'Range', icon: 'stat_range', type: 'number', default: 0 },
                { key: 'critChance', label: 'Crit Chance', icon: 'stat_crit_chance', type: 'number', default: 0 },
                { key: 'critDamage', label: 'Crit Damage', icon: 'stat_crit_damage', type: 'number', default: 1.5 },
            ],
            defense: [
                { key: 'armor', label: 'Armor', icon: 'stat_armor', type: 'number', default: 0 },
                { key: 'health', label: 'Health', icon: 'stat_health', type: 'number', default: 0 },
                { key: 'stamina', label: 'Stamina', icon: 'stat_stamina', type: 'number', default: 0 },
                { key: 'speed', label: 'Speed', icon: 'stat_speed', type: 'number', default: 0 },
            ],
            utility: [
                { key: 'efficiency', label: 'Efficiency', icon: 'stat_efficiency', type: 'number', default: 1.0 },
            ],
        };
        return stats[category] || [];
    },
};

// ============================================
// INITIALIZATION
// ============================================

function initApp() {
    console.log('[Dashboard] Initializing App...');

    try {
        // Replace loading message immediately so we never stay stuck
        loadManifest();

        // Initialize Event Delegation (Replaces inline onclicks)
        initEventDelegation();

        // Resizable sidebars
        initResizeHandle('resize-sidebar', 'sidebar', true, {
            defaultPx: 260,
            storageKey: 'dashboard-sidebar-width',
        });
        initResizeHandle('resize-inspector', 'inspectorPanel', false, {
            defaultPx: 350,
            storageKey: 'dashboard-inspector-width',
        });

        // Load Global Asset Lookup (for Drops/Sources)
        loadGlobalAssetLookup().then(() => {
            // If we are already on a view, re-render to show drops/sources
            if (window.currentViewCategory) {
                import('./categoryRenderer').then(({ renderCategoryView }) => {
                    renderCategoryView();
                });
            }
        });

        // Load Asset Prompts
        fetchPrompts().then((data) => {
            setAssetPrompts(data || {});
            // If inspector is open, we might want to re-render it, but usually this is fast enough
        });

        // Set up filter button listeners
        // Note: If these elements exist in static HTML, they might accumulate listeners on re-run
        // Ideally we should use delegation for these too, but for now we'll assume they are safe-ish 
        // or we should replace them to strip listeners.
        document.querySelectorAll('.filter-btn').forEach((btn) => {
            // Cloning removes listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode?.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
                (newBtn as HTMLElement).classList.add('active');
                const filter = (newBtn as HTMLElement).dataset.filter;
                if (filter) {
                    import('./state').then(({ setCurrentFilter }) => {
                        setCurrentFilter(filter);
                        renderAssets();
                    });
                }
            });
        });

        // Keyboard & Mouse handlers for modal
        initModalHandlers();

        // Sync SFX regeneration queue from localStorage to server on load
        if (sfxRegenerationQueue && sfxRegenerationQueue.length > 0) {
            console.log(`[Dashboard] Syncing ${sfxRegenerationQueue.length} SFX queue items to server...`);
            saveRegenerationQueueToFile();
        }

        // Handle Browser Navigation (Back/Forward)
        // Clean up old popstate if it exists? 
        // window.onpopstate is cleaner for replacement than addEventListener
        window.onpopstate = (event) => {
            // Always try to hide map editor first to ensure clean state
            import('@dashboard/mapEditorView').then(({ hideMapEditorView }) => hideMapEditorView());

            if (event.state && event.state.view === 'map') {
                import('@dashboard/mapEditorView').then((m) => m.showMapEditorView(false));
            } else if (event.state && event.state.view === 'config') {
                showConfigView(false);
            } else if (event.state && event.state.category) {
                showCategoryView(event.state.category, false);
            } else {
                loadManifest();
            }
        };

        // Check URL for initial view/category (Only on fresh load or if we want to reset view on HMR)
        if (!window.currentViewCategory) {
            const urlParams = new URLSearchParams(window.location.search);
            const viewParam = urlParams.get('view');
            const categoryParam = urlParams.get('category');

            if (viewParam === 'map') {
                import('@dashboard/mapEditorView').then((m) => m.showMapEditorView(false));
            } else if (viewParam === 'config') {
                showConfigView(false);
            } else if (categoryParam) {
                showCategoryView(categoryParam, false);
            }
            // else: loadManifest already called above
        } else {
            if (window.currentViewCategory) {
                renderCategoryView();
            }
        }

        // Start live polling
        startLivePolling();
    } catch (err) {
        console.error('[Dashboard] Init failed:', err);
        loadManifest(); // Fallback so user at least sees landing page
    }
}

// Boot - ensure we never stay stuck on "Loading..."
let booted = false;
function boot(): void {
    if (booted) return;
    booted = true;
    try {
        initApp();
    } catch (err) {
        console.error('[Dashboard] Boot failed:', err);
        loadManifest();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
    // Fallback: if DOMContentLoaded never fires (e.g. script blocking), run after 2s
    setTimeout(boot, 2000);
} else {
    boot();
}

console.log('[Dashboard] TypeScript modules loaded');

// ============================================
// HMR Configuration
// ============================================
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        console.log('[HMR] Dashboard module updated. Re-initializing...');
        // initApp will be called because this module is re-executed
        // But we are inside the accept callback of the *previous* module?
        // No, import.meta.hot.accept() means "I accept updates".
        // When update happens, the NEW module is executed.
        // The NEW module's top level code runs.
        // So initApp() above is called by the `else { initApp() }` block because readyState is complete.
    });

    import.meta.hot.dispose(() => {
        console.log('[HMR] Disposing old dashboard instance...');
        stopLivePolling();
        disposeDelegation();
    });
}
