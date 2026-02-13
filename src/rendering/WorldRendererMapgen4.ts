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
import { drawCachedMeshToCanvas } from '../tools/map-editor/Mapgen4Generator';
import { drawRailroadSpline } from '../tools/map-editor/Mapgen4RailroadPreview';
import { RAILROAD_TILE_WORLD_PX } from '../tools/map-editor/Mapgen4SplineUtils';
import { MapEditorConfig } from '../tools/map-editor/MapEditorConfig';
import type { Mesh } from '../tools/map-editor/mapgen4/types';
import type Mapgen4Map from '../tools/map-editor/mapgen4/map';
import type { Mapgen4Param, RailroadCrossing } from '../tools/map-editor/Mapgen4Param';
import type { IGame, IViewport } from '../types/core';

const MESH_SIZE = 1000;
const WORLD_SIZE = 160000;

type WorldManagerLike = {
    getMesh: () => { mesh: Mesh; map: Mapgen4Map } | null;
    getMapgen4Param: () => Mapgen4Param;
    getCachedTownsAndRoads?: () => {
        towns: unknown[];
        roadSegments: unknown[];
        railroadPath: number[];
        railroadCrossings: RailroadCrossing[];
    };
};

class WorldRendererMapgen4 {
    game: IGame | null = null;
    _worldManager: WorldManagerLike | null = null;
    private _loggedOnce = false;

    constructor() {
        Logger.info('[WorldRendererMapgen4] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        this._worldManager = game.getSystem('IslandManager') as typeof this._worldManager;
        if (!this._worldManager) {
            this._worldManager = Registry?.get('IslandManager') as typeof this._worldManager;
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

        const { towns, roadSegments, railroadPath, railroadCrossings } =
            this._worldManager.getCachedTownsAndRoads?.() ?? {
                towns: [],
                roadSegments: [],
                railroadPath: [],
                railroadCrossings: []
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
            new Set<string>(), // no hidden zones in game
            true // skipRailroad — drawn explicitly below
        );

        // 2. Railroad — separate pass, directly on game canvas
        if (railroadPath.length >= 2) {
            this.renderRailroad(
                ctx, mesh, map, param, railroadPath, railroadCrossings,
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

        const WORLD_WIDTH_PX = MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE;
        const tileWidthCanvas = RAILROAD_TILE_WORLD_PX * scale * (MESH_SIZE / WORLD_WIDTH_PX);

        const margin = 80;
        const vpMinX = vpX - margin;
        const vpMaxX = vpX + vpW + margin;
        const vpMinY = vpY - margin;
        const vpMaxY = vpY + vpH + margin;

        try {
            drawRailroadSpline(
                ctx,
                mesh,
                map,
                railroadPath,
                railroadCrossings,
                param.meshSeed,
                toCanvas,
                scale,
                tileWidthCanvas,
                vpMinX,
                vpMaxX,
                vpMinY,
                vpMaxY
            );
        } catch (err) {
            Logger.warn('[WorldRendererMapgen4] Railroad spline render error:', err);
        }

        // Fallback: if the spline fails to produce visible output, draw simple
        // thick lines between stations so the railroad is always visible.
        // This also serves as a debug layer to confirm the data is correct.
        this.renderRailroadFallbackLines(ctx, mesh, railroadPath, toCanvas);
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
