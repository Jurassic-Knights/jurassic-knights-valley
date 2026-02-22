/**
 * MapEditorDebugOverlay
 *
 * Debug overlay rendering: station labels, spline path wireframes, connection lines.
 * Reuses buffers to avoid per-frame allocations.
 */
import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';
import { buildRailroadSplineSamples, RAILROAD_TILE_MESH } from './RailroadSplineBuilder';
import type { ProceduralCache } from './MapEditorProceduralRenderer';
import type { RailroadSplineSample } from './RailroadSplineBuilder';
import type { Mesh } from './mapgen4/types';

const MESH_TO_WORLD =
    (MapEditorConfig.WORLD_WIDTH_TILES * MapEditorConfig.TILE_SIZE) / 1000;
const MAX_DEBUG_DRAW_SAMPLES = MapEditorConfig.Debug.MAX_DRAW_SAMPLES;
const DEBUG_DOT_RADIUS = MapEditorConfig.Debug.DOT_RADIUS;
const DEBUG_FONT_SIZE = MapEditorConfig.Debug.FONT_SIZE;
const DEBUG_LABEL_FONT_SIZE = MapEditorConfig.Debug.LABEL_FONT_SIZE;
const DEBUG_LABEL_START_IDX = 1;
const DEBUG_ARROW_SIZE = MapEditorConfig.Debug.ARROW_SIZE;
const DEBUG_SEG_COLORS = [
    0xff0000, 0x00ff00, 0x0088ff, 0xff8800, 0xff00ff, 0x00ffff, 0xffff00, 0x88ff00,
    0xff0088, 0x8800ff
];

export interface DebugOverlayHost {
    procCache: ProceduralCache | null;
    worldContainer: PIXI.Container | null;
    app: PIXI.Application | null;
    zoom: number;
    debugShowStationNumbers: boolean;
    debugShowSplinePath: boolean;
}

export class MapEditorDebugOverlay {
    private container: PIXI.Container | null = null;
    private connectionGraphics: PIXI.Graphics | null = null;
    private splineLabel: PIXI.Text | null = null;
    private cachedSplineSamples: RailroadSplineSample[] | null = null;
    private splineCacheKey: string | null = null;
    private overlayViewKey: string | null = null;
    private readonly drawIndices: number[] = [];
    private readonly stationScreenPos: { sx: number; sy: number }[] = [];

    update(host: DebugOverlayHost): void {
        const { procCache, worldContainer, app, zoom, debugShowStationNumbers, debugShowSplinePath } =
            host;
        if (!worldContainer || !app) return;

        if (!debugShowStationNumbers && !debugShowSplinePath) {
            if (this.container) this.container.visible = false;
            return;
        }

        const hasPath = (procCache?.railroadPath?.length ?? 0) >= 2;
        const hasStationIds = (procCache?.railroadStationIds?.length ?? 0) >= 2;
        if (!procCache || (!hasPath && !hasStationIds)) {
            if (this.container) this.container.visible = false;
            return;
        }

        const stationIds = procCache.railroadStationIds;
        const path = procCache.railroadPath;
        const mesh = procCache.meshAndMap.mesh;
        const n = stationIds.length;
        const hasStations = n >= 1;

        const viewKey = `${Math.round(worldContainer.x)},${Math.round(worldContainer.y)},${Math.round(zoom * 1000)}|${debugShowSplinePath}|${debugShowStationNumbers}|${path.length}|${n}`;
        if (viewKey === this.overlayViewKey && this.container?.visible) return;
        this.overlayViewKey = viewKey;

        if (!this.container) {
            this.container = new PIXI.Container();
            this.container.zIndex = 10000;
            this.container.eventMode = 'none';
            app.stage.addChild(this.container);
        }
        this.container.visible = true;

        const screenX = (worldX: number) => worldContainer.x + worldX * zoom;
        const screenY = (worldY: number) => worldContainer.y + worldY * zoom;

        this.stationScreenPos.length = 0;
        for (let i = 0; i < n; i++) {
            const regionId = stationIds[i];
            const mx = mesh.x_of_r(regionId);
            const my = mesh.y_of_r(regionId);
            this.stationScreenPos.push({
                sx: screenX(mx * MESH_TO_WORLD),
                sy: screenY(my * MESH_TO_WORLD)
            });
        }

        if (!this.connectionGraphics) {
            this.connectionGraphics = new PIXI.Graphics();
            this.connectionGraphics.eventMode = 'none';
            this.container.addChildAt(this.connectionGraphics, 0);
        }
        const gfx = this.connectionGraphics;
        gfx.clear();

        if (debugShowSplinePath) {
            this._drawSplinePath(
                gfx, path, stationIds, mesh,
                (wx) => screenX(wx), (wy) => screenY(wy)
            );
        } else if (this.splineLabel) {
            this.splineLabel.visible = false;
        }

        if (debugShowStationNumbers && hasStations) {
            this._drawStationConnections(gfx, n);
            this._drawStationLabels(n);
        } else {
            // Hide all labels if disabled or no stations
            const existingLabels = this.container.children.length - DEBUG_LABEL_START_IDX;
            for (let i = 0; i < existingLabels; i++) {
                const label = this.container!.children[i + DEBUG_LABEL_START_IDX] as PIXI.Text;
                if (label) label.visible = false;
            }
        }
    }

    private _drawSplinePath(
        gfx: PIXI.Graphics, path: number[], stationIds: number[], mesh: Mesh,
        screenX: (wx: number) => number, screenY: (wy: number) => number
    ) {
        const splineCacheKey = path.join(',') + '|' + stationIds.join(',');
        if (splineCacheKey !== this.splineCacheKey || !this.cachedSplineSamples) {
            this.cachedSplineSamples = buildRailroadSplineSamples(mesh, path, stationIds);
            this.splineCacheKey = splineCacheKey;
        }
        const samples = this.cachedSplineSamples;
        const halfW = RAILROAD_TILE_MESH / 2;

        if (samples.length >= 2) {
            this.drawIndices.length = 0;
            if (samples.length <= MAX_DEBUG_DRAW_SAMPLES) {
                for (let i = 0; i < samples.length; i++) this.drawIndices.push(i);
            } else {
                for (let i = 0; i < MAX_DEBUG_DRAW_SAMPLES - 1; i++) {
                    this.drawIndices.push(
                        Math.round((i * (samples.length - 1)) / (MAX_DEBUG_DRAW_SAMPLES - 1))
                    );
                }
                this.drawIndices.push(samples.length - 1);
            }

            for (let j = 0; j < this.drawIndices.length - 1; j++) {
                const i = this.drawIndices[j]!;
                const iNext = this.drawIndices[j + 1]!;
                const a = samples[i]!;
                const b = samples[iNext]!;
                const pxA = Math.cos(a.angle + Math.PI / 2) * halfW;
                const pyA = Math.sin(a.angle + Math.PI / 2) * halfW;
                const pxB = Math.cos(b.angle + Math.PI / 2) * halfW;
                const pyB = Math.sin(b.angle + Math.PI / 2) * halfW;
                gfx.moveTo(
                    screenX((a.x - pxA) * MESH_TO_WORLD),
                    screenY((a.y - pyA) * MESH_TO_WORLD)
                );
                gfx.lineTo(
                    screenX((a.x + pxA) * MESH_TO_WORLD),
                    screenY((a.y + pyA) * MESH_TO_WORLD)
                );
                gfx.lineTo(
                    screenX((b.x + pxB) * MESH_TO_WORLD),
                    screenY((b.y + pyB) * MESH_TO_WORLD)
                );
                gfx.lineTo(
                    screenX((b.x - pxB) * MESH_TO_WORLD),
                    screenY((b.y - pyB) * MESH_TO_WORLD)
                );
                gfx.lineTo(
                    screenX((a.x - pxA) * MESH_TO_WORLD),
                    screenY((a.y - pyA) * MESH_TO_WORLD)
                );
                gfx.stroke({ width: 1, color: 0x00ff00, alpha: 0.6 });
            }

            const s0 = samples[this.drawIndices[0]!]!;
            gfx.moveTo(screenX(s0.x * MESH_TO_WORLD), screenY(s0.y * MESH_TO_WORLD));
            for (let j = 1; j < this.drawIndices.length; j++) {
                const s = samples[this.drawIndices[j]!]!;
                gfx.lineTo(screenX(s.x * MESH_TO_WORLD), screenY(s.y * MESH_TO_WORLD));
            }
            gfx.stroke({ width: 10, color: 0x00ffff, alpha: 0.5 });

            for (let j = 0; j < this.drawIndices.length; j++) {
                const s = samples[this.drawIndices[j]!]!;
                gfx.circle(
                    screenX(s.x * MESH_TO_WORLD),
                    screenY(s.y * MESH_TO_WORLD),
                    DEBUG_DOT_RADIUS
                );
                gfx.fill({ color: 0xff00ff, alpha: 0.9 });
            }
        }

        if (!this.splineLabel) {
            this.splineLabel = new PIXI.Text({
                text: 'Catmull-Rom spline',
                style: {
                    fontFamily: 'monospace',
                    fontSize: DEBUG_FONT_SIZE,
                    fill: 0x00ffff,
                    stroke: { color: 0x000000, width: 1 }
                }
            });
            this.splineLabel.eventMode = 'none';
            this.container!.addChild(this.splineLabel);
        }
        this.splineLabel.position.set(20, 20);
        this.splineLabel.visible = true;
    }

    private _drawStationConnections(gfx: PIXI.Graphics, n: number) {
        for (let i = 0; i < n; i++) {
            const from = this.stationScreenPos[i];
            const to = this.stationScreenPos[(i + 1) % n]!;
            const color = DEBUG_SEG_COLORS[i % DEBUG_SEG_COLORS.length]!;
            gfx.moveTo(from!.sx, from!.sy);
            gfx.lineTo(to.sx, to.sy);
            gfx.stroke({ width: 3, color, alpha: 0.8 });

            const midX = (from!.sx + to.sx) / 2;
            const midY = (from!.sy + to.sy) / 2;
            const dx = to.sx - from!.sx;
            const dy = to.sy - from!.sy;
            const len = Math.hypot(dx, dy);
            if (len > 10) {
                const ux = dx / len;
                const uy = dy / len;
                gfx.moveTo(
                    midX - ux * DEBUG_ARROW_SIZE + uy * DEBUG_ARROW_SIZE * 0.5,
                    midY - uy * DEBUG_ARROW_SIZE - ux * DEBUG_ARROW_SIZE * 0.5
                );
                gfx.lineTo(midX, midY);
                gfx.lineTo(
                    midX - ux * DEBUG_ARROW_SIZE - uy * DEBUG_ARROW_SIZE * 0.5,
                    midY - uy * DEBUG_ARROW_SIZE + ux * DEBUG_ARROW_SIZE * 0.5
                );
                gfx.stroke({ width: 2, color, alpha: 1 });
            }
        }
    }

    private _drawStationLabels(n: number) {
        const existingLabels = this.container!.children.length - DEBUG_LABEL_START_IDX;
        for (let i = 0; i < n; i++) {
            const { sx, sy } = this.stationScreenPos[i]!;
            let label: PIXI.Text;
            if (i < existingLabels) {
                label = this.container!.children[i + DEBUG_LABEL_START_IDX] as PIXI.Text;
            } else {
                label = new PIXI.Text({
                    text: String(i + 1),
                    style: {
                        fontFamily: 'monospace',
                        fontSize: DEBUG_LABEL_FONT_SIZE,
                        fill: 0xffff00,
                        stroke: { color: 0x000000, width: 2 }
                    }
                });
                label.anchor.set(0.5, 1);
                label.eventMode = 'none';
                this.container!.addChild(label);
            }
            label.text = String(i + 1);
            label.position.set(sx, sy);
            label.visible = true;
        }
        for (let i = n; i < existingLabels; i++) {
            const label = this.container!.children[i + DEBUG_LABEL_START_IDX] as PIXI.Text;
            if (label) label.visible = false;
        }
    }

    destroy(): void {
        this.container = null;
        this.connectionGraphics = null;
        this.splineLabel = null;
        this.cachedSplineSamples = null;
        this.splineCacheKey = null;
        this.overlayViewKey = null;
    }
}
