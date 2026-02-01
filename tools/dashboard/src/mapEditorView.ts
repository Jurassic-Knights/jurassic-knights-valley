import { MapEditorCore } from '../../../src/tools/map-editor/MapEditorCore';
import { Logger } from '@core/Logger';
import { ZoneConfig, ZoneCategories } from '../../../src/data/ZoneConfig';

let editorInstance: MapEditorCore | null = null;

export async function showMapEditorView(pushState = true): Promise<void> {
    const mainContent = document.getElementById('mainContent');
    const container = document.getElementById('map-editor-container');
    const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
    const stats = document.querySelector('.stats') as HTMLElement;

    if (mainContent) mainContent.style.display = 'none';
    if (stickyBar) stickyBar.style.display = 'none';
    if (stats) stats.style.display = 'none';
    if (container) container.style.display = 'block';

    if (pushState) {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'map');
        // Clear category param to avoid confusion
        url.searchParams.delete('category');
        window.history.pushState({ view: 'map' }, '', url.toString());
        // Update global state tracking
        window.currentViewCategory = '';
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-action') === 'toggle-map-editor') {
            btn.classList.add('active');
        }
    });

    if (!editorInstance) {
        editorInstance = new MapEditorCore();
        // Inject Dashboard API fetcher
        await editorInstance.mount('map-editor-canvas', async (cat) => {
            const { fetchCategory } = await import('./api');
            return fetchCategory(cat);
        });
        // Setup Save Handler done via ActionDelegator now

        // --- UI BINDINGS ---
        // Mode Toggle
        const btnObj = document.getElementById('mode-object');
        const btnZone = document.getElementById('mode-zone');
        const zoneControls = document.getElementById('zone-controls');

        const updateModeUI = (mode: 'object' | 'zone') => {
            if (mode === 'object') {
                btnObj?.style.setProperty('background', '#444');
                btnObj?.style.setProperty('color', 'white');
                btnZone?.style.setProperty('background', '#2d2d2d');
                btnZone?.style.setProperty('color', '#888');
                if (zoneControls) zoneControls.style.display = 'none';
            } else {
                btnZone?.style.setProperty('background', '#444');
                btnZone?.style.setProperty('color', 'white');
                btnObj?.style.setProperty('background', '#2d2d2d');
                btnObj?.style.setProperty('color', '#888');
                if (zoneControls) zoneControls.style.display = 'block';
            }

            // Call API
            const api = (window as any).MapEditorAPI;
            if (api) api.setMode(mode);
        };

        btnObj?.addEventListener('click', () => updateModeUI('object'));
        btnZone?.addEventListener('click', () => updateModeUI('zone'));

        // Brush Size
        const brushInput = document.getElementById('editor-brush-size') as HTMLInputElement;
        const brushVal = document.getElementById('editor-brush-val');
        brushInput?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value);
            if (brushVal) brushVal.innerText = val.toString();
            const api = (window as any).MapEditorAPI;
            if (api) api.setBrushSize(val);
        });

        // Grid Opacity
        const gridInput = document.getElementById('editor-grid-opacity') as HTMLInputElement;
        const gridVal = document.getElementById('editor-grid-val');
        gridInput?.addEventListener('input', (e) => {
            const val = parseInt((e.target as HTMLInputElement).value);
            if (gridVal) gridVal.innerText = `${val}%`;
            const api = (window as any).MapEditorAPI;
            if (api && api.setGridOpacity) api.setGridOpacity(val / 100);
        });

        // Zone Category Dropdown
        const catSelect = document.getElementById('zone-category-select') as HTMLSelectElement;
        if (catSelect) {
            // Populate
            ZoneCategories.forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat;
                opt.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);
                catSelect.appendChild(opt);
            });

            catSelect.addEventListener('change', (e) => {
                const val = (e.target as HTMLSelectElement).value;
                const api = (window as any).MapEditorAPI;
                if (api) api.setZoneCategory(val);
            });
        }

        // Zone Visibility Filters (Nested Tree)
        const filterContainer = document.getElementById('zone-visibility-filters');
        if (filterContainer) {
            filterContainer.innerHTML = ''; // Clear existing

            // 1. Group Zones by Category
            const zonesByCategory: Record<string, any[]> = {};
            Object.values(ZoneConfig).forEach(z => {
                if (!zonesByCategory[z.category]) zonesByCategory[z.category] = [];
                zonesByCategory[z.category].push(z);
            });

            // 2. Build UI Tree
            Object.entries(zonesByCategory).forEach(([cat, zones]) => {
                // Category Header Container
                const groupDiv = document.createElement('div');
                groupDiv.style.marginBottom = '8px';

                // Helper to create styled checkboxes
                const createCheckbox = (id: string, label: string, isGroup: boolean, onChange: (checked: boolean) => void) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.gap = '8px';
                    row.style.padding = '2px 0';
                    if (!isGroup) row.style.paddingLeft = '12px'; // Indent children

                    const cb = document.createElement('input');
                    cb.type = 'checkbox';
                    cb.id = `filter-${id}`;
                    cb.checked = true; // Default visible
                    cb.style.cursor = 'pointer';
                    // Style tweak for custom look if possible, otherwise standard
                    cb.style.accentColor = '#66fcf1'; // Match theme accent

                    const lbl = document.createElement('label');
                    lbl.htmlFor = `filter-${id}`;
                    lbl.innerText = label;
                    lbl.style.fontSize = isGroup ? '12px' : '11px';
                    lbl.style.fontWeight = isGroup ? '700' : '400';
                    lbl.style.color = isGroup ? '#fff' : '#ccc';
                    lbl.style.cursor = 'pointer';
                    lbl.style.textTransform = isGroup ? 'uppercase' : 'none';
                    lbl.style.fontFamily = isGroup ? 'Chakra Petch' : 'Inter';

                    cb.addEventListener('change', (e) => onChange((e.target as HTMLInputElement).checked));

                    row.appendChild(cb);
                    row.appendChild(lbl);
                    return { row, cb };
                };

                // Create Parent (Category) Toggle
                const { row: groupRow, cb: groupCb } = createCheckbox(`cat-${cat}`, cat, true, (checked) => {
                    // Toggle All Children Visuals
                    zones.forEach(z => {
                        const childCb = document.getElementById(`filter-zone-${z.id}`) as HTMLInputElement;
                        if (childCb) childCb.checked = checked;
                    });

                    // Call API to toggle whole category
                    const api = (window as any).MapEditorAPI;
                    if (api && api.toggleCategoryVisibility) api.toggleCategoryVisibility(cat, checked);
                });

                groupDiv.appendChild(groupRow);

                // Create Children (Zone IDs)
                zones.forEach(z => {
                    const { row: childRow } = createCheckbox(`zone-${z.id}`, z.name, false, (checked) => {
                        const api = (window as any).MapEditorAPI;
                        if (api && api.toggleZoneVisibility) api.toggleZoneVisibility(z.id, checked);

                        // If unchecking child, maybe visually uncheck parent? (Optional polish)
                    });
                    groupDiv.appendChild(childRow);
                });

                filterContainer.appendChild(groupDiv);
            });
        }
    }
}

export function hideMapEditorView(): void {
    const mainContent = document.getElementById('mainContent');
    const container = document.getElementById('map-editor-container');
    const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
    const stats = document.querySelector('.stats') as HTMLElement;

    if (container) container.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block'; // Or flex/grid? Check CSS. Workbench uses flex.
    // If we just remove display:none, it reverts to CSS default
    if (mainContent) mainContent.style.removeProperty('display');

    if (stickyBar) stickyBar.style.removeProperty('display');
    if (stats) stats.style.removeProperty('display');

    // Remove active highlight from sidebar
    document.querySelectorAll('.nav-item[data-action="toggle-map-editor"]').forEach(btn => {
        btn.classList.remove('active');
    });
}

export async function saveMapData(): Promise<void> {
    if (!editorInstance) {
        console.warn('Map Editor not initialized');
        return;
    }

    Logger.info('Saving map...');
    // In the future this will call editorInstance.serialize()
    // For now just test the API
    const testData: { tiles: unknown[]; name: string; version?: number; chunks?: unknown[] } = {
        tiles: [],
        name: 'test_map',
        // In real usage: ...editorInstance.serialize()
    };

    try {
        const res = await fetch('/api/save_map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: 'world_map_v1', mapData: testData })
        });
        const result = await res.json();
        if (result.success) {
            alert('Map saved successfully!');
        } else {
            alert('Save failed: ' + result.error);
        }
    } catch (e) {
        console.error(e);
        alert('Save error');
    }
}
