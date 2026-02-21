/**
 * WorldRendererMapgen4 - Renders mapgen4 polygon mesh to canvas
 *
 * Uses WorldManager mesh+map. Viewport in world coords, converted to mesh coords (0..1000).
 * Railroad is rendered as its own pass AFTER the terrain/rivers/roads (not inside the
 * preview function) so the game pipeline has full control and visibility.
 *
 * Owner: Director
 */

import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';
import * as PIXI from 'pixi.js';
import { drawCachedMeshToCanvas } from '../tools/map-editor/Mapgen4PreviewRenderer';
import { createRailroadMeshes } from '../tools/map-editor/RailroadMeshRenderer';
import { MapEditorConfig } from '../tools/map-editor/MapEditorConfig';
import type { Mesh } from '../tools/map-editor/mapgen4/types';
import type Mapgen4Map from '../tools/map-editor/mapgen4/map';
import type { Mapgen4Param, RailroadCrossing, TownSite, RoadSegment } from '../tools/map-editor/Mapgen4Param';
import type { IGame, IViewport } from '../types/core';

const MESH_SIZE = 1000;
const WORLD_SIZE = 160000;

type WorldManagerLike = {
    getMesh: () => { mesh: Mesh; map: Mapgen4Map } | null;
    getMapgen4Param: () => Mapgen4Param;
    getCachedTownsAndRoads?: () => {
        towns: TownSite[];
        roadSegments: RoadSegment[];
        railroadPath: number[];
        railroadCrossings: RailroadCrossing[];
        railroadStationIds: number[];
    };
};

class WorldRendererMapgen4 {
    game: IGame | null = null;
    _worldManager: WorldManagerLike | null = null;
    private _loggedOnce = false;
    private _pixiApp: PIXI.Application | null = null;
    private _pixiAppInitPromise: Promise<void> | null = null;
    private _railroadContainer: PIXI.Container | null = null;
    private _lastRailroadPath: string = '';
    private _railroadMeshes: PIXI.Mesh[] = [];

    constructor() {
        Logger.info('[WorldRendererMapgen4] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        this._worldManager = game.getSystem('WorldManager') as typeof this._worldManager;
        if (!this._worldManager) {
            this._worldManager = Registry?.get('WorldManager') as typeof this._worldManager;
        }
        Logger.info('[WorldRendererMapgen4] Initialized');
    }

    render(ctx: CanvasRenderingContext2D, viewport: IViewport) {
        if (!this.game || !this._worldManager) return;

        const meshAndMap = this._worldManager.getMesh();
        if (!meshAndMap) return;

        const param = this._worldManager.getMapgen4Param();
        const { mesh, map } = meshAndMap;

        // Viewport in world coords → mesh coords (0..1000)
        const vpX = (viewport.x / WORLD_SIZE) * MESH_SIZE;
        const vpY = (viewport.y / WORLD_SIZE) * MESH_SIZE;
        const vpW = (viewport.width / WORLD_SIZE) * MESH_SIZE;
        const vpH = (viewport.height / WORLD_SIZE) * MESH_SIZE;

        if (!ctx?.canvas) return;

        const { towns, roadSegments, railroadPath, railroadCrossings, railroadStationIds = [] } =
            this._worldManager.getCachedTownsAndRoads?.() ?? {
                towns: [],
                roadSegments: [],
                railroadPath: [],
                railroadCrossings: [],
                railroadStationIds: []
            };

        // One-time diagnostic log to confirm railroad data is present
        if (!this._loggedOnce) {
            Logger.info(
                '[WorldRendererMapgen4] First render — railroadPath:',
                railroadPath.length,
                'towns:', towns.length,
                'roads:', roadSegments.length,
                'canvas:', ctx.canvas.width, 'x', ctx.canvas.height,
                'meshVP:', vpX.toFixed(1), vpY.toFixed(1), vpW.toFixed(3), vpH.toFixed(3)
            );
            this._loggedOnce = true;
        }

        // 1. Terrain, rivers, roads — skip railroad (drawn as separate pass below)
        drawCachedMeshToCanvas(
            ctx,
            mesh,
            map,
            param,
            vpX,
            vpY,
            vpW,
            vpH,
            towns,
            roadSegments,
            railroadPath,
            railroadCrossings,
            railroadStationIds,
            new Set<string>(), // no hidden zones in game
            true // skipRailroad — drawn explicitly below
        );

        // 2. Railroad — separate pass, directly on game canvas
        if (railroadPath.length >= 2) {
            this.renderRailroad(
                ctx, mesh, map, param, railroadPath, railroadCrossings, railroadStationIds,
                vpX, vpY, vpW, vpH
            );
        }
    }

    /**
     * Draw railroad directly to the game canvas using the same mesh→canvas mapping
     * as drawCachedMeshToCanvas. This gives the game full control over railroad rendering
     * instead of relying on the map editor preview function's internal drawing.
     */
    private renderRailroad(
        ctx: CanvasRenderingContext2D,
        mesh: Mesh,
        map: Mapgen4Map,
        param: Mapgen4Param,
        railroadPath: number[],
        railroadCrossings: RailroadCrossing[],
        railroadStationIds: number[],
        vpX: number,
        vpY: number,
        vpW: number,
        vpH: number
    ): void {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        if (w === 0 || h === 0) return;

        const scaleX = w / vpW;
        const scaleY = h / vpH;
        const scale = Math.min(scaleX, scaleY);

        const toCanvas = (x: number, y: number) => ({
            x: (x - vpX) * scaleX,
            y: (y - vpY) * scaleY
        });

        // Initialize PIXI App asynchronously if needed for WebGL context to render true continuous UV meshes
        if (!this._pixiApp && !this._pixiAppInitPromise) {
            this._pixiApp = new PIXI.Application();

            // PIXI v8 requires async initialization. Catch errors to prevent silent fails.
            this._pixiAppInitPromise = this._pixiApp.init({
                width: w,
                height: h,
                backgroundAlpha: 0,
                autoStart: false,
                preserveDrawingBuffer: true
            }).then(() => {
                this._railroadContainer = new PIXI.Container();
                this._pixiApp!.stage.addChild(this._railroadContainer);
            }).catch(err => {
                Logger.error('[WorldRendererMapgen4] PIXI Railroad Renderer init failed:', err);
            });
        }

        // The game render loop is synchronous. Fall back to simple lines while PIXI mounts in the background
        if (!this._pixiApp || !this._railroadContainer || !this._pixiApp.canvas) {
            this.renderRailroadFallbackLines(ctx, mesh, railroadPath, toCanvas);
            return;
        }

        // Ensure canvas stays synchronized with game viewport resizes
        if (this._pixiApp.canvas.width !== w || this._pixiApp.canvas.height !== h) {
            this._pixiApp.renderer.resize(w, h);
        }

        // Rebuild mesh geometry if the path changes
        const currentPathStr = railroadPath.join(',');
        if (this._lastRailroadPath !== currentPathStr) {
            this._lastRailroadPath = currentPathStr;

            // Clean up old meshes to prevent WebGL buffer leaks
            for (const m of this._railroadMeshes) {
                m.destroy({ children: true, texture: false });
            }
            this._railroadContainer!.removeChildren();

            this._railroadMeshes = createRailroadMeshes(
                mesh,
                map,
                railroadPath,
                this._railroadContainer!,
                railroadStationIds
            );
        }

        if (this._railroadMeshes.length > 0) {
            // Transform the container to match the viewport camera.
            // Mapgen4 coordinates (rx, ry) in mesh space (0-1000).
            this._railroadContainer!.scale.set(scaleX, scaleY);
            this._railroadContainer!.position.set(-vpX * scaleX, -vpY * scaleY);

            // Render the PIXI stage to its internal WebGL canvas
            this._pixiApp.renderer.render(this._pixiApp.stage);

            // Composite the PIXI WebGL canvas onto the Game's native 2D canvas
            // PIXI v8 uses .canvas instead of .view
            ctx.drawImage(this._pixiApp.canvas, 0, 0);
        } else {
            // Fallback: if the spline fails to produce visible output
            this.renderRailroadFallbackLines(ctx, mesh, railroadPath, toCanvas);
        }
    }

    /**
     * Simple thick lines between railroad station points.
     * Always drawn ON TOP of the spline as a guarantee of visibility.
     * Uses a semi-transparent dark line so it doesn't overpower textures
     * but is clearly visible if the spline rendering fails.
     */
    private renderRailroadFallbackLines(
        ctx: CanvasRenderingContext2D,
        mesh: Mesh,
        railroadPath: number[],
        toCanvas: (x: number, y: number) => { x: number; y: number }
    ): void {
        if (railroadPath.length < 2) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(90, 60, 30, 0.7)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const first = toCanvas(mesh.x_of_r(railroadPath[0]), mesh.y_of_r(railroadPath[0]));
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < railroadPath.length; i++) {
            const p = toCanvas(
                mesh.x_of_r(railroadPath[i]),
                mesh.y_of_r(railroadPath[i])
            );
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();
    }
}

const worldRendererMapgen4 = new WorldRendererMapgen4();
if (Registry) Registry.register('WorldRendererMapgen4', worldRendererMapgen4);

export { WorldRendererMapgen4, worldRendererMapgen4 };
