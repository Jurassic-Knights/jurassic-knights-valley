/**
 * OutlinerPanel — UE5-inspired World Outliner for the Map Editor
 *
 * Features:
 * - Search / filter bar (real-time, debounced)
 * - Category tree groups with collapse/expand (persisted via localStorage)
 * - Per-item visibility (eye) and lock toggles (editor-only state)
 * - Multi-selection (Ctrl+Click, Shift+Click)
 * - Right-click context menu (Focus, Delete, Select All of Type)
 * - Item count per group
 */

import type { MapEditorCore } from '../../../src/tools/map-editor/MapEditorCore';
import type { MapObject } from '../../../src/tools/map-editor/MapEditorTypes';

// ── Types ──────────────────────────────────────────────────────────────

interface OutlinerItem {
    kind: 'town' | 'station' | 'object';
    /** Display label */
    label: string;
    /** Category group key */
    group: string;
    /** For objects: the MapObject ref. For towns: regionId. For stations: regionId + order. */
    ref: MapObject | { regionId: number } | { regionId: number; order: number };
    /** Unique key for selection tracking */
    key: string;
}

interface EditorItemState {
    visible: boolean;
    locked: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────

const COLLAPSE_STORAGE_KEY = 'outliner-collapsed-groups';
const SEARCH_DEBOUNCE_MS = 150;

const GROUP_CONFIG: Record<string, { icon: string; label: string; order: number }> = {
    towns: { icon: '🏘️', label: 'Towns', order: 0 },
    stations: { icon: '🚂', label: 'Stations', order: 1 },
    environment: { icon: '🌲', label: 'Environment', order: 2 },
    nodes: { icon: '⛏️', label: 'Nodes', order: 3 },
    enemies: { icon: '🦖', label: 'Enemies', order: 4 },
    npcs: { icon: '👤', label: 'NPCs', order: 5 },
    equipment: { icon: '⚔️', label: 'Equipment', order: 6 },
    items: { icon: '📦', label: 'Items', order: 7 },
    ground: { icon: '⛰️', label: 'Ground', order: 8 },
    other: { icon: '📁', label: 'Other', order: 9 },
};

// ── Module State ───────────────────────────────────────────────────────

let editorRef: MapEditorCore | null = null;
let refreshCallback: (() => void) | null = null;
let runPreviewCallback: (() => Promise<void>) | null = null;

const itemStates = new Map<string, EditorItemState>();
const selectedKeys = new Set<string>();
let lastClickedKey: string | null = null;
let searchQuery = '';
let searchTimer: ReturnType<typeof setTimeout> | null = null;
let collapsedGroups: Set<string>;

// Load collapsed groups from localStorage
function loadCollapsedGroups(): Set<string> {
    try {
        const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveCollapsedGroups(): void {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...collapsedGroups]));
}

collapsedGroups = loadCollapsedGroups();

// ── Helpers ────────────────────────────────────────────────────────────

function getItemState(key: string): EditorItemState {
    let s = itemStates.get(key);
    if (!s) {
        s = { visible: true, locked: false };
        itemStates.set(key, s);
    }
    return s;
}

function classifyObjectGroup(id: string): string {
    const prefixes: [string, string][] = [
        ['environment_', 'environment'],
        ['env_', 'environment'],
        ['node_', 'nodes'],
        ['enemy_', 'enemies'],
        ['boss_', 'enemies'],
        ['npc_', 'npcs'],
        ['weapon_', 'equipment'],
        ['tool_', 'equipment'],
        ['armor_', 'equipment'],
        ['item_', 'items'],
        ['ground_', 'ground'],
    ];
    for (const [prefix, group] of prefixes) {
        if (id.startsWith(prefix)) return group;
    }
    return 'other';
}

function cleanLabel(id: string): string {
    return id
        .replace(/_original$/, '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Build Items ────────────────────────────────────────────────────────

function buildItems(): OutlinerItem[] {
    if (!editorRef) return [];
    const items: OutlinerItem[] = [];

    // Towns
    const towns = editorRef.getManualTowns();
    towns.forEach((regionId, i) => {
        items.push({
            kind: 'town',
            label: `Town ${i + 1} (region ${regionId})`,
            group: 'towns',
            ref: { regionId },
            key: `town_${regionId}`,
        });
    });

    // Stations
    const stations = editorRef.getManualStations();
    const sorted = [...stations].sort((a, b) => a.order - b.order);
    sorted.forEach((s) => {
        items.push({
            kind: 'station',
            label: `Station #${s.order} (region ${s.regionId})`,
            group: 'stations',
            ref: { regionId: s.regionId, order: s.order },
            key: `station_${s.regionId}_${s.order}`,
        });
    });

    // Objects
    const cm = editorRef.getChunkManager();
    const objects = cm?.getAllObjects() ?? [];
    for (const obj of objects) {
        const group = classifyObjectGroup(obj.id);
        items.push({
            kind: 'object',
            label: cleanLabel(obj.id),
            group,
            ref: obj,
            key: `obj_${obj.id}_${Math.round(obj.x)}_${Math.round(obj.y)}`,
        });
    }

    return items;
}

// ── Context Menu ───────────────────────────────────────────────────────

function showContextMenu(x: number, y: number, item: OutlinerItem): void {
    hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'outliner-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.id = 'outliner-ctx-menu';

    const actions: { label: string; action: () => void }[] = [];

    if (item.kind === 'object') {
        const obj = item.ref as MapObject;
        actions.push({
            label: '📍 Focus',
            action: () => {
                editorRef?.setSelectedObject(obj);
                editorRef?.centerViewOn(obj.x, obj.y);
            },
        });
        actions.push({
            label: '🗑️ Delete',
            action: () => {
                editorRef?.setSelectedObject(obj);
                editorRef?.removeSelectedObject();
                runPreviewCallback?.().catch(() => { });
                refresh();
            },
        });
    } else if (item.kind === 'town') {
        const t = item.ref as { regionId: number };
        actions.push({
            label: '🗑️ Delete Town',
            action: () => {
                editorRef?.removeManualTown(t.regionId);
                runPreviewCallback?.().catch(() => { });
                refresh();
            },
        });
    } else if (item.kind === 'station') {
        const s = item.ref as { regionId: number };
        actions.push({
            label: '🗑️ Delete Station',
            action: () => {
                editorRef?.removeManualStation(s.regionId);
                runPreviewCallback?.().catch(() => { });
                refresh();
            },
        });
    }

    // Select all of type
    actions.push({
        label: `☑️ Select All ${GROUP_CONFIG[item.group]?.label ?? item.group}`,
        action: () => {
            const items = buildItems().filter((i) => i.group === item.group);
            selectedKeys.clear();
            items.forEach((i) => selectedKeys.add(i.key));
            refresh();
        },
    });

    for (const a of actions) {
        const btn = document.createElement('button');
        btn.className = 'outliner-ctx-item';
        btn.textContent = a.label;
        btn.addEventListener('click', () => {
            a.action();
            hideContextMenu();
        });
        menu.appendChild(btn);
    }

    document.body.appendChild(menu);

    // Close on outside click
    const closeHandler = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
            hideContextMenu();
            document.removeEventListener('click', closeHandler, true);
        }
    };
    setTimeout(() => document.addEventListener('click', closeHandler, true), 0);
}

function hideContextMenu(): void {
    document.getElementById('outliner-ctx-menu')?.remove();
}

// ── Render ──────────────────────────────────────────────────────────────

function refresh(): void {
    const container = document.getElementById('outliner-tree');
    if (!container || !editorRef) return;

    const items = buildItems();

    // Filter
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
        ? items.filter((i) => i.label.toLowerCase().includes(query) || i.key.toLowerCase().includes(query))
        : items;

    // Group
    const groups = new Map<string, OutlinerItem[]>();
    for (const item of filtered) {
        const list = groups.get(item.group) ?? [];
        list.push(item);
        groups.set(item.group, list);
    }

    // Sort groups by config order
    const sortedGroupKeys = [...groups.keys()].sort((a, b) => {
        return (GROUP_CONFIG[a]?.order ?? 99) - (GROUP_CONFIG[b]?.order ?? 99);
    });

    // Current selection in editor
    const editorSel = editorRef.getSelectedObject();

    container.innerHTML = '';

    if (sortedGroupKeys.length === 0) {
        container.innerHTML = '<div class="outliner-empty">No items match your search.</div>';
        return;
    }

    for (const groupKey of sortedGroupKeys) {
        const groupItems = groups.get(groupKey)!;
        const config = GROUP_CONFIG[groupKey] ?? { icon: '📁', label: groupKey, order: 99 };
        const isCollapsed = collapsedGroups.has(groupKey);

        // Group header
        const groupEl = document.createElement('div');
        groupEl.className = 'outliner-group';

        const header = document.createElement('div');
        header.className = 'outliner-group-header';
        header.innerHTML = `<span class="outliner-chevron ${isCollapsed ? 'collapsed' : ''}">${isCollapsed ? '▶' : '▼'}</span>
            <span class="outliner-group-icon">${config.icon}</span>
            <span class="outliner-group-label">${config.label}</span>
            <span class="outliner-group-count">(${groupItems.length})</span>`;
        header.addEventListener('click', () => {
            if (collapsedGroups.has(groupKey)) {
                collapsedGroups.delete(groupKey);
            } else {
                collapsedGroups.add(groupKey);
            }
            saveCollapsedGroups();
            refresh();
        });
        groupEl.appendChild(header);

        // Items (hidden if collapsed)
        if (!isCollapsed) {
            const listEl = document.createElement('div');
            listEl.className = 'outliner-group-items';

            for (const item of groupItems) {
                const state = getItemState(item.key);
                const isSelected = selectedKeys.has(item.key);
                const isEditorSelected = item.kind === 'object' && editorSel &&
                    (item.ref as MapObject).id === editorSel.id &&
                    Math.abs((item.ref as MapObject).x - editorSel.x) < 1 &&
                    Math.abs((item.ref as MapObject).y - editorSel.y) < 1;

                const row = document.createElement('div');
                row.className = 'outliner-item' +
                    (isSelected ? ' selected' : '') +
                    (isEditorSelected ? ' editor-selected' : '') +
                    (!state.visible ? ' hidden-item' : '') +
                    (state.locked ? ' locked-item' : '');
                row.dataset.key = item.key;

                // Visibility toggle
                const eyeBtn = document.createElement('button');
                eyeBtn.className = 'outliner-toggle outliner-eye';
                eyeBtn.textContent = state.visible ? '👁️' : '🚫';
                eyeBtn.title = state.visible ? 'Hide' : 'Show';
                eyeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.visible = !state.visible;
                    refresh();
                });

                // Icon
                const icon = document.createElement('span');
                icon.className = 'outliner-item-icon';
                icon.textContent = config.icon;

                // Label
                const label = document.createElement('span');
                label.className = 'outliner-item-label';
                label.textContent = item.label;

                // Coordinates (for objects)
                const coords = document.createElement('span');
                coords.className = 'outliner-item-coords';
                if (item.kind === 'object') {
                    const obj = item.ref as MapObject;
                    coords.textContent = `${Math.round(obj.x)}, ${Math.round(obj.y)}`;
                }

                // Lock toggle
                const lockBtn = document.createElement('button');
                lockBtn.className = 'outliner-toggle outliner-lock';
                lockBtn.textContent = state.locked ? '🔒' : '🔓';
                lockBtn.title = state.locked ? 'Unlock' : 'Lock';
                lockBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.locked = !state.locked;
                    refresh();
                });

                row.appendChild(eyeBtn);
                row.appendChild(icon);
                row.appendChild(label);
                row.appendChild(coords);
                row.appendChild(lockBtn);

                // Click: select
                row.addEventListener('click', (e) => {
                    handleItemClick(item, e);
                });

                // Right-click: context menu
                row.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    showContextMenu(e.clientX, e.clientY, item);
                });

                listEl.appendChild(row);
            }

            groupEl.appendChild(listEl);
        }

        container.appendChild(groupEl);
    }

    // Update selection count
    const countEl = document.getElementById('outliner-sel-count');
    if (countEl) {
        countEl.textContent = selectedKeys.size > 0 ? `${selectedKeys.size} selected` : '';
    }
}

// ── Selection Logic ────────────────────────────────────────────────────

function handleItemClick(item: OutlinerItem, e: MouseEvent): void {
    const allItems = buildItems();

    if (e.shiftKey && lastClickedKey) {
        // Range select
        const allKeys = allItems.map((i) => i.key);
        const start = allKeys.indexOf(lastClickedKey);
        const end = allKeys.indexOf(item.key);
        if (start >= 0 && end >= 0) {
            const [from, to] = start < end ? [start, end] : [end, start];
            if (!e.ctrlKey) selectedKeys.clear();
            for (let i = from; i <= to; i++) {
                selectedKeys.add(allKeys[i]);
            }
        }
    } else if (e.ctrlKey) {
        // Toggle
        if (selectedKeys.has(item.key)) {
            selectedKeys.delete(item.key);
        } else {
            selectedKeys.add(item.key);
        }
    } else {
        // Single select
        selectedKeys.clear();
        selectedKeys.add(item.key);
    }

    lastClickedKey = item.key;

    // Focus in editor
    if (item.kind === 'object') {
        const obj = item.ref as MapObject;
        editorRef?.setSelectedObject(obj);
        editorRef?.centerViewOn(obj.x, obj.y);
    }

    refresh();
}

// ── Toolbar Actions ────────────────────────────────────────────────────

function deleteSelected(): void {
    if (selectedKeys.size === 0 || !editorRef) return;
    const items = buildItems();

    for (const item of items) {
        if (!selectedKeys.has(item.key)) continue;

        if (item.kind === 'object') {
            editorRef.setSelectedObject(item.ref as MapObject);
            editorRef.removeSelectedObject();
        } else if (item.kind === 'town') {
            editorRef.removeManualTown((item.ref as { regionId: number }).regionId);
        } else if (item.kind === 'station') {
            editorRef.removeManualStation((item.ref as { regionId: number }).regionId);
        }
    }

    selectedKeys.clear();
    runPreviewCallback?.().catch(() => { });
    refresh();
}

function selectAll(): void {
    const items = buildItems();
    selectedKeys.clear();
    items.forEach((i) => selectedKeys.add(i.key));
    refresh();
}

function deselectAll(): void {
    selectedKeys.clear();
    refresh();
}

function expandAll(): void {
    collapsedGroups.clear();
    saveCollapsedGroups();
    refresh();
}

function collapseAll(): void {
    const items = buildItems();
    const groups = new Set(items.map((i) => i.group));
    collapsedGroups = groups;
    saveCollapsedGroups();
    refresh();
}

// ── Public API ─────────────────────────────────────────────────────────

export const OutlinerPanel = {
    /**
     * Initialize the outliner panel. Call once after the HTML container exists.
     */
    init(
        editor: MapEditorCore,
        onRefresh: () => void,
        onRunPreview: () => Promise<void>
    ): void {
        editorRef = editor;
        refreshCallback = onRefresh;
        runPreviewCallback = onRunPreview;

        // Search bar
        const searchInput = document.getElementById('outliner-search') as HTMLInputElement | null;
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                if (searchTimer) clearTimeout(searchTimer);
                searchTimer = setTimeout(() => {
                    searchQuery = searchInput.value;
                    refresh();
                }, SEARCH_DEBOUNCE_MS);
            });
        }

        // Toolbar buttons
        document.getElementById('outliner-btn-delete')?.addEventListener('click', deleteSelected);
        document.getElementById('outliner-btn-select-all')?.addEventListener('click', selectAll);
        document.getElementById('outliner-btn-deselect')?.addEventListener('click', deselectAll);
        document.getElementById('outliner-btn-expand')?.addEventListener('click', expandAll);
        document.getElementById('outliner-btn-collapse')?.addEventListener('click', collapseAll);
    },

    /**
     * Re-render the outliner tree. Call whenever editor data changes.
     */
    refresh,

    /**
     * Check if an object is hidden by the outliner visibility toggle.
     */
    isHidden(obj: MapObject): boolean {
        const key = `obj_${obj.id}_${Math.round(obj.x)}_${Math.round(obj.y)}`;
        return !getItemState(key).visible;
    },

    /**
     * Check if an object is locked by the outliner lock toggle.
     */
    isLocked(obj: MapObject): boolean {
        const key = `obj_${obj.id}_${Math.round(obj.x)}_${Math.round(obj.y)}`;
        return getItemState(key).locked;
    },
};
