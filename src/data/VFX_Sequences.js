/**
 * VFX_Sequences - Composed Multi-Step Effect Timelines
 *
 * Complex effects that play multiple particles with timing.
 * Used by VFXController.playSequence().
 */

const VFX_Sequences = {
    // Standard Explosion
    EXPLOSION_GENERIC: [
        { time: 0, layer: 'fg', template: 'GLOW_CORE_WHITE', params: { size: 100 } },
        { time: 50, layer: 'fg', template: 'SHOCKWAVE_FAST_WHITE' },
        { time: 100, layer: 'fg', template: 'DEBRIS_BURST_GOLD', params: { color: '#333333' } },
        { time: 200, layer: 'fg', template: 'SMOKE_PLUME' }
    ]
};

window.VFX_Sequences = VFX_Sequences;

// ES6 Module Export
export { VFX_Sequences };
