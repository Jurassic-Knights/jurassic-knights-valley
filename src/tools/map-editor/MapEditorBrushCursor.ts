/**
 * MapEditorBrushCursor - Brush cursor drawing for zone/ground modes
 */
import * as PIXI from 'pixi.js';
import { EditorContext } from './EditorContext';
import type { EditingMode } from './MapEditorState';

export interface BrushCursorParams {
    brushCursor: PIXI.Graphics;
    worldX: number;
    worldY: number;
    editingMode: EditingMode;
    currentTool: string;
    brushSize: number;
    zoom: number;
    shiftKey: boolean;
}

export function updateBrushCursor(params: BrushCursorParams): void {
    const { brushCursor } = params;
    brushCursor.visible = false;
}
