/**
 * MapEditorBrushCursor - Brush cursor drawing for zone/ground modes
 */
import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';

export interface BrushCursorParams {
    brushCursor: PIXI.Graphics;
    worldX: number;
    worldY: number;
    editingMode: 'object' | 'zone' | 'ground';
    currentTool: string;
    brushSize: number;
    zoom: number;
    shiftKey: boolean;
}

export function updateBrushCursor(params: BrushCursorParams): void {
    const {
        brushCursor,
        worldX,
        worldY,
        editingMode,
        currentTool,
        brushSize,
        zoom,
        shiftKey
    } = params;

    if (
        (editingMode === 'zone' || editingMode === 'ground') &&
        currentTool === 'brush'
    ) {
        brushCursor.visible = true;
        brushCursor.clear();

        const { TILE_SIZE } = MapEditorConfig;

        let radiusPx = 0;
        let snapX = worldX;
        let snapY = worldY;

        if (editingMode === 'ground') {
            radiusPx = brushSize * 4;
            snapX = Math.floor(worldX / 32) * 32 + 16;
            snapY = Math.floor(worldY / 32) * 32 + 16;
        } else {
            radiusPx = (brushSize - 0.5) * TILE_SIZE;
            snapX = Math.floor(worldX / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
            snapY = Math.floor(worldY / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
        }

        brushCursor.circle(snapX, snapY, radiusPx);

        const color = shiftKey ? 0xff0000 : 0x00ff00;
        brushCursor.stroke({ width: 2 / zoom, color, alpha: 0.8 });
        brushCursor.fill({ color, alpha: 0.1 });
    } else {
        brushCursor.visible = false;
    }
}
