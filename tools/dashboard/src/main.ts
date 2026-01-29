/**
 * Dashboard Main Entry Point
 * Initialization and global exports for legacy onclick handlers
 */

// Re-export everything from modules for global access
import {
    sfxRegenerationQueue,
    categoryData,
    setCategoryData,
    currentCategoryName,
} from './state';
import {
    updateCategoryStatus,
    updateConsumedStatus,
    updateItemWeapon,
    updateItemStat,
    updateItemField,
    updateItemTier,
    updateDisplayField,
    updateWeaponMeta,
    syncEntitiesToJson,
    markSfxForRegeneration,
    markAllSfxForRegeneration,
    saveRegenerationQueueToFile,
    updateDisplaySize,
} from './api';
import { openModal, closeModal, toggleComparisonView, initModalHandlers } from './modals';
import {
    showLandingPage,
    loadManifest,
    showCategoryView,
    navigateToAsset,
    approveCategoryItem,
    declineCategoryItem,
    remakeCategoryItem,
    declineCategoryItemById,
    remakeCategoryItemById,
    approveAsset,
    declineAsset,
    declineAssetPrompt,
    startAutoRefresh,
    stopAutoRefresh,
} from './views';
import { renderCategoryView } from './categoryRenderer';
import {
    setCategoryStatusFilter,
    setCategoryBiomeFilter,
    setCategoryTierFilter,
    setCategoryFileFilter,
    setCategoryWeaponTypeFilter,
    setCategoryHandsFilter,
    setCategoryNodeSubtypeFilter,
    setCategoryImageSize,
    setCategorySortOrder,
    setLootFilter,
    setBiomeFilter,
    setTierFilter,
} from './filters';
import { showTemplatesView } from './templates';
import { showLootView } from './lootRenderer';
import { buildCategoryFilters, renderAssets } from './legacyAssets';
import { renderConfigView } from './configRenderer';
import { showMapEditorView } from './mapEditorView';

// Wrapper function for config view
function showConfigView(): void {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        // Hide stats and filters when showing config
        const stats = document.querySelector('.stats') as HTMLElement;
        const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
        if (stats) stats.style.display = 'none';
        if (stickyBar) stickyBar.style.display = 'none';

        renderConfigView(mainContent);
    }
}


import { initEventDelegation } from './ActionDelegator';

// ============================================
// LIVE POLLING
// ============================================

// ============================================
// LIVE POLLING
// ============================================

function startLivePolling(): void {
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
// GLOBAL EXPORTS - REMOVED!
// All actions now handled via ActionDelegator.ts
// ============================================

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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Event Delegation (Replaces inline onclicks)
    initEventDelegation();

    // Set up filter button listeners
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = (btn as HTMLElement).dataset.filter;
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

    // Load landing page
    loadManifest();

    // Start live polling
    startLivePolling();
});

console.log('[Dashboard] TypeScript modules loaded');
