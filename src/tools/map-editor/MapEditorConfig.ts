
import { GameConstants } from '@data/GameConstants';

export const MapEditorConfig = {
    // inherit from game constants to ensure 1:1 match
    TILE_SIZE: GameConstants.Grid.CELL_SIZE,

    // Editor specific Rendering constants
    CHUNK_SIZE: 32, // tiles per chunk (32x32 = 1024 chunks visible logic)

    // World Dimensions (Targeting 160,000px world)
    // 160,000 / 128 = 1250 tiles
    WORLD_WIDTH_TILES: 1250,
    WORLD_HEIGHT_TILES: 1250,

    // Layers
    Layers: {
        GROUND: 0,
        ELEVATION: 1,
        OBJECTS: 2,
        COLLISION: 3
    },

    // Viewport Settings
    VIEWPORT_PADDING: 128 * 4, // 4 tiles padding
    MIN_ZOOM: 0.006,
    MAX_ZOOM: 4.0,

    // Colors for Debug/UI
    Colors: {
        GRID: 0x333333,
        CHUNK_BORDER: 0x00FF00,
        COLLISION_FILL: 0xFF0000,
        COLLISION_ALPHA: 0.3,
        SELECTION_BORDER: 0xFFFF00
    }
};
