/**
 * MapEditorInputHandlers - Zoom and mouse-to-world coordinate conversion
 */
import { MapEditorConfig } from './MapEditorConfig';

export function handleZoom(
    e: WheelEvent,
    app: { canvas: HTMLCanvasElement },
    worldContainer: { x: number; y: number; scale: { set: (v: number) => void } } | null,
    zoom: number,
    onZoomChange: (newZoom: number) => void,
    onWorldContainerMove: (x: number, y: number) => void,
    onZoomUIUpdate: () => void
): void {
    e.preventDefault();

    const zoomFactor = 1.1;
    let newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    newZoom = Math.max(MapEditorConfig.MIN_ZOOM, Math.min(MapEditorConfig.MAX_ZOOM, newZoom));

    const rect = app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (worldContainer) {
        const worldPos = {
            x: (mouseX - worldContainer.x) / zoom,
            y: (mouseY - worldContainer.y) / zoom
        };
        onZoomChange(newZoom);
        onWorldContainerMove(
            mouseX - worldPos.x * newZoom,
            mouseY - worldPos.y * newZoom
        );
    } else {
        onZoomChange(newZoom);
    }

    onZoomUIUpdate();
}

export function screenToWorld(
    e: MouseEvent,
    app: { canvas: HTMLCanvasElement },
    worldContainer: { x: number; y: number },
    zoom: number
): { worldX: number; worldY: number } {
    const rect = app.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return {
        worldX: (mouseX - worldContainer.x) / zoom,
        worldY: (mouseY - worldContainer.y) / zoom
    };
}
