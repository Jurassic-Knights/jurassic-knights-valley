import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkManager } from './ChunkManager';
import { ChunkData } from './MapEditorTypes';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';
import { EditorContext } from './EditorContext';
import { CommandManager } from './commands/CommandManager';
import { PaintSplatCommand, SplatChange } from './commands/PaintSplatCommand';
import { BatchObjectCommand } from './commands/BatchObjectCommand';
import {
    buildMeshAndMap,
    drawCachedMeshToCanvas,
    type MeshAndMap
} from './Mapgen4Generator';
import type { Mapgen4Param } from './Mapgen4Generator';
import { createZoomUI, updateZoomUI, updateCursorCoords } from './MapEditorUIOverlays';
import { updateBrushCursor } from './MapEditorBrushCursor';
import { handleZoom as handleZoomImpl, screenToWorld } from './MapEditorInputHandlers';
import { executeTool } from './MapEditorToolUse';
import { preloadRegistry } from './MapEditorRegistry';
import { createPixiApp } from './MapEditorMount';
import { runMapEditorUpdate } from './MapEditorUpdate';

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
    private lastProcParam: Mapgen4Param | null = null;
    private procCache: { meshAndMap: MeshAndMap; param: Mapgen4Param } | null = null;
    private lastViewportKey: string | null = null;
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
    private visibleZoneIds: Set<string> = new Set(Object.keys(ZoneConfig)); // Default all visible

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

        preloadRegistry(dataFetcher);

        const result = await createPixiApp(this.container, this.zoom);
        this.app = result.app;
        this.worldContainer = result.worldContainer;
        this.proceduralCanvas = result.proceduralCanvas;
        this.chunkManager = result.chunkManager;
        this.brushCursor = result.brushCursor;
        this.zoom = result.initialZoom;

        this.setupInputListeners();
        this.app.ticker.add(this.update, this);
        this.createUIOverlays();

        this.isInitialized = true;
        EditorContext.visibleZoneIds = this.visibleZoneIds;

        Logger.info('[MapEditorCore] Initialized successfully');
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
        if (visible) this.visibleZoneIds.add(id);
        else this.visibleZoneIds.delete(id);

        EditorContext.visibleZoneIds = this.visibleZoneIds;
        this.refreshZoneRendering();
    }

    public toggleCategoryVisibility(cat: ZoneCategory, visible: boolean) {
        Object.values(ZoneConfig).forEach((def) => {
            if (def.category === cat) visible ? this.visibleZoneIds.add(def.id) : this.visibleZoneIds.delete(def.id);
        });
        EditorContext.visibleZoneIds = this.visibleZoneIds;
        this.refreshZoneRendering();
    }

    public setGridOpacity(opacity: number) { this.chunkManager?.setGridOpacity(opacity); }

    private createUIOverlays() {
        createZoomUI(this.container);
        updateZoomUI(this.zoom);
    }

    private updateZoomUI() { updateZoomUI(this.zoom); }

    public unmount(): void {
        if (!this.isInitialized || !this.app) return;
        Logger.info('[MapEditorCore] Unmounting...');
        this.app.ticker.remove(this.update, this);
        this.app.destroy(true, { children: true });
        this.app = this.container = this.worldContainer = this.chunkManager = null;
        this.proceduralCanvas = null;
        this.procCache = null;
        this.lastProcParam = null;
        this.lastViewportKey = null;
        this.isInitialized = false;
    }

    private update(_ticker: PIXI.Ticker): void {
        if (!this.chunkManager || !this.app || !this.worldContainer) return;
        runMapEditorUpdate(this.app, this.worldContainer, this.zoom, this.chunkManager);
        this.redrawProceduralIfNeeded();
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
        if (e.button === 1 || (e.button === 0 && this.isSpacePressed)) {
            this.isDragging = true;
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        }
        // Left click = Tool Action
        else if (e.button === 0) {
            this.isPainting = true;
            this.useTool(e);
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (this.isDragging && this.worldContainer) {
            const dx = e.clientX - this.lastMousePosition.x;
            const dy = e.clientY - this.lastMousePosition.y;

            this.worldContainer.x += dx;
            this.worldContainer.y += dy;

            this.lastMousePosition = { x: e.clientX, y: e.clientY };
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

    public getChunkManager(): ChunkManager | null { return this.chunkManager; }

    /** Update procedural preview — builds cache when param changes. Supports pan/zoom via cached draw. */
    public setProceduralPreview(param: Mapgen4Param): void {
        this.lastProcParam = param;
        const hasMapData = (this.chunkManager?.getWorldData()?.size ?? 0) > 0;
        if (hasMapData) {
            this.proceduralCanvas?.style.setProperty('display', 'none');
            this.procCache = null;
            return;
        }
        this.proceduralCanvas?.style.setProperty('display', 'block');
        this.procCache = { meshAndMap: buildMeshAndMap(param), param };
        this.lastViewportKey = null;
        if (this.container && this.proceduralCanvas) {
            this.proceduralCanvas.width = this.container.clientWidth;
            this.proceduralCanvas.height = this.container.clientHeight;
        }
        this.redrawProceduralIfNeeded();
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
        const { meshAndMap, param } = this.procCache;
        const vpX = viewport?.x ?? 0;
        const vpY = viewport?.y ?? 0;
        const vpW = viewport?.width ?? 1000;
        const vpH = viewport?.height ?? 1000;
        drawCachedMeshToCanvas(canvas, meshAndMap.mesh, meshAndMap.map, param, vpX, vpY, vpW, vpH);
        return true;
    }

    /** Redraw procedural canvas with current viewport (supports zoom/pan). Uses cache; throttles by viewport. */
    private redrawProceduralIfNeeded(): void {
        if (
            !this.proceduralCanvas ||
            !this.procCache ||
            this.proceduralCanvas.style.display === 'none' ||
            (this.chunkManager?.getWorldData()?.size ?? 0) > 0
        )
            return;
        if (!this.app || !this.worldContainer) return;

        const w = this.app.canvas.width;
        const h = this.app.canvas.height;
        const viewX = -this.worldContainer.x / this.zoom;
        const viewY = -this.worldContainer.y / this.zoom;
        const viewW = w / this.zoom;
        const viewH = h / this.zoom;

        const MESH_PER_WORLD = 1000 / (MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE);
        const vpX = viewX * MESH_PER_WORLD;
        const vpY = viewY * MESH_PER_WORLD;
        const vpW = viewW * MESH_PER_WORLD;
        const vpH = viewH * MESH_PER_WORLD;

        const vpKey = `${Math.round(vpX)},${Math.round(vpY)},${Math.round(vpW)},${Math.round(vpH)}`;
        if (vpKey === this.lastViewportKey) return;
        this.lastViewportKey = vpKey;

        if (this.container) {
            this.proceduralCanvas.width = this.container.clientWidth;
            this.proceduralCanvas.height = this.container.clientHeight;
        }
        drawCachedMeshToCanvas(
            this.proceduralCanvas,
            this.procCache.meshAndMap.mesh,
            this.procCache.meshAndMap.map,
            this.procCache.param,
            vpX,
            vpY,
            vpW,
            vpH
        );
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
        if (this.proceduralCanvas) {
            this.proceduralCanvas.style.display = 'none';
        }
    }

    private refreshZoneRendering() { this.chunkManager?.refreshZones(); }
}
