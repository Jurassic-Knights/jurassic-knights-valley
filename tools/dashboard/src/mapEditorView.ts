import { MapEditorCore } from '../../../src/tools/map-editor/MapEditorCore';
import { Logger } from '@core/Logger';
import { ZoneConfig, ZoneCategories } from '../../../src/data/ZoneConfig';
import { AssetPaletteView } from './AssetPaletteView';

/** Mapgen4 param shape (loaded only when user generates). */
interface ProcParam {
    spacing: number;
    mountainSpacing: number;
    meshSeed: number;
    elevation: Record<string, number>;
    biomes: Record<string, number>;
    rivers: Record<string, number>;
}

let editorInstance: MapEditorCore | null = null;
let paletteInstance: AssetPaletteView | null = null;
let currentLoadedMap: string | null = null;
let lastGeneratedPayload: { version: number; chunks: unknown[] } | null = null;

export async function showMapEditorView(pushState = true): Promise<void> {
    const mainContent = document.getElementById('mainContent');
    const container = document.getElementById('map-editor-container');
    const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
    const stats = document.querySelector('.stats') as HTMLElement;

    if (mainContent) mainContent.style.display = 'none';
    if (stickyBar) stickyBar.style.display = 'none';
    if (stats) stats.style.display = 'none';
    if (container) container.style.display = 'flex';

    if (pushState) {
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'map');
        url.searchParams.delete('category');
        window.history.pushState({ view: 'map' }, '', url.toString());
        window.currentViewCategory = '';
    }

    document.querySelectorAll('.nav-item').forEach((btn) => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-action') === 'toggle-map-editor') {
            btn.classList.add('active');
        }
    });

    if (!editorInstance) {
        editorInstance = new MapEditorCore();
        await editorInstance.mount('map-editor-canvas', async (cat) => {
            const { fetchCategory } = await import('./api');
            return fetchCategory(cat);
        });

        paletteInstance = new AssetPaletteView('palette-content', (id, cat) => {
            if (editorInstance) editorInstance.selectAsset(id, cat);
        });

        initMapPanel();
        initModeAndTools();
        initProceduralPreviewClickAndViewport();
    } else {
        refreshMapList();
    }
}

/** Procedural preview uses mapgen4 space 0..1000; editor world is 0..160000 px. */
const PREVIEW_TO_WORLD = 160000 / 1000;

function drawViewportRectOnProceduralOverlay(): void {
    const overlay = document.getElementById('proc-preview-overlay') as HTMLCanvasElement;
    const wrap = document.getElementById('proc-preview-wrap');
    if (!overlay || !wrap || !editorInstance) return;
    const container = document.getElementById('map-editor-container');
    if (!container || container.style.display !== 'none') {
        wrap?.classList.add('has-viewport');
    } else {
        wrap?.classList.remove('has-viewport');
        return;
    }
    const viewport = editorInstance.getViewportWorldRect();
    if (!viewport) return;
    const w = overlay.width;
    const h = overlay.height;
    const scale = Math.min(w, h) / 1000;
    const offX = (w - 1000 * scale) / 2;
    const offY = (h - 1000 * scale) / 2;
    const x = offX + (viewport.x / PREVIEW_TO_WORLD) * scale;
    const y = offY + (viewport.y / PREVIEW_TO_WORLD) * scale;
    const rw = (viewport.width / PREVIEW_TO_WORLD) * scale;
    const rh = (viewport.height / PREVIEW_TO_WORLD) * scale;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, rw, rh);
}

function initProceduralPreviewClickAndViewport(): void {
    const wrap = document.getElementById('proc-preview-wrap');
    const overlay = document.getElementById('proc-preview-overlay') as HTMLCanvasElement;
    const previewCanvas = document.getElementById('proc-preview-canvas') as HTMLCanvasElement;
    if (!wrap || !overlay || !previewCanvas) return;

    wrap.addEventListener('click', (e: MouseEvent) => {
        if (!editorInstance || (e.target !== overlay && e.target !== previewCanvas)) return;
        const rect = wrap.getBoundingClientRect();
        const can = overlay;
        const mx = ((e.clientX - rect.left) / rect.width) * can.width;
        const my = ((e.clientY - rect.top) / rect.height) * can.height;
        const w = can.width;
        const h = can.height;
        const scale = Math.min(w, h) / 1000;
        const offX = (w - 1000 * scale) / 2;
        const offY = (h - 1000 * scale) / 2;
        const previewX = (mx - offX) / scale;
        const previewY = (my - offY) / scale;
        const worldX = previewX * PREVIEW_TO_WORLD;
        const worldY = previewY * PREVIEW_TO_WORLD;
        editorInstance.centerViewOn(worldX, worldY);
    });

    setInterval(() => {
        const proceduralBody = document.getElementById('procedural-panel-body');
        const container = document.getElementById('map-editor-container');
        if (container?.style.display !== 'none' && proceduralBody?.style.display !== 'none') {
            drawViewportRectOnProceduralOverlay();
        }
    }, 100);
}

function initMapPanel(): void {
    const toggleBtn = document.getElementById('maps-panel-toggle');
    const panel = document.getElementById('maps-panel');
    toggleBtn?.addEventListener('click', () => {
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', String(!expanded));
        panel?.classList.toggle('collapsed', expanded);
    });

    const filenameInput = document.getElementById('map-save-filename') as HTMLInputElement;
    filenameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveMapFromPanel();
    });

    initPanelTabs();
    initProceduralPanel();
    updateLoadedDisplay();
    refreshMapList();
}

function initPanelTabs(): void {
    const tabMaps = document.getElementById('tab-maps');
    const tabProcedural = document.getElementById('tab-procedural');
    const bodyMaps = document.getElementById('maps-panel-body');
    const bodyProcedural = document.getElementById('procedural-panel-body');
    const panelTitle = document.getElementById('maps-panel-title');
    const switchTo = (tab: 'maps' | 'procedural') => {
        tabMaps?.classList.toggle('active', tab === 'maps');
        tabProcedural?.classList.toggle('active', tab === 'procedural');
        if (bodyMaps) bodyMaps.style.display = tab === 'maps' ? '' : 'none';
        if (bodyProcedural) bodyProcedural.style.display = tab === 'procedural' ? '' : 'none';
        if (panelTitle) panelTitle.textContent = tab === 'maps' ? 'Maps' : 'Procedural';
        if (tab === 'procedural') {
            runPreviewCanvas();
            scheduleLivePreview();
        }
    };
    tabMaps?.addEventListener('click', () => switchTo('maps'));
    tabProcedural?.addEventListener('click', () => switchTo('procedural'));
}

function setProcStatus(message: string, isError = false): void {
    const el = document.getElementById('proc-status');
    if (el) {
        el.textContent = message;
        el.style.color = isError ? '#e74c3c' : '#888';
    }
}

function updateLoadEditorButtonState(): void {
    const btn = document.getElementById('proc-load-editor-btn') as HTMLButtonElement;
    if (btn) btn.disabled = !lastGeneratedPayload;
}

const LIVE_PREVIEW_DEBOUNCE_MS = 120;
let livePreviewTimeoutId: ReturnType<typeof setTimeout> | null = null;

function scheduleLivePreview(): void {
    const cb = document.getElementById('proc-live-preview') as HTMLInputElement;
    if (!cb?.checked) return;
    if (livePreviewTimeoutId != null) clearTimeout(livePreviewTimeoutId);
    livePreviewTimeoutId = setTimeout(() => {
        livePreviewTimeoutId = null;
        runPreviewCanvas();
    }, LIVE_PREVIEW_DEBOUNCE_MS);
}

async function runPreviewCanvas(): Promise<void> {
    const canvas = document.getElementById('proc-preview-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    try {
        const param = getProcParam();
        const { runAndDrawPreview } =
            await import('../../../src/tools/map-editor/Mapgen4Generator');
        runAndDrawPreview(
            canvas,
            param as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param
        );
    } catch (e) {
        Logger.error('Mapgen4 preview error:', e);
    }
}

function bindSlider(id: string, valueId: string, parse: (s: string) => number): number {
    const input = document.getElementById(id) as HTMLInputElement;
    const valueEl = document.getElementById(valueId);
    if (!input) return 0;
    const update = () => {
        if (valueEl) valueEl.textContent = input.value;
        scheduleLivePreview();
    };
    input.addEventListener('input', update);
    update();
    return parse(input.value);
}

function bindNumberInput(id: string): void {
    const input = document.getElementById(id) as HTMLInputElement;
    if (!input) return;
    input.addEventListener('input', scheduleLivePreview);
    input.addEventListener('change', scheduleLivePreview);
}

function getProcParam(): ProcParam {
    const num = (id: string) =>
        parseFloat((document.getElementById(id) as HTMLInputElement)?.value ?? '0') || 0;
    const int = (id: string) =>
        parseInt((document.getElementById(id) as HTMLInputElement)?.value ?? '0', 10) || 0;
    return {
        spacing: num('proc-spacing') || 5.5,
        mountainSpacing: num('proc-mountain-spacing') || 35,
        meshSeed: int('proc-mesh-seed') || 12345,
        elevation: {
            seed: int('proc-elev-seed') || 187,
            island: num('proc-island'),
            noisy_coastlines: num('proc-noisy-coastlines'),
            hill_height: num('proc-hill-height'),
            mountain_jagged: num('proc-mountain-jagged'),
            mountain_sharpness: num('proc-mountain-sharpness'),
            mountain_folds: num('proc-mountain-folds'),
            ocean_depth: num('proc-ocean-depth')
        },
        biomes: {
            wind_angle_deg: num('proc-wind-angle'),
            raininess: num('proc-raininess'),
            rain_shadow: num('proc-rain-shadow'),
            evaporation: num('proc-evaporation')
        },
        rivers: {
            lg_min_flow: num('proc-lg-min-flow'),
            lg_river_width: num('proc-lg-river-width'),
            flow: num('proc-flow')
        }
    };
}

function initProceduralPanel(): void {
    bindSlider('proc-spacing', 'proc-spacing-val', parseFloat);
    bindSlider('proc-mountain-spacing', 'proc-mountain-spacing-val', parseFloat);
    bindNumberInput('proc-mesh-seed');
    bindSlider('proc-island', 'proc-island-val', parseFloat);
    bindSlider('proc-noisy-coastlines', 'proc-noisy-coastlines-val', parseFloat);
    bindSlider('proc-hill-height', 'proc-hill-height-val', parseFloat);
    bindSlider('proc-mountain-jagged', 'proc-mountain-jagged-val', parseFloat);
    bindSlider('proc-mountain-sharpness', 'proc-mountain-sharpness-val', parseFloat);
    bindSlider('proc-mountain-folds', 'proc-mountain-folds-val', parseFloat);
    bindSlider('proc-ocean-depth', 'proc-ocean-depth-val', parseFloat);
    bindSlider('proc-wind-angle', 'proc-wind-angle-val', parseFloat);
    bindSlider('proc-raininess', 'proc-raininess-val', parseFloat);
    bindSlider('proc-rain-shadow', 'proc-rain-shadow-val', parseFloat);
    bindSlider('proc-evaporation', 'proc-evaporation-val', parseFloat);
    bindSlider('proc-lg-min-flow', 'proc-lg-min-flow-val', parseFloat);
    bindSlider('proc-lg-river-width', 'proc-lg-river-width-val', parseFloat);
    bindSlider('proc-flow', 'proc-flow-val', parseFloat);
    bindNumberInput('proc-elev-seed');

    document.getElementById('proc-apply-btn')?.addEventListener('click', () => runGenerateWorld());
    document
        .getElementById('proc-load-editor-btn')
        ?.addEventListener('click', () => loadProceduralIntoEditor());
    updateLoadEditorButtonState();
}

async function runGenerateWorld(): Promise<void> {
    setProcStatus('Generating...');
    try {
        const param = getProcParam();
        const { generateMapgen4, toSerializedPayload } =
            await import('../../../src/tools/map-editor/Mapgen4Generator');
        const worldData = generateMapgen4(param);
        lastGeneratedPayload = toSerializedPayload(worldData);
        if (editorInstance) {
            editorInstance.loadData(lastGeneratedPayload);
            currentLoadedMap = null;
            updateLoadedDisplay();
        }
        setProcStatus('World loaded in main view. Use Maps tab to save.');
        updateLoadEditorButtonState();
    } catch (e) {
        Logger.error('Mapgen4 generate error:', e);
        setProcStatus('Generation failed: ' + (e instanceof Error ? e.message : String(e)), true);
        lastGeneratedPayload = null;
        updateLoadEditorButtonState();
    }
}

function loadProceduralIntoEditor(): void {
    if (!editorInstance || !lastGeneratedPayload) {
        setProcStatus('Nothing to load', true);
        return;
    }
    editorInstance.loadData(lastGeneratedPayload);
    currentLoadedMap = null;
    updateLoadedDisplay();
    setProcStatus('Loaded into editor. Use Maps tab to save.');
    setMapStatus('');
}

function setMapStatus(message: string, isError = false): void {
    const el = document.getElementById('map-status');
    if (el) {
        el.textContent = message;
        el.style.color = isError ? '#e74c3c' : '#888';
        if (message) {
            setTimeout(() => {
                el.textContent = '';
            }, 4000);
        }
    }
}

function updateLoadedDisplay(): void {
    const el = document.getElementById('map-loaded-display');
    const input = document.getElementById('map-save-filename') as HTMLInputElement;
    if (el && input) {
        if (currentLoadedMap) {
            el.textContent = `Loaded: ${currentLoadedMap}`;
            el.style.color = '#66fcf1';
            input.value = currentLoadedMap;
            input.placeholder = 'Edit to save as new map';
        } else {
            el.textContent = 'No map loaded';
            el.style.color = '#666';
            input.value = '';
            input.placeholder = 'Map name (e.g. world_v1)';
        }
    }
}

export async function saveMapFromPanel(): Promise<void> {
    if (!editorInstance) {
        setMapStatus('Editor not ready', true);
        return;
    }

    const input = document.getElementById('map-save-filename') as HTMLInputElement;
    const typed = input?.value?.trim() ?? '';
    // If empty and we have a loaded map, overwrite it. Otherwise use typed name (or require one).
    const filename = typed || currentLoadedMap;
    if (!filename) {
        setMapStatus('Enter a map name', true);
        return;
    }

    const mapData = editorInstance.serialize();
    if (!mapData) {
        setMapStatus('Failed to serialize', true);
        return;
    }

    setMapStatus('Saving...');
    try {
        const res = await fetch('/api/save_map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, mapData })
        });
        const result = await res.json();
        if (result.success) {
            currentLoadedMap = filename;
            updateLoadedDisplay();
            setMapStatus('Saved as ' + filename);
            refreshMapList();
        } else {
            setMapStatus('Save failed: ' + (result.error || 'Unknown error'), true);
        }
    } catch (e) {
        Logger.error('Save map error:', e);
        setMapStatus('Save error', true);
    }
}

export async function refreshMapList(): Promise<void> {
    const listEl = document.getElementById('map-list');
    if (!listEl) return;

    try {
        const res = await fetch('/api/list_maps');
        const result = await res.json();
        const maps: string[] = result.maps || [];
        listEl.innerHTML = '';

        if (maps.length === 0) {
            listEl.innerHTML =
                '<div style="color:#666; padding:8px; font-size:11px;">No saved maps</div>';
        } else {
            maps.forEach((name) => {
                const row = document.createElement('div');
                row.style.cssText =
                    'display:flex; align-items:center; gap:6px; padding:6px 8px; background:#252525; border-radius:4px; margin-bottom:4px;';
                const label = document.createElement('button');
                label.type = 'button';
                label.textContent = name;
                label.style.cssText =
                    'flex:1; text-align:left; background:none; border:none; color:#66fcf1; cursor:pointer; font-size:12px; padding:0;';
                label.title = 'Load';
                label.addEventListener('click', () => loadMapByName(name));
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.textContent = '🗑';
                delBtn.title = 'Delete';
                delBtn.style.cssText =
                    'background:#5a2525; color:#fff; border:none; border-radius:4px; cursor:pointer; padding:4px 8px; font-size:11px;';
                delBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteMapByName(name);
                });
                row.appendChild(label);
                row.appendChild(delBtn);
                listEl.appendChild(row);
            });
        }
    } catch (e) {
        Logger.error('Failed to list maps:', e);
        listEl.innerHTML =
            '<div style="color:#e74c3c; padding:8px; font-size:11px;">Failed to load list</div>';
    }
}

async function loadMapByName(filename: string): Promise<void> {
    if (!editorInstance) return;

    setMapStatus('Loading...');
    try {
        const res = await fetch(`/api/load_map?filename=${encodeURIComponent(filename)}`);
        const result = await res.json();
        if (result.success && result.data) {
            editorInstance.loadData(result.data as { version?: number; chunks?: unknown[] });
            currentLoadedMap = filename;
            updateLoadedDisplay();
            setMapStatus('Loaded: ' + filename);
            Logger.info(`Map loaded: ${filename}`);
        } else {
            setMapStatus('Load failed: ' + (result.error || 'Unknown error'), true);
        }
    } catch (e) {
        Logger.error('Load map error:', e);
        setMapStatus('Load error', true);
    }
}

async function deleteMapByName(filename: string): Promise<void> {
    try {
        const res = await fetch('/api/delete_map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename })
        });
        const result = await res.json();
        if (result.success) {
            if (currentLoadedMap === filename) {
                currentLoadedMap = null;
                updateLoadedDisplay();
            }
            setMapStatus('Deleted: ' + filename);
            refreshMapList();
        } else {
            setMapStatus('Delete failed: ' + (result.error || 'Unknown error'), true);
        }
    } catch (e) {
        Logger.error('Delete map error:', e);
        setMapStatus('Delete error', true);
    }
}

function initModeAndTools(): void {
    const btnObj = document.getElementById('mode-object');
    const btnGround = document.getElementById('mode-ground');
    const btnZone = document.getElementById('mode-zone');
    const zoneControls = document.getElementById('zone-controls');

    const updateModeUI = (mode: 'object' | 'zone' | 'ground') => {
        const resetBtn = (btn: HTMLElement | null) => {
            if (btn) {
                btn.style.setProperty('background', '#2d2d2d');
                btn.style.setProperty('color', '#888');
            }
        };
        const activeBtn = (btn: HTMLElement | null) => {
            if (btn) {
                btn.style.setProperty('background', '#444');
                btn.style.setProperty('color', 'white');
            }
        };

        resetBtn(btnObj);
        resetBtn(btnGround);
        resetBtn(btnZone);

        if (mode === 'object') activeBtn(btnObj);
        else if (mode === 'ground') activeBtn(btnGround);
        else if (mode === 'zone') activeBtn(btnZone);

        if (zoneControls) {
            zoneControls.style.display = mode === 'zone' ? 'block' : 'none';
        }

        if (editorInstance) editorInstance.setMode(mode);
        if (paletteInstance) paletteInstance.setMode(mode);
    };

    btnObj?.addEventListener('click', () => updateModeUI('object'));
    btnGround?.addEventListener('click', () => updateModeUI('ground'));
    btnZone?.addEventListener('click', () => updateModeUI('zone'));

    const brushInput = document.getElementById('editor-brush-size') as HTMLInputElement;
    const brushVal = document.getElementById('editor-brush-val');
    brushInput?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        if (brushVal) brushVal.innerText = val.toString();
        if (editorInstance) editorInstance.setBrushSize(val);
    });

    const gridInput = document.getElementById('editor-grid-opacity') as HTMLInputElement;
    const gridVal = document.getElementById('editor-grid-val');
    gridInput?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        if (gridVal) gridVal.innerText = `${val}%`;
        if (editorInstance) editorInstance.setGridOpacity(val / 100);
    });

    const catSelect = document.getElementById('zone-category-select') as HTMLSelectElement;
    if (catSelect) {
        ZoneCategories.forEach((cat) => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat.charAt(0).toUpperCase() + cat.slice(1);
            catSelect.appendChild(opt);
        });

        catSelect.addEventListener('change', (e) => {
            const val = (e.target as HTMLSelectElement).value;
            if (editorInstance) editorInstance.setZoneCategory(val as string);
            if (paletteInstance) paletteInstance.setCategory(val);
        });
    }

    const filterContainer = document.getElementById('zone-visibility-filters');
    if (filterContainer) {
        filterContainer.innerHTML = '';

        const zonesByCategory: Record<string, unknown[]> = {};
        Object.values(ZoneConfig).forEach((z) => {
            if (!zonesByCategory[z.category]) zonesByCategory[z.category] = [];
            zonesByCategory[z.category].push(z);
        });

        Object.entries(zonesByCategory).forEach(([cat, zones]) => {
            const groupDiv = document.createElement('div');
            groupDiv.style.marginBottom = '8px';

            const createCheckbox = (
                id: string,
                label: string,
                isGroup: boolean,
                onChange: (checked: boolean) => void
            ) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '8px';
                row.style.padding = '2px 0';
                if (!isGroup) row.style.paddingLeft = '12px';

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.id = `filter-${id}`;
                cb.checked = true;
                cb.style.cursor = 'pointer';
                cb.style.accentColor = '#66fcf1';

                const lbl = document.createElement('label');
                lbl.htmlFor = `filter-${id}`;
                lbl.innerText = label;
                lbl.style.fontSize = isGroup ? '12px' : '11px';
                lbl.style.fontWeight = isGroup ? '700' : '400';
                lbl.style.color = isGroup ? '#fff' : '#ccc';
                lbl.style.cursor = 'pointer';
                lbl.style.textTransform = isGroup ? 'uppercase' : 'none';
                lbl.style.fontFamily = isGroup ? 'Chakra Petch' : 'Inter';

                cb.addEventListener('change', (e) =>
                    onChange((e.target as HTMLInputElement).checked)
                );

                row.appendChild(cb);
                row.appendChild(lbl);
                return { row, cb };
            };

            const { row: groupRow } = createCheckbox(`cat-${cat}`, cat, true, (checked) => {
                zones.forEach((z) => {
                    const childCb = document.getElementById(
                        `filter-zone-${z.id}`
                    ) as HTMLInputElement;
                    if (childCb) childCb.checked = checked;
                });
                if (editorInstance) editorInstance.toggleCategoryVisibility(cat as string, checked);
            });

            groupDiv.appendChild(groupRow);

            zones.forEach((z) => {
                const { row: childRow } = createCheckbox(
                    `zone-${z.id}`,
                    z.name,
                    false,
                    (checked) => {
                        if (editorInstance) editorInstance.toggleZoneVisibility(z.id, checked);
                    }
                );
                groupDiv.appendChild(childRow);
            });

            filterContainer.appendChild(groupDiv);
        });
    }
}

export function hideMapEditorView(): void {
    const mainContent = document.getElementById('mainContent');
    const container = document.getElementById('map-editor-container');
    const stickyBar = document.querySelector('.sticky-bar') as HTMLElement;
    const stats = document.querySelector('.stats') as HTMLElement;

    if (container) container.style.display = 'none';
    if (mainContent) mainContent.style.removeProperty('display');
    if (stickyBar) stickyBar.style.removeProperty('display');
    if (stats) stats.style.removeProperty('display');

    document.querySelectorAll('.nav-item[data-action="toggle-map-editor"]').forEach((btn) => {
        btn.classList.remove('active');
    });
}
