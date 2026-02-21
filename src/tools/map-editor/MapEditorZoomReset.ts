/**
 * MapEditorZoomReset — Reset zoom to match game viewport for parity.
 */

import { MapEditorConfig } from './MapEditorConfig';

export interface ZoomResetContext {
    canvasWidth: number;
    canvasHeight: number;
    worldContainer: { x: number; y: number; scale: { set: (v: number) => void } };
    zoom: number;
}

/** Reset zoom to game viewport ratio. Returns new zoom and world container position. */
export function computeZoomReset(ctx: ZoomResetContext): { zoom: number; worldX: number; worldY: number } {
    const { canvasWidth, canvasHeight, worldContainer, zoom } = ctx;
    const aspect = canvasWidth / canvasHeight;
    const isPortrait = canvasHeight > canvasWidth;

    let viewportW: number, viewportH: number;
    if (isPortrait) {
        viewportW = MapEditorConfig.GAME_VIEWPORT_PORTRAIT_WIDTH;
        viewportH = viewportW / aspect;
    } else {
        viewportH = MapEditorConfig.GAME_VIEWPORT_LANDSCAPE_HEIGHT;
        viewportW = viewportH * aspect;
    }

    const gameZoom = canvasWidth / viewportW;
    const newZoom = Math.max(MapEditorConfig.MIN_ZOOM, Math.min(MapEditorConfig.MAX_ZOOM, gameZoom));

    const centerScreenX = canvasWidth / 2;
    const centerScreenY = canvasHeight / 2;
    const centerWorldX = (centerScreenX - worldContainer.x) / zoom;
    const centerWorldY = (centerScreenY - worldContainer.y) / zoom;

    return {
        zoom: newZoom,
        worldX: centerScreenX - centerWorldX * newZoom,
        worldY: centerScreenY - centerWorldY * newZoom
    };
}
