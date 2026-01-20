/**
 * LightingSystem
 * Manages dynamic lights in the game world.
 *
 * Implements an "Immediate Mode" lighting system where systems/entities
 * submit lights each frame to be rendered.
 *
 * Rendered AFTER the ambient darkness overlay with additive blending.
 *
 * Owner: VFX Specialist
 */
class LightingSystem {
    constructor() {
        this.lights = [];
        this.ctx = null;
    }

    init(game) {
        this.game = game;
        if (window.Registry) Registry.register('LightingSystem', this);
        Logger.info('[LightingSystem] Initialized');
    }

    /**
     * Add a dynamic light for this frame
     * @param {number} x - World X
     * @param {number} y - World Y
     * @param {number} radius - Light radius
     * @param {string} color - Hex or RGB string
     * @param {number} alpha - Intensity (0.0 - 1.0)
     * @param {number} angle - Optional direction angle (radians) for oblong lights
     * @param {number} elongation - Optional elongation factor (1.0 = circle, 2.0 = twice as long)
     */
    addLight(x, y, radius, color, alpha = 1.0, angle = 0, elongation = 1.0) {
        this.lights.push({ x, y, radius, color, alpha, angle, elongation });
    }

    /**
     * Render all submitted lights
     * @param {CanvasRenderingContext2D} ctx - Canvas context (must be translated/world space)
     */
    render(ctx) {
        if (!ctx || this.lights.length === 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; // Additive blending to cut through darkness

        for (const light of this.lights) {
            const { x, y, radius, color, alpha, angle, elongation } = light;

            // Skip invalid lights
            if (!isFinite(x) || !isFinite(y) || !isFinite(radius) || radius <= 0) continue;

            try {
                ctx.save();

                // Transform to create oblong shape aligned with projectile direction
                ctx.translate(x, y);
                ctx.rotate(angle || 0);
                // Scale: elongate along X (projectile direction), squash Y
                const scaleX = elongation || 1.5;
                const scaleY = 0.6; // Narrower perpendicular to motion
                ctx.scale(scaleX, scaleY);

                // Create Glow Gradient (centered at origin after translate)
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);

                gradient.addColorStop(0, color || '#FFFFFF');
                gradient.addColorStop(0.4, this.fadeColor(color, 0.3));
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.globalAlpha = 0.4 * (alpha || 1.0);

                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            } catch (e) {
                // Skip this light if rendering fails
                Logger.warn('[LightingSystem] Failed to render light:', e.message);
            }
        }

        ctx.restore();

        // Clear for next frame (Immediate Mode)
        this.lights = [];
    }

    /**
     * Helper to create a transparent version of a color
     * Very basic hex/rgba parser
     */
    fadeColor(color, alpha) {
        if (!color || typeof color !== 'string') {
            return `rgba(255, 255, 255, ${alpha})`; // Default white
        }
        if (color.startsWith('#')) {
            // Hex to RGBA
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        } else if (color.startsWith('rgb')) {
            return color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        }
        return `rgba(255, 255, 255, ${alpha})`; // Fallback
    }
}

// Export Singleton
window.LightingSystem = new LightingSystem();

// ES6 Module Export
export { LightingSystem };
