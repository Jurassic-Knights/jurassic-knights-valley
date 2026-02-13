/**
 * MapEditorMount - PixiJS app initialization for map editor
 *
 * Polygon map is the ground (mapgen4 mesh). Rendered as a PIXI sprite on stage
 * so it's guaranteed visible. Procedural canvas is offscreen; we draw to it and
 * display via sprite texture.
 */
import * as PIXI from 'pixi.js';
import { ChunkManager } from './ChunkManager';
import { MapEditorConfig } from './MapEditorConfig';

export interface MountResult {
    app: PIXI.Application;
    worldContainer: PIXI.Container;
    /** Offscreen canvas for polygon map — drawn to, displayed via proceduralSprite. */
    proceduralCanvas: HTMLCanvasElement;
    /** PIXI sprite displaying procedural map; added to stage behind worldContainer. */
    proceduralSprite: PIXI.Sprite;
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
        backgroundAlpha: MapEditorConfig.USE_POLYGON_MAP_AS_GROUND ? 0 : 1,
        resizeTo: container,
        antialias: false,
        roundPixels: true
    });

    container.style.position = 'relative';

    const appCanvas = app.canvas as HTMLCanvasElement;
    appCanvas.style.position = 'absolute';
    appCanvas.style.top = '0';
    appCanvas.style.left = '0';
    appCanvas.style.zIndex = '1';
    appCanvas.style.pointerEvents = 'auto';
    appCanvas.style.cursor = 'default';
    container.appendChild(appCanvas);

    const fitZoom = Math.max(
        MapEditorConfig.MIN_ZOOM,
        Math.min(
            requestedZoom,
            Math.min(app.canvas.width, app.canvas.height) / WORLD_SIZE_PX
        )
    );

    const worldContainer = new PIXI.Container();
    worldContainer.sortableChildren = true;
    worldContainer.scale.set(fitZoom);
    worldContainer.x = app.canvas.width / 2 - MAP_CENTER * fitZoom;
    worldContainer.y = app.canvas.height / 2 - MAP_CENTER * fitZoom;

    // Offscreen canvas for procedural map — displayed as a PIXI sprite.
    // Use CanvasSource with dynamic:true so texture re-uploads each frame.
    const proceduralCanvas = document.createElement('canvas');
    proceduralCanvas.width = Math.max(1, app.canvas.width);
    proceduralCanvas.height = Math.max(1, app.canvas.height);
    const canvasSource = new PIXI.CanvasSource({ resource: proceduralCanvas, dynamic: true });
    const proceduralTexture = new PIXI.Texture({ source: canvasSource });
    const proceduralSprite = new PIXI.Sprite(proceduralTexture);
    proceduralSprite.anchor.set(0, 0);
    proceduralSprite.position.set(0, 0);
    proceduralSprite.width = app.canvas.width;
    proceduralSprite.height = app.canvas.height;
    proceduralSprite.zIndex = -1;

    app.stage.sortableChildren = true;
    app.stage.addChild(proceduralSprite);
    app.stage.addChild(worldContainer);

    const chunkManager = new ChunkManager(worldContainer);

    const brushCursor = new PIXI.Graphics();
    brushCursor.zIndex = 9999;
    brushCursor.visible = false;
    worldContainer.addChild(brushCursor);

    return {
        app,
        worldContainer,
        proceduralCanvas,
        proceduralSprite,
        chunkManager,
        brushCursor,
        initialZoom: fitZoom
    };
}
