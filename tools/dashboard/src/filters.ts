/**
 * Category Filters Module
 * Filter setter functions for category view
 */

import { categoryFilter, setCategoryFilterValue, setCategorySort, setCategoryImageSizeValue } from './state';
import { renderCategoryView } from './categoryRenderer';

// ============================================
// FILTER FUNCTIONS
// ============================================

let imageSizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export function setCategoryStatusFilter(status: string): void {
    setCategoryFilterValue({ status });
    renderCategoryView();
}

export function setCategoryBiomeFilter(biome: string): void {
    setCategoryFilterValue({ biome: categoryFilter.biome === biome ? 'all' : biome });
    renderCategoryView();
}

export function setCategoryTierFilter(tier: string | number): void {
    setCategoryFilterValue({ tier: categoryFilter.tier === tier ? 'all' : tier });
    renderCategoryView();
}

export function setCategoryFileFilter(file: string): void {
    setCategoryFilterValue({ file });
    renderCategoryView();
}

export function setCategoryWeaponTypeFilter(weaponType: string): void {
    setCategoryFilterValue({ weaponType: categoryFilter.weaponType === weaponType ? 'all' : weaponType });
    renderCategoryView();
}

export function setCategoryHandsFilter(hands: string): void {
    setCategoryFilterValue({ hands: categoryFilter.hands === hands ? 'all' : hands });
    renderCategoryView();
}

export function setCategoryNodeSubtypeFilter(subtype: string): void {
    setCategoryFilterValue({ nodeSubtype: categoryFilter.nodeSubtype === subtype ? 'all' : subtype });
    renderCategoryView();
}

export function setCategoryImageSize(size: string | number): void {
    const sizeNum = typeof size === 'string' ? parseInt(size) : size;
    setCategoryImageSizeValue(sizeNum);

    // Update the label immediately
    const label = document.getElementById('imageSizeValue');
    if (label) label.textContent = `${sizeNum}px`;

    // Debounce the re-render to allow smooth dragging
    if (imageSizeDebounceTimer) clearTimeout(imageSizeDebounceTimer);
    imageSizeDebounceTimer = setTimeout(() => {
        renderCategoryView();
    }, 150);
}

export function setCategorySortOrder(order: string): void {
    setCategorySort(order);
    renderCategoryView();
}

export function setLootFilter(category: string): void {
    import('./lootRenderer').then(({ renderLootView }) => {
        // Update loot filter state
        import('./state').then(({ setLootFilterValue }) => {
            setLootFilterValue({ category });
            renderLootView();
        });
    });
}

export function setBiomeFilter(biome: string): void {
    import('./state').then(({ lootFilter, setLootFilterValue }) => {
        setLootFilterValue({ biome: lootFilter.biome === biome ? 'all' : biome });
        import('./lootRenderer').then(({ renderLootView }) => {
            renderLootView();
        });
    });
}

export function setTierFilter(tier: string | number): void {
    import('./state').then(({ lootFilter, setLootFilterValue }) => {
        setLootFilterValue({ tier: lootFilter.tier === tier ? 'all' : tier });
        import('./lootRenderer').then(({ renderLootView }) => {
            renderLootView();
        });
    });
}
