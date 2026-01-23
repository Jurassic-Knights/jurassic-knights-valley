/**
 * VFXConfig - Unified VFX Configuration
 *
 * Combines VFX_Templates, VFX_Categories, and VFX_Sequences into a single
 * VFXConfig object for backward compatibility with existing systems.
 *
 * Owner: VFX Specialist
 */

// Ambient declarations
declare const VFX_Templates: any;
declare const VFX_Categories: any;
declare const VFX_Sequences: any;
declare const Logger: any;

// Create unified VFXConfig
const VFXConfig = {
    // Templates from VFX_Templates.js
    TEMPLATES: VFX_Templates || {},

    // Sequences from VFX_Sequences.js
    SEQUENCES: VFX_Sequences || {},

    // Domain-specific categories
    HERO: VFX_Categories?.HERO || {},
    DINO: VFX_Categories?.DINO || {},
    RESOURCE: VFX_Categories?.RESOURCE || {},
    PURCHASE: VFX_Categories?.PURCHASE || {},
    UNLOCK: VFX_Categories?.UNLOCK || {},
    MAGNET: VFX_Categories?.MAGNET || {},
    PROJECTILES: VFX_Categories?.PROJECTILES || {}
};

// Export
if (typeof window !== 'undefined') {
    (window as any).VFXConfig = VFXConfig;
}

// ES6 Module Export
export { VFXConfig };
