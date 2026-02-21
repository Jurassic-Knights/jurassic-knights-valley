export const DINO = {
    BLOOD_SPLATTER: { type: 'debris', color: '#8B0000', count: 20, speed: 12, gravity: 0.6, lifetime: 400, size: 6, drag: 0.92, spread: 0.8 },
    BLOOD_MIST: { type: 'glow', color: '#660000', count: 8, speed: 4, lifetime: 300, size: 15, alpha: 0.4, drag: 0.95 },
    BLOOD_DROPS: { type: 'circle', color: '#990000', count: 12, speed: 8, gravity: 0.8, lifetime: 600, size: 4, drag: 0.88 },
    MEAT_CHUNKS: { type: 'debris', color: '#8B4513', count: 6, speed: 8, gravity: 0.5, lifetime: 700, size: 10, drag: 0.85 },
    BONE_FRAGMENTS: { type: 'debris', color: '#E8DCC8', count: 4, speed: 10, gravity: 0.4, lifetime: 800, size: 5, drag: 0.9 },
    DEATH_GLOW: { type: 'glow', color: '#FFFFFF', size: 150, lifetime: 700, blendMode: 'lighter' },
    DEATH_RING: { type: 'ring', color: '#2ECC71', size: 30, lifetime: 600, blendMode: 'lighter' },
    DEATH_SPARKS: { type: 'spark', color: '#2ECC71', count: 30, speed: 12, size: 5, lifetime: 900 },
    RESPAWN: { type: 'circle', color: '#A2F2B4', count: 15, speed: 5, bias: 'up', gravity: -0.03 }
};
