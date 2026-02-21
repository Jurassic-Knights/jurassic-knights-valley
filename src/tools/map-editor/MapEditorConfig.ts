import { GameConstants } from '@data/GameConstants';

export const MapEditorConfig = {
    // inherit from game constants to ensure 1:1 match
    TILE_SIZE: GameConstants.Grid.CELL_SIZE,

    // Editor specific Rendering constants
    CHUNK_SIZE: 32, // tiles per chunk (32x32 = 1024 chunks visible logic)
    /** Splat resolution per chunk (CHUNK_SIZE * 4). Used for ground blending. */
    SPLAT_RES: 128,

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

    /** Cap procedural canvas size to avoid OOM on large displays. */
    MAX_PROCEDURAL_CANVAS_SIZE: 2048,

    /** Procedural coast/splat constants. */
    Procedural: {
        /** Tiles of coast gradient from water edge. */
        COAST_DEPTH: 2,
        /** Radius (tiles) for water splat gradient. */
        WATER_SPLAT_RADIUS: 8,
        /** Intensity for water splat gradient. */
        WATER_SPLAT_INTENSITY: 200
    },

    /** Railroad spline and mesh constants. */
    Railroad: {
        /** Douglas-Peucker simplify tolerance. Lower = preserve more points. */
        SIMPLIFY_TOLERANCE: 6,
        /** Arc radius for corners (mesh units). */
        DEFAULT_ARC_RADIUS_MESH: 28,
        /** Steps per spline segment. */
        STEPS_PER_SEGMENT: 24,
        /** Min spacing between samples (mesh units). */
        MIN_SAMPLE_SPACING_MESH: 3,
        /** Max spline samples to cap memory. */
        MAX_SPLINE_SAMPLES: 1200,
        /** Buffer steps from coast for blocked regions. */
        COASTAL_BUFFER_STEPS: 2
    },

    /** Debug overlay constants. */
    Debug: {
        MAX_DRAW_SAMPLES: 500,
        DOT_RADIUS: 4,
        FONT_SIZE: 14,
        LABEL_FONT_SIZE: 24,
        ARROW_SIZE: 10
    },

    /** UI and input constants. */
    UI: {
        ZOOM_FACTOR: 1.1,
        BRUSH_SIZE_MULTIPLIER: 4,
        SPLAT_INTENSITY_POSITIVE: 50,
        SPLAT_INTENSITY_NEGATIVE: -50,
        SNAP_GRID: 32,
        HERO_SPAWN_Z_INDEX: 9980,
        SCALE_REF_Z_INDEX: 10000
    }
};
