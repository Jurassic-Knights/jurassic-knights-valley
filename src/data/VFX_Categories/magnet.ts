export const MAGNET = {
    ELECTRIC_ARCS: { type: 'spark', color: '#88CCFF', count: 100, speed: 30, lifetime: 300, size: 8, bias: 'inward', drag: 0.85, blendMode: 'lighter' },
    FIELD_PULSE: { type: 'ring', color: '#4488CC', sizeOverLifetime: [80, 480], lifetime: 500, alpha: 0.6, width: 12, blendMode: 'lighter' },
    STATIC_FLASH: { type: 'glow', color: '#AADDFF', count: 1, size: 240, lifetime: 200, alpha: 0.8, blendMode: 'lighter' },
    METAL_DEBRIS: { type: 'debris', count: 48, speed: 10, gravity: 0, bias: 'inward', lifetime: 600, size: 12, color: '#888888', drag: 0.92 },
    IMPACT_SPARKS: { type: 'spark', count: 80, speed: 18, drag: 0.88, lifetime: 500, size: 8, colorOverLifetime: ['#FFFFFF', '#88CCFF'], blendMode: 'lighter' },
    DUST_CLOUD: { type: 'glow', count: 24, speed: 5, lifetime: 1000, drag: 0.96, color: '#8B7355', sizeOverLifetime: [32, 100], alpha: 0.5 }
};
