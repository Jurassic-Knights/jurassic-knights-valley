/**
 * ShadowRenderer - Handles entity shadow rendering
 *
 * Extracted from GameRenderer.js for modularity.
 * Renders shadows either as complex sprite shadows or simple ellipses.
 *
 * Owner: Rendering System
 */

const ShadowRenderer = {
    simpleShadows: false, // Use complex sprite shadows by default

    /**
     * Render shadows for all entities
     * @param {CanvasRenderingContext2D} ctx
     * @param {Array} entities - Sorted entities to render shadows for
     * @param {Object} viewport - Current viewport
     * @param {Object} renderers - { hero, dinosaur, resource } renderer refs
     * @param {Object} timing - Optional profiling timing object
     */
    renderShadowPass(ctx, entities, viewport, renderers, timing = null) {
        if (!ctx || !window.EnvironmentRenderer) return;

        // PERFORMANCE MODE: Simple ellipse shadows
        if (this.simpleShadows) {
            this.renderSimpleShadows(ctx, entities, viewport);
            return;
        }

        let tSub;
        const hero = window.GameRenderer?.hero;

        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        ctx.globalAlpha = window.EnvironmentRenderer.shadowAlpha || 0.3;

        const { heroRenderer, dinosaurRenderer, resourceRenderer } = renderers;

        for (const entity of entities) {
            if (timing) tSub = performance.now();

            if (entity === hero) {
                if (heroRenderer) heroRenderer.drawShadow(ctx, entity, false);
                if (timing) {
                    timing.shadowHero = (timing.shadowHero || 0) + performance.now() - tSub;
                }
            } else if (entity.entityType === EntityTypes.DINOSAUR) {
                if (dinosaurRenderer) dinosaurRenderer.renderShadow(ctx, entity, false);
                if (timing) {
                    timing.shadowDino = (timing.shadowDino || 0) + performance.now() - tSub;
                }
            } else if (entity.entityType === EntityTypes.RESOURCE) {
                if (resourceRenderer) resourceRenderer.renderShadow(ctx, entity, false);
                if (timing) {
                    timing.shadowRes = (timing.shadowRes || 0) + performance.now() - tSub;
                }
            } else if (entity.entityType === EntityTypes.MERCHANT) {
                if (typeof entity.drawShadow === 'function') entity.drawShadow(ctx, false);
                if (timing) {
                    timing.shadowMerch = (timing.shadowMerch || 0) + performance.now() - tSub;
                }
            } else {
                if (typeof entity.drawShadow === 'function') entity.drawShadow(ctx, false);
                if (timing) {
                    timing.shadowOther = (timing.shadowOther || 0) + performance.now() - tSub;
                }
            }
        }

        ctx.restore();
    },

    /**
     * Fast simple ellipse shadows (performance mode)
     */
    renderSimpleShadows(ctx, entities, viewport) {
        const alpha = window.EnvironmentRenderer?.shadowAlpha || 0.3;

        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        ctx.fillStyle = 'rgba(0, 0, 0, ' + alpha + ')';

        for (const entity of entities) {
            const w = entity.width || 64;
            const h = entity.height || 64;
            const shadowW = w * 0.4;
            const shadowH = h * 0.15;
            const x = entity.x;
            const y = entity.y + h * 0.4;

            ctx.beginPath();
            ctx.ellipse(x, y, shadowW, shadowH, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
};

window.ShadowRenderer = ShadowRenderer;

// ES6 Module Export
export { ShadowRenderer };
