/**
 * SnowVFX - Modular Weather Effect
 * Handles gently falling circles with sine-wave drift.
 * Simulates world-space persistence by shifting particles opposite to camera movement.
 */
interface SnowParticle {
    x: number;
    y: number;
    size: number;
    speed: number;
    driftOffset: number;
    driftSpeed: number;
}

/**
 * SnowVFX - Modular Weather Effect
 * Handles gently falling circles with sine-wave drift.
 * Simulates world-space persistence by shifting particles opposite to camera movement.
 */
class SnowVFX {
    active: boolean;
    particles: SnowParticle[];
    count: number;
    speedBase: number;

    constructor() {
        this.active = false;
        this.particles = [];
        this.count = 200; // Snowflakes
        this.speedBase = 2;
    }

    init() {
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                x: Math.random() * innerWidth,
                y: Math.random() * innerHeight,
                size: 1 + Math.random() * 2,
                speed: this.speedBase + Math.random() * 1.5,
                driftOffset: Math.random() * Math.PI * 2,
                driftSpeed: 1 + Math.random()
            });
        }
    }

    update(dt: number, delta: { x: number; y: number } | null, viewport: { width: number; height: number } | null, wind: { currentX: number } | null) {
        if (!this.active) return;

        const timeScale = dt / 16.666;
        const width = viewport ? viewport.width : innerWidth;
        const height = viewport ? viewport.height : innerHeight;
        const time = Date.now() * 0.001;

        const dx = delta ? delta.x : 0;
        const dy = delta ? delta.y : 0;

        // Wind Force
        // Snow is lighter, affected more by wind? Or just moves with it.
        // Let's apply full wind force.
        const windShift = wind ? wind.currentX * (dt / 1000) : 0;

        for (const p of this.particles) {
            // 1. Apply Camera Shift
            p.x -= dx;
            p.y -= dy;

            // 2. Fall
            p.y += p.speed * timeScale;

            // 3. Horizontal Drift (Sine Wave) + Wind
            const drift = Math.sin(time * p.driftSpeed + p.driftOffset) * 0.5;
            p.x += drift * timeScale + windShift;

            // 4. Wrap
            if (p.y > height) {
                p.y = -5;
                p.x = Math.random() * width;
            } else if (p.y < -50) {
                // Camera moved down fast
                p.y = height + 5;
                p.x = Math.random() * width;
            }

            // Horizontal wrap
            if (p.x > width) p.x = 0;
            if (p.x < 0) p.x = width;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();

        for (const p of this.particles) {
            // Draw simple circle (rect is faster but circle looks fluffier)
            ctx.moveTo(p.x, p.y);
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }

        ctx.fill();
    }
}

// ES6 Module Export
export { SnowVFX };
