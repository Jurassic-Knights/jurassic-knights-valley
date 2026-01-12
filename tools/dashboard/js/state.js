/**
 * Dashboard State Management
 * Global state, constants, and configuration
 */

// Global state
let manifest = null;
let declineNotes = {};
let assetPrompts = {};
let missingAssets = [];
let unsyncedAssets = [];
let currentFilter = 'all';
let currentCategory = 'all';

// Category view state
let categoryData = null;
let currentCategoryName = '';
let categoryFilter = { status: 'all', biome: 'all', tier: 'all', file: 'all', weaponType: 'all', hands: 'all' };
let categoryImageSize = parseInt(localStorage.getItem('categoryImageSize')) || 200;

// Loot view state
let lootData = null;
let lootFilter = { category: 'all', biome: 'all', tier: 'all' };
let lootDataHash = '';
let autoRefreshInterval = null;

// SFX regeneration queue
let sfxRegenerationQueue = JSON.parse(localStorage.getItem('sfxRegenerationQueue') || '[]');

// Global asset lookup (for drops/recipes)
let globalAssetLookup = {};
let assetLookupLoaded = false;

// Constants
const BASE_PATH = '/images/';

const CATEGORY_ICONS = {
    enemies: '🦖', npcs: '👤', items: '🧱', equipment: '⚔️',
    resources: '🪨', nodes: '⛏️', environment: '🌲', ui: '🖼️',
    buildings: '🏠', props: '🌲', vfx: '✨', audio: '🔊'
};

const CATEGORY_COLORS = {
    enemies: '#e91e63', npcs: '#4caf50', items: '#795548', equipment: '#9c27b0',
    resources: '#ff9800', nodes: '#6d4c41', environment: '#8bc34a', ui: '#03a9f4',
    buildings: '#ff9800', props: '#8bc34a', vfx: '#e91e63', audio: '#9c27b0'
};

const WEAPON_TYPES = {
    ranged: ['rifle', 'pistol', 'submachine_gun', 'machine_gun', 'crossbow', 'flamethrower', 'shotgun', 'sniper_rifle', 'bazooka'],
    melee: ['sword', 'longsword', 'greatsword', 'axe', 'war_axe', 'mace', 'war_hammer', 'lance', 'halberd', 'spear', 'dual_blades', 'flail', 'knife']
};

// State accessors
function getState() {
    return {
        manifest, declineNotes, assetPrompts, missingAssets, unsyncedAssets,
        currentFilter, currentCategory, categoryData, currentCategoryName,
        categoryFilter, categoryImageSize, lootData, lootFilter,
        globalAssetLookup, assetLookupLoaded, sfxRegenerationQueue
    };
}

function setCategoryImageSize(size) {
    categoryImageSize = parseInt(size);
    localStorage.setItem('categoryImageSize', size);
    document.getElementById('imageSizeValue').textContent = size + 'px';

    // Update all existing cards
    document.querySelectorAll('.asset-card').forEach(card => {
        const isSplitCard = card.querySelector('div[style*="display:flex"][style*="gap:4px"]');
        const cardWidth = isSplitCard ? (size * 2 + 20) : size;
        card.style.width = cardWidth + 'px';
        card.style.minWidth = cardWidth + 'px';
    });
    document.querySelectorAll('.asset-card .asset-image').forEach(img => {
        img.style.width = size + 'px';
        img.style.height = size + 'px';
    });
    document.querySelectorAll('.asset-card > div:first-child').forEach(div => {
        if (div.style.height && !div.style.display?.includes('flex')) {
            div.style.width = size + 'px';
            div.style.height = size + 'px';
        }
    });
}

// Filter setters
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

function setLootFilter(category) {
    lootFilter.category = category;
    renderLootView();
}

function setBiomeFilter(biome) {
    lootFilter.biome = (lootFilter.biome === biome) ? 'all' : biome;
    renderLootView();
}

function setTierFilter(tier) {
    lootFilter.tier = (lootFilter.tier === tier) ? 'all' : tier;
    renderLootView();
}

// Utility
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
