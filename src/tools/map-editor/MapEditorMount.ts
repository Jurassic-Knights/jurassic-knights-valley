/**
 * MapEditorMount - PixiJS app initialization for map editor
 *
 * When no map is loaded: main view uses an HTML canvas (same as minimap).
 * When map is loaded: main view uses PIXI chunks.
 * No legacy world scaling — procedural map lives in mesh coords 0..1000.
 */
import * as PIXI from 'pixi.js';
import { ChunkManager } from './ChunkManager';
import { MapEditorConfig } from './MapEditorConfig';

export interface MountResult {
    app: PIXI.Application;
    worldContainer: PIXI.Container;
    /** HTML canvas for procedural preview — same drawing path as minimap. */
    proceduralCanvas: HTMLCanvasElement;
    chunkManager: ChunkManager;
    brushCursor: PIXI.Graphics;
    initialZoom: number;
}

const WORLD_SIZE_PX =
    MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE;
const MAP_CENTER = WORLD_SIZE_PX / 2;

export async function createPixiApp(
    container: HTMLElement,
    requestedZoom: number
): Promise<MountResult> {
    const app = new PIXI.Application();

    await app.init({
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: 0x1a1a1a,
        resizeTo: container,
        antialias: false,
        roundPixels: true
    });

    container.appendChild(app.canvas);

    const fitZoom = Math.max(
        MapEditorConfig.MIN_ZOOM,
        Math.min(
            requestedZoom,
            Math.min(app.canvas.width, app.canvas.height) / WORLD_SIZE_PX
        )
    );

    const worldContainer = new PIXI.Container();
    worldContainer.scale.set(fitZoom);
    worldContainer.x = app.canvas.width / 2 - MAP_CENTER * fitZoom;
    worldContainer.y = app.canvas.height / 2 - MAP_CENTER * fitZoom;
    app.stage.addChild(worldContainer);

    const chunkManager = new ChunkManager(worldContainer);

    const brushCursor = new PIXI.Graphics();
    brushCursor.zIndex = 9999;
    brushCursor.visible = false;
    worldContainer.addChild(brushCursor);

    // Procedural preview: HTML canvas, same approach as minimap. No PIXI, no scaling.
    const proceduralCanvas = document.createElement('canvas');
    proceduralCanvas.style.position = 'absolute';
    proceduralCanvas.style.top = '0';
    proceduralCanvas.style.left = '0';
    proceduralCanvas.style.width = '100%';
    proceduralCanvas.style.height = '100%';
    proceduralCanvas.style.pointerEvents = 'none';
    proceduralCanvas.width = container.clientWidth;
    proceduralCanvas.height = container.clientHeight;
    container.style.position = 'relative';
    container.appendChild(proceduralCanvas); // On top of PIXI canvas; pointer-events:none so events reach PIXI

    return {
        app,
        worldContainer,
        proceduralCanvas,
        chunkManager,
        brushCursor,
        initialZoom: fitZoom
    };
}
