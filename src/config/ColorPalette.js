/**
 * ColorPalette - Centralized color constants for game systems
 *
 * SINGLE SOURCE OF TRUTH - Use these instead of inline hex strings in JS code.
 * For CSS colors, use variables.css instead.
 */
const ColorPalette = {
    // Gold/Reward colors
    GOLD: '#FFD700',
    GOLD_DARK: '#B8860B',
    MOCCASIN: '#FFE4B5',

    // Damage/Combat colors
    DAMAGE_RED: '#FF0000',
    DAMAGE_DARK: '#8B0000',
    CRITICAL_HIT: '#FF4500',

    // Healing/Positive colors
    HEAL_GREEN: '#32CD32',
    BUFF_GREEN: '#4CAF50',
    STAMINA_BLUE: '#1E90FF',

    // Health Bar colors (HeroRenderer, DinosaurRenderer)
    HEALTH_GREEN: '#2ECC71',
    HEALTH_BG: '#0E2C1A',
    HEALTH_LOW: '#E74C3C',
    HEALTH_CRITICAL: '#C0392B',

    // Neutral/UI colors
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY_LIGHT: '#AAAAAA',
    GRAY_MID: '#888888',
    GRAY_DARK: '#444444',

    // UI Background colors
    UI_BG_DARK: '#1a1a1a',
    UI_BG_MID: '#252525',
    UI_BG_LIGHT: '#3a3a3a',
    UI_BORDER: '#3a3a3a',
    UI_ACCENT: '#2196f3',

    // Modal colors
    MODAL_BG: '#1a1a2e',
    MODAL_BG_ALT: '#16213e',
    MODAL_BORDER: '#2196f3',
    MODAL_BACKDROP: 'rgba(0, 0, 0, 0.8)',

    // Status colors
    WARNING_ORANGE: '#FFA500',
    ERROR_RED: '#E74C3C',
    SUCCESS_GREEN: '#27AE60',
    INFO_BLUE: '#3498DB',

    // Amber (Resolve bar)
    AMBER: '#FFB347',
    AMBER_DARK: '#8B4513',
    SIENNA: '#CD853F',

    // Parchment/Paper tones
    PARCHMENT: '#D4C9A8',
    INK_BROWN: '#3E362E',
    INK_DARK: '#2B221B'
};

window.ColorPalette = ColorPalette;

// ES6 Module Export
export { ColorPalette };
