export const UNLOCK = {
    CORE_FLASH: { type: 'glow', color: '#FFFFFF', count: 1, size: 150, lifetime: 250, alpha: 1.0, blendMode: 'lighter' },
    SHOCKWAVE_PRIMARY: { type: 'ring', color: '#FFD700', sizeOverLifetime: [40, 500], lifetime: 800, alpha: 0.8, width: 8 },
    SHOCKWAVE_SECONDARY: { type: 'ring', color: '#FFFFFF', sizeOverLifetime: [20, 350], lifetime: 1200, alpha: 0.3, width: 30 },
    DIVINE_GLINT: { type: 'spark', color: '#FFFFFF', count: 25, speed: 12, gravity: -0.1, drag: 0.92, lifetime: 1500, size: 4, alpha: 0.8, blendMode: 'lighter' },
    DEBRIS_COLORS: ['#FFD700', '#C0C0C0', '#DAA520'],
    DEBRIS_BASE: { type: 'debris', count: 8, speed: 14, drag: 0.88, gravity: 0.4, size: 5, lifetime: 1000, alpha: 1 }
};
