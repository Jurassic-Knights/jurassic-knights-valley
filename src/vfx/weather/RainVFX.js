/**
 * RainVFX - Modular Weather Effect
 * Handles high-velocity falling lines with screen wrapping.
 * Simulates world-space persistence by shifting particles opposite to camera movement.
 */
class RainVFX {
    constructor() {
        this.active = false;
        this.particles = [];
        this.count = 150; // Max raindrops
        this.speedBase = 15;
        this.angle = 0.2; // Radians lean (right)
    }

    init() {
        // Pool instantiation
        for (let i = 0; i < this.count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                len: 10 + Math.random() * 15,
                speed: this.speedBase + Math.random() * 5,
                alpha: 0.3 + Math.random() * 0.3
            });
        }
    }

    update(dt, delta, viewport, wind, isStorm) {
        if (!this.active) return;

        this.isStorm = isStorm;

        // Visual Scale
        const lenScale = isStorm ? 2.5 : 1.0; // Increased to 2.5x for impact

        // Assume 60fps baseline for simple physics
        const timeScale = dt / 16.666;

        // Use viewport dimensions if available, else fallback
        const width = viewport ? viewport.width : window.innerWidth;
        const height = viewport ? viewport.height : window.innerHeight;

        // If viewport is missing, we can't do world space shift, default to 0
        const dx = delta ? delta.x : 0;
        const dy = delta ? delta.y : 0;

        // Wind Velocity (pixels/sec)
        const windSpeed = wind ? wind.currentX : 0;

        // Update Angle based on wind?
        // Base angle 0.2 rad (~11 deg).
        // 100 wind -> +0.5 rad?
        if (wind) {
            this.angle = 0.2 + wind.currentX / 300; // 300 force = +1 rad (~57 deg)
        }

        for (const p of this.particles) {
            // 1. Apply Camera Move (Shift opposite to camera to stay in world)
            p.x -= dx;
            p.y -= dy;

            // 2. Move (Falling)
            // Calculate Velocity Components (per second approx for direction)
            const vX_sec = p.speed * 0.2 + windSpeed;
            const vY_sec = p.speed;

            // Frame Delta
            const vx_frame = vX_sec * (dt / 1000); // or use timeScale logic: p.speed * timeScale is pixels/frame
            const vy_frame = vY_sec * (dt / 1000); //

            // Consistent Physics Update (using timeScale logic for consistency with original tuning)
            // Original: p.y += p.speed * timeScale;
            // timeScale = dt / 16.666
            // So p.speed is pixels per ~16ms? No, p.speed is pixels/frame at 60fps.
            // Let's stick to modifying p.x/p.y as before, but calculating angle from that.

            const moveY = p.speed * timeScale;
            const moveX = p.speed * 0.2 * timeScale + windSpeed * (dt / 1000);

            p.x += moveX;
            p.y += moveY;

            // 3. Update Visual Vector (Align streak with velocity)
            // Normalize velocity vector
            const mag = Math.sqrt(moveX * moveX + moveY * moveY);
            // Effective visual length based on storm state
            const effectiveLen = p.len * lenScale;

            if (mag > 0.001) {
                // Point tail backwards
                p.renderDx = (moveX / mag) * effectiveLen;
                p.renderDy = (moveY / mag) * effectiveLen;
            } else {
                p.renderDx = 0;
                p.renderDy = effectiveLen;
            }

            // 4. Wrapping
            // If particle goes off-screen, wrap it to the other side
            // Ideally we want to wrap around the *viewport bounds*
            // Since we are rendering in "Screen Space" relative to camera (0,0 is top-left of screen),
            // The particles are effectively in screen coords.
            // Wait, if p.x -= dx, p.x is effectively WorldX - CameraX.
            // So p.x IS screen coordinate.
            // So we just wrap 0..width.

            if (p.y > height) {
                p.y = -p.len;
                p.x = Math.random() * width;
            }
            if (p.y < -p.len - 100) {
                // If camera moves UP fast (dy negative -> p.y increases. If dy positive (cam down) -> p.y decreases)
                // If p.y becomes too negative (cam moved down past it)
                p.y = height + p.len;
                p.x = Math.random() * width;
            }

            if (p.x > width) {
                p.x = -10;
            } else if (p.x < -10) {
                p.x = width;
            }
        }
    }

    render(ctx) {
        if (!this.active) return;

        ctx.strokeStyle = 'rgba(174, 194, 224, 0.6)'; // Blue-ish white
        ctx.lineWidth = this.isStorm ? 2 : 1;
        ctx.beginPath();

        for (const p of this.particles) {
            ctx.moveTo(p.x, p.y);
            // Draw Trail (Backwards from head)
            // p.x, p.y is the head (bottom)
            ctx.lineTo(p.x - (p.renderDx || 0), p.y - (p.renderDy || p.len));
        }

        ctx.stroke();
    }
}
window.RainVFX = RainVFX;

// ES6 Module Export
export { RainVFX };
