/**
 * MapEditorWaypointManager
 *
 * Waypoint handle overlay: blue midpoints, orange draggable waypoints.
 * Right-click waypoint to remove; add via context menu on spline path.
 */
import * as PIXI from 'pixi.js';
import type { RailroadWaypointEntry } from '../../world/MapDataService';
import type { ProceduralCache } from './MapEditorProceduralRenderer';
import { MESH_TO_WORLD, getRegionHandleRadiusWorld } from './MapEditorRailroadUtils';
import { screenToWorld } from './MapEditorInputHandlers';

export interface WaypointManagerHost {
    procCache: ProceduralCache | null;
    worldContainer: PIXI.Container | null;
    app: PIXI.Application | null;
    zoom: number;
    manualStations: { regionId: number; order: number }[];
    railroadWaypoints: RailroadWaypointEntry[];
    editingMode: string;
    debugShowStationNumbers: boolean;
    debugShowSplinePath: boolean;
    _onRemoveWaypoint: (legIndex: number, waypointIndex: number) => void;
    _onUpdateWaypointRegion: (legIndex: number, waypointIndex: number, regionId: number) => void;
    _getRegionAtWorld: (wx: number, wy: number) => number | null;
}

export class MapEditorWaypointManager {
    private container: PIXI.Container | null = null;
    private dragging: { legIndex: number; waypointIndex: number } | null = null;
    private host: WaypointManagerHost | null = null;
    private lastKey: string = '';
    private readonly boundPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
    private readonly boundPointerUp = () => this.handlePointerUp();
    /** Reused to avoid per-frame allocation. */
    private readonly waypointsByLeg = new Map<
        number,
        { regionId: number; waypointIndex: number }[]
    >();

    update(host: WaypointManagerHost): void {
        this.host = host;
        if (this.dragging) return;
        const {
            procCache,
            worldContainer,
            app,
            zoom,
            manualStations,
            railroadWaypoints,
            editingMode,
            debugShowStationNumbers,
            debugShowSplinePath,
            _onRemoveWaypoint,
            _onUpdateWaypointRegion,
            _getRegionAtWorld
        } = host;

        if (!worldContainer || !app) return;
        const show =
            manualStations.length >= 2 &&
            procCache &&
            procCache.railroadStationIds.length >= 2 &&
            (editingMode !== 'manipulation' || debugShowStationNumbers || debugShowSplinePath);

        if (!show) {
            if (this.container) this.container.visible = false;
            this.lastKey = '';
            return;
        }

        const key = `${editingMode}|${debugShowStationNumbers}|${debugShowSplinePath}|${procCache!.railroadStationIds.join(',')}|${railroadWaypoints.map((w) => w.regionId).join(',')}`;
        if (this.lastKey === key && this.container?.visible) return;
        this.lastKey = key;

        if (!this.container) {
            this.container = new PIXI.Container();
            this.container.zIndex = 1000;
            this.container.eventMode = 'static';
            worldContainer.addChild(this.container);
        }
        this.container.visible = true;
        this.container.removeChildren().forEach((c) => c.destroy({ children: true }));

        const mesh = procCache!.meshAndMap.mesh;
        const stationIds = procCache!.railroadStationIds;
        const n = stationIds.length;

        for (let legIndex = 0; legIndex < n; legIndex++) {
            const fromR = stationIds[legIndex]!;
            const toR = stationIds[(legIndex + 1) % n]!;
            const mx = (mesh.x_of_r(fromR) + mesh.x_of_r(toR)) / 2;
            const my = (mesh.y_of_r(fromR) + mesh.y_of_r(toR)) / 2;
            const worldX = mx * MESH_TO_WORLD;
            const worldY = my * MESH_TO_WORLD;
            const radiusWorld = Math.min(
                getRegionHandleRadiusWorld(mesh, fromR),
                getRegionHandleRadiusWorld(mesh, toR)
            );
            const midCircle = new PIXI.Graphics();
            midCircle.circle(0, 0, radiusWorld);
            midCircle.fill({ color: 0x4488ff, alpha: 0.7 });
            midCircle.stroke({ width: 2, color: 0xffffff });
            midCircle.position.set(worldX, worldY);
            midCircle.eventMode = 'none';
            this.container.addChild(midCircle);
        }

        this.waypointsByLeg.clear();
        for (const w of railroadWaypoints) {
            const list = this.waypointsByLeg.get(w.legIndex) ?? [];
            list.push({ regionId: w.regionId, waypointIndex: list.length });
            this.waypointsByLeg.set(w.legIndex, list);
        }
        this.waypointsByLeg.forEach((list, legIndex) => {
            list.forEach(({ regionId, waypointIndex }) => {
                const wx = mesh.x_of_r(regionId) * MESH_TO_WORLD;
                const wy = mesh.y_of_r(regionId) * MESH_TO_WORLD;
                const radiusWorld = getRegionHandleRadiusWorld(mesh, regionId);
                const g = new PIXI.Graphics();
                g.circle(0, 0, radiusWorld);
                g.fill({ color: 0xffaa44, alpha: 0.9 });
                g.stroke({ width: 2, color: 0xffffff });
                g.position.set(wx, wy);
                g.eventMode = 'static';
                g.cursor = 'grab';
                (g as unknown as { legIndex: number; waypointIndex: number }).legIndex = legIndex;
                (g as unknown as { waypointIndex: number }).waypointIndex = waypointIndex;
                g.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                    e.stopPropagation();
                    this.dragging = { legIndex, waypointIndex };
                    window.addEventListener('pointermove', this.boundPointerMove);
                    window.addEventListener('pointerup', this.boundPointerUp);
                });
                this.container!.addChild(g);
            });
        });
    }

    /** Returns { legIndex, waypointIndex } if (worldX, worldY) is inside an orange waypoint handle. */
    getWaypointHandleAtWorldCoords(
        host: Pick<WaypointManagerHost, 'procCache' | 'railroadWaypoints'>,
        worldX: number,
        worldY: number
    ): { legIndex: number; waypointIndex: number } | null {
        const { procCache, railroadWaypoints } = host;
        if (!procCache || railroadWaypoints.length === 0) return null;
        const mesh = procCache.meshAndMap.mesh;
        this.waypointsByLeg.clear();
        for (const w of railroadWaypoints) {
            const list = this.waypointsByLeg.get(w.legIndex) ?? [];
            list.push({ regionId: w.regionId, waypointIndex: list.length });
            this.waypointsByLeg.set(w.legIndex, list);
        }
        for (const [legIndex, list] of this.waypointsByLeg) {
            for (const { regionId, waypointIndex } of list) {
                const wx = mesh.x_of_r(regionId) * MESH_TO_WORLD;
                const wy = mesh.y_of_r(regionId) * MESH_TO_WORLD;
                const r = getRegionHandleRadiusWorld(mesh, regionId);
                const dSq = (worldX - wx) ** 2 + (worldY - wy) ** 2;
                if (dSq <= r * r) return { legIndex, waypointIndex };
            }
        }
        return null;
    }

    private handlePointerMove(e: PointerEvent): void {
        if (!this.dragging || !this.container) return;
        const host = this.host;
        if (!host?.app || !host?.worldContainer) return;
        const { worldX, worldY } = screenToWorld(
            e as unknown as MouseEvent,
            host.app,
            host.worldContainer,
            host.zoom
        );
        const child = this.container.children.find((c) => {
            const d = c as unknown as { legIndex: number; waypointIndex: number };
            return (
                d.legIndex === this.dragging!.legIndex &&
                d.waypointIndex === this.dragging!.waypointIndex
            );
        });
        if (child) child.position.set(worldX, worldY);
    }

    private handlePointerUp(): void {
        if (!this.dragging || !this.container) return;
        const host = this.host;
        if (!host?.app || !host?.worldContainer) return;
        window.removeEventListener('pointermove', this.boundPointerMove);
        window.removeEventListener('pointerup', this.boundPointerUp);
        const child = this.container.children.find((c) => {
            const d = c as unknown as { legIndex: number; waypointIndex: number };
            return (
                d.legIndex === this.dragging!.legIndex &&
                d.waypointIndex === this.dragging!.waypointIndex
            );
        });
        const regionId = child ? host._getRegionAtWorld(child.position.x, child.position.y) : null;
        if (regionId != null) {
            host._onUpdateWaypointRegion(
                this.dragging.legIndex,
                this.dragging.waypointIndex,
                regionId
            );
        }
        this.dragging = null;
    }

    destroy(): void {
        this.host = null;
        this.container = null;
        this.dragging = null;
    }
}
