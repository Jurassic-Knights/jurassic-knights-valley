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
    ],

    // Artillery Strike
    BOMBARDMENT_SHELL: [
        { time: 0, layer: 'fg', type: 'streak', params: { color: '#FFCC00', size: 40, lifetime: 700, trail: { color: '#FF0000', size: 20 } } }
    ]
};

window.VFX_Sequences = VFX_Sequences;
