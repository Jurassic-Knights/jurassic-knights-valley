/**
 * Category Filters Module
 * Filter setter functions for category view
 */

function setCategoryStatusFilter(status) {
    categoryFilter.status = status;
    renderCategoryView();
}

function setCategoryBiomeFilter(biome) {
    categoryFilter.biome = (categoryFilter.biome === biome) ? 'all' : biome;
    renderCategoryView();
}

function setCategoryTierFilter(tier) {
    categoryFilter.tier = (categoryFilter.tier === tier) ? 'all' : tier;
    renderCategoryView();
}

function setCategoryFileFilter(file) {
    categoryFilter.file = file;
    renderCategoryView();
}

function setCategoryWeaponTypeFilter(weaponType) {
    categoryFilter.weaponType = (categoryFilter.weaponType === weaponType) ? 'all' : weaponType;
    renderCategoryView();
}

function setCategoryHandsFilter(hands) {
    categoryFilter.hands = (categoryFilter.hands === hands) ? 'all' : hands;
    renderCategoryView();
}

let imageSizeDebounceTimer = null;

function setCategoryImageSize(size) {
    categoryImageSize = parseInt(size);
    localStorage.setItem('categoryImageSize', size);

    // Update the label immediately
    const label = document.getElementById('imageSizeValue');
    if (label) label.textContent = size + 'px';

    // Debounce the re-render to allow smooth dragging
    clearTimeout(imageSizeDebounceTimer);
    imageSizeDebounceTimer = setTimeout(() => {
        renderCategoryView();
    }, 150);
}
