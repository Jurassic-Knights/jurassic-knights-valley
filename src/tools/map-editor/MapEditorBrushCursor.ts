/**
 * MapEditorBrushCursor - Brush cursor drawing for zone/ground modes
 */
import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';

export interface BrushCursorParams {
    brushCursor: PIXI.Graphics;
    worldX: number;
    worldY: number;
    editingMode: 'object' | 'manipulation';
    currentTool: string;
    brushSize: number;
    zoom: number;
    shiftKey: boolean;
}

export function updateBrushCursor(params: BrushCursorParams): void {
    const { brushCursor } = params;
    brushCursor.visible = false;
}
