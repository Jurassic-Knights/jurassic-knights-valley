/**
 * Dashboard State Module
 * Global state, constants, and configuration
 */

// ============================================
// TYPES
// ============================================

export interface AssetItem {
    id: string;
    name?: string;
    status?: 'pending' | 'approved' | 'declined' | 'clean';
    declineNote?: string;
    files?: {
        original?: string;
        clean?: string;
        consumed_original?: string;
        consumed_clean?: string;
    };
    consumedStatus?: string;
    sourceDescription?: string;
    consumedSourceDescription?: string;
    biome?: string;
    tier?: number;
    enemyType?: string;
    type?: string;
    sourceFile?: string;
    sourceCategory?: string;
    stats?: Record<string, unknown> | string;
    combat?: Record<string, unknown>;
    loot?: Array<{ item: string; chance?: number; amount?: number; min?: number; max?: number }>;
    drops?: Array<{ item: string; chance?: number; amount?: number[] }>; // Fishing/Node style
    recipe?: Array<{ item: string; amount?: number }> | Record<string, number> | string;
    source?: string;
    resourceDrop?: string;
    sfx?: Record<string, string | { id: string; status?: string }>;
    vfx?: Record<string, { status?: string }>;
    display?: {
        sizeScale?: number;
        width?: number;
        height?: number;
    };
    gender?: string;
    bodyType?: string;
    role?: string;
    weaponType?: string;
    gripType?: string;
    weaponSubtype?: string;
    species?: string;
    description?: string;
    slot?: string;
    category?: string;
    imageModifiedTime?: number;
    groupId?: string;
}

export interface CategoryFilter {
    status: string;
    biome: string;
    tier: string | number;
    file: string;
    weaponType: string;
    hands: string;
    nodeSubtype: string;
}

export interface LootFilter {
    category: string;
    biome: string;
    tier: string | number;
}

export interface CategoryData {
    _config?: { description?: string };
    asset_queue?: { vfx?: Array<{ status: string }>; sfx?: Array<{ status: string }> };
    files?: Record<string, AssetItem[]>;
    error?: string;
    entities?: AssetItem[];
}

export interface AssetInfo {
    id: string;
    path: string;
    name?: string;
    category?: string;
}

export interface Manifest {
    assets?: Array<{
        path: string;
        name: string;
        category: string;
        status: string;
    }>;
}

// ============================================
// STATE
// ============================================

export let manifest: Manifest | null = null;
export let declineNotes: Record<string, string> = {};
export let assetPrompts: Record<string, string> = {};
export let missingAssets: Array<{ id: string; expectedFile: string }> = [];
export let unsyncedAssets: unknown[] = [];
export let currentFilter = 'all';
export let currentCategory = 'all';

// Category view state
export let categoryData: CategoryData | null = null;
export let currentCategoryName = '';
export let categoryFilter: CategoryFilter = {
    status: 'all',
    biome: 'all',
    tier: 'all',
    file: 'all',
    weaponType: 'all',
    hands: 'all',
    nodeSubtype: 'all',
};
export let categoryImageSize = parseInt(localStorage.getItem('categoryImageSize') || '200');
export let categorySort = localStorage.getItem('categorySort') || 'tier';

// Loot view state
export let lootData: unknown = null;
export let lootFilter: LootFilter = { category: 'all', biome: 'all', tier: 'all' };
export let lootDataHash = '';
export let autoRefreshInterval: ReturnType<typeof setInterval> | null = null;

// SFX regeneration queue
export let sfxRegenerationQueue: Array<{ assetId: string; sfxIds: string[] }> = JSON.parse(
    localStorage.getItem('sfxRegenerationQueue') || '[]'
);

// Global asset lookup (for drops/recipes)
export let globalAssetLookup: Record<string, AssetInfo> = {};
export let lootSourceMap: Record<string, string[]> = {}; // itemId -> [sourceIds]
export let assetLookupLoaded = false;

// Selection State (for Inspector)
export let selectedAssetId: string | null = null;
export let currentInspectorTab: string = 'general';

// ============================================
// STATE SETTERS (for module encapsulation)
// ============================================

export function setCurrentInspectorTab(tab: string): void {
    currentInspectorTab = tab;
}

export function setManifest(m: Manifest | null): void {
    manifest = m;
}

export function setDeclineNotes(notes: Record<string, string>): void {
    declineNotes = notes;
}

export function setAssetPrompts(prompts: Record<string, string>): void {
    assetPrompts = prompts;
}

export function setMissingAssets(assets: Array<{ id: string; expectedFile: string }>): void {
    missingAssets = assets;
}

export function setCurrentFilter(filter: string): void {
    currentFilter = filter;
}

export function setCurrentCategory(category: string): void {
    currentCategory = category;
}

export function setCategoryData(data: CategoryData | null): void {
    categoryData = data;
}

export function setCurrentCategoryName(name: string): void {
    currentCategoryName = name;
}

export function setGlobalAssetLookup(lookup: Record<string, AssetInfo>): void {
    globalAssetLookup = lookup;
    assetLookupLoaded = true;
}

export function setLootSourceMap(data: Record<string, string[]>): void {
    lootSourceMap = data;
}

export function setSfxRegenerationQueue(queue: Array<{ assetId: string; sfxIds: string[] }>): void {
    sfxRegenerationQueue = queue;
    localStorage.setItem('sfxRegenerationQueue', JSON.stringify(queue));
}

export function setLootData(data: unknown): void {
    lootData = data;
}

export function setLootDataHash(hash: string): void {
    lootDataHash = hash;
}

export function setCategorySort(sort: string): void {
    categorySort = sort;
    localStorage.setItem('categorySort', sort);
}

export function setCategoryImageSizeValue(size: number): void {
    categoryImageSize = size;
    localStorage.setItem('categoryImageSize', String(size));
}

export function setCategoryFilterValue(filter: Partial<CategoryFilter>): void {
    Object.assign(categoryFilter, filter);
}

export function setLootFilterValue(filter: Partial<LootFilter>): void {
    Object.assign(lootFilter, filter);
}

export function setSelectedAssetId(id: string | null): void {
    selectedAssetId = id;
}

// ============================================
// CONSTANTS
// ============================================

export const BASE_PATH = '/images/';

export const CATEGORY_ICONS: Record<string, string> = {
    enemies: '🦖',
    bosses: '👑',
    npcs: '👤',
    items: '🧱',
    equipment: '⚔️',
    resources: '🪨',
    nodes: '⛏️',
    environment: '🌲',
    ui: '🖼️',
    buildings: '🏠',
    props: '🌲',
    vfx: '✨',
    audio: '🔊',
    config: '⚙️',
    hero: '🛡️',
};

export const CATEGORY_COLORS: Record<string, string> = {
    enemies: '#e91e63',
    bosses: '#9c27b0',
    npcs: '#4caf50',
    items: '#795548',
    equipment: '#673ab7',
    resources: '#ff9800',
    nodes: '#6d4c41',
    environment: '#8bc34a',
    ui: '#03a9f4',
    buildings: '#ff9800',
    props: '#8bc34a',
    vfx: '#e91e63',
    audio: '#9c27b0',
    config: '#607d8b',
    hero: '#2196f3',
};

// Weapon types - mirrors GameConstants.Weapons from game code
export const WEAPON_TYPES: Record<string, string[]> = {
    ranged: [
        'rifle',
        'pistol',
        'submachine_gun',
        'machine_gun',
        'flamethrower',
        'shotgun',
        'sniper_rifle',
        'bazooka',
    ],
    melee: [
        'sword',
        'greatsword',
        'axe',
        'war_axe',
        'mace',
        'war_hammer',
        'lance',
        'halberd',
        'spear',
        'flail',
        'knife',
    ],
};

// Combat role types
export const COMBAT_ROLES = ['light', 'medium', 'heavy', 'utility', 'special'];

// Hero SFX types
export const HERO_SFX_TYPES = [
    'movement',
    'footstep',
    'hurt',
    'death',
    'jump',
    'land',
    'dodge',
    'interact',
];

// Species lists
export const ALL_DINOSAUR_SPECIES = [
    // Carnivores - Small/Fast
    'Velociraptor',
    'Utahraptor',
    'Deinonychus',
    'Compsognathus',
    'Dilophosaurus',
    'Oviraptor',
    'Gallimimus',
    'Troodon',
    'Microraptor',
    // Carnivores - Medium
    'Allosaurus',
    'Carnotaurus',
    'Ceratosaurus',
    'Baryonyx',
    'Suchomimus',
    // Carnivores - Large
    'Tyrannosaurus Rex',
    'Spinosaurus',
    'Giganotosaurus',
    'Carcharodontosaurus',
    'Acrocanthosaurus',
    // Carnivores - Unusual
    'Therizinosaurus',
    // Herbivores - Ceratopsians
    'Triceratops',
    'Styracosaurus',
    'Pachyrhinosaurus',
    'Centrosaurus',
    'Chasmosaurus',
    // Herbivores - Armored
    'Stegosaurus',
    'Ankylosaurus',
    'Kentrosaurus',
    'Polacanthus',
    // Herbivores - Sauropods
    'Brachiosaurus',
    'Diplodocus',
    'Argentinosaurus',
    'Brontosaurus',
    'Apatosaurus',
    // Herbivores - Hadrosaurs
    'Parasaurolophus',
    'Iguanodon',
    'Maiasaura',
    'Edmontosaurus',
    'Corythosaurus',
    // Herbivores - Dome-headed
    'Pachycephalosaurus',
    'Stygimoloch',
];

export const DINOSAUR_SPECIES = ALL_DINOSAUR_SPECIES;
export const SAURIAN_SPECIES = ALL_DINOSAUR_SPECIES;

export const HERBIVORE_SPECIES = [
    'Triceratops',
    'Styracosaurus',
    'Pachyrhinosaurus',
    'Centrosaurus',
    'Chasmosaurus',
    'Stegosaurus',
    'Ankylosaurus',
    'Kentrosaurus',
    'Polacanthus',
    'Brachiosaurus',
    'Diplodocus',
    'Argentinosaurus',
    'Brontosaurus',
    'Apatosaurus',
    'Camarasaurus',
    'Parasaurolophus',
    'Iguanodon',
    'Maiasaura',
    'Edmontosaurus',
    'Corythosaurus',
    'Lambeosaurus',
    'Pachycephalosaurus',
    'Stygimoloch',
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function isHeroCategory(categoryName: string): boolean {
    return categoryName === 'hero';
}
