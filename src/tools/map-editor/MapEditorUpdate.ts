/**
 * MapEditorUpdate - Main render loop logic for map editor
 */
import type { ChunkManager } from './ChunkManager';
export function runMapEditorUpdate(
    app: { canvas: HTMLCanvasElement },
    worldContainer: { x: number; y: number },
    zoom: number,
    chunkManager: ChunkManager
): void {
    const screenWidth = app.canvas.width;
    const screenHeight = app.canvas.height;

    const worldX = -worldContainer.x / zoom;
    const worldY = -worldContainer.y / zoom;
    const worldWidth = screenWidth / zoom;
    const worldHeight = screenHeight / zoom;

    const viewRect = { x: worldX, y: worldY, width: worldWidth, height: worldHeight };

    chunkManager.update(viewRect, zoom);
}
