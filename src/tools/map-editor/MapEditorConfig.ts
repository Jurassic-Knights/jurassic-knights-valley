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
    /** Game viewport dimensions (match GameRendererViewport). Portrait: 1100 wide. Landscape: 1950 tall. */
    GAME_VIEWPORT_PORTRAIT_WIDTH: 1100,
    GAME_VIEWPORT_LANDSCAPE_HEIGHT: 1950,

    // Colors for Debug/UI
    Colors: {
        GRID: 0x333333,
        CHUNK_BORDER: 0x00ff00,
        COLLISION_FILL: 0xff0000,
        COLLISION_ALPHA: 0.3,
        SELECTION_BORDER: 0xffff00
    },
    // Rendering Logic
    RenderConfig: {
        BLEND_DEPTH_FACTOR: 0.15, // Contrast of the height blend (lower = sharper)
        NOISE_SCALE: 0.25 // Influence of noise on the transition
    },

    /** When true, main view uses color-block placeholders instead of textures (fast). */
    USE_PLACEHOLDER_GROUND: true,

    /** When true, polygon map is the ground; chunks render only objects (no tile grid). */
    USE_POLYGON_MAP_AS_GROUND: true,

    /** Road generator: grid divisions for coverage lookup; max shortcut edges. */
    RoadGenerator: {
        COVERAGE_GRID_N: 25,
        MAX_SHORTCUTS: 10
    },

    /** Procedural coast/splat constants. */
    Procedural: {
        /** Tiles of coast gradient from water edge. */
        COAST_DEPTH: 2,
        /** Radius (tiles) for water splat gradient. */
        WATER_SPLAT_RADIUS: 8,
        /** Intensity for water splat gradient. */
        WATER_SPLAT_INTENSITY: 200
    }
};
