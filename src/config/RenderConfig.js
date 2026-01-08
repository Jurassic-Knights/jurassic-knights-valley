/**
 * RenderConfig - Centralized Rendering Constants
 * 
 * Separates visual magic numbers from game logic.
 * Organized by Entity Type.
 */
const RenderConfig = {
    Hero: {
        // Sprite Dimensions
        WIDTH: 186,
        HEIGHT: 186,

        // Colors (Fallback)
        COLOR: '#D4AF37',

        // Shadow
        SHADOW_SCALE_X: 0.7,
        SHADOW_SCALE_Y: 0.25,
        SHADOW_OFFSET_Y: -5,

        // Weapon Rendering
        WEAPON: {
            RIFLE: {
                TARGET_WIDTH: 200,
                OFFSET_X: -40,
                // Recoil Animation
                RECOIL_DISTANCE: -10,
                KICK_DURATION_PCT: 0.1,
                RECOVER_DURATION_PCT: 0.3
            },
            SHOVEL: {
                TARGET_HEIGHT: 200,
                OFFSET_Y: 40,
                // Swing Animation
                IDLE_ANGLE: -0.5,
                COCK_ANGLE: -0.5,
                SWING_FWD_ANGLE: -1.0,
                SWING_MAX_ANGLE: 2.5,
                RETURN_ANGLE: 1.5
            }
        },

        // VFX
        DUST: {
            DENSITY: 8,
            SPREAD_X: 45,
            SPREAD_Y: 15,
            COLOR: '#8D6E63',
            SIZE_BASE: 20,
            SIZE_VAR: 8,
            LIFETIME_BASE: 800,
            LIFETIME_VAR: 400
        }
    }
};

window.RenderConfig = RenderConfig;
if (window.Registry) Registry.register('RenderConfig', RenderConfig);
