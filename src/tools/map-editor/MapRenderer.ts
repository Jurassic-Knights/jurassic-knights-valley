import * as PIXI from 'pixi.js';


/**
 * MapRenderer — Placeholder for future map data rendering via PixiJS.
 * Map editor currently uses ChunkManager + GroundSystem + ObjectSystem directly.
 */
export class MapRenderer {
    public stage: PIXI.Container;

    constructor(stage: PIXI.Container) {
        this.stage = stage;
    }

    // Future methods:
    // renderTile(chunk, x, y, assetId)
    // renderObject(chunk, x, y, assetId)
    // refreshChunk(chunk)
}
