
import * as PIXI from 'pixi.js';
import { MapEditorConfig } from './MapEditorConfig';

/**
 * MapRenderer
 * 
 * Handles reading the Map Data and rendering it via PixiJS.
 * Contains the actual "Paint" logic (creating sprites, etc).
 */
export class MapRenderer {
    private stage: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
    }

    // Future methods:
    // renderTile(chunk, x, y, assetId)
    // renderObject(chunk, x, y, assetId)
    // refreshChunk(chunk)
}
