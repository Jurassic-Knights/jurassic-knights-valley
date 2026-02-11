import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { GameConstants } from '@data/GameConstants';
import { ChunkManager } from './ChunkManager';
import { ChunkData } from './MapEditorTypes';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';
import { EditorContext } from './EditorContext';
import { CommandManager } from './commands/CommandManager';
import { PlaceObjectCommand } from './commands/PlaceObjectCommand';
import { RemoveObjectCommand } from './commands/RemoveObjectCommand';
import { PaintZoneCommand } from './commands/PaintZoneCommand';
import { PaintSplatCommand, SplatChange } from './commands/PaintSplatCommand';
import { BatchObjectCommand } from './commands/BatchObjectCommand';

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

    /**
     * Mounts the editor to a DOM container
     * @param containerId The ID of the div to mount to
     * @param dataFetcher Optional function to fetch category data (Dependency Injection from Dashboard)
     */
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

        // Initialize Palette (Legacy Removed - Handled by Dashboard)
        // Preload Registry for ObjectSystem
        try {
            const fetcher = dataFetcher || (async () => ({ entities: [], files: {} }));
            const categories = ['nodes', 'enemies', 'resources', 'environment', 'items'];
            Promise.all(categories.map((cat) => fetcher(cat).catch(() => ({ entities: [] })))).then(
                (results) => {
                    results.forEach((data, i) => {
                        const cat = categories[i];
                        const dict: Record<string, unknown> = {};
                        if (data.entities) {
                            data.entities.forEach(
                                (e: { id: string; width?: number; height?: number }) => {
                                    dict[e.id] = { width: e.width, height: e.height };
                                }
                            );
                        }
                        (EditorContext.registry as Record<string, unknown>)[cat] = dict;
                    });
                    Logger.info('[MapEditor] Registry Preloaded');
                }
            );
        } catch (e) {
            Logger.error('[MapEditor] Failed to preload registry:', e);
        }

        // Initialize PixiJS
        this.app = new PIXI.Application();

        await this.app.init({
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            backgroundColor: 0x1a1a1a,
            resizeTo: this.container,
            antialias: false,
            roundPixels: true
        });

        this.container.appendChild(this.app.canvas);

        this.worldContainer = new PIXI.Container();
        this.worldContainer.scale.set(this.zoom);
        this.worldContainer.x = this.app.canvas.width / 2;
        this.worldContainer.y = this.app.canvas.height / 2;
        this.app.stage.addChild(this.worldContainer);

        this.chunkManager = new ChunkManager(this.worldContainer);
        this.setupInputListeners();
        this.app.ticker.add(this.update, this);
        this.createUIOverlays();

        this.brushCursor = new PIXI.Graphics();
        this.brushCursor.zIndex = 9999;
        this.brushCursor.visible = false;
        this.worldContainer.addChild(this.brushCursor);

        this.isInitialized = true;
        EditorContext.visibleZoneIds = this.visibleZoneIds;

        Logger.info('[MapEditorCore] Initialized successfully');
    }

    // --- Public API ---

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

        // Update Context (Set is reference, but just to be explicit)
        EditorContext.visibleZoneIds = this.visibleZoneIds;
        this.refreshZoneRendering();
    }

    public toggleCategoryVisibility(cat: ZoneCategory, visible: boolean) {
        // Toggle all IDs in this category
        Object.values(ZoneConfig).forEach((def) => {
            if (def.category === cat) {
                if (visible) this.visibleZoneIds.add(def.id);
                else this.visibleZoneIds.delete(def.id);
            }
        });

        EditorContext.visibleZoneIds = this.visibleZoneIds;
        this.refreshZoneRendering();
    }

    public setGridOpacity(opacity: number) {
        if (this.chunkManager) {
            this.chunkManager.setGridOpacity(opacity);
        }
    }

    private createUIOverlays() {
        // Zoom Indicator
        let zoomEl = document.getElementById('map-editor-zoom');
        if (!zoomEl) {
            zoomEl = document.createElement('div');
            zoomEl.id = 'map-editor-zoom';
            zoomEl.style.position = 'absolute';
            zoomEl.style.top = '10px';
            zoomEl.style.left = '10px';
            zoomEl.style.background = 'rgba(0, 0, 0, 0.7)';
            zoomEl.style.color = '#fff';
            zoomEl.style.padding = '4px 8px';
            zoomEl.style.borderRadius = '4px';
            zoomEl.style.pointerEvents = 'none';
            zoomEl.style.fontSize = '12px';
            zoomEl.style.zIndex = '100';
            this.container?.appendChild(zoomEl);
        }
        this.updateZoomUI();
    }

    private updateZoomUI() {
        const el = document.getElementById('map-editor-zoom');
        if (el) {
            el.innerText = `Zoom: ${(this.zoom * 100).toFixed(1)}%`;
        }
    }

    /**
     * Unmounts and cleans up resources
     */
    public unmount(): void {
        if (!this.isInitialized || !this.app) return;

        Logger.info('[MapEditorCore] Unmounting...');

        this.app.ticker.remove(this.update, this);
        this.app.destroy(true, { children: true });
        this.app = null;
        this.container = null;
        this.worldContainer = null;
        this.chunkManager = null;
        this.isInitialized = false;
    }

    /**
     * Main Render Loop
     */
    private update(ticker: PIXI.Ticker): void {
        if (!this.chunkManager || !this.app || !this.worldContainer) return;

        const screenWidth = this.app.canvas.width;
        const screenHeight = this.app.canvas.height;

        const worldX = -this.worldContainer.x / this.zoom;
        const worldY = -this.worldContainer.y / this.zoom;
        const worldWidth = screenWidth / this.zoom;
        const worldHeight = screenHeight / this.zoom;

        const viewRect = { x: worldX, y: worldY, width: worldWidth, height: worldHeight };

        // Update chunks based on what we can see
        this.chunkManager.update(viewRect, this.zoom);

        // Update Brush Cursor
        if (this.brushCursor && this.worldContainer && this.app) {
            const rect = this.app.canvas.getBoundingClientRect();
            // We need current mouse pos? We only catch it in events.
            // But we can check if isPainting/Dragging or just store last pos.
            // Actually, handleMouseMove updates it.
        }
    }

    /**
     * Input Handling
     */
    private setupInputListeners(): void {
        if (!this.app || !this.app.canvas) return;

        const canvas = this.app.canvas;

        canvas.addEventListener('wheel', (e) => this.handleZoom(e), { passive: false });
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.isSpacePressed = true;
            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                if (e.shiftKey) {
                    this.commandManager.redo();
                } else {
                    this.commandManager.undo();
                }
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
        e.preventDefault();

        // Multiplicative Zoom for smooth transition at all scales
        const zoomFactor = 1.1; // 10% change per tick

        let newZoom = this.zoom;
        if (e.deltaY < 0) {
            newZoom *= zoomFactor;
        } else {
            newZoom /= zoomFactor;
        }

        // Clamp
        newZoom = Math.max(MapEditorConfig.MIN_ZOOM, Math.min(MapEditorConfig.MAX_ZOOM, newZoom));

        // Zoom towards mouse position
        const rect = this.app!.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // World Point under mouse before zoom
        if (this.worldContainer) {
            const worldPos = {
                x: (mouseX - this.worldContainer.x) / this.zoom,
                y: (mouseY - this.worldContainer.y) / this.zoom
            };

            this.zoom = newZoom;
            this.worldContainer.scale.set(this.zoom);

            // Adjust position so worldPoint is still under mouse
            this.worldContainer.x = mouseX - worldPos.x * this.zoom;
            this.worldContainer.y = mouseY - worldPos.y * this.zoom;
        }

        this.updateZoomUI();
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

        // Update Cursor Coords Display
        if (this.worldContainer && this.app) {
            const rect = this.app.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - this.worldContainer.x) / this.zoom;
            const worldY = (mouseY - this.worldContainer.y) / this.zoom;

            const cursorEl = document.getElementById('cursor-coords');
            if (cursorEl) {
                cursorEl.innerText = `${Math.floor(worldX)}, ${Math.floor(worldY)}`;
            }

            // Update Brush Cursor
            if (this.brushCursor) {
                if (
                    (this.editingMode === 'zone' || this.editingMode === 'ground') &&
                    this.currentTool === 'brush'
                ) {
                    this.brushCursor.visible = true;
                    this.brushCursor.clear();

                    const { TILE_SIZE } = MapEditorConfig;

                    let radiusPx = 0;
                    let snapX = worldX;
                    let snapY = worldY;

                    if (this.editingMode === 'ground') {
                        // Splat Units (Splat = Tile/4 = 32px)
                        // Brush Size 1 = 1 Tile radius = 4 Splats
                        radiusPx = this.brushSize * 4;
                        // Snap to 32px grid
                        snapX = Math.floor(worldX / 32) * 32 + 16;
                        snapY = Math.floor(worldY / 32) * 32 + 16;
                    } else {
                        // Zone Mode (Tile Units)
                        radiusPx = (this.brushSize - 0.5) * TILE_SIZE;
                        // Snap to Tile Center
                        snapX = Math.floor(worldX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                        snapY = Math.floor(worldY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
                    }

                    this.brushCursor.circle(snapX, snapY, radiusPx);

                    const color = e.shiftKey ? 0xff0000 : 0x00ff00;
                    this.brushCursor.stroke({ width: 2 / this.zoom, color: color, alpha: 0.8 });
                    this.brushCursor.fill({ color: color, alpha: 0.1 });
                } else {
                    this.brushCursor.visible = false;
                }
            }
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        this.isDragging = false;
        this.isPainting = false;

        // Finalize Splat Command
        if (this.currentSplatChanges.length > 0) {
            const cmd = new PaintSplatCommand(this.chunkManager!, [...this.currentSplatChanges]); // Clone array
            this.commandManager.execute(cmd);
            this.currentSplatChanges = [];
            Logger.info('[MapEditor] Paint Stroke Recorded');
        }

        // Finalize Object Command
        if (this.currentObjectActions.length > 0) {
            const cmd = new BatchObjectCommand(this.chunkManager!, [...this.currentObjectActions]);
            // Use record() because we applied changes live during useTool
            this.commandManager.record(cmd);
            this.currentObjectActions = [];
            Logger.info('[MapEditor] Object Batch Recorded');
        }
    }

    private useTool(e: MouseEvent): void {
        if (!this.chunkManager || !this.worldContainer || !this.app) return;

        // Screen -> World
        const rect = this.app.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - this.worldContainer.x) / this.zoom;
        const worldY = (mouseY - this.worldContainer.y) / this.zoom;

        // --- GROUND MODE ---
        if (this.currentTool === 'brush' && this.editingMode === 'ground') {
            // Intensity: +50 per click/drag. Eraser: -50.
            const intensity = e.shiftKey ? -50 : 50;
            const radius = (this.brushSize || 1) * 4; // Convert Tiles to Splats

            this.chunkManager.paintSplat(worldX, worldY, radius, intensity).then((changes) => {
                if (changes && changes.length > 0) {
                    this.currentSplatChanges.push(...changes);
                }
            });
        }
        // --- OBJECT MODE ---
        else if (
            this.currentTool === 'brush' &&
            this.editingMode === 'object' &&
            this.selectedAsset
        ) {
            const actionType = e.shiftKey ? 'remove' : 'add';

            // Check if we already have an action at this location in the current batch to avoid duplicates
            // Especially important for drag
            const existing = this.currentObjectActions.find(
                (a) =>
                    Math.abs(a.x - worldX) < 1 &&
                    Math.abs(a.y - worldY) < 1 &&
                    a.type === actionType
            );

            if (!existing) {
                // Execute immediately for visual feedback
                if (actionType === 'add') {
                    this.chunkManager.addObject(worldX, worldY, this.selectedAsset.id);
                } else {
                    this.chunkManager.removeObjectAt(worldX, worldY);
                }

                this.currentObjectActions.push({
                    type: actionType,
                    x: worldX,
                    y: worldY,
                    assetId: this.selectedAsset.id
                });
            }
        }
        // --- ZONE MODE ---
        else if (
            this.currentTool === 'brush' &&
            this.editingMode === 'zone' &&
            this.selectedZoneId
        ) {
            const { TILE_SIZE } = MapEditorConfig;

            // Brush Logic
            const centerTileX = Math.floor(worldX / TILE_SIZE);
            const centerTileY = Math.floor(worldY / TILE_SIZE);

            const radius = this.brushSize - 1;
            const updates: Array<{
                chunkKey: string;
                lx: number;
                ly: number;
                assetId: string | null;
            }> = [];

            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    // Circle/Rounded Brush check
                    if (x * x + y * y <= radius * radius + 0.5) {
                        const tx = centerTileX + x;
                        const ty = centerTileY + y;

                        // Convert back to pixels for setZone (Center aligned)
                        const px = tx * TILE_SIZE + TILE_SIZE / 2;
                        const py = ty * TILE_SIZE + TILE_SIZE / 2;

                        updates.push({
                            x: px,
                            y: py,
                            category: this.activeZoneCategory,
                            zoneId: e.shiftKey ? null : this.selectedZoneId // Shift = Erase
                        });
                    }
                }
            }

            // Flush Batch
            // this.chunkManager.setZones(updates);
            if (updates.length > 0) {
                const cmd = new PaintZoneCommand(this.chunkManager, updates);
                this.commandManager.execute(cmd);
            }
        } else {
            if (!this.selectedAsset && this.editingMode === 'object') {
                // Squelch warning if clicking empty space without tool
            }
        }
    }

    public getChunkManager(): ChunkManager | null {
        return this.chunkManager;
    }

    /** Current viewport in world pixels (same as used for chunk loading). */
    public getViewportWorldRect(): { x: number; y: number; width: number; height: number } | null {
        if (!this.app || !this.worldContainer) return null;
        const screenWidth = this.app.canvas.width;
        const screenHeight = this.app.canvas.height;
        const worldX = -this.worldContainer.x / this.zoom;
        const worldY = -this.worldContainer.y / this.zoom;
        const worldWidth = screenWidth / this.zoom;
        const worldHeight = screenHeight / this.zoom;
        return { x: worldX, y: worldY, width: worldWidth, height: worldHeight };
    }

    /** Pan so that world point (worldX, worldY) is at the center of the screen. */
    public centerViewOn(worldX: number, worldY: number): void {
        if (!this.app || !this.worldContainer) return;
        const cx = this.app.canvas.width / 2;
        const cy = this.app.canvas.height / 2;
        this.worldContainer.x = cx - worldX * this.zoom;
        this.worldContainer.y = cy - worldY * this.zoom;
    }

    public serialize(): { version: number; chunks: ChunkData[] } | null {
        if (!this.chunkManager) return null;
        return this.chunkManager.serialize();
    }

    /**
     * Load map data from a serialized payload. Clears current map and repopulates.
     */
    public loadData(data: { version?: number; chunks?: ChunkData[] }): void {
        if (!this.chunkManager) return;
        this.chunkManager.deserialize(data);
        this.commandManager.clear();
    }

    private refreshZoneRendering() {
        if (!this.chunkManager) return;
        this.chunkManager.refreshZones();
    }
}
