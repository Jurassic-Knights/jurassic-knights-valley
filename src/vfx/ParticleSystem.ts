/**
 * Particle System
 * Handles particle effects rendering
 *
 * Owner: VFX Specialist
 */

import { GameRenderer } from '@core/GameRenderer';
import { ParticleRenderer } from './ParticleRenderer';

const ParticleSystem = {
    particles: [] as any[],
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,

    init(canvasId) {
        // Fix: Ensure each instance has its own particle array
        this.particles = [];

        this.canvas = document.getElementById(canvasId);
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            addEventListener('resize', () => this.resize());
        }
    },

    resize() {
        if (!this.canvas) return;
        // Always full screen overlay
        this.canvas.width = innerWidth;
        this.canvas.height = innerHeight;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.margin = '0'; // Reset any margins
        this.canvas.style.position = 'fixed'; // Ensure it stays on top/aligned with viewport
    },

    /**
     * Emit particles at a position
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {object} options - Particle options
     */
    emit(x: number, y: number, options: any = {}) {
        const count = options.count || 10;
        const color = options.color || '#FFD700';
        const lifetime = options.lifetime || 500;
        const type = options.type || 'circle'; // circle, ring, spark, debris, glow
        const speed = options.speed !== undefined ? options.speed : 4;
        const gravity = options.gravity !== undefined ? options.gravity : 0.1;
        const drag = options.drag || 1; // 1 = no drag, < 1 = friction
        const blendMode = options.blendMode || 'source-over'; // Allow 'lighter' for additive blending

        for (let i = 0; i < count; i++) {
            let angle;
            if (options.angle !== undefined) {
                // Directional emission (Cone)
                const spread = options.spread !== undefined ? options.spread : 0;
                angle = options.angle + (Math.random() - 0.5) * spread;
            } else {
                // Omni-directional
                angle = Math.random() * Math.PI * 2;
            }
            // Heavily bias vertical velocity for debris (pop up then fall)
            const velocity = Math.random() * speed;
            let vx = options.vx !== undefined ? options.vx : Math.cos(angle) * velocity;
            let vy = options.vy !== undefined ? options.vy : Math.sin(angle) * velocity;

            // Optional: Directional bias (e.g. for ground impacts, things fly UP mostly)
            if (options.bias === 'up') {
                vy = -Math.abs(vy) * 1.5; // Always fly up initially
                vx *= 0.7; // Reduce spread width
            }

            // Pre-calculate cloud blob shape
            let blobPoints = null;
            if (type === 'cloud') {
                blobPoints = [];
                const segments = 8;
                for (let j = 0; j < segments; j++) {
                    blobPoints.push(0.7 + Math.random() * 0.6); // Variance
                }
            }

            // Create particle object
            const p = {
                x,
                y,
                vx,
                vy,
                color,
                alpha: options.alpha !== undefined ? options.alpha : 1, // Respect visual option
                maxAlpha: options.alpha !== undefined ? options.alpha : 1, // Store for fading logic
                lifetime: lifetime * (0.5 + Math.random() * 0.5), // Variance in life
                age: 0,
                type,
                size: options.size || 3, // EXACT size (removed random variance 0.5-1.5x)
                gravity,
                drag,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed:
                    options.rotationSpeed !== undefined
                        ? options.rotationSpeed
                        : (Math.random() - 0.5) * 0.5,
                blendMode, // Store blend mode
                sprite: options.sprite, // CRITICAL: Store sprite ID
                pulse: options.pulse, // Size oscillation
                pulseOffset: Math.random() * Math.PI * 2, // Random pulse phase
                warp: options.warp, // Jelly distortion { speed, freq, amp }
                warpOffset: Math.random() * Math.PI * 2, // Random warp phase
                drift: options.drift, // Tethered movement { radius, speed }
                anchor: options.anchor || { x, y }, // Origin for drift
                driftOffset: Math.random() * Math.PI * 2, // Random start phase
                sizeCheckpoints: options.sizeOverLifetime,
                colorCheckpoints: options.colorOverLifetime,
                blobPoints // Store procedural shape
            };

            this.particles.push(p);

            // Return single particle if count is 1
            if (count === 1) return p;
        }
    },

    // Helper: Hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16),
                  g: parseInt(result[2], 16),
                  b: parseInt(result[3], 16)
              }
            : { r: 255, g: 255, b: 255 };
    },

    update(dt) {
        const aliveParticles = [];
        const newParticles = [];

        for (const p of this.particles) {
            p.age += dt;
            const progress = p.age / p.lifetime;

            if (p.age >= p.lifetime) continue; // Dead

            if (p.type === 'ring') {
                // Rings expand simply
                p.size += 1.5;
                p.alpha = 1 - progress;
            } else {
                // Physics particles (Standardized to 60fps baseline)
                const timeScale = dt / 16.666;

                p.x += p.vx * timeScale;
                p.y += p.vy * timeScale;
                p.vy += p.gravity * timeScale;
                p.vx *= Math.pow(p.drag, timeScale); // Drag scaled roughly
                p.vy *= Math.pow(p.drag, timeScale);

                // Drift Logic
                if (p.drift) {
                    const t = p.age * 0.001 * p.drift.speed;
                    const yFreq = p.drift.yFreq || 0.7; // Default to non-sync
                    p.x = p.anchor.x + Math.sin(t + p.driftOffset) * p.drift.radius;
                    p.y = p.anchor.y + Math.cos(t * yFreq + p.driftOffset) * p.drift.radius;
                }

                // Rotation
                if (p.rotationSpeed) {
                    p.rotation += p.rotationSpeed;
                }

                p.alpha = p.maxAlpha * (1 - Math.pow(progress, 3)); // Cubic fade

                // Trail Logic
                if (p.trail) {
                    p._trailTimer = (p._trailTimer || 0) + dt;
                    const interval = p.trail.interval || 20; // Fast emission
                    if (p._trailTimer >= interval) {
                        p._trailTimer = 0;
                        // Spawn simple smoke particle
                        newParticles.push({
                            x: p.type === 'streak' ? p.x - p.vx * 3 : p.x, // Offset behind if streak
                            y: p.type === 'streak' ? p.y - p.vy * 3 : p.y,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: (Math.random() - 0.5) * 0.5,
                            color: p.trail.color || '#555555',
                            alpha: 0.5,
                            maxAlpha: 0.5,
                            size: p.trail.size || 5,
                            lifetime: p.trail.lifetime || 600,
                            age: 0,
                            type: 'circle',
                            gravity: -0.05, // Slight rise
                            drag: 0.95
                        });
                    }
                }

                // --- AAA Features: Interpolation ---

                // Pulse Size (Sine Wave)
                if (p.pulse) {
                    if (!p._baseSize) p._baseSize = p.size;
                    const offset = p.pulseOffset || 0;
                    const wave = Math.sin(
                        p.age * 0.001 * (p.pulse.speed || 1) * Math.PI * 2 + offset
                    );
                    const scale = 1 + wave * (p.pulse.amplitude || 0.1);
                    p.size = p._baseSize * scale;
                }

                // Size over Lifetime (Lerp)
                if (p.sizeCheckpoints) {
                    const start = p.sizeCheckpoints[0];
                    const end = p.sizeCheckpoints[1];
                    p.size = Math.max(0, start + (end - start) * progress);
                }

                // Color over Lifetime (Lerp RGB)
                if (p.colorCheckpoints) {
                    if (!p._startRgb) p._startRgb = this.hexToRgb(p.colorCheckpoints[0]);
                    if (!p._endRgb) p._endRgb = this.hexToRgb(p.colorCheckpoints[1]);

                    const r = Math.round(p._startRgb.r + (p._endRgb.r - p._startRgb.r) * progress);
                    const g = Math.round(p._startRgb.g + (p._endRgb.g - p._startRgb.g) * progress);
                    const b = Math.round(p._startRgb.b + (p._endRgb.b - p._startRgb.b) * progress);

                    p.color = `rgb(${r},${g},${b})`;
                }
            }

            aliveParticles.push(p);
        }

        // Merge new trail particles
        this.particles = aliveParticles.concat(newParticles);
    },

    render(overrideCtx = null) {
        const ctx = overrideCtx || this.ctx;
        if (!ctx) return;

        // Projection Parameters
        let offsetX = 0;
        let offsetY = 0;
        let scaleX = 1;
        let scaleY = 1;
        let canvasLeft = 0;
        let canvasTop = 0;

        // Calculate projection if we are drawing to our own overlay canvas
        if (!overrideCtx && GameRenderer && GameRenderer.viewport && GameRenderer.canvas) {
            const gr = GameRenderer;
            const rect = gr.canvas.getBoundingClientRect();

            offsetX = gr.viewport.x;
            offsetY = gr.viewport.y;
            canvasLeft = rect.left;
            canvasTop = rect.top;
            scaleX = rect.width / gr.canvas.width;
            scaleY = rect.height / gr.canvas.height;
        }

        // Only clear if we are using the system's own canvas
        if (!overrideCtx) {
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Apply strict clipping to the Game Window area
        if (!overrideCtx && GameRenderer && GameRenderer.canvas) {
            ctx.save();
            ctx.beginPath();
            const gr = GameRenderer;
            const rect = gr.canvas.getBoundingClientRect();
            ctx.rect(rect.left, rect.top, rect.width, rect.height);
            ctx.clip();
        }

        // Render particles (delegate shape drawing to ParticleRenderer)
        this.particles.forEach((p) => {
            if (ctx.globalCompositeOperation !== p.blendMode) {
                ctx.globalCompositeOperation = p.blendMode;
            }

            ctx.globalAlpha = Math.max(0, p.alpha);

            // Project Coordinates
            let px, py, pSize;
            if (overrideCtx) {
                px = p.x - offsetX;
                py = p.y - offsetY;
                pSize = p.size;
            } else {
                px = (p.x - offsetX) * scaleX + canvasLeft;
                py = (p.y - offsetY) * scaleY + canvasTop;
                pSize = p.size * scaleX;
            }

            ctx.save();
            ctx.translate(px, py);

            // Delegate to ParticleRenderer for shape-specific drawing
            if (ParticleRenderer) {
                ParticleRenderer.renderParticle(ctx, p, pSize, scaleX);
            } else {
                // Fallback: simple circle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, pSize, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        });

        // Reset context state
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';

        // Pop the clipping state if we applied it
        if (!overrideCtx && GameRenderer && GameRenderer.canvas) {
            ctx.restore();
        }
    }
};

// ES6 Module Export
export { ParticleSystem };
