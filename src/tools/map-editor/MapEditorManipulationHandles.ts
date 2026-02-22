/**
 * MapEditorManipulationHandles
 *
 * Manipulation handles for towns and stations when mode is 'manipulation'.
 * Draggable circles; on drop, updates town/station region.
 */
import * as PIXI from 'pixi.js';
import type { ManualStation } from '../../world/MapDataService';
import type { ProceduralCache } from './MapEditorProceduralRenderer';
import { MESH_TO_WORLD, getRegionHandleRadiusWorld } from './MapEditorRailroadUtils';
import { screenToWorld } from './MapEditorInputHandlers';

export interface ManipulationHandlesHost {
    procCache: ProceduralCache | null;
    worldContainer: PIXI.Container | null;
    app: PIXI.Application | null;
    zoom: number;
    manualTowns: number[];
    manualStations: ManualStation[];
    editingMode: string;
    onSetTownAt: (index: number, regionId: number) => void;
    onSetStationRegion: (index: number, regionId: number) => void;
    getRegionAtWorld: (worldX: number, worldY: number) => number | null;
}

export class MapEditorManipulationHandles {
    private container: PIXI.Container | null = null;
    private dragging: { type: 'town'; index: number } | { type: 'station'; index: number } | null =
        null;
    private host: ManipulationHandlesHost | null = null;
    private lastKey = '';
    private readonly boundPointerMove = (e: PointerEvent) => this.handlePointerMove(e);
    private readonly boundPointerUp = () => this.handlePointerUp();

    update(host: ManipulationHandlesHost): void {
        this.host = host;
        const {
            procCache,
            worldContainer,
            app,
            zoom: _zoom,
            manualTowns,
            manualStations,
            editingMode
        } = host;

        if (!worldContainer || !app) return;
        if (editingMode !== 'manipulation') {
            if (this.container) this.container.visible = false;
            this.lastKey = '';
            return;
        }
        if (!procCache) {
            if (this.container) this.container.visible = false;
            this.lastKey = '';
            return;
        }

        if (this.dragging) return;

        const key = `manual-${manualTowns.join(',')}-${manualStations.map((s) => `${s.regionId}:${s.order}`).join(',')}`;
        if (key === this.lastKey) return;
        this.lastKey = key;

        if (!this.container) {
            this.container = new PIXI.Container();
            this.container.zIndex = 1000;
            this.container.eventMode = 'static';
            worldContainer.addChild(this.container);
        }
        this.container.visible = true;
        this.container.removeChildren().forEach((c) => c.destroy({ children: true }));

        const mesh = procCache.meshAndMap.mesh;

        const addHandle = (
            worldX: number,
            worldY: number,
            radiusWorld: number,
            fillColor: number,
            type: 'town' | 'station',
            index: number
        ) => {
            const g = new PIXI.Graphics();
            g.circle(0, 0, radiusWorld);
            g.fill({ color: fillColor, alpha: 0.9 });
            g.stroke({ width: 2, color: 0xffffff });
            g.position.set(worldX, worldY);
            g.eventMode = 'static';
            g.cursor = 'grab';
            (g as unknown as { manipulationType: 'town' | 'station' }).manipulationType = type;
            (g as unknown as { manipulationIndex: number }).manipulationIndex = index;
            g.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
                e.stopPropagation();
                this.dragging =
                    type === 'town' ? { type: 'town', index } : { type: 'station', index };
                window.addEventListener('pointermove', this.boundPointerMove);
                window.addEventListener('pointerup', this.boundPointerUp);
            });
            this.container!.addChild(g);
        };

        manualTowns.forEach((regionId, i) => {
            const worldX = mesh.x_of_r(regionId) * MESH_TO_WORLD;
            const worldY = mesh.y_of_r(regionId) * MESH_TO_WORLD;
            const radiusWorld = getRegionHandleRadiusWorld(mesh, regionId);
            addHandle(worldX, worldY, radiusWorld, 0x22aa44, 'town', i);
        });
        manualStations.forEach((s, i) => {
            const worldX = mesh.x_of_r(s.regionId) * MESH_TO_WORLD;
            const worldY = mesh.y_of_r(s.regionId) * MESH_TO_WORLD;
            const radiusWorld = getRegionHandleRadiusWorld(mesh, s.regionId);
            addHandle(worldX, worldY, radiusWorld, 0xffaa44, 'station', i);
        });
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
            const type = (c as unknown as { manipulationType: 'town' | 'station' })
                .manipulationType;
            const index = (c as unknown as { manipulationIndex: number }).manipulationIndex;
            return (
                type === this.dragging!.type &&
                index === (this.dragging as { type: 'town' | 'station'; index: number }).index
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
            const type = (c as unknown as { manipulationType: 'town' | 'station' })
                .manipulationType;
            const index = (c as unknown as { manipulationIndex: number }).manipulationIndex;
            return (
                type === this.dragging!.type &&
                index === (this.dragging as { type: 'town' | 'station'; index: number }).index
            );
        });
        const drag = this.dragging;
        this.dragging = null;
        if (child) {
            const regionId = host.getRegionAtWorld(child.position.x, child.position.y);
            if (regionId != null) {
                if (drag.type === 'town') host.onSetTownAt(drag.index, regionId);
                else host.onSetStationRegion(drag.index, regionId);
            }
        }
    }

    destroy(): void {
        this.host = null;
        this.container = null;
        this.dragging = null;
    }
}
