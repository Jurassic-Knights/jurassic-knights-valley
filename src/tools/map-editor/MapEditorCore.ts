
import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { MapEditorConfig } from './MapEditorConfig';
import { GameConstants } from '@data/GameConstants';
import { ChunkManager } from './ChunkManager';
import { AssetPalette } from './AssetPalette';

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

    // State
    private isInitialized: boolean = false;
    private currentTool: 'brush' | 'eraser' | 'select' = 'brush';
    private currentLayer: number = MapEditorConfig.Layers.GROUND;

    // Viewport State
    private zoom: number = 0.5; // Zoomed out by default to see chunks
    private isDragging: boolean = false;
    private lastMousePosition: { x: number, y: number } = { x: 0, y: 0 };

    constructor() {
        Logger.info('[MapEditorCore] Instantiated');
    }

    /**
     * Mounts the editor to a DOM container
     * @param containerId The ID of the div to mount to
     */
    public async mount(containerId: string): Promise<void> {
        if (this.isInitialized) return;

        this.container = document.getElementById(containerId);
        if (!this.container) {
            Logger.error(`[MapEditorCore] Container #${containerId} not found`);
            return;
        }

        Logger.info('[MapEditorCore] Mounting...');

        // Initialize Palette
        try {
            this.palette = new AssetPalette('palette-content', (assetId, category) => {
                this.selectedAsset = { id: assetId, category };
                this.currentTool = 'brush';
                Logger.info(`[MapEditor] Selected: ${assetId} (${category})`);
            });
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

        this.isInitialized = true;
        Logger.info('[MapEditorCore] Initialized successfully');
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
        this.chunkManager.update(viewRect);

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
    }

    private handleZoom(e: WheelEvent): void {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;

        const newZoom = Math.max(
            MapEditorConfig.MIN_ZOOM,
            Math.min(MapEditorConfig.MAX_ZOOM, this.zoom + delta)
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
    }

    private handleMouseDown(e: MouseEvent): void {
        // Middle click or Space+Click = Pan
        if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
            this.isDragging = true;
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        }
        // Left click = Tool Action
        else if (e.button === 0) {
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
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        this.isDragging = false;
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
        } else {
            if (!this.selectedAsset) Logger.warn('[MapEditor] No asset selected');
        }
    }

    public getChunkManager(): ChunkManager | null {
        return this.chunkManager;
    }
}
