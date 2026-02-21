import { MapEditorCore } from '../../../src/tools/map-editor/MapEditorCore';
import { Logger } from '@core/Logger';
import { ZoneConfig, ZoneCategories } from '../../../src/data/ZoneConfig';
import { AssetPaletteView } from './AssetPaletteView';
import { initResizeHandle } from './ResizePanels';
import { loadDefaultMap, saveDefaultMap } from './MapStorage';
import type { MapEditorDataPayload } from '../../../src/tools/map-editor/MapEditorTypes';

/** Mapgen4 param shape (loaded only when user generates). */
interface ProcParam {
    spacing: number;
    mountainSpacing: number;
    meshSeed: number;
    elevation: Record<string, number>;
    biomes: Record<string, number>;
    rivers: Record<string, number>;
    towns?: { enabled: boolean; numTowns: number; minSpacing: number; townRadius: number; defaultZoneId: string; elevationMin: number; elevationMax: number; rainfallMin: number; rainfallMax: number; seed?: number };
    roads?: { enabled: boolean; baseWidth: number; shortcutsPerTown: number; riverCrossingCost: number; coverageGridSize?: number; slopeWeight?: number; waypointCurviness?: number; seed?: number };
    railroads?: { enabled: boolean };
}

const DEFAULT_MAP_FILENAME = 'default';
const MAP_STORAGE_KEY = 'map-editor-default-map';

let editorInstance: MapEditorCore | null = null;
let paletteInstance: AssetPaletteView | null = null;
let currentLoadedMap: string | null = null;
/** Last mapgen4 param from a successful load; used when procCache is null so save does not use form defaults. */
let lastLoadedMapgen4Param: ProcParam | null = null;

let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DEBOUNCE_MS = 800;

const AUTO_SAVE_STORAGE_KEY = 'map-editor-auto-save';

function getAutoSaveEnabled(): boolean {
    return localStorage.getItem(AUTO_SAVE_STORAGE_KEY) === 'true';
}

function setAutoSaveEnabled(enabled: boolean): void {
    localStorage.setItem(AUTO_SAVE_STORAGE_KEY, String(enabled));
}

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
        const loadingOverlay = document.getElementById('map-editor-loading-overlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        try {
            // Wait for layout so map-editor-canvas has non-zero dimensions before mount
            await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

            editorInstance = new MapEditorCore();
            await editorInstance.mount('map-editor-canvas', async (cat) => {
                const { fetchCategory } = await import('./api');
                return fetchCategory(cat) as any;
            });

            paletteInstance = new AssetPaletteView('palette-content', (id, cat) => {
                if (editorInstance) editorInstance.selectAsset(id, cat);
            });

            await loadDefaultMapOnFirstOpen();
            initMapPanel();
            if (editorInstance) {
                editorInstance.setOnManualDataChange(() => {
                    refreshOutliner();
                    runPreviewCanvas().catch(() => { });
                    if (getAutoSaveEnabled()) scheduleAutoSave();
                });
            }
            initModeAndTools();
            initMapEditorResize();
            initProceduralPreviewClickAndViewport();
            initMapEditBroadcast();
            await runPreviewCanvas({ skipRebuildIfLoaded: true });
            initMapEditorBeforeUnload();

            const canvasContainer = document.getElementById('map-editor-canvas');
            if (canvasContainer) {
                const ro = new ResizeObserver(() => {
                    editorInstance?.resize?.();
                    editorInstance?.invalidateProceduralViewport?.();
                });
                ro.observe(canvasContainer);
            }
        } catch (err) {
            Logger.error('[MapEditor] First-time init failed', err);
        } finally {
            if (loadingOverlay) loadingOverlay.style.display = 'none';
        }
    } else {
        refreshMapList();
        runPreviewCanvas();
    }
}

/** Procedural preview uses mapgen4 space 0..1000; editor world is 0..160000 px. */
const PREVIEW_TO_WORLD = 160000 / 1000;

function drawViewportRectOnOverlay(overlay: HTMLCanvasElement): void {
    if (!editorInstance) return;
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

function drawViewportRectOnProceduralOverlay(): void {
    const overlaySidebar = document.getElementById('proc-preview-overlay') as HTMLCanvasElement;
    const wrapSidebar = document.getElementById('proc-preview-wrap');
    const container = document.getElementById('map-editor-container');
    const inMapView = container && container.style.display !== 'none';
    if (wrapSidebar) wrapSidebar.classList.toggle('has-viewport', inMapView && (document.getElementById('procedural-panel-body')?.style.display !== 'none'));
    if (!editorInstance || !inMapView) return;
    if (overlaySidebar && document.getElementById('procedural-panel-body')?.style.display !== 'none') drawViewportRectOnOverlay(overlaySidebar);
}

let mapEditChannel: BroadcastChannel | null = null;

function scheduleAutoSave(): void {
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        autoSaveTimer = null;
        saveMapToDefault();
    }, AUTO_SAVE_DEBOUNCE_MS);
}

async function loadDefaultMapOnFirstOpen(): Promise<void> {
    if (!editorInstance || currentLoadedMap) return;
    let data: MapEditorDataPayload | null = null;
    let loadSource: 'localStorage' | 'indexedDB' | 'API' | 'static' | null = null;

    // 1. Try MapStorage (localStorage then IndexedDB) — survives refresh, avoids quota for large maps
    const stored = await loadDefaultMap();
    if (stored?.data) {
        data = stored.data as MapEditorDataPayload;
        loadSource = stored.source;
    }

    // 2. Try API (authoritative when server is running)
    if (!data) {
        try {
            const res = await fetch(
                `/api/load_map?filename=${encodeURIComponent(DEFAULT_MAP_FILENAME)}`,
                { cache: 'no-store' }
            );
            const result = await res.json();
            if (result.success && result.data) {
                // If the backend returns an array of chunks, we need to convert it to a record
                if (Array.isArray(result.data.chunks)) {
                    const chunksRecord: Record<string, import('../../../src/tools/map-editor/MapEditorTypes').ChunkData> = {};
                    result.data.chunks.forEach((chunk: any) => {
                        chunksRecord[chunk.id] = chunk;
                    });
                    result.data.chunks = chunksRecord;
                }
                data = result.data as MapEditorDataPayload;
                loadSource = 'API';
            }
        } catch {
            /* API failed */
        }
    }

    // 3. Try static file fallback
    if (!data) {
        try {
            const res = await fetch(`/maps/default.json?_=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
                const json = await res.json();
                if (Array.isArray(json.chunks)) {
                    const chunksRecord: Record<string, import('../../../src/tools/map-editor/MapEditorTypes').ChunkData> = {};
                    json.chunks.forEach((chunk: any) => chunksRecord[chunk.id] = chunk);
                    json.chunks = chunksRecord;
                }
                data = json as MapEditorDataPayload;
                loadSource = 'static';
            }
        } catch {
            /* Static fetch failed */
        }
    }

    if (data) {
        editorInstance.loadData(data);
        const param = data.mapgen4Param as ProcParam | undefined;
        lastLoadedMapgen4Param = param ?? null;
        setProcParamFromData(param);
        if (param) {
            await editorInstance.setProceduralPreview(param as unknown as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param);
        }
        currentLoadedMap = DEFAULT_MAP_FILENAME;
        updateLoadedDisplay();
        refreshOutliner();
        broadcastMapFull();
        Logger.info(`[MapEditor] Load default map: source=${loadSource ?? 'none'} success=true`);
        try {
            await saveDefaultMap(data);
        } catch {
            // Keep storage in sync when possible
        }
    } else {
        Logger.info('[MapEditor] Load default map: no data from any source (localStorage/indexedDB/API/static)');
    }
}

async function saveMapToDefault(): Promise<void> {
    if (!editorInstance) return;
    const mapData = buildMapPayload();
    if (!mapData) return;

    const filename = currentLoadedMap || DEFAULT_MAP_FILENAME;
    try {
        const res = await fetch('/api/save_map', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename, mapData })
        });
        const result = await res.json();
        if (result.success) {
            if (!currentLoadedMap) {
                currentLoadedMap = DEFAULT_MAP_FILENAME;
                updateLoadedDisplay();
            }
            refreshMapList();
            broadcastMapFull();
            try {
                const { source } = await saveDefaultMap(mapData);
                Logger.info(`[MapEditor] Save default map: API success, local persistence=${source}`);
            } catch {
                // local persistence failed
            }
        }
    } catch (e) {
        Logger.error('Auto-save map error:', e);
        try {
            const { source } = await saveDefaultMap(mapData);
            Logger.info(`[MapEditor] Save default map: API failed, local persistence=${source}`);
        } catch {
            // Fallback: persist locally when API fails so refresh loads it
        }
    }
}

function initMapEditorBeforeUnload(): void {
    window.addEventListener('beforeunload', () => {
        if (autoSaveTimer) {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = null;
        }
        if (getAutoSaveEnabled() && editorInstance) {
            const mapData = buildMapPayload();
            if (mapData) {
                const filename = currentLoadedMap || DEFAULT_MAP_FILENAME;
                fetch('/api/save_map', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename, mapData }),
                    keepalive: true
                }).catch(() => { });
                if (filename === DEFAULT_MAP_FILENAME || filename === 'default') {
                    saveDefaultMap(mapData).catch(() => { });
                }
            }
        }
    });
}

function initMapEditBroadcast(): void {
    if (typeof BroadcastChannel === 'undefined' || !editorInstance) return;
    mapEditChannel = new BroadcastChannel('game-map-updates');
    const cm = editorInstance.getChunkManager();
    cm?.setOnMapEdit((type, payload) => {
        mapEditChannel?.postMessage({ type, ...(payload as object) });
        if (getAutoSaveEnabled()) scheduleAutoSave();
    });
}

export function broadcastMapFull(): void {
    if (!mapEditChannel || !editorInstance) return;
    const data = buildMapPayload();
    if (data) mapEditChannel.postMessage({ type: 'MAP_FULL', data });
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

function initMapEditorResize(): void {
    const triggerMapCanvasResize = () => editorInstance?.resize?.();
    initResizeHandle('resize-map-palette', 'map-editor-sidebar', true, {
        defaultPx: 300,
        minPx: 180,
        storageKey: 'map-editor-palette-width',
        onResize: triggerMapCanvasResize,
    });
    initResizeHandle('resize-map-panel', 'maps-panel', false, {
        defaultPx: 280,
        minPx: 200,
        storageKey: 'map-editor-maps-panel-width',
        onResize: triggerMapCanvasResize,
    });
}

const MAP_PANEL_COLLAPSED_KEY = 'map-editor-maps-panel-collapsed';

function initMapPanel(): void {
    const toggleBtn = document.getElementById('maps-panel-toggle');
    const panel = document.getElementById('maps-panel');
    if (!toggleBtn || !panel) return;

    const stored = localStorage.getItem(MAP_PANEL_COLLAPSED_KEY);
    const initiallyCollapsed = stored === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!initiallyCollapsed));
    panel.classList.toggle('collapsed', initiallyCollapsed);

    toggleBtn.addEventListener('click', () => {
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', String(!expanded));
        panel.classList.toggle('collapsed', expanded);
        localStorage.setItem(MAP_PANEL_COLLAPSED_KEY, String(expanded));
    });

    const filenameInput = document.getElementById('map-save-filename') as HTMLInputElement;
    filenameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveMapFromPanel();
    });

    const autoSaveToggle = document.getElementById('map-auto-save-toggle') as HTMLInputElement;
    if (autoSaveToggle) {
        autoSaveToggle.checked = getAutoSaveEnabled();
        autoSaveToggle.addEventListener('change', () => {
            setAutoSaveEnabled(autoSaveToggle.checked);
        });
    }

    initPanelTabs();
    initOutlinerPanel();
    initProceduralPanel();
    updateLoadedDisplay();
    refreshMapList();
}

const MAP_PANEL_TAB_KEY = 'map-editor-maps-panel-tab';

function initPanelTabs(): void {
    const tabMaps = document.getElementById('tab-maps');
    const tabOutliner = document.getElementById('tab-outliner');
    const tabProcedural = document.getElementById('tab-procedural');
    const bodyMaps = document.getElementById('maps-panel-body');
    const bodyOutliner = document.getElementById('outliner-panel-body');
    const bodyProcedural = document.getElementById('procedural-panel-body');
    const panelTitle = document.getElementById('maps-panel-title');
    let isInitialRestore = true;
    const switchTo = (tab: 'maps' | 'outliner' | 'procedural') => {
        localStorage.setItem(MAP_PANEL_TAB_KEY, tab);
        tabMaps?.classList.toggle('active', tab === 'maps');
        tabOutliner?.classList.toggle('active', tab === 'outliner');
        tabProcedural?.classList.toggle('active', tab === 'procedural');
        if (bodyMaps) bodyMaps.style.display = tab === 'maps' ? '' : 'none';
        if (bodyOutliner) bodyOutliner.style.display = tab === 'outliner' ? '' : 'none';
        if (bodyProcedural) bodyProcedural.style.display = tab === 'procedural' ? '' : 'none';
        if (panelTitle) {
            panelTitle.textContent = tab === 'maps' ? 'Maps' : tab === 'outliner' ? 'Outliner' : 'Procedural';
        }
        if (tab === 'outliner') {
            refreshOutliner();
        }
        if (tab === 'procedural' && !isInitialRestore) {
            runPreviewCanvas({ skipRebuildIfLoaded: true });
        }
    };
    tabMaps?.addEventListener('click', () => switchTo('maps'));
    tabOutliner?.addEventListener('click', () => switchTo('outliner'));
    tabProcedural?.addEventListener('click', () => switchTo('procedural'));

    const storedTab = localStorage.getItem(MAP_PANEL_TAB_KEY) as 'maps' | 'outliner' | 'procedural' | null;
    if (storedTab && (storedTab === 'maps' || storedTab === 'outliner' || storedTab === 'procedural')) {
        switchTo(storedTab);
    }
    isInitialRestore = false;
}

function initOutlinerPanel(): void {
    const refreshBtn = document.getElementById('outliner-refresh-btn');
    const moveBtn = document.getElementById('outliner-move-btn');
    const deleteBtn = document.getElementById('outliner-delete-btn');

    refreshBtn?.addEventListener('click', () => refreshOutliner());

    moveBtn?.addEventListener('click', () => {
        if (!editorInstance) return;
        const sel = editorInstance.getSelectedObject();
        if (!sel) return;
        editorInstance.setOnNextClickAction((x, y) => {
            editorInstance?.moveSelectedObjectTo(x, y);
            refreshOutliner();
            setMapStatus('');
        });
        setMapStatus('Click on map to place object');
    });

    deleteBtn?.addEventListener('click', () => {
        if (!editorInstance) return;
        if (editorInstance.removeSelectedObject()) {
            refreshOutliner();
        }
    });
}

export function refreshOutliner(): void {
    const listEl = document.getElementById('outliner-list');
    const selectionEl = document.getElementById('outliner-selection');
    const selectedLabel = document.getElementById('outliner-selected-label');
    const moveBtn = document.getElementById('outliner-move-btn');
    const deleteBtn = document.getElementById('outliner-delete-btn');
    const townsEl = document.getElementById('outliner-towns');
    const stationsEl = document.getElementById('outliner-stations');

    if (!listEl || !editorInstance) return;

    if (townsEl) {
        const towns = editorInstance.getManualTowns();
        townsEl.innerHTML = '';
        if (towns.length === 0) {
            townsEl.innerHTML = '<div style="color:#666; padding:6px; font-size:11px;">None. Right-click map → Place town.</div>';
        } else {
            towns.forEach((regionId, i) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:6px; padding:6px 8px; background:#252525; border-radius:4px; margin-bottom:4px;';
                const label = document.createElement('span');
                label.textContent = `Town ${i + 1} (region ${regionId})`;
                label.style.cssText = 'flex:1; font-size:12px; color:#ccc;';
                row.appendChild(label);
                const del = document.createElement('button');
                del.type = 'button';
                del.textContent = 'Delete';
                del.style.cssText = 'font-size:10px; padding:2px 6px; background:#5a2525; color:#fff; border:none; border-radius:4px; cursor:pointer;';
                del.addEventListener('click', () => {
                    editorInstance?.removeManualTown(regionId);
                    refreshOutliner();
                    runPreviewCanvas().catch(() => { });
                });
                row.appendChild(del);
                townsEl.appendChild(row);
            });
        }
    }

    if (stationsEl) {
        const stations = editorInstance.getManualStations();
        const sorted = [...stations].sort((a, b) => a.order - b.order);
        stationsEl.innerHTML = '';
        if (sorted.length === 0) {
            stationsEl.innerHTML = '<div style="color:#666; padding:6px; font-size:11px;">None. Right-click polygon → Place station.</div>';
        } else {
            const manualStations = editorInstance.getManualStations();
            sorted.forEach((s) => {
                const idx = manualStations.findIndex((m) => m.regionId === s.regionId && m.order === s.order);
                if (idx < 0) return;
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:6px; padding:6px 8px; background:#252525; border-radius:4px; margin-bottom:4px;';
                const orderInput = document.createElement('input');
                orderInput.type = 'number';
                orderInput.min = '1';
                orderInput.value = String(s.order);
                orderInput.style.cssText = 'width:36px; padding:2px 4px; background:#111; color:#fff; border:1px solid #444; border-radius:4px; font-size:11px;';
                orderInput.addEventListener('change', () => {
                    const v = parseInt(orderInput.value, 10);
                    if (!Number.isNaN(v)) editorInstance?.setStationOrder(idx, v);
                    refreshOutliner();
                    runPreviewCanvas().catch(() => { });
                });
                row.appendChild(orderInput);
                const label = document.createElement('span');
                label.textContent = `Station (region ${s.regionId})`;
                label.style.cssText = 'flex:1; font-size:12px; color:#ccc;';
                row.appendChild(label);
                const del = document.createElement('button');
                del.type = 'button';
                del.textContent = 'Delete';
                del.style.cssText = 'font-size:10px; padding:2px 6px; background:#5a2525; color:#fff; border:none; border-radius:4px; cursor:pointer;';
                del.addEventListener('click', () => {
                    editorInstance?.removeManualStation(s.regionId);
                    refreshOutliner();
                    runPreviewCanvas().catch(() => { });
                });
                row.appendChild(del);
                stationsEl.appendChild(row);
            });
        }
    }

    const cm = editorInstance.getChunkManager();
    const objects = cm?.getAllObjects() ?? [];
    const sel = editorInstance.getSelectedObject();

    listEl.innerHTML = '';
    if (objects.length === 0) {
        listEl.innerHTML = '<div style="color:#666; padding:8px; font-size:11px;">No objects. Load a map and place objects from the palette.</div>';
    } else {
        for (const obj of objects) {
            const row = document.createElement('div');
            const isSelected = sel && Math.abs(sel.x - obj.x) < 1 && Math.abs(sel.y - obj.y) < 1 && sel.id === obj.id;
            row.style.cssText =
                'display:flex; align-items:center; gap:6px; padding:6px 8px; background:' +
                (isSelected ? '#2a3a2a' : '#252525') +
                '; border-radius:4px; margin-bottom:4px; cursor:pointer;';
            const label = document.createElement('span');
            label.textContent = `${obj.id} @ ${Math.round(obj.x)}, ${Math.round(obj.y)}`;
            label.style.cssText = 'flex:1; font-size:12px; color:#66fcf1;';
            row.appendChild(label);
            row.title = 'Click to go to and select';
            row.addEventListener('click', () => {
                editorInstance?.setSelectedObject(obj);
                editorInstance?.centerViewOn(obj.x, obj.y);
                refreshOutliner();
            });
            listEl.appendChild(row);
        }
    }

    if (selectionEl && selectedLabel && moveBtn && deleteBtn) {
        if (sel) {
            selectionEl.style.display = '';
            selectedLabel.textContent = `${sel.id} @ ${Math.round(sel.x)}, ${Math.round(sel.y)}`;
        } else {
            selectionEl.style.display = 'none';
        }
    }
}

function setProcStatus(message: string, isError = false): void {
    const el = document.getElementById('proc-status');
    if (el) {
        el.textContent = message;
        el.style.color = isError ? '#e74c3c' : '#888';
    }
}


const PREVIEW_DEBOUNCE_MS = 120;

let previewDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/** Update minimap and main view. Debounced to avoid rapid rebuilds when dragging sliders. */
function scheduleLivePreview(): void {
    if (previewDebounceTimer) clearTimeout(previewDebounceTimer);
    previewDebounceTimer = setTimeout(() => {
        previewDebounceTimer = null;
        runPreviewCanvas();
        if (getAutoSaveEnabled()) scheduleAutoSave();
    }, PREVIEW_DEBOUNCE_MS);
}

/** @param skipRebuildIfLoaded When true and a map is loaded, skip setProceduralPreview (used on init to avoid overwriting cache built from loaded params). */
async function runPreviewCanvas(opts?: { skipRebuildIfLoaded?: boolean }): Promise<void> {
    const skipRebuildIfLoaded = opts?.skipRebuildIfLoaded ?? false;
    const canvasSidebar = document.getElementById('proc-preview-canvas') as HTMLCanvasElement;
    try {
        const param = getProcParam();
        const mapgenParam = param as any as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param;
        if (editorInstance) {
            const shouldRebuild = !currentLoadedMap || !skipRebuildIfLoaded;
            if (shouldRebuild) {
                await editorInstance.setProceduralPreview(mapgenParam);
            }
            if (canvasSidebar && !editorInstance.drawCachedToCanvas(canvasSidebar)) {
                if (shouldRebuild) {
                    const { runAndDrawPreview } =
                        await import('../../../src/tools/map-editor/Mapgen4PreviewRenderer');
                    runAndDrawPreview(canvasSidebar, mapgenParam);
                }
            }
        } else if (canvasSidebar) {
            const { runAndDrawPreview } =
                await import('../../../src/tools/map-editor/Mapgen4PreviewRenderer');
            runAndDrawPreview(canvasSidebar, mapgenParam);
        }
    } catch (e) {
        Logger.error('Mapgen4 preview error:', e);
    }
}

function bindSlider(id: string, valueId: string, parse: (s: string) => number): number {
    const input = document.getElementById(id) as HTMLInputElement;
    const valueEl = document.getElementById(valueId);
    if (!input) return 0;
    const updateDisplay = () => {
        if (valueEl) valueEl.textContent = input.value;
    };
    input.addEventListener('input', updateDisplay);
    input.addEventListener('change', scheduleLivePreview);
    updateDisplay();
    return parse(input.value);
}

function bindNumberInput(id: string): void {
    const input = document.getElementById(id) as HTMLInputElement;
    if (!input) return;
    input.addEventListener('change', scheduleLivePreview);
}

function bindCheckbox(id: string): void {
    const input = document.getElementById(id) as HTMLInputElement;
    if (!input) return;
    input.addEventListener('change', scheduleLivePreview);
}

function getProcParam(): ProcParam {
    const num = (id: string) =>
        parseFloat((document.getElementById(id) as HTMLInputElement)?.value ?? '0') || 0;
    const int = (id: string) =>
        parseInt((document.getElementById(id) as HTMLInputElement)?.value ?? '0', 10) || 0;
    const checked = (id: string) => (document.getElementById(id) as HTMLInputElement)?.checked ?? false;
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
        },
        towns: {
            enabled: checked('proc-towns-enabled'),
            numTowns: int('proc-num-towns') || 5,
            minSpacing: num('proc-town-spacing') || 60,
            townRadius: num('proc-town-radius') || 30,
            defaultZoneId: 'civ_town',
            elevationMin: num('proc-town-elev-min') ?? 0,
            elevationMax: num('proc-town-elev-max') ?? 0.3,
            rainfallMin: num('proc-town-rain-min') ?? 0.2,
            rainfallMax: num('proc-town-rain-max') ?? 1
        },
        roads: {
            enabled: checked('proc-roads-enabled'),
            baseWidth: num('proc-road-width') || 80,
            shortcutsPerTown: int('proc-road-shortcuts') ?? 1,
            riverCrossingCost: num('proc-road-river-cost') ?? 1.2,
            coverageGridSize: int('proc-road-coverage') ?? 0,
            slopeWeight: num('proc-road-slope-weight') ?? 3,
            waypointCurviness: num('proc-road-waypoint-curviness') ?? 0.15
        },
        railroads: {
            enabled: checked('proc-railroads-enabled')
        }
    };
}

/** Build full map payload including procedural params for save/broadcast. Uses editor procCache when available, else last-loaded param, else form. */
function buildMapPayload(): MapEditorDataPayload | null {
    if (!editorInstance) return null;

    const serialized = editorInstance.serialize();
    const fromEditor = editorInstance?.getMapgen4Param?.() as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param | undefined;
    const fromUIParam = getProcParam() as unknown as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param;

    const mapgen4Param = fromEditor && Object.keys(fromEditor).length > 0 ? fromEditor : fromUIParam;
    const paramSource = fromEditor ? 'procCache' : lastLoadedMapgen4Param ? 'lastLoaded' : 'form';
    Logger.info(`[MapEditor] buildMapPayload: mapgen4Param source=${paramSource}`);

    // MapEditorDataPayload requires `chunks` to be a Record<string, ChunkData>, not an Array.
    // Ensure that mapping occurs if needed.
    const payload: MapEditorDataPayload = {
        chunks: serialized.chunks,
        heroSpawn: serialized.heroSpawn,
        mapgen4Param,
        manualTowns: serialized.manualTowns,
        manualStations: serialized.manualStations,
        railroadWaypoints: serialized.railroadWaypoints
    };

    return payload;
}

/** Restore procedural form inputs from saved mapgen4 param. Does not trigger live preview. */
function setProcParamFromData(param: ProcParam | null | undefined): void {
    if (!param) return;
    const setInput = (id: string, value: number): void => {
        const input = document.getElementById(id) as HTMLInputElement | null;
        if (input) {
            input.value = String(value);
            const valEl = document.getElementById(id + '-val');
            if (valEl) valEl.textContent = input.value;
        }
    };
    setInput('proc-spacing', param.spacing);
    setInput('proc-mountain-spacing', param.mountainSpacing);
    setInput('proc-mesh-seed', param.meshSeed);
    if (param.elevation) {
        setInput('proc-elev-seed', param.elevation.seed ?? 187);
        setInput('proc-island', param.elevation.island ?? 0.5);
        setInput('proc-noisy-coastlines', param.elevation.noisy_coastlines ?? 0.01);
        setInput('proc-hill-height', param.elevation.hill_height ?? 0.02);
        setInput('proc-mountain-jagged', param.elevation.mountain_jagged ?? 0);
        setInput('proc-mountain-sharpness', param.elevation.mountain_sharpness ?? 9.8);
        setInput('proc-mountain-folds', param.elevation.mountain_folds ?? 0.05);
        setInput('proc-ocean-depth', param.elevation.ocean_depth ?? 1.4);
    }
    if (param.biomes) {
        setInput('proc-wind-angle', param.biomes.wind_angle_deg ?? 0);
        setInput('proc-raininess', param.biomes.raininess ?? 0.9);
        setInput('proc-rain-shadow', param.biomes.rain_shadow ?? 0.5);
        setInput('proc-evaporation', param.biomes.evaporation ?? 0.5);
    }
    if (param.rivers) {
        setInput('proc-lg-min-flow', param.rivers.lg_min_flow ?? 2.7);
        setInput('proc-lg-river-width', param.rivers.lg_river_width ?? -2.4);
        setInput('proc-flow', param.rivers.flow ?? 0.2);
    }
    if (param.towns) {
        const cb = document.getElementById('proc-towns-enabled') as HTMLInputElement;
        if (cb) cb.checked = param.towns.enabled ?? true;
        setInput('proc-num-towns', param.towns.numTowns ?? 5);
        setInput('proc-town-spacing', param.towns.minSpacing ?? 60);
        setInput('proc-town-radius', param.towns.townRadius ?? 30);
        setInput('proc-town-elev-min', param.towns.elevationMin ?? 0);
        setInput('proc-town-elev-max', param.towns.elevationMax ?? 0.3);
        setInput('proc-town-rain-min', param.towns.rainfallMin ?? 0.2);
        setInput('proc-town-rain-max', param.towns.rainfallMax ?? 1);
    }
    if (param.roads) {
        const cb = document.getElementById('proc-roads-enabled') as HTMLInputElement;
        if (cb) cb.checked = param.roads.enabled ?? true;
        setInput('proc-road-width', param.roads.baseWidth ?? 80);
        setInput('proc-road-shortcuts', param.roads.shortcutsPerTown ?? 1);
        setInput('proc-road-river-cost', param.roads.riverCrossingCost ?? 1.2);
        setInput('proc-road-coverage', param.roads.coverageGridSize ?? 0);
        setInput('proc-road-slope-weight', param.roads.slopeWeight ?? 3);
        setInput('proc-road-waypoint-curviness', param.roads.waypointCurviness ?? 0.15);
    }
    if (param.railroads) {
        const cb = document.getElementById('proc-railroads-enabled') as HTMLInputElement;
        if (cb) cb.checked = param.railroads.enabled ?? true;
    }
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
    bindCheckbox('proc-towns-enabled');
    bindNumberInput('proc-num-towns');
    const updateTownNum = () => {
        const el = document.getElementById('proc-num-towns-val');
        const input = document.getElementById('proc-num-towns') as HTMLInputElement;
        if (el && input) el.textContent = input.value;
    };
    document.getElementById('proc-num-towns')?.addEventListener('input', updateTownNum);
    updateTownNum();
    bindSlider('proc-town-spacing', 'proc-town-spacing-val', parseFloat);
    bindSlider('proc-town-radius', 'proc-town-radius-val', parseFloat);
    bindSlider('proc-town-elev-min', 'proc-town-elev-min-val', parseFloat);
    bindSlider('proc-town-elev-max', 'proc-town-elev-max-val', parseFloat);
    bindSlider('proc-town-rain-min', 'proc-town-rain-min-val', parseFloat);
    bindSlider('proc-town-rain-max', 'proc-town-rain-max-val', parseFloat);
    bindCheckbox('proc-roads-enabled');
    bindNumberInput('proc-road-width');
    bindNumberInput('proc-road-shortcuts');
    bindNumberInput('proc-road-coverage');
    const updateRoadWidth = () => {
        const el = document.getElementById('proc-road-width-val');
        const input = document.getElementById('proc-road-width') as HTMLInputElement;
        if (el && input) el.textContent = input.value;
    };
    const updateRoadShortcuts = () => {
        const el = document.getElementById('proc-road-shortcuts-val');
        const input = document.getElementById('proc-road-shortcuts') as HTMLInputElement;
        if (el && input) el.textContent = input.value;
    };
    const updateRoadCoverage = () => {
        const el = document.getElementById('proc-road-coverage-val');
        const input = document.getElementById('proc-road-coverage') as HTMLInputElement;
        if (el && input) el.textContent = input.value;
    };
    document.getElementById('proc-road-width')?.addEventListener('input', updateRoadWidth);
    document.getElementById('proc-road-shortcuts')?.addEventListener('input', updateRoadShortcuts);
    document.getElementById('proc-road-coverage')?.addEventListener('input', updateRoadCoverage);
    updateRoadWidth();
    updateRoadShortcuts();
    updateRoadCoverage();
    bindSlider('proc-road-river-cost', 'proc-road-river-cost-val', parseFloat);
    bindSlider('proc-road-slope-weight', 'proc-road-slope-weight-val', parseFloat);
    bindSlider('proc-road-waypoint-curviness', 'proc-road-waypoint-curviness-val', parseFloat);
    bindCheckbox('proc-railroads-enabled');

    const rebuildBtn = document.getElementById('proc-railroad-rebuild');
    if (rebuildBtn) {
        rebuildBtn.addEventListener('click', async () => {
            if (!editorInstance) {
                setProcStatus('Editor not ready', true);
                return;
            }
            const param = editorInstance.getMapgen4Param() ?? getProcParam();
            await editorInstance.setProceduralPreview(param as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param);
            setProcStatus('Railroad path rebuilt.');
        });
    }
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
            input.value = DEFAULT_MAP_FILENAME;
            input.placeholder = `Saves to ${DEFAULT_MAP_FILENAME}`;
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

    const mapData = buildMapPayload();
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
            broadcastMapFull();
            if (filename === DEFAULT_MAP_FILENAME || filename === 'default') {
                try {
                    const { source } = await saveDefaultMap(mapData);
                    Logger.info(`[MapEditor] Save from panel (default): persistence=${source}`);
                } catch {
                    /* local persistence failed */
                }
            }
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
        const res = await fetch(`/api/load_map?filename=${encodeURIComponent(filename)}`, { cache: 'no-store' });
        const result = await res.json();
        if (result.success && result.data) {
            const data = result.data as unknown as MapEditorDataPayload;
            editorInstance.loadData(data);
            lastLoadedMapgen4Param = (data.mapgen4Param as unknown as ProcParam) ?? null;
            setProcParamFromData(data.mapgen4Param as unknown as ProcParam);
            if (data.mapgen4Param) {
                await editorInstance.setProceduralPreview(data.mapgen4Param as unknown as import('../../../src/tools/map-editor/Mapgen4Generator').Mapgen4Param);
            }
            currentLoadedMap = filename;
            updateLoadedDisplay();
            refreshOutliner();
            broadcastMapFull();
            setMapStatus('Loaded: ' + filename);
            Logger.info(`[MapEditor] Load map: ${filename} (API)`);
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
                lastLoadedMapgen4Param = null;
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
    const btnManipulation = document.getElementById('mode-manipulation');

    const updateModeUI = (mode: 'object' | 'manipulation') => {
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
        resetBtn(btnManipulation);

        if (mode === 'object') activeBtn(btnObj);
        else if (mode === 'manipulation') activeBtn(btnManipulation);

        if (editorInstance) editorInstance.setMode(mode);
        if (paletteInstance) paletteInstance.setMode(mode);
    };

    btnObj?.addEventListener('click', () => updateModeUI('object'));
    btnManipulation?.addEventListener('click', () => updateModeUI('manipulation'));

    const gridInput = document.getElementById('editor-grid-opacity') as HTMLInputElement;
    const gridVal = document.getElementById('editor-grid-val');
    gridInput?.addEventListener('input', (e) => {
        const val = parseInt((e.target as HTMLInputElement).value);
        if (gridVal) gridVal.innerText = `${val}%`;
        if (editorInstance) editorInstance.setGridOpacity(val / 100);
    });

    const debugBtn = document.getElementById('debug-btn');
    const debugPanel = document.getElementById('debug-panel');
    const debugStationNumbersCheck = document.getElementById('debug-station-numbers') as HTMLInputElement;
    const debugSplinePathCheck = document.getElementById('debug-spline-path') as HTMLInputElement;
    debugBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (debugPanel) debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    });
    debugStationNumbersCheck?.addEventListener('change', () => {
        if (editorInstance) editorInstance.setDebugStationNumbers(debugStationNumbersCheck.checked);
    });
    debugSplinePathCheck?.addEventListener('change', () => {
        if (editorInstance) editorInstance.setDebugShowSplinePath(debugSplinePathCheck.checked);
    });
    if (editorInstance && debugStationNumbersCheck) {
        debugStationNumbersCheck.checked = editorInstance.getDebugStationNumbers();
    }
    if (editorInstance && debugSplinePathCheck) {
        debugSplinePathCheck.checked = editorInstance.getDebugShowSplinePath();
    }
    document.addEventListener('click', () => {
        if (debugPanel) debugPanel.style.display = 'none';
    });
    debugPanel?.addEventListener('click', (e) => e.stopPropagation());


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

// HMR: when any of these map-editor modules change, refresh procedural preview instead of full page reload.
// Vite requires string literals here (no variables).
if (import.meta.hot) {
    import.meta.hot.accept(
        [
            '../../../src/tools/map-editor/Mapgen4SplineUtils.ts',
            '../../../src/tools/map-editor/RailroadSplineBuilder.ts',
            '../../../src/tools/map-editor/MapEditorCore.ts',
            '../../../src/tools/map-editor/MapEditorProceduralRenderer.ts',
            '../../../src/tools/map-editor/Mapgen4Generator.ts',
            '../../../src/tools/map-editor/RailroadGenerator.ts',
            '../../../src/tools/map-editor/RailroadDijkstra.ts',
            '../../../src/tools/map-editor/RailroadPathfinder.ts',
            '../../../src/tools/map-editor/Mapgen4Param.ts',
            '../../../src/tools/map-editor/Mapgen4PreviewRenderer.ts',
            '../../../src/tools/map-editor/Mapgen4RailroadPreview.ts',
            '../../../src/tools/map-editor/RailroadGeneratorTypes.ts',
            '../../../src/tools/map-editor/RailroadMeshRenderer.ts',
        ],
        () => {
            if (editorInstance) {
                runPreviewCanvas().catch(() => { });
            }
        }
    );
}
