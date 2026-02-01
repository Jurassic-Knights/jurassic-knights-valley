
import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { GameConstants } from '@data/GameConstants';
import { ChunkManager, ChunkData } from './ChunkManager';
import { AssetPalette } from './AssetPalette';
import { ZoneConfig, ZoneCategory } from '@data/ZoneConfig';

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
    private palette: AssetPalette | null = null;
    private selectedAsset: { id: string, category: string } | null = null;
    private brushCursor: PIXI.Graphics | null = null;

    // State
    private isInitialized: boolean = false;
    private currentTool: 'brush' | 'eraser' | 'select' = 'brush';
    private currentLayer: number = MapEditorConfig.Layers.GROUND;

    // Zone Editor State
    private editingMode: 'object' | 'zone' = 'object';
    private activeZoneCategory: ZoneCategory = ZoneCategory.BIOME;
    private selectedZoneId: string | null = null;
    private brushSize: number = 1; // 1 = 1x1, 2 = 3x3 approx (radius)
    private visibleZoneIds: Set<string> = new Set(Object.keys(ZoneConfig)); // Default all visible

    // Viewport State
    private zoom: number = 1.0; // Default to 100% (Gameplay parity)
    private isDragging: boolean = false;
    private isPainting: boolean = false;
    private isSpacePressed: boolean = false;
    private lastMousePosition: { x: number, y: number } = { x: 0, y: 0 };

    constructor() {
        Logger.info('[MapEditorCore] Instantiated');
    }

    /**
     * Mounts the editor to a DOM container
     * @param containerId The ID of the div to mount to
     */
    /**
     * Mounts the editor to a DOM container
     * @param containerId The ID of the div to mount to
     * @param dataFetcher Optional function to fetch category data (Dependency Injection from Dashboard)
     */
    public async mount(containerId: string, dataFetcher?: (category: string) => Promise<any>): Promise<void> {
        if (this.isInitialized) return;

        this.container = document.getElementById(containerId);
        if (!this.container) {
            Logger.error(`[MapEditorCore] Container #${containerId} not found`);
            return;
        }

        Logger.info('[MapEditorCore] Mounting...');

        // Initialize Palette
        try {
            // Default no-op fetcher if none provided (prevents crash, but empty palette)
            const fetcher = dataFetcher || (async () => ({ entities: [], files: {} }));

            this.palette = new AssetPalette(
                'palette-content',
                (assetId, category) => {
                    if (category === 'zone') {
                        this.selectedZoneId = assetId;
                        this.selectedAsset = null;
                        this.editingMode = 'zone'; // Auto-switch mode for convenience?
                        // Actually, 'editingMode' is controlled via UI toggle. Stick to that for now to avoid confusion.
                    } else {
                        this.selectedAsset = { id: assetId, category };
                        this.selectedZoneId = null;
                    }
                    this.currentTool = 'brush';
                    Logger.info(`[MapEditor] Selected: ${assetId} (${category})`);
                },
                fetcher
            );
        } catch (e) {
            Logger.error('[MapEditor] Failed to init palette (ignoring for now):', e);
        }

        // Initialize PixiJS
        this.app = new PIXI.Application();

        await this.app.init({
            width: this.container.clientWidth,
            height: this.container.clientHeight,
            backgroundColor: 0x1a1a1a,
            resizeTo: this.container,
            antialias: false, // Pixel art needs crisp edges
            roundPixels: true
        });

        this.container.appendChild(this.app.canvas);

        // Setup World Container
        this.worldContainer = new PIXI.Container();
        this.worldContainer.scale.set(this.zoom);
        // Start centered-ish
        this.worldContainer.x = this.app.canvas.width / 2;
        this.worldContainer.y = this.app.canvas.height / 2;
        this.app.stage.addChild(this.worldContainer);

        // Initialize ChunkManager
        this.chunkManager = new ChunkManager(this.worldContainer);

        // Setup Inputs
        this.setupInputListeners();

        // Start Loop
        this.app.ticker.add(this.update, this);

        // Initialize UI Overlays
        this.createUIOverlays();

        // Create Brush Cursor
        this.brushCursor = new PIXI.Graphics();
        this.brushCursor.zIndex = 9999;
        this.brushCursor.visible = false;
        this.app.stage.addChild(this.brushCursor); // Add to stage so it's not affected by world zoom/pan? Or world?
        // Actually, if we want it to represent WORLD tile size, it should be in worldContainer?
        // But for visibility, stage is better, just scaled/positioned manually? 
        // No, let's put it in worldContainer so it scales with zoom automatically.
        this.worldContainer.addChild(this.brushCursor);

        this.isInitialized = true;

        // Expose API for UI
        (window as any).MapEditorAPI = {
            setMode: (mode: 'object' | 'zone') => {
                this.editingMode = mode;
                if (this.palette) this.palette.setMode(mode);
                Logger.info(`[MapEditor] Mode set to ${mode}`);
            },
            setZoneCategory: (cat: ZoneCategory) => {
                this.activeZoneCategory = cat;
                (window as any).activeZoneCategory = cat; // For Chunk rendering
                if (this.palette) this.palette.setZoneCategory(cat);
                Logger.info(`[MapEditor] Zone Category: ${cat}`);
            },
            setSelectedZone: (id: string) => {
                this.selectedZoneId = id;
                Logger.info(`[MapEditor] Zone Selected: ${id}`);
            },
            setBrushSize: (size: number) => {
                this.brushSize = size;
                Logger.info(`[MapEditor] Brush Size: ${size}`);
            },
            toggleZoneVisibility: (id: string, visible: boolean) => {
                if (visible) this.visibleZoneIds.add(id);
                else this.visibleZoneIds.delete(id);

                (window as any).visibleZoneIds = this.visibleZoneIds;
                this.refreshZoneRendering();
            },
            toggleCategoryVisibility: (cat: ZoneCategory, visible: boolean) => {
                // Toggle all IDs in this category
                Object.values(ZoneConfig).forEach(def => {
                    if (def.category === cat) {
                        if (visible) this.visibleZoneIds.add(def.id);
                        else this.visibleZoneIds.delete(def.id);
                    }
                });
                (window as any).visibleZoneIds = this.visibleZoneIds;
                this.refreshZoneRendering();
            },
            setGridOpacity: (opacity: number) => {
                if (this.chunkManager) {
                    this.chunkManager.setGridOpacity(opacity);
                    // Force refresh? ChunkManager.update handles it if we move, but maybe trigger update?
                    // Ideally we should force a redraw of debug graphics.
                    // For now, let's rely on next update or add a force refresh method.
                    // Actually, let's trigger a refresh if possible, or just accept it updates on move.
                    // To be responsive, we should probably iterate loaded chunks and update their graphics.
                    // But for now, let's just set the prop. The user will likely move/zoom which triggers update.
                    // OR we can add a method to ChunkManager to refresh debug instantly.
                    // Let's do that in future if needed.
                    // EDIT: Let's do it now for responsiveness.
                    // Access private loadedChunks via 'any' hack for speed, or just assume movement.
                    // Let's try to be clean: ChunkManager.update(viewRect...)
                    // We can't easily call update without coords.
                    // We'll leave it as setting property. Movement/Zoom triggers update.
                }
            }
        };

        // Initialize Global for ChunkManager to read immediately
        (window as any).visibleZoneIds = this.visibleZoneIds;

        Logger.info('[MapEditorCore] Initialized successfully');
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

        // Calculate Viewport Rectangle in WORLD coordinates
        // Canvas (screen) -> World Transform
        // worldX = (screenX - containerX) / scale

        const screenWidth = this.app.canvas.width;
        const screenHeight = this.app.canvas.height;

        const worldX = -this.worldContainer.x / this.zoom;
        const worldY = -this.worldContainer.y / this.zoom;
        const worldWidth = screenWidth / this.zoom;
        const worldHeight = screenHeight / this.zoom;

        const viewRect = { x: worldX, y: worldY, width: worldWidth, height: worldHeight };

        // Update chunks based on what we can see
        this.chunkManager.update(viewRect, this.zoom);

        // Update Cursor UI coords (simple debug)
        // In reality we'd transform mouse pos to world pos here
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
        window.addEventListener('keydown', (e) => { if (e.code === 'Space') this.isSpacePressed = true; });
        window.addEventListener('keyup', (e) => { if (e.code === 'Space') this.isSpacePressed = false; });
    }

    private handleZoom(e: WheelEvent): void {
        e.preventDefault();

        // Multiplicative Zoom for smooth transition at all scales
        // e.deltaY > 0 means scroll down (Zoom OUT)
        // e.deltaY < 0 means scroll up (Zoom IN)

        const zoomFactor = 1.1; // 10% change per tick

        let newZoom = this.zoom;
        if (e.deltaY < 0) {
            newZoom *= zoomFactor;
        } else {
            newZoom /= zoomFactor;
        }

        // Clamp
        newZoom = Math.max(
            MapEditorConfig.MIN_ZOOM,
            Math.min(MapEditorConfig.MAX_ZOOM, newZoom)
        );

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
            this.worldContainer.x = mouseX - (worldPos.x * this.zoom);
            this.worldContainer.y = mouseY - (worldPos.y * this.zoom);
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

            const worldX = Math.floor((mouseX - this.worldContainer.x) / this.zoom);
            const worldY = Math.floor((mouseY - this.worldContainer.y) / this.zoom);

            const cursorEl = document.getElementById('cursor-coords');
            if (cursorEl) {
                cursorEl.innerText = `${worldX}, ${worldY}`;
            }

            // Update Brush Cursor
            if (this.brushCursor) {
                if (this.editingMode === 'zone' && this.currentTool === 'brush') {
                    this.brushCursor.visible = true;
                    this.brushCursor.clear();

                    const { TILE_SIZE } = MapEditorConfig;
                    const radius = (this.brushSize - 0.5) * TILE_SIZE; // Approximate logic

                    // Snap to grid center
                    const snapX = Math.floor(worldX / TILE_SIZE) * TILE_SIZE + (TILE_SIZE / 2);
                    const snapY = Math.floor(worldY / TILE_SIZE) * TILE_SIZE + (TILE_SIZE / 2);

                    this.brushCursor.circle(snapX, snapY, radius + (TILE_SIZE / 2)); // Add half tile to cover edge
                    this.brushCursor.stroke({ width: 2 / this.zoom, color: 0x00FF00, alpha: 0.8 });
                    this.brushCursor.fill({ color: 0x00FF00, alpha: 0.1 });
                } else {
                    this.brushCursor.visible = false;
                }
            }
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        this.isDragging = false;
        this.isPainting = false;
    }

    private useTool(e: MouseEvent): void {
        // Logger.info(`[MapEditorCore] useTool called. Tool: ${this.currentTool}, Asset: ${this.selectedAsset?.id}`);

        if (this.currentTool === 'brush' && this.selectedAsset && this.chunkManager && this.worldContainer && this.app) {
            // Screen -> World
            const rect = this.app.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - this.worldContainer.x) / this.zoom;
            const worldY = (mouseY - this.worldContainer.y) / this.zoom;

            Logger.info(`[MapEditor] Painting ${this.selectedAsset.id} at ${worldX.toFixed(0)}, ${worldY.toFixed(0)}`);

            // TODO: Snap to Grid option
            // const snappedX = Math.floor(worldX / MapEditorConfig.TILE_SIZE) * MapEditorConfig.TILE_SIZE;
            // const snappedY = Math.floor(worldY / MapEditorConfig.TILE_SIZE) * MapEditorConfig.TILE_SIZE;

            this.chunkManager.addObject(worldX, worldY, this.selectedAsset.id);
        } else if (this.currentTool === 'brush' && this.editingMode === 'zone' && this.selectedZoneId && this.chunkManager && this.worldContainer && this.app) {
            const rect = this.app.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = (mouseX - this.worldContainer.x) / this.zoom;
            const worldY = (mouseY - this.worldContainer.y) / this.zoom;

            const { TILE_SIZE } = MapEditorConfig;

            // Brush Logic
            const centerTileX = Math.floor(worldX / TILE_SIZE);
            const centerTileY = Math.floor(worldY / TILE_SIZE);

            const radius = this.brushSize - 1;
            const updates: any[] = []; // Collect batch updates

            for (let x = -radius; x <= radius; x++) {
                for (let y = -radius; y <= radius; y++) {
                    // Circle/Rounded Brush check
                    if (x * x + y * y <= radius * radius + 0.5) {
                        const tx = centerTileX + x;
                        const ty = centerTileY + y;

                        // Convert back to pixels for setZone (as agreed in logic)
                        const px = tx * TILE_SIZE;
                        const py = ty * TILE_SIZE;

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
            this.chunkManager.setZones(updates);
        } else {
            if (!this.selectedAsset && this.editingMode === 'object') Logger.warn('[MapEditor] No asset selected');
        }
    }

    public getChunkManager(): ChunkManager | null {
        return this.chunkManager;
    }
    public serialize(): { version: number; chunks: ChunkData[] } | null {
        if (!this.chunkManager) return null;
        return this.chunkManager.serialize();
    }

    private refreshZoneRendering() {
        if (!this.chunkManager || !this.chunkManager['loadedChunks']) return;

        // Force re-render of overlays for all loaded chunks
        // Accessing private 'loadedChunks' via any or refactoring ChunkManager to have public method?
        // Let's rely on update() logic? No, update() handles visibility loading.
        // We need to re-call renderZoneOverlay on existing chunks.

        // Better: Expose a 'refreshZones()' on ChunkManager.
        // For now, dirty hack:
        // iterate loaded chunks and call setZone logic? No, too slow.
        // Actually, ChunkManager.update() calls renderZoneOverlay IF it loads.

        // Let's add a `redrawZones()` to ChunkManager.
        // Or access private:
        const mgr = this.chunkManager as any;
        mgr.loadedChunks.forEach((chunk: PIXI.Container, key: string) => {
            // Need data to render
            const data = mgr.worldData.get(key);
            if (data && data.zones) {
                mgr.renderZoneOverlay(chunk, data.zones);
            }
        });
    }
}
