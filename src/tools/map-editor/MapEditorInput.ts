import type * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { screenToWorld, toCanvasCoords } from './MapEditorInputHandlers';
import { handleZoom as handleZoomViewport } from './MapEditorViewport';
import { updateCursorCoords } from './MapEditorUIOverlays';
import { updateBrushCursor } from './MapEditorBrushCursor';
import { executeTool } from './MapEditorToolUse';
import {
    isWorldPointOnSplinePath,
    SPLINE_HIT_THRESHOLD_WORLD,
    getNearestLegIndexForWorldPoint,
    getWaypointInsertionIndex
} from './MapEditorRailroadUtils';

import { AddManualTownCommand } from './commands/AddManualTownCommand';
import { AddManualStationCommand } from './commands/AddManualStationCommand';
import { AddWaypointCommand } from './commands/AddWaypointCommand';
import { RemoveWaypointCommand } from './commands/RemoveWaypointCommand';
import { BatchObjectCommand } from './commands/BatchObjectCommand';
import type { MapEditorCore } from './MapEditorCore';
import type { ObjectAction } from './MapEditorState';
import type { ManualStation } from '../../world/MapDataService';

export interface InputState {
    isDragging: boolean;
    isPainting: boolean;
    isSpacePressed: boolean;
    lastMousePosition: { x: number; y: number };
    currentObjectActions: ObjectAction[];
}

export function setupInputListeners(core: MapEditorCore, state: InputState): { cleanup: () => void } {
    const handleZoomBind = (e: WheelEvent) => handleZoom(e, core);
    const handleMouseDownBind = (e: MouseEvent) => handleMouseDown(e, core, state);
    const handleContextMenuBind = (e: MouseEvent) => handleContextMenu(e, core);
    const handleMouseMoveBind = (e: MouseEvent) => handleMouseMove(e, core, state);
    const handleMouseUpBind = (e: MouseEvent) => handleMouseUp(e, core, state);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space') state.isSpacePressed = true;
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
            e.preventDefault();
            e.shiftKey ? core.getCommandManager().redo() : core.getCommandManager().undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
            e.preventDefault();
            core.getCommandManager().redo();
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'Space') state.isSpacePressed = false;
    };

    const canvas = core.getApp()?.canvas;
    if (canvas) {
        canvas.addEventListener('wheel', handleZoomBind, { passive: false });
        canvas.addEventListener('mousedown', handleMouseDownBind);
        canvas.addEventListener('contextmenu', handleContextMenuBind);
    }
    window.addEventListener('mousemove', handleMouseMoveBind);
    window.addEventListener('mouseup', handleMouseUpBind);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return {
        cleanup: () => {
            if (canvas) {
                canvas.removeEventListener('wheel', handleZoomBind);
                canvas.removeEventListener('mousedown', handleMouseDownBind);
                canvas.removeEventListener('contextmenu', handleContextMenuBind);
            }
            window.removeEventListener('mousemove', handleMouseMoveBind);
            window.removeEventListener('mouseup', handleMouseUpBind);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        }
    };
}

function handleZoom(e: WheelEvent, core: MapEditorCore): void {
    const app = core.getApp();
    const worldContainer = core.getWorldContainer();
    if (!app || !worldContainer) return;

    handleZoomViewport(e, {
        app,
        worldContainer,
        zoom: core.getZoom(),
        onZoomChange: (v) => core.setZoom(v),
        onWorldContainerMove: (x, y) => {
            worldContainer.x = x;
            worldContainer.y = y;
        },
        onZoomUIUpdate: () => core.triggerZoomUIUpdate()
    });
}

function handleMouseDown(e: MouseEvent, core: MapEditorCore, state: InputState): void {
    const app = core.getApp();
    const worldContainer = core.getWorldContainer();

    if (e.button === 1 || (e.button === 0 && state.isSpacePressed) && app) {
        state.isDragging = true;
        const { x, y } = toCanvasCoords(e.clientX, e.clientY, app.canvas);
        state.lastMousePosition = { x, y };
    }
    else if (e.button === 0) {
        const onNextClickAction = core.getOnNextClickAction();
        if (onNextClickAction && app && worldContainer) {
            const { worldX, worldY } = screenToWorld(e, app, worldContainer, core.getZoom());
            core.clearOnNextClickAction();
            onNextClickAction(worldX, worldY);
            return;
        }
        if (core.getEditingMode() !== 'manipulation') state.isPainting = true;
        useTool(e, core, state);
    }
}

function handleMouseMove(e: MouseEvent, core: MapEditorCore, state: InputState): void {
    const app = core.getApp();
    const worldContainer = core.getWorldContainer();

    if (state.isDragging && worldContainer && app) {
        const { x, y } = toCanvasCoords(e.clientX, e.clientY, app.canvas);
        const dx = x - state.lastMousePosition.x;
        const dy = y - state.lastMousePosition.y;

        worldContainer.x += dx;
        worldContainer.y += dy;

        state.lastMousePosition = { x, y };
    }

    if (state.isPainting) {
        useTool(e, core, state);
    }

    if (worldContainer && app) {
        const zoom = core.getZoom();
        const { worldX, worldY } = screenToWorld(e, app, worldContainer, zoom);
        updateCursorCoords(worldX, worldY);
        const brushCursor = core.getBrushCursor();
        if (brushCursor) {
            updateBrushCursor({
                brushCursor,
                worldX,
                worldY,
                editingMode: core.getEditingMode(),
                currentTool: core.getCurrentTool(),
                brushSize: 1,
                zoom,
                shiftKey: e.shiftKey
            });
        }
    }
}

function handleMouseUp(_e: MouseEvent, core: MapEditorCore, state: InputState): void {
    state.isDragging = false;
    state.isPainting = false;
    if (state.currentObjectActions.length > 0) {
        core.getCommandManager().record(new BatchObjectCommand(core.getChunkManager()!, [...state.currentObjectActions]));
        state.currentObjectActions = [];
        Logger.info('[MapEditor] Object Batch Recorded');
    }
}

function handleContextMenu(e: MouseEvent, core: MapEditorCore): void {
    e.preventDefault();
    const app = core.getApp();
    const worldContainer = core.getWorldContainer();
    if (!app || !worldContainer) return;

    const zoom = core.getZoom();
    const { worldX, worldY } = screenToWorld(e, app, worldContainer, zoom);

    const procCache = core.getProcCache();
    const railroadWaypoints = core.getRailroadWaypoints();
    const waypointManager = core.getWaypointManager();

    const waypointAt = waypointManager.getWaypointHandleAtWorldCoords(
        { procCache, railroadWaypoints },
        worldX,
        worldY
    );

    if (waypointAt !== null) {
        showMenu(e.clientX, e.clientY, [
            {
                label: 'Remove spline waypoint', action: () => {
                    core.executeCommand(new RemoveWaypointCommand(core, waypointAt.legIndex, waypointAt.waypointIndex));
                    Logger.info('[MapEditor] Removed spline waypoint for leg', waypointAt.legIndex);
                }
            }
        ]);
        return;
    }

    const regionId = core.getRegionAtWorld(worldX, worldY);
    if (regionId == null) return;

    const items = [
        {
            label: 'Place town', action: () => {
                core.executeCommand(new AddManualTownCommand(core, regionId));
                Logger.info('[MapEditor] Placed town at region', regionId);
            }
        },
        {
            label: 'Place station', action: () => {
                const manualStations = core.getManualStations();
                const nextOrder = manualStations.reduce((m: number, s: ManualStation) => Math.max(m, s.order), 0) + 1;
                core.executeCommand(new AddManualStationCommand(core, regionId, nextOrder));
                Logger.info('[MapEditor] Placed station', nextOrder, 'at region', regionId);
            }
        }
    ];

    if (isWorldPointOnSplinePath(procCache, worldX, worldY, SPLINE_HIT_THRESHOLD_WORLD)) {
        const leg = getNearestLegIndexForWorldPoint(procCache, (wx, wy) => core.getRegionAtWorld(wx, wy), worldX, worldY);
        if (leg !== null) {
            items.push({
                label: 'Add spline point', action: () => {
                    const insertIndex = getWaypointInsertionIndex(procCache, leg, railroadWaypoints, worldX, worldY);
                    core.executeCommand(new AddWaypointCommand(core, leg, regionId, insertIndex));
                    Logger.info('[MapEditor] Added spline point (waypoint) for leg', leg);
                }
            });
        }
    }

    showMenu(e.clientX, e.clientY, items);
}

function showMenu(x: number, y: number, items: { label: string, action: () => void }[]) {
    const menu = document.createElement('div');
    menu.style.cssText = 'position:fixed;background:#2d2d2d;border:1px solid #555;border-radius:6px;padding:4px 0;min-width:140px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.4);';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;

    items.forEach(({ label, action }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.style.cssText = 'display:block;width:100%;padding:8px 14px;border:none;background:transparent;color:#eee;text-align:left;cursor:pointer;font-size:13px;';
        btn.addEventListener('mouseenter', () => { btn.style.background = '#3d3d3d'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
        btn.addEventListener('click', () => { action(); menu.remove(); });
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    const close = () => { menu.remove(); document.removeEventListener('click', close); };
    requestAnimationFrame(() => document.addEventListener('click', close));
}

function useTool(e: MouseEvent, core: MapEditorCore, state: InputState): void {
    const chunkManager = core.getChunkManager();
    const worldContainer = core.getWorldContainer();
    const app = core.getApp();

    if (!chunkManager || !worldContainer || !app) return;
    if (core.getEditingMode() === 'manipulation') return;

    const { worldX, worldY } = screenToWorld(e, app, worldContainer, core.getZoom());

    executeTool(
        worldX,
        worldY,
        e,
        {
            currentTool: core.getCurrentTool(),
            editingMode: core.getEditingMode(),
            brushSize: 1,
            selectedAsset: core.getSelectedAsset()
        },
        chunkManager,
        core.getCommandManager(),
        state.currentObjectActions,
        {
            onObjectAction: (action) => state.currentObjectActions.push(action)
        }
    );
}
