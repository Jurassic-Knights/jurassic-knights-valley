/**
 * VFXConfig - VFX Configuration Aggregator
 * 
 * REFACTOR NOTICE: Split into 3 focused files:
 * - VFX_Templates.js: Atomic reusable VFX components
 * - VFX_Sequences.js: Composed multi-step effect timelines
 * - VFX_Categories.js: Domain-specific VFX (HERO, DINO, RESOURCE, etc)
 * 
 * This file now aggregates them for backward compatibility.
 */

const VFXConfig = {
    // Delegate to split files
    get TEMPLATES() { return window.VFX_Templates || {}; },
    get SEQUENCES() { return window.VFX_Sequences || {}; },

    // Category shortcuts
    get PURCHASE() { return (window.VFX_Categories || {}).PURCHASE || {}; },
    get UNLOCK() { return (window.VFX_Categories || {}).UNLOCK || {}; },
    get MAGNET() { return (window.VFX_Categories || {}).MAGNET || {}; },
    get HERO() { return (window.VFX_Categories || {}).HERO || {}; },
    get DINO() { return (window.VFX_Categories || {}).DINO || {}; },
    get RESOURCE() { return (window.VFX_Categories || {}).RESOURCE || {}; }
};

window.VFXConfig = VFXConfig;
