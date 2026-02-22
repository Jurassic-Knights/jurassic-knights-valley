/**
 * MapEditorViewport
 *
 * Viewport and zoom state. Handles pan, zoom, screen-to-world conversion.
 * No PIXI rendering; operates on container coordinates.
 */
import {
    handleZoom as handleZoomImpl,
    screenToWorld,
    toCanvasCoords
} from './MapEditorInputHandlers';
import { computeZoomReset } from './MapEditorZoomReset';

export interface ViewportHost {
    app: { canvas: HTMLCanvasElement } | null;
    worldContainer: { x: number; y: number; scale: { set: (v: number) => void } } | null;
    zoom: number;
    onZoomChange: (v: number) => void;
    onWorldContainerMove: (x: number, y: number) => void;
    onZoomUIUpdate: () => void;
}

export function handleZoom(e: WheelEvent, host: ViewportHost): void {
    handleZoomImpl(
        e,
        host.app!,
        host.worldContainer,
        host.zoom,
        (v) => host.onZoomChange(v),
        (x, y) => host.onWorldContainerMove(x, y),
        host.onZoomUIUpdate
    );
}

export function screenToWorldCoords(
    e: MouseEvent,
    app: { canvas: HTMLCanvasElement },
    worldContainer: { x: number; y: number },
    zoom: number
): { worldX: number; worldY: number } {
    return screenToWorld(e, app, worldContainer, zoom);
}

export { toCanvasCoords };

export function getViewportWorldRect(
    app: { canvas: HTMLCanvasElement } | null,
    worldContainer: { x: number; y: number } | null,
    zoom: number
): { x: number; y: number; width: number; height: number } | null {
    if (!app || !worldContainer) return null;
    const w = app.canvas.width / zoom;
    const h = app.canvas.height / zoom;
    return {
        x: -worldContainer.x / zoom,
        y: -worldContainer.y / zoom,
        width: w,
        height: h
    };
}

export function centerViewOn(
    app: { canvas: HTMLCanvasElement },
    worldContainer: { x: number; y: number },
    zoom: number,
    worldX: number,
    worldY: number
): void {
    const cx = app.canvas.width / 2;
    const cy = app.canvas.height / 2;
    worldContainer.x = cx - worldX * zoom;
    worldContainer.y = cy - worldY * zoom;
}

export function resetZoomToGame(params: {
    canvasWidth: number;
    canvasHeight: number;
    worldContainer: { x: number; y: number; scale: { set: (v: number) => void } };
    zoom: number;
}): { zoom: number; worldX: number; worldY: number } {
    return computeZoomReset(params);
}
