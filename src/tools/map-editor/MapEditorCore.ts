import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkManager } from './ChunkManager';
import { ChunkData, MapObject } from './MapEditorTypes';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';
import { EditorContext } from './EditorContext';
import { CommandManager } from './commands/CommandManager';
import { PaintSplatCommand, SplatChange } from './commands/PaintSplatCommand';
import { BatchObjectCommand } from './commands/BatchObjectCommand';
import { MoveObjectCommand } from './commands/MoveObjectCommand';
import type { Mapgen4Param } from './Mapgen4Generator';
import {
    buildProceduralCache,
    drawProceduralToCanvas,
    updateRailroadMeshes,
    worldToMeshViewport,
    type ProceduralCache,
    type RailroadMeshState
} from './MapEditorProceduralRenderer';
import { createZoomUI, updateZoomUI, updateCursorCoords } from './MapEditorUIOverlays';
import { createScaleReferenceOverlay, type ScaleReferenceOverlay } from './MapEditorScaleReference';
import { updateBrushCursor } from './MapEditorBrushCursor';
import { handleZoom as handleZoomImpl, screenToWorld, toCanvasCoords } from './MapEditorInputHandlers';
import { executeTool } from './MapEditorToolUse';
import { preloadRegistry } from './MapEditorRegistry';
import { AssetLoader } from '@core/AssetLoader';
import { createPixiApp } from './MapEditorMount';
import { runMapEditorUpdate } from './MapEditorUpdate';
import { EntityLoader } from '@entities/EntityLoader';
import { computeZoomReset } from './MapEditorZoomReset';

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
    private editingMode: 'object' | 'zone' | 'ground' = 'object';
    private activeZoneCategory: ZoneCategory = ZoneCategory.BIOME;
    private selectedZoneId: string | null = null;
    private brushSize: number = 1; // 1 = 1x1, 2 = 3x3 approx (radius)
    /** Zone IDs that are currently hidden. Empty = everything visible (default). */
    private hiddenZoneIds: Set<string> = new Set();

    // Viewport State
    private zoom: number = 1.0; // Default to 100% (Gameplay parity)
    private isDragging: boolean = false;
    private isPainting: boolean = false;
    private isSpacePressed: boolean = false;
    private lastMousePosition: { x: number; y: number } = { x: 0, y: 0 };
    private currentSplatChanges: SplatChange[] = [];
    private currentObjectActions: {
        type: 'add' | 'remove';
        x: number;
        y: number;
        assetId: string;
    }[] = [];

    private selectedObject: MapObject | null = null;
    private onNextClickAction: ((x: number, y: number) => void) | null = null;

    private scaleReferenceOverlay: ScaleReferenceOverlay | null = null;

    /** Debug: show train station order numbers above each station polygon. */
    private debugShowStationNumbers: boolean = false;
    private debugOverlayContainer: PIXI.Container | null = null;
    private debugConnectionGraphics: PIXI.Graphics | null = null;

    // Commands
    private commandManager: CommandManager;

    constructor() {
        this.commandManager = new CommandManager();
        Logger.info('[MapEditorCore] Instantiated');
    }

    public selectAsset(id: string, category: string) {
        if (category === 'zone') {
            this.selectedZoneId = id;
            this.selectedAsset = null;
            this.editingMode = 'zone';
        } else {
            this.selectedAsset = { id, category };
            this.selectedZoneId = null; // Clear zone selection to avoid confusion
            this.editingMode = 'object';
            // Preload so the actual asset appears immediately on first placement (no placeholder)
            AssetLoader.preloadImage(id);
        }
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
        EditorContext.hiddenZoneIds = this.hiddenZoneIds;

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

    public setMode(mode: 'object' | 'zone' | 'ground') {
        this.editingMode = mode;
        Logger.info(`[MapEditor] Mode set to ${mode}`);
    }
    public setZoneCategory(cat: ZoneCategory) {
        this.activeZoneCategory = cat;
        EditorContext.activeZoneCategory = cat;
        Logger.info(`[MapEditor] Zone Category: ${cat}`);
    }
    public setSelectedZone(id: string) {
        this.selectedZoneId = id;
        Logger.info(`[MapEditor] Zone Selected: ${id}`);
    }
    public setBrushSize(size: number) {
        this.brushSize = size;
        Logger.info(`[MapEditor] Brush Size: ${size}`);
    }
    public toggleZoneVisibility(id: string, visible: boolean) {
        if (visible) this.hiddenZoneIds.delete(id);
        else this.hiddenZoneIds.add(id);

        EditorContext.hiddenZoneIds = this.hiddenZoneIds;
        this.updateRailroadMeshesFromCache();
        this.lastMainViewViewportKey = null;
        this.refreshZoneRendering();
    }

    public toggleCategoryVisibility(cat: ZoneCategory, visible: boolean) {
        Object.values(ZoneConfig).forEach((def) => {
            if (def.category === cat) {
                if (visible) this.hiddenZoneIds.delete(def.id);
                else this.hiddenZoneIds.add(def.id);
            }
        });
        EditorContext.hiddenZoneIds = this.hiddenZoneIds;
        this.updateRailroadMeshesFromCache();
        this.lastMainViewViewportKey = null;
        this.refreshZoneRendering();
    }

    public setGridOpacity(opacity: number) { this.chunkManager?.setGridOpacity(opacity); }

    private createUIOverlays() {
        createZoomUI(this.container, () => this.resetZoomToGame());
        updateZoomUI(this.zoom);
    }

    private resetZoomToGame(): void {
        if (!this.app || !this.worldContainer) return;
        const { zoom, worldX, worldY } = computeZoomReset({
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

    private updateZoomUI() { updateZoomUI(this.zoom); }

    public unmount(): void {
        if (!this.isInitialized || !this.app) return;
        Logger.info('[MapEditorCore] Unmounting...');
        this.app.ticker.remove(this.update, this);
        this.scaleReferenceOverlay?.destroy();
        this.scaleReferenceOverlay = null;
        this.app.destroy(true, { children: true });
        this.app = this.container = this.worldContainer = this.chunkManager = null;
        this.proceduralCanvas = null;
        this.proceduralSprite = null;
        this.procCache = null;
        this.debugOverlayContainer = null;
        this.debugConnectionGraphics = null;
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
        this.scaleReferenceOverlay?.update(this.zoom, this.app.canvas.width, this.app.canvas.height);
        this.updateDebugOverlay();
    }

    private setupInputListeners(): void {
        if (!this.app?.canvas) return;
        const canvas = this.app.canvas;
        canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.isSpacePressed = true;
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                e.shiftKey ? this.commandManager.redo() : this.commandManager.undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
                e.preventDefault();
                this.commandManager.redo();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') this.isSpacePressed = false;
        });
    }

    private handleZoom(e: WheelEvent): void {
        handleZoomImpl(
            e,
            this.app!,
            this.worldContainer,
            this.zoom,
            (v) => { this.zoom = v; this.worldContainer?.scale.set(v); },
            (x, y) => {
                if (this.worldContainer) {
                    this.worldContainer.x = x;
                    this.worldContainer.y = y;
                }
            },
            () => this.updateZoomUI()
        );
    }

    private handleMouseDown(e: MouseEvent): void {
        // Middle click or Space+LeftClick = Pan
        if (e.button === 1 || (e.button === 0 && this.isSpacePressed) && this.app) {
            this.isDragging = true;
            const { x, y } = toCanvasCoords(e.clientX, e.clientY, this.app.canvas);
            this.lastMousePosition = { x, y };
        }
        // Left click = Tool Action or pending click action (e.g. move)
        else if (e.button === 0) {
            if (this.onNextClickAction && this.app && this.worldContainer) {
                const { worldX, worldY } = screenToWorld(e, this.app, this.worldContainer, this.zoom);
                const fn = this.onNextClickAction;
                this.onNextClickAction = null;
                fn(worldX, worldY);
                return;
            }
            this.isPainting = true;
            this.useTool(e);
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (this.isDragging && this.worldContainer && this.app) {
            const { x, y } = toCanvasCoords(e.clientX, e.clientY, this.app.canvas);
            const dx = x - this.lastMousePosition.x;
            const dy = y - this.lastMousePosition.y;

            this.worldContainer.x += dx;
            this.worldContainer.y += dy;

            this.lastMousePosition = { x, y };
        }

        // Drag Painting
        if (this.isPainting) {
            this.useTool(e);
        }

        if (this.worldContainer && this.app) {
            const { worldX, worldY } = screenToWorld(e, this.app, this.worldContainer, this.zoom);
            updateCursorCoords(worldX, worldY);
            if (this.brushCursor) {
                updateBrushCursor({
                    brushCursor: this.brushCursor,
                    worldX,
                    worldY,
                    editingMode: this.editingMode,
                    currentTool: this.currentTool,
                    brushSize: this.brushSize,
                    zoom: this.zoom,
                    shiftKey: e.shiftKey
                });
            }
        }
    }

    private handleMouseUp(_e: MouseEvent): void {
        this.isDragging = false;
        this.isPainting = false;
        if (this.currentSplatChanges.length > 0) {
            this.commandManager.execute(new PaintSplatCommand(this.chunkManager!, [...this.currentSplatChanges]));
            this.currentSplatChanges = [];
            Logger.info('[MapEditor] Paint Stroke Recorded');
        }
        if (this.currentObjectActions.length > 0) {
            this.commandManager.record(new BatchObjectCommand(this.chunkManager!, [...this.currentObjectActions]));
            this.currentObjectActions = [];
            Logger.info('[MapEditor] Object Batch Recorded');
        }
    }

    private useTool(e: MouseEvent): void {
        if (!this.chunkManager || !this.worldContainer || !this.app) return;

        const { worldX, worldY } = screenToWorld(e, this.app, this.worldContainer, this.zoom);

        executeTool(
            worldX,
            worldY,
            e,
            {
                currentTool: this.currentTool,
                editingMode: this.editingMode,
                brushSize: this.brushSize,
                selectedAsset: this.selectedAsset,
                selectedZoneId: this.selectedZoneId,
                activeZoneCategory: this.activeZoneCategory
            },
            this.chunkManager,
            this.commandManager,
            this.currentObjectActions,
            {
                onSplatChanges: (changes) => this.currentSplatChanges.push(...changes),
                onObjectAction: (action) => this.currentObjectActions.push(action)
            }
        );
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

    private updateDebugOverlay(): void {
        if (!this.worldContainer || !this.app) return;

        if (!this.debugShowStationNumbers) {
            if (this.debugOverlayContainer) {
                this.debugOverlayContainer.visible = false;
            }
            return;
        }

        if (!this.procCache || this.procCache.railroadPath.length < 2) {
            if (this.debugOverlayContainer) this.debugOverlayContainer.visible = false;
            return;
        }

        const path = this.procCache.railroadPath;
        const mesh = this.procCache.meshAndMap.mesh;
        const MESH_TO_WORLD = (MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE) / 1000;

        const n = path.length - 1; // unique stations (path includes closing duplicate)
        if (n < 1) return;

        if (!this.debugOverlayContainer) {
            this.debugOverlayContainer = new PIXI.Container();
            this.debugOverlayContainer.zIndex = 10000;
            this.debugOverlayContainer.eventMode = 'none';
            this.app.stage.addChild(this.debugOverlayContainer);
        }

        this.debugOverlayContainer.visible = true;

        const wc = this.worldContainer;
        const screenX = (worldX: number) => wc.x + worldX * this.zoom;
        const screenY = (worldY: number) => wc.y + worldY * this.zoom;

        // Pre-compute screen positions for all unique stations
        const stationScreenPos: { sx: number; sy: number }[] = [];
        for (let i = 0; i < n; i++) {
            const regionId = path[i];
            const mx = mesh.x_of_r(regionId);
            const my = mesh.y_of_r(regionId);
            stationScreenPos.push({
                sx: screenX(mx * MESH_TO_WORLD),
                sy: screenY(my * MESH_TO_WORLD)
            });
        }

        // --- Draw connection lines between consecutive stations ---
        if (!this.debugConnectionGraphics) {
            this.debugConnectionGraphics = new PIXI.Graphics();
            this.debugConnectionGraphics.eventMode = 'none';
            this.debugOverlayContainer.addChildAt(this.debugConnectionGraphics, 0);
        }
        const gfx = this.debugConnectionGraphics;
        gfx.clear();

        // Color palette for segments: cycle through distinct colors
        const segColors = [0xff0000, 0x00ff00, 0x0088ff, 0xff8800, 0xff00ff, 0x00ffff, 0xffff00, 0x88ff00, 0xff0088, 0x8800ff];
        for (let i = 0; i < path.length - 1; i++) {
            const fromIdx = i;
            const toIdx = (i + 1) % n; // wrap for the closing segment
            const from = stationScreenPos[fromIdx < n ? fromIdx : 0];
            const to = stationScreenPos[toIdx];
            const color = segColors[i % segColors.length];

            gfx.moveTo(from.sx, from.sy);
            gfx.lineTo(to.sx, to.sy);
            gfx.stroke({ width: 3, color, alpha: 0.8 });

            // Draw small arrowhead at midpoint pointing in the direction of travel
            const midX = (from.sx + to.sx) / 2;
            const midY = (from.sy + to.sy) / 2;
            const dx = to.sx - from.sx;
            const dy = to.sy - from.sy;
            const len = Math.hypot(dx, dy);
            if (len > 10) {
                const ux = dx / len;
                const uy = dy / len;
                const arrowSize = 10;
                gfx.moveTo(midX - ux * arrowSize + uy * arrowSize * 0.5, midY - uy * arrowSize - ux * arrowSize * 0.5);
                gfx.lineTo(midX, midY);
                gfx.lineTo(midX - ux * arrowSize - uy * arrowSize * 0.5, midY - uy * arrowSize + ux * arrowSize * 0.5);
                gfx.stroke({ width: 2, color, alpha: 1 });
            }
        }

        // --- Draw station number labels ---
        const FONT_SIZE = 24;
        // Labels start after the graphics child (index 0 = graphics)
        const labelStartIdx = 1;
        const existingLabels = this.debugOverlayContainer.children.length - labelStartIdx;
        for (let i = 0; i < n; i++) {
            const { sx, sy } = stationScreenPos[i];
            let label: PIXI.Text;
            if (i < existingLabels) {
                label = this.debugOverlayContainer.children[i + labelStartIdx] as PIXI.Text;
            } else {
                label = new PIXI.Text({
                    text: String(i + 1),
                    style: {
                        fontFamily: 'monospace',
                        fontSize: FONT_SIZE,
                        fill: 0xffff00,
                        stroke: { color: 0x000000, width: 2 }
                    }
                });
                label.anchor.set(0.5, 1);
                label.eventMode = 'none';
                this.debugOverlayContainer.addChild(label);
            }
            label.text = String(i + 1);
            label.position.set(sx, sy);
            label.visible = true;
        }
        for (let i = n; i < existingLabels; i++) {
            (this.debugOverlayContainer.children[i + labelStartIdx] as PIXI.Text).visible = false;
        }
    }

    public getChunkManager(): ChunkManager | null { return this.chunkManager; }

    public setSelectedObject(obj: MapObject | null): void { this.selectedObject = obj; }
    public getSelectedObject(): MapObject | null { return this.selectedObject; }

    public setOnNextClickAction(fn: ((x: number, y: number) => void) | null): void {
        this.onNextClickAction = fn;
    }

    private enterHeroSpawnPlacementMode(): void {
        if (!this.chunkManager || !this.app || !this.worldContainer) return;
        const viewport = this.getViewportWorldRect();
        if (!viewport) return;
        const centerX = viewport.x + viewport.width / 2;
        const centerY = viewport.y + viewport.height / 2;
        this.chunkManager.setHeroSpawn(centerX, centerY);
        Logger.info(`[MapEditor] Hero spawn set to view center: ${Math.round(centerX)}, ${Math.round(centerY)}`);
    }

    public moveSelectedObjectTo(newX: number, newY: number): boolean {
        if (!this.selectedObject || !this.chunkManager) return false;
        const { x, y, id } = this.selectedObject;
        this.commandManager.execute(new MoveObjectCommand(this.chunkManager, x, y, newX, newY, id));
        this.selectedObject = { id, x: newX, y: newY };
        return true;
    }

    public removeSelectedObject(): boolean {
        if (!this.selectedObject || !this.chunkManager) return false;
        const { x, y, id } = this.selectedObject;
        this.commandManager.execute(
            new BatchObjectCommand(this.chunkManager, [{ type: 'remove', x, y, assetId: id }])
        );
        this.selectedObject = null;
        return true;
    }

    /** Get the mapgen4 param from the current procedural cache (what is actually displayed). Use for save. */
    public getMapgen4Param(): Mapgen4Param | null {
        return this.procCache?.param ?? null;
    }

    /** Update procedural preview — builds cache when param changes. Awaits railroad asset preload so tracks render immediately. */
    public async setProceduralPreview(param: Mapgen4Param): Promise<void> {
        this.procCache = await buildProceduralCache(param);
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
        return drawProceduralToCanvas(this.procCache, canvas, viewport, this.hiddenZoneIds);
    }

    /** Update railroad PIXI meshes when cache or visibility changes. Uses spline mesh for gapless rendering. */
    private updateRailroadMeshesFromCache(): void {
        if (!this.procCache || !this.worldContainer) return;
        this.railroadState = updateRailroadMeshes(
            this.procCache,
            this.worldContainer,
            this.hiddenZoneIds,
            this.railroadState,
            true
        );
    }

    /** Draw procedural map to offscreen canvas; display via PIXI sprite on stage. */
    private drawProceduralToMainView(): void {
        if (!this.procCache || !this.proceduralCanvas || !this.proceduralSprite || !this.app || !this.worldContainer) return;
        const w = this.app.canvas.width;
        const h = this.app.canvas.height;
        if (w < 1 || h < 1) return;

        const { vpX, vpY, vpW, vpH } = worldToMeshViewport(
            this.worldContainer,
            this.zoom,
            w,
            h
        );
        if (!Number.isFinite(vpX + vpY + vpW + vpH) || vpW < 1 || vpH < 1) return;
        const visKey = [...this.hiddenZoneIds].sort().join(',');
        const vpKey = `${Math.round(vpX * 10) / 10},${Math.round(vpY * 10) / 10},${Math.round(vpW * 10) / 10},${Math.round(vpH * 10) / 10}|${visKey}`;
        if (vpKey === this.lastMainViewViewportKey) return;
        this.lastMainViewViewportKey = vpKey;

        // Resize offscreen canvas if needed; rebuild texture source when dimensions change
        if (this.proceduralCanvas.width !== w || this.proceduralCanvas.height !== h) {
            this.proceduralCanvas.width = w;
            this.proceduralCanvas.height = h;
            const newSource = new PIXI.CanvasSource({ resource: this.proceduralCanvas, dynamic: true });
            const oldTexture = this.proceduralSprite.texture;
            this.proceduralSprite.texture = new PIXI.Texture({ source: newSource });
            oldTexture.destroy();
        }

        // Railroad rendered as PIXI spline mesh (gapless); skip on canvas.
        drawProceduralToCanvas(
            this.procCache,
            this.proceduralCanvas,
            { x: vpX, y: vpY, width: vpW, height: vpH },
            this.hiddenZoneIds,
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
        return { x: -this.worldContainer.x / this.zoom, y: -this.worldContainer.y / this.zoom, width: w, height: h };
    }
    public centerViewOn(worldX: number, worldY: number): void {
        if (!this.app || !this.worldContainer) return;
        const cx = this.app.canvas.width / 2;
        const cy = this.app.canvas.height / 2;
        this.worldContainer.x = cx - worldX * this.zoom;
        this.worldContainer.y = cy - worldY * this.zoom;
    }
    public serialize(): { version: number; chunks: ChunkData[] } | null {
        return this.chunkManager?.serialize() ?? null;
    }
    public loadData(data: { version?: number; chunks?: ChunkData[] }): void {
        this.chunkManager?.deserialize(data);
        this.commandManager.clear();
    }

    private refreshZoneRendering() { this.chunkManager?.refreshZones(); }
}
