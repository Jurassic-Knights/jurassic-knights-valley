/**
 * MapEditorInputHandlers - Zoom and mouse-to-world coordinate conversion
 */
import { MapEditorConfig } from './MapEditorConfig';

/** Convert display coords to canvas coords (fixes drift when canvas resolution !== display size, e.g. retina) */
export function toCanvasCoords(clientX: number, clientY: number, canvas: HTMLCanvasElement): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

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

    const { x: mouseX, y: mouseY } = toCanvasCoords(e.clientX, e.clientY, app.canvas);

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
    const { x: mouseX, y: mouseY } = toCanvasCoords(e.clientX, e.clientY, app.canvas);
    return {
        worldX: (mouseX - worldContainer.x) / zoom,
        worldY: (mouseY - worldContainer.y) / zoom
    };
}
