/**
 * HealthBarRenderer - Utility for rendering health and respawn bars
 *
 * Consolidates duplicated health bar rendering code from Resource.js and Dinosaur.js.
 * Falls back to simple bars when ProgressBarRenderer is unavailable.
 *
 * Owner: VFX Specialist
 */

const HealthBarRenderer = {
    /**
     * Draw a health or respawn bar above an entity
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} options
     * @param {number} options.x - Center X position of entity
     * @param {number} options.y - Top Y position (above entity)
     * @param {number} options.percent - Fill percentage (0-1)
     * @param {string} options.mode - 'health' or 'respawn'
     * @param {number} [options.width=100] - Bar width
     * @param {number} [options.height=14] - Bar height
     * @param {string} [options.entityId] - Optional entity ID for tracking
     * @param {boolean} [options.animated=true] - Whether to animate
     */
    draw(ctx, options) {
        const {
            x,
            y,
            percent,
            mode = 'health',
            width = 100,
            height = 14,
            entityId,
            animated = true
        } = options;

        const barX = x - width / 2;
        const barY = y;

        // Use ProgressBarRenderer if available
        if (window.ProgressBarRenderer) {
            ProgressBarRenderer.draw(ctx, {
                x: barX,
                y: barY,
                width,
                height,
                percent,
                mode,
                entityId,
                animated
            });
            return;
        }

        // Fallback: simple colored bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX, barY, width, height);

        if (mode === 'health') {
            // Color based on health level
            if (percent > 0.5) {
                ctx.fillStyle = '#4CAF50'; // Green
            } else if (percent > 0.25) {
                ctx.fillStyle = '#F39C12'; // Orange
            } else {
                ctx.fillStyle = '#E74C3C'; // Red
            }
        } else if (mode === 'respawn') {
            ctx.fillStyle = '#3498DB'; // Blue
        } else {
            ctx.fillStyle = '#4CAF50'; // Default green
        }

        ctx.fillRect(barX, barY, width * Math.max(0, Math.min(1, percent)), height);
    },

    /**
     * Draw a health bar for an entity with standard positioning
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} entity - Entity with x, y, width, height, health, maxHealth
     * @param {object} [options] - Override options
     */
    drawForEntity(ctx, entity, options = {}) {
        const barY = entity.y - entity.height / 2 - 18;

        this.draw(ctx, {
            x: entity.x,
            y: barY,
            percent: entity.health / entity.maxHealth,
            mode: 'health',
            entityId: entity.id,
            ...options
        });
    },

    /**
     * Draw a respawn bar for an entity with standard positioning
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} entity - Entity with x, y, respawnTimer, maxRespawnTime
     * @param {object} [options] - Override options
     */
    drawRespawnForEntity(ctx, entity, options = {}) {
        const barY = entity.y - entity.height / 2 - 18;
        const totalDuration = entity.currentRespawnDuration || entity.maxRespawnTime;
        const percent = Math.max(0, 1 - entity.respawnTimer / totalDuration);

        this.draw(ctx, {
            x: entity.x,
            y: barY,
            percent,
            mode: 'respawn',
            ...options
        });
    }
};

window.HealthBarRenderer = HealthBarRenderer;

