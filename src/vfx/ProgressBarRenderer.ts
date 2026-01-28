/**
 * ProgressBarRenderer - VFX-Style Progress Bar Drawing Utility
 *
 * Features: Segmented Bars, Inner Flow Particles, Damage Trail, Heartbeat Pulse
 *
 * Owner: Director (VFX/UI)
 */

const ProgressBarRenderer = {
    time: 0,

    // Track damage trails per entity (simple cache)
    damageTrails: new Map(),

    update(dt) {
        this.time += dt / 1000;

        // Decay damage trails
        for (const [id, trail] of this.damageTrails) {
            trail.percent -= dt / 500; // Fade over 500ms
            if (trail.percent <= 0) {
                this.damageTrails.delete(id);
            }
        }
    },

    /**
     * Draw a VFX-style progress bar
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} options
     */
    draw(ctx, options) {
        const {
            x,
            y,
            width,
            height,
            percent,
            mode = 'health', // 'health' or 'respawn'
            entityId = null, // For damage trail tracking
            animated = true
        } = options;

        const cornerRadius = 4;
        const safePercent = Math.max(0, Math.min(1, percent));

        // --- 1. Background (Dark Metal Plate) ---
        ctx.save();

        // Metal background
        const bgGradient = ctx.createLinearGradient(x, y, x, y + height);
        bgGradient.addColorStop(0, '#1a1a1a');
        bgGradient.addColorStop(0.5, '#2d2d2d');
        bgGradient.addColorStop(1, '#1a1a1a');
        ctx.fillStyle = bgGradient;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, cornerRadius);
        ctx.fill();

        // --- 2. Damage Trail (White fading chunk) ---
        if (entityId && this.damageTrails.has(entityId)) {
            const trail = this.damageTrails.get(entityId);
            const trailWidth = width * trail.percent;
            ctx.fillStyle = `rgba(255, 255, 255, ${trail.percent * 0.6})`;
            ctx.beginPath();
            ctx.roundRect(x, y, trailWidth, height, cornerRadius);
            ctx.fill();
        }

        // --- 3. Main Fill (Segmented with Inner Glow) ---
        const fillWidth = width * safePercent;

        if (fillWidth > 2) {
            // Determine color based on mode
            let baseColor, darkColor, lightColor;
            if (mode === 'health') {
                baseColor = '#E74C3C'; // Red
                darkColor = '#8B0000';
                lightColor = '#FF6B6B';
            } else {
                // respawn
                baseColor = '#3498DB'; // Blue
                darkColor = '#1E5799';
                lightColor = '#5DADE2';
            }

            // Vertical gradient for depth
            const fillGradient = ctx.createLinearGradient(x, y, x, y + height);
            fillGradient.addColorStop(0, lightColor);
            fillGradient.addColorStop(0.4, baseColor);
            fillGradient.addColorStop(1, darkColor);

            ctx.fillStyle = fillGradient;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, fillWidth - 2, height - 2, cornerRadius - 1);
            ctx.fill();

            // --- 4. Segmented Overlay (Chunky Look) ---
            const segmentWidth = 8;
            const segmentGap = 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            for (let sx = x + segmentWidth; sx < x + fillWidth; sx += segmentWidth + segmentGap) {
                ctx.fillRect(sx, y + 2, segmentGap, height - 4);
            }

            // --- 5. Inner Particle Flow (Blood Cells / Energy) ---
            if (animated && fillWidth > 20) {
                const particleCount = 3;
                for (let i = 0; i < particleCount; i++) {
                    const offset = (this.time * 40 + i * 30) % fillWidth;
                    const px = x + offset;
                    const py = y + height * 0.3 + Math.sin(this.time * 8 + i) * (height * 0.2);
                    const particleSize = 2 + Math.sin(this.time * 5 + i) * 1;

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath();
                    ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // --- 6. Glass Highlight (Top Edge) ---
            const highlightGradient = ctx.createLinearGradient(x, y, x, y + height / 2);
            highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = highlightGradient;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, fillWidth - 2, height / 2 - 1, [
                cornerRadius - 1,
                cornerRadius - 1,
                0,
                0
            ]);
            ctx.fill();

            // --- 7. Heartbeat Pulse (Low Health Warning) ---
            if (mode === 'health' && safePercent < 0.25 && animated) {
                const pulse = 0.5 + 0.5 * Math.sin(this.time * 10); // Fast pulse
                ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * 0.8})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(x, y, width, height, cornerRadius);
                ctx.stroke();
            }
        }

        // --- 8. Border Frame (Beveled Metal Edge) ---
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, cornerRadius);
        ctx.stroke();

        // Inner bevel highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, width - 2, height - 2, cornerRadius - 1);
        ctx.stroke();

        ctx.restore();
    },

    /**
     * Report damage for trail effect
     * @param {string} entityId
     * @param {number} oldPercent
     */
    reportDamage(entityId, oldPercent) {
        if (entityId) {
            this.damageTrails.set(entityId, { percent: oldPercent });
        }
    }
};

import { Registry } from '@core/Registry';
Registry.register('ProgressBarRenderer', ProgressBarRenderer);

// ES6 Module Export
export { ProgressBarRenderer };
