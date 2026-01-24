/**
 * RenderConfig - Centralized Rendering Constants
 *
 * Separates visual magic numbers from game logic.
 * Organized by Entity Type.
 */

import { Registry } from '../core/Registry';


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
            // RANGED weapons (rifles, pistols, etc.) - legacy name kept for compatibility
            RIFLE: {
                TARGET_WIDTH: 200,
                OFFSET_X: -40,
                // Sprite orientation for weapons with grip at bottom-left, muzzle at top-right
                // Weapon naturally points at +45Â°, so rotate +45Â° to align muzzle with aim (0Â°)
                SPRITE_ROTATION: Math.PI / 4,   // +45Â° to align muzzle with aim direction
                ANCHOR_X: 0,                    // Grip at left edge
                ANCHOR_Y: 1,                    // Grip at bottom edge
                // Recoil Animation
                RECOIL_DISTANCE: -10,
                KICK_DURATION_PCT: 0.1,
                RECOVER_DURATION_PCT: 0.3
            },
            // MELEE weapons (swords, axes, etc.) - legacy name kept for compatibility
            SHOVEL: {
                TARGET_HEIGHT: 200,
                OFFSET_Y: 40,
                // Sprite orientation for weapons with handle at bottom-left, tip at top-right
                // Weapon naturally points at +45Â°, so rotate +45Â° to align tip with aim (0Â°)
                SPRITE_ROTATION: Math.PI / 4,   // +45Â° to align tip with aim direction
                TIP_DISTANCE_FACTOR: 0.85,      // Tip is at 85% of diagonal length
                // Pivot point offset - weapon handle is at bottom-left of image
                ANCHOR_X: 0,                    // Left edge
                ANCHOR_Y: 1,                    // Bottom edge (1 = full height from top)
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

if (Registry) Registry.register('RenderConfig', RenderConfig);

export { RenderConfig };
