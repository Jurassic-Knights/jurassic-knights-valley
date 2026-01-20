/**
 * VFXConfig - Unified VFX Configuration
 *
 * Combines VFX_Templates, VFX_Categories, and VFX_Sequences into a single
 * VFXConfig object for backward compatibility with existing systems.
 *
 * Owner: VFX Specialist
 */

// Create unified config after components are loaded
(function () {
    'use strict';

    // Wait for dependencies
    if (!window.VFX_Templates || !window.VFX_Categories || !window.VFX_Sequences) {
        (window.Logger || console).warn('[VFXConfig] Dependencies not loaded yet');
    }

    // Create unified VFXConfig
    const VFXConfig = {
        // Templates from VFX_Templates.js
        TEMPLATES: window.VFX_Templates || {},

        // Sequences from VFX_Sequences.js
        SEQUENCES: window.VFX_Sequences || {},

        // Domain-specific categories
        HERO: window.VFX_Categories?.HERO || {},
        DINO: window.VFX_Categories?.DINO || {},
        RESOURCE: window.VFX_Categories?.RESOURCE || {},
        PURCHASE: window.VFX_Categories?.PURCHASE || {},
        UNLOCK: window.VFX_Categories?.UNLOCK || {},
        MAGNET: window.VFX_Categories?.MAGNET || {},
        PROJECTILES: window.VFX_Categories?.PROJECTILES || {}
    };

    // Export
    window.VFXConfig = VFXConfig;
})();

