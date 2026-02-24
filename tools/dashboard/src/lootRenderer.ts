/**
 * Loot Renderer
 * Renders the loot view with resources, items, and equipment
 */

import { setLootData, setLootDataHash, lootFilter, setLootFilterValue } from './state';

// ============================================
// SHOW LOOT VIEW
// ============================================

export async function showLootView(): Promise<void> {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading loot data...</div>';

    try {
        const resp = await fetch('/api/get_loot', { method: 'POST', body: '{}' });
        const data = await resp.json();
        setLootData(data);
        setLootDataHash(JSON.stringify(data));
        renderLootView();
    } catch (err) {
        container.innerHTML = '<div class="error">Failed to load loot data: ' + (err as Error).message + '</div>';
    }
}

// ============================================
// FILTER SETTERS
// ============================================

export function setLootCategoryFilter(category: string): void {
    setLootFilterValue({ category });
    renderLootView();
}

export function setBiomeLootFilter(biome: string): void {
    setLootFilterValue({ biome: lootFilter.biome === biome ? 'all' : biome });
    renderLootView();
}

export function setTierLootFilter(tier: string | number): void {
    setLootFilterValue({ tier: lootFilter.tier === tier ? 'all' : tier });
    renderLootView();
}

// ============================================
// RENDER LOOT VIEW
// ============================================

export function renderLootView(): void {
    const container = document.getElementById('mainContent');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loot view coming soon...</div>';
    // Full implementation can be migrated from asset_dashboard.html
}
