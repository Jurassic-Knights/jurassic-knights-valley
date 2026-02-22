import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkManager } from './ChunkManager';
import { ChunkData, MapObject } from './MapEditorTypes';
import { EditorContext } from './EditorContext';
import { CommandManager } from './commands/CommandManager';

import { BatchObjectCommand } from './commands/BatchObjectCommand';
import { MoveObjectCommand } from './commands/MoveObjectCommand';
import { SetHeroSpawnCommand } from './commands/SetHeroSpawnCommand';
import { EditorCommand } from './commands/EditorCommand';
import type { Mapgen4Param } from './Mapgen4Generator';
import type { ManualStation, RailroadWaypointEntry } from '../../world/MapDataService';
import {
    buildProceduralCache,
    drawProceduralToCanvas,
    updateRailroadMeshes,
    worldToMeshViewport,
    type ProceduralCache,
    type RailroadMeshState
} from './MapEditorProceduralRenderer';
import { createZoomUI, updateZoomUI } from './MapEditorUIOverlays';
import { createScaleReferenceOverlay, type ScaleReferenceOverlay } from './MapEditorScaleReference';
import { resetZoomToGame } from './MapEditorViewport';
import { createHistoryUI } from './MapEditorHistoryOverlay';
import { findRegionAt } from './Mapgen4RegionUtils';
import { preloadRegistry } from './MapEditorRegistry';
import { AssetLoader } from '@core/AssetLoader';
import { createPixiApp } from './MapEditorMount';
import { runMapEditorUpdate } from './MapEditorUpdate';
import { EntityLoader } from '@entities/EntityLoader';
import { MapEditorDebugOverlay } from './MapEditorDebugOverlay';
import { MapEditorWaypointManager } from './MapEditorWaypointManager';
import { MapEditorManipulationHandles } from './MapEditorManipulationHandles';
import {
    getDebugOverlayHost,
    getWaypointManagerHost,
    getManipulationHandlesHost
} from './MapEditorHosts';
import { setupInputListeners, type InputState } from './MapEditorInput';

/**
 * MapEditorCore
 *
 * The central controller for the Map Editor tool.
 * Manages the PixiJS Application, Input Handling, and Tool State.
 */
export class MapEditorCore {
    private app: PIXI.Application | null = null;
    private container: HTMLElement | null = null;
    private worldContainer: PIXI.Container | null = null;
    private chunkManager: ChunkManager | null = null;
    private proceduralCanvas: HTMLCanvasElement | null = null;
    private proceduralSprite: PIXI.Sprite | null = null;
    private procCache: ProceduralCache | null = null;
    private railroadState: RailroadMeshState = {
        railroadMeshContainer: null,
        railroadMeshes: [],
        cacheKey: null
    };
    private lastMainViewViewportKey: string | null = null;
    private selectedAsset: { id: string; category: string } | null = null;
    private brushCursor: PIXI.Graphics | null = null;

    // State
    private isInitialized: boolean = false;
    private currentTool: 'brush' | 'eraser' | 'select' = 'brush';
    private currentLayer: number = MapEditorConfig.Layers.GROUND;

    // Zone Editor State
    private editingMode: 'object' | 'manipulation' | 'ground' | 'zone' = 'object';

    // Viewport State
    private zoom: number = 1.0; // Default to 100% (Gameplay parity)
    private inputState: InputState = {
        isDragging: false,
        isPainting: false,
        isSpacePressed: false,
        lastMousePosition: { x: 0, y: 0 },
        currentObjectActions: []
    };
    private inputCleanup: (() => void) | null = null;

    private selectedObject: MapObject | null = null;
    private onNextClickAction: ((x: number, y: number) => void) | null = null;

    private scaleReferenceOverlay: ScaleReferenceOverlay | null = null;

    /** Debug: show train station order numbers above each station polygon. */
    private debugShowStationNumbers = false;
    private debugShowSplinePath = false;

    private readonly debugOverlay = new MapEditorDebugOverlay();
    private readonly waypointManager = new MapEditorWaypointManager();
    private readonly manipulationHandles = new MapEditorManipulationHandles();

    /** Manual towns (region IDs). When non-empty, override procedural towns. */
    private manualTowns: number[] = [];
    /** Manual stations with order. When non-empty, railroad uses this order. */
    private manualStations: ManualStation[] = [];
    /** Waypoints per leg for railroad shaping. */
    private railroadWaypoints: RailroadWaypointEntry[] = [];
    /** Callback when manual data changes (e.g. dashboard refresh, save). */
    private onManualDataChange: (() => void) | null = null;
    /** Callback when any command is executed (object placed/moved/deleted, etc). */
    private onCommandExecuted: (() => void) | null = null;

    // Commands
    private commandManager: CommandManager;

    constructor() {
        this.commandManager = new CommandManager();
        Logger.info('[MapEditorCore] Instantiated');
    }

    public executeCommand(cmd: EditorCommand): void {
        this.commandManager.execute(cmd);
        this.onCommandExecuted?.();
    }

    public selectAsset(id: string, category: string) {
        this.selectedAsset = { id, category };
        this.editingMode = 'object';
        // Preload so the actual asset appears immediately on first placement (no placeholder)
        AssetLoader.preloadImage(id);

        this.currentTool = 'brush';
        Logger.info(`[MapEditor] Selected: ${id} (${category})`);
    }

    public async mount(
        containerId: string,
        dataFetcher?: (
            category: string
        ) => Promise<{ entities: Array<{ id: string; [key: string]: unknown }> }>
    ): Promise<void> {
        if (this.isInitialized) return;

        this.container = document.getElementById(containerId);
        if (!this.container) {
            Logger.error(`[MapEditorCore] Container #${containerId} not found`);
            return;
        }

        Logger.info('[MapEditorCore] Mounting...');

        // Ensure EntityRegistry is populated so AssetLoader uses same image paths as game
        await EntityLoader.load();

        preloadRegistry(dataFetcher);

        const result = await createPixiApp(this.container, this.zoom);
        this.app = result.app;
        this.worldContainer = result.worldContainer;
        this.proceduralCanvas = result.proceduralCanvas;
        this.proceduralSprite = result.proceduralSprite;
        this.chunkManager = result.chunkManager;
        this.brushCursor = result.brushCursor;
        this.zoom = result.initialZoom;

        this.setupInputListeners();
        this.setupEntityUpdateListener();
        this.app.ticker.add(this.update, this);
        this.createUIOverlays();

        this.scaleReferenceOverlay = await createScaleReferenceOverlay(this.app, {
            onHeroSpawnClick: () => this.enterHeroSpawnPlacementMode()
        });

        this.isInitialized = true;

        Logger.info('[MapEditorCore] Initialized successfully');
    }

    private setupEntityUpdateListener(): void {
        if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;
        const channel = new BroadcastChannel('game-entity-updates');
        channel.onmessage = (event) => {
            const d = event.data;
            if (d?.type !== 'ENTITY_UPDATE' || !d.updates) return;
            const u = d.updates as Record<string, unknown>;
            const hasDisplayChange =
                'display.width' in u ||
                'display.height' in u ||
                'display.sizeScale' in u ||
                'display.scale' in u ||
                'width' in u ||
                'height' in u ||
                'sizeScale' in u ||
                'scale' in u;
            if (hasDisplayChange && this.chunkManager) {
                this.chunkManager.refreshObjectSprites();
            }
        };
    }

    public setMode(mode: 'object' | 'manipulation' | 'ground' | 'zone') {
        this.editingMode = mode as 'object' | 'manipulation' | 'ground' | 'zone';
        Logger.info(`[MapEditor] Mode set to ${mode}`);
    }

    public setGridOpacity(opacity: number) {
        this.chunkManager?.setGridOpacity(opacity);
    }

    private createUIOverlays() {
        createZoomUI(this.container, () => this.resetZoomToGame());
        createHistoryUI(this.container, this.commandManager);
        updateZoomUI(this.zoom);
    }

    private resetZoomToGame(): void {
        if (!this.app || !this.worldContainer) return;
        const { zoom, worldX, worldY } = resetZoomToGame({
            canvasWidth: this.app.canvas.width,
            canvasHeight: this.app.canvas.height,
            worldContainer: this.worldContainer,
            zoom: this.zoom
        });
        this.zoom = zoom;
        this.worldContainer.scale.set(zoom);
        this.worldContainer.x = worldX;
        this.worldContainer.y = worldY;
        this.updateZoomUI();
    }

    private updateZoomUI() {
        updateZoomUI(this.zoom);
    }

    public unmount(): void {
        if (!this.isInitialized || !this.app) return;
        Logger.info('[MapEditorCore] Unmounting...');
        this.app.ticker.remove(this.update, this);
        this.scaleReferenceOverlay?.destroy();
        this.scaleReferenceOverlay = null;
        this.debugOverlay.destroy();
        this.waypointManager.destroy();
        this.manipulationHandles.destroy();
        this.inputCleanup?.();
        this.inputCleanup = null;
        this.app.destroy(true, { children: true });
        this.app = this.container = this.worldContainer = this.chunkManager = null;
        this.proceduralCanvas = null;
        this.proceduralSprite = null;
        this.procCache = null;
        this.railroadState = { railroadMeshContainer: null, railroadMeshes: [], cacheKey: null };
        this.lastMainViewViewportKey = null;
        this.isInitialized = false;
    }

    private update(_ticker: PIXI.Ticker): void {
        if (!this.chunkManager || !this.app || !this.worldContainer) return;
        try {
            runMapEditorUpdate(this.app, this.worldContainer, this.zoom, this.chunkManager);
        } catch (_err) {
            /* viewport/load errors logged elsewhere */
        }
        this.drawProceduralToMainView();
        this.scaleReferenceOverlay?.update(
            this.zoom,
            this.app.canvas.width,
            this.app.canvas.height
        );
        try {
            this.debugOverlay.update(this.getDebugOverlayHost());
        } catch (err) {
            Logger.warn('[MapEditor] debugOverlay.update error', err);
        }
        this.waypointManager.update(this.getWaypointManagerHost());
        this.manipulationHandles.update(this.getManipulationHandlesHost());
    }

    /** Resolve world coords to mesh region ID. Returns null if no procedural cache. */
    public getRegionAtWorld(worldX: number, worldY: number): number | null {
        if (!this.procCache) return null;
        const { mesh } = this.procCache.meshAndMap;
        const { cellRegions } = this.procCache;
        const worldSize = MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE;
        const meshPerWorld = 1000 / worldSize;
        const meshX = worldX * meshPerWorld;
        const meshY = worldY * meshPerWorld;
        return findRegionAt(mesh, meshX, meshY, cellRegions);
    }

    private getDebugOverlayHost() {
        return getDebugOverlayHost(this, {
            procCache: this.procCache,
            worldContainer: this.worldContainer,
            app: this.app,
            zoom: this.zoom,
            debugShowStationNumbers: this.debugShowStationNumbers,
            debugShowSplinePath: this.debugShowSplinePath
        });
    }

    private getWaypointManagerHost() {
        return getWaypointManagerHost(this, {
            procCache: this.procCache,
            worldContainer: this.worldContainer,
            app: this.app,
            zoom: this.zoom,
            manualStations: this.manualStations,
            railroadWaypoints: this.railroadWaypoints,
            editingMode: this.editingMode,
            debugShowStationNumbers: this.debugShowStationNumbers,
            debugShowSplinePath: this.debugShowSplinePath
        });
    }

    private getManipulationHandlesHost() {
        return getManipulationHandlesHost(this, {
            procCache: this.procCache,
            worldContainer: this.worldContainer,
            app: this.app,
            zoom: this.zoom,
            manualTowns: this.manualTowns,
            manualStations: this.manualStations,
            editingMode: this.editingMode
        });
    }

    private setupInputListeners(): void {
        const { cleanup } = setupInputListeners(this, this.inputState);
        this.inputCleanup = cleanup;
    }

    /** Trigger canvas resize (e.g. when sidebars change layout). Responds to ResizeObserver. */
    public resize(): void {
        this.app?.resize?.();
    }

    /** Invalidate viewport cache so procedural map redraws on next frame. Use on resize; do not regenerate cache. */
    public invalidateProceduralViewport(): void {
        this.lastMainViewViewportKey = null;
    }

    public setDebugStationNumbers(show: boolean): void {
        this.debugShowStationNumbers = show;
    }

    public getDebugStationNumbers(): boolean {
        return this.debugShowStationNumbers;
    }

    public setDebugShowSplinePath(show: boolean): void {
        this.debugShowSplinePath = show;
    }

    public getDebugShowSplinePath(): boolean {
        return this.debugShowSplinePath;
    }

    public getChunkManager(): ChunkManager | null {
        return this.chunkManager;
    }

    public setSelectedObject(obj: MapObject | null): void {
        this.selectedObject = obj;
    }
    public getSelectedObject(): MapObject | null {
        return this.selectedObject;
    }

    public clearOnNextClickAction(): void {
        this.onNextClickAction = null;
    }
    public getOnNextClickAction(): ((x: number, y: number) => void) | null {
        return this.onNextClickAction;
    }
    public setOnNextClickAction(fn: ((x: number, y: number) => void) | null): void {
        this.onNextClickAction = fn;
    }

    // --- Accessors for UI/Input ---
    public getApp() {
        return this.app;
    }
    public getWorldContainer() {
        return this.worldContainer;
    }
    public getProcCache() {
        return this.procCache;
    }
    public getZoom() {
        return this.zoom;
    }
    public setZoom(z: number) {
        this.zoom = z;
        if (this.worldContainer) {
            this.worldContainer.scale.set(z);
        }
    }
    public triggerZoomUIUpdate() {
        this.updateZoomUI();
    }
    public getEditingMode() {
        return this.editingMode;
    }
    public getCurrentTool() {
        return this.currentTool;
    }
    public getSelectedAsset() {
        return this.selectedAsset;
    }
    public getBrushCursor() {
        return this.brushCursor;
    }
    public getCommandManager() {
        return this.commandManager;
    }
    public getWaypointManager() {
        return this.waypointManager;
    }

    public enterHeroSpawnPlacementMode(): void {
        if (!this.chunkManager || !this.app || !this.worldContainer) return;
        const viewport = this.getViewportWorldRect();
        if (!viewport) return;
        const centerX = viewport.x + viewport.width / 2;
        const centerY = viewport.y + viewport.height / 2;
        this.executeCommand(
            new SetHeroSpawnCommand(this.chunkManager, Math.round(centerX), Math.round(centerY))
        );
        Logger.info(
            `[MapEditor] Hero spawn set to view center: ${Math.round(centerX)}, ${Math.round(centerY)}`
        );
    }

    public moveSelectedObjectTo(newX: number, newY: number): boolean {
        if (!this.selectedObject || !this.chunkManager) return false;
        const { x, y, id } = this.selectedObject;
        this.commandManager.execute(new MoveObjectCommand(this.chunkManager, x, y, newX, newY, id));
        this.selectedObject = { id, x: newX, y: newY };
        this.onCommandExecuted?.();
        return true;
    }

    public removeSelectedObject(): boolean {
        if (!this.selectedObject || !this.chunkManager) return false;
        const { x, y, id } = this.selectedObject;
        this.commandManager.execute(
            new BatchObjectCommand(this.chunkManager, [{ type: 'remove', x, y, assetId: id }])
        );
        this.selectedObject = null;
        this.onCommandExecuted?.();
        return true;
    }

    /** Get the mapgen4 param from the current procedural cache (what is actually displayed). Use for save. */
    public getMapgen4Param(): Mapgen4Param | null {
        return this.procCache?.param ?? null;
    }

    /** Update procedural preview — builds cache when param changes. Uses manual towns/stations/waypoints when set. */
    public async setProceduralPreview(param: Mapgen4Param): Promise<void> {
        const manual: import('./Mapgen4Generator').ManualTownsAndRailroads | undefined =
            this.manualTowns.length > 0 ||
            this.manualStations.length > 0 ||
            this.railroadWaypoints.length > 0
                ? {
                      manualTowns: this.manualTowns.length > 0 ? [...this.manualTowns] : undefined,
                      manualStations:
                          this.manualStations.length > 0
                              ? this.manualStations.map((s) => ({ ...s }))
                              : undefined,
                      railroadWaypoints:
                          this.railroadWaypoints.length > 0
                              ? this.railroadWaypoints.map((w) => ({ ...w }))
                              : undefined
                  }
                : undefined;
        let newCache: import('./MapEditorProceduralRenderer').ProceduralCache;
        try {
            newCache = await buildProceduralCache(param, manual);
        } catch (err) {
            Logger.error('[MapEditor] buildProceduralCache failed (possibly OOM)', err);
            return;
        }
        const wantedStations = this.manualStations.length >= 2;
        const newPathEmpty = newCache.railroadPath.length < 2;
        const hadPath = (this.procCache?.railroadPath?.length ?? 0) >= 2;
        if (wantedStations && newPathEmpty && this.procCache && hadPath) {
            this.procCache = {
                ...newCache,
                railroadPath: this.procCache.railroadPath,
                railroadCrossings: this.procCache.railroadCrossings,
                railroadStationIds: this.procCache.railroadStationIds
            };
        } else {
            this.procCache = newCache;
        }
        if (this.railroadState.railroadMeshContainer) {
            this.railroadState.railroadMeshContainer.destroy({ children: true });
            this.railroadState.railroadMeshContainer = null;
        }
        for (const m of this.railroadState.railroadMeshes) m.destroy();
        this.railroadState = { railroadMeshContainer: null, railroadMeshes: [], cacheKey: null };
        this.updateRailroadMeshesFromCache();
        this.lastMainViewViewportKey = null;
    }

    /**
     * Draw cached mesh to a canvas (e.g. sidebar). Uses full viewport (0..1000) if viewport omitted.
     * Returns true if drawn; false if no cache.
     */
    public drawCachedToCanvas(
        canvas: HTMLCanvasElement,
        viewport?: { x: number; y: number; width: number; height: number }
    ): boolean {
        if (!this.procCache) return false;
        return drawProceduralToCanvas(
            this.procCache,
            canvas,
            viewport,
            EditorContext.hiddenZoneIds
        );
    }

    /** Update railroad PIXI meshes when cache or visibility changes. Uses spline mesh for gapless rendering. */
    private updateRailroadMeshesFromCache(): void {
        if (!this.procCache || !this.worldContainer) return;
        this.railroadState = updateRailroadMeshes(
            this.procCache,
            this.worldContainer,
            EditorContext.hiddenZoneIds,
            this.railroadState,
            true
        );
    }

    /** Draw procedural map to offscreen canvas; display via PIXI sprite on stage. */
    private drawProceduralToMainView(): void {
        if (
            !this.procCache ||
            !this.proceduralCanvas ||
            !this.proceduralSprite ||
            !this.app ||
            !this.worldContainer
        )
            return;
        const maxSize = MapEditorConfig.MAX_PROCEDURAL_CANVAS_SIZE;
        const w = Math.min(this.app.canvas.width, maxSize);
        const h = Math.min(this.app.canvas.height, maxSize);
        if (w < 1 || h < 1) return;

        const { vpX, vpY, vpW, vpH } = worldToMeshViewport(this.worldContainer, this.zoom, w, h);
        if (!Number.isFinite(vpX + vpY + vpW + vpH) || vpW < 1 || vpH < 1) return;
        const visKey = [...EditorContext.hiddenZoneIds].sort().join(',');
        const vpKey = `${Math.round(vpX * 10) / 10},${Math.round(vpY * 10) / 10},${Math.round(vpW * 10) / 10},${Math.round(vpH * 10) / 10}|${visKey}`;
        if (vpKey === this.lastMainViewViewportKey) return;
        this.lastMainViewViewportKey = vpKey;

        // Resize offscreen canvas if needed; rebuild texture source when dimensions change
        if (this.proceduralCanvas.width !== w || this.proceduralCanvas.height !== h) {
            this.proceduralCanvas.width = w;
            this.proceduralCanvas.height = h;
            const newSource = new PIXI.CanvasSource({
                resource: this.proceduralCanvas,
                dynamic: true
            });
            const oldTexture = this.proceduralSprite.texture;
            this.proceduralSprite.texture = new PIXI.Texture({ source: newSource });
            oldTexture.destroy();
        }

        // Railroad rendered as PIXI spline mesh (gapless); skip on canvas.
        drawProceduralToCanvas(
            this.procCache,
            this.proceduralCanvas,
            { x: vpX, y: vpY, width: vpW, height: vpH },
            EditorContext.hiddenZoneIds,
            true
        );

        this.proceduralSprite.width = w;
        this.proceduralSprite.height = h;
        this.proceduralSprite.texture.source.update();
    }

    public getViewportWorldRect(): { x: number; y: number; width: number; height: number } | null {
        if (!this.app || !this.worldContainer) return null;
        const w = this.app.canvas.width / this.zoom;
        const h = this.app.canvas.height / this.zoom;
        return {
            x: -this.worldContainer.x / this.zoom,
            y: -this.worldContainer.y / this.zoom,
            width: w,
            height: h
        };
    }
    public centerViewOn(worldX: number, worldY: number): void {
        if (!this.app || !this.worldContainer) return;
        const cx = this.app.canvas.width / 2;
        const cy = this.app.canvas.height / 2;
        this.worldContainer.x = cx - worldX * this.zoom;
        this.worldContainer.y = cy - worldY * this.zoom;
    }
    public serialize(): {
        version: number;
        chunks: ChunkData[];
        heroSpawn?: import('./MapEditorTypes').HeroSpawnPosition;
        manualTowns?: number[];
        manualStations?: import('../../world/MapDataService').ManualStation[];
        railroadWaypoints?: import('../../world/MapDataService').RailroadWaypointEntry[];
    } | null {
        const base = this.chunkManager?.serialize() ?? null;
        if (!base) return null;
        const out: NonNullable<ReturnType<MapEditorCore['serialize']>> = { ...base };
        if (this.manualTowns.length > 0) out.manualTowns = [...this.manualTowns];
        if (this.manualStations.length > 0)
            out.manualStations = this.manualStations.map((s) => ({ ...s }));
        if (this.railroadWaypoints.length > 0)
            out.railroadWaypoints = this.railroadWaypoints.map((w) => ({ ...w }));
        return out;
    }
    public loadData(data: {
        version?: number;
        chunks?: ChunkData[];
        heroSpawn?: import('./MapEditorTypes').HeroSpawnPosition;
        manualTowns?: number[];
        manualStations?: import('../../world/MapDataService').ManualStation[];
        railroadWaypoints?: import('../../world/MapDataService').RailroadWaypointEntry[];
    }): void {
        this.chunkManager?.deserialize(data);
        this.commandManager.clear();
        this.manualTowns = Array.isArray(data.manualTowns) ? [...data.manualTowns] : [];
        this.manualStations = Array.isArray(data.manualStations)
            ? data.manualStations.map((s) => ({ regionId: s.regionId, order: s.order }))
            : [];
        this.railroadWaypoints = Array.isArray(data.railroadWaypoints)
            ? data.railroadWaypoints.map((w) => ({ legIndex: w.legIndex, regionId: w.regionId }))
            : [];
        this.onManualDataChange?.();
    }

    public setOnManualDataChange(fn: (() => void) | null): void {
        this.onManualDataChange = fn;
    }
    public setOnCommandExecuted(fn: (() => void) | null): void {
        this.onCommandExecuted = fn;
    }
    public getManualTowns(): number[] {
        return [...this.manualTowns];
    }
    public getManualStations(): ManualStation[] {
        return this.manualStations.map((s) => ({ ...s }));
    }
    public getRailroadWaypoints(): RailroadWaypointEntry[] {
        return this.railroadWaypoints.map((w) => ({ ...w }));
    }
    public addManualTown(regionId: number): void {
        if (this.manualTowns.includes(regionId)) return;
        this.manualTowns.push(regionId);
        this.onManualDataChange?.();
    }
    public removeManualTown(regionId: number): void {
        this.manualTowns = this.manualTowns.filter((r) => r !== regionId);
        this.onManualDataChange?.();
    }
    public addManualStation(regionId: number, order: number): void {
        const next =
            order <= 0 ? this.manualStations.reduce((m, s) => Math.max(m, s.order), 0) + 1 : order;
        this.manualStations.push({ regionId, order: next });
        this.onManualDataChange?.();
    }
    public setStationOrder(index: number, order: number): void {
        if (index < 0 || index >= this.manualStations.length) return;
        this.manualStations[index] = { ...this.manualStations[index]!, order };
        this.onManualDataChange?.();
    }
    /** Move town at index to a new polygon. Removes duplicate if regionId already exists at another index. */
    public setManualTownAt(index: number, regionId: number): void {
        if (index < 0 || index >= this.manualTowns.length) return;
        const out: number[] = [];
        for (let i = 0; i < this.manualTowns.length; i++) {
            if (i === index) {
                out.push(regionId);
            } else if (this.manualTowns[i] !== regionId) {
                out.push(this.manualTowns[i]);
            }
        }
        this.manualTowns = out;
        this.onManualDataChange?.();
    }
    /** Move station at index to a new polygon (keeps order). */
    public setManualStationRegion(index: number, regionId: number): void {
        if (index < 0 || index >= this.manualStations.length) return;
        this.manualStations[index] = { ...this.manualStations[index]!, regionId };
        this.onManualDataChange?.();
    }
    public removeManualStation(regionId: number): void {
        this.manualStations = this.manualStations.filter((s) => s.regionId !== regionId);
        this.onManualDataChange?.();
    }
    public addWaypoint(_legIndex: number, _regionId: number, _insertIndex?: number): void {
        const waypoint = { legIndex: _legIndex, regionId: _regionId };
        if (_insertIndex !== undefined) {
            let legCount = 0;
            let inserted = false;
            for (let i = 0; i < this.railroadWaypoints.length; i++) {
                if (this.railroadWaypoints[i]!.legIndex === _legIndex) {
                    if (legCount === _insertIndex) {
                        this.railroadWaypoints.splice(i, 0, waypoint);
                        inserted = true;
                        break;
                    }
                    legCount++;
                }
            }
            if (!inserted) {
                this.railroadWaypoints.push(waypoint);
            }
        } else {
            this.railroadWaypoints.push(waypoint);
        }
        this.onManualDataChange?.();
    }
    public updateWaypointRegion(
        _legIndex: number,
        _waypointIndex: number,
        _regionId: number
    ): void {
        const entries = this.railroadWaypoints.filter((w) => w.legIndex === _legIndex);
        if (_waypointIndex < 0 || _waypointIndex >= entries.length) return;
        const globalIdx = this.railroadWaypoints.indexOf(entries[_waypointIndex]!);
        if (globalIdx >= 0)
            this.railroadWaypoints[globalIdx] = { legIndex: _legIndex, regionId: _regionId };
        this.onManualDataChange?.();
    }
    public removeWaypoint(_legIndex: number, _waypointIndex: number): void {
        const entries = this.railroadWaypoints
            .map((w, i) => ({ w, i }))
            .filter(({ w }) => w.legIndex === _legIndex);
        if (_waypointIndex < 0 || _waypointIndex >= entries.length) return;
        const globalIdx = entries[_waypointIndex]!.i;
        this.railroadWaypoints.splice(globalIdx, 1);
        this.onManualDataChange?.();
    }

    private refreshZoneRendering() {
        this.chunkManager?.refreshZones();
    }
}
