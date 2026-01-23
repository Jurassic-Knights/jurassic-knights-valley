/**
 * EntityRenderService - Handles entity collection, Y-sorting, and render dispatch
 *
 * Extracted from GameRenderer to reduce file size and improve maintainability.
 * Owner: EntityRenderService
 */

// Ambient declarations
declare const EntityManager: any;
declare const EntityTypes: any;
declare const Registry: any;

const EntityRenderService = {
    // GC Optimization: Pre-allocated array for Y-sorting
    _sortableEntities: [],

    /**
     * Collect visible entities from EntityManager and Y-sort them
     * @param {object} visibleBounds - {left, top, right, bottom, width, height}
     * @returns {array} Sorted array of active entities
     */
    collectAndSort(visibleBounds) {
        const sortableEntities = this._sortableEntities;
        sortableEntities.length = 0; // Clear without deallocation

        if (!EntityManager) return sortableEntities;

        // Add padding to prevent culling objects partially on screen
        const bounds = {
            x: visibleBounds.left - 200,
            y: visibleBounds.top - 200,
            width: visibleBounds.width + 400,
            height: visibleBounds.height + 400
        };

        const allEntities = EntityManager.queryRect(bounds);

        // Filter active entities
        for (const e of allEntities) {
            if (e.active) sortableEntities.push(e);
        }

        // Sort by Y position (bottom of sprite = y + height/2 for accurate depth)
        sortableEntities.sort((a, b) => {
            const ay = a.y + (a.height ? a.height / 2 : 0);
            const by = b.y + (b.height ? b.height / 2 : 0);
            return ay - by;
        });

        return sortableEntities;
    },

    /**
     * Render a single entity using appropriate renderer
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} entity
     * @param {object} renderers - {hero, heroRenderer, dinosaurRenderer, resourceRenderer}
     * @param {object} timing - Optional timing object for profiling
     */
    renderEntity(ctx, entity, renderers, timing = null) {
        const tSub = timing ? performance.now() : 0;
        const type = entity.entityType;

        // Pass 'false' for includeShadow to prevent double rendering
        if (entity === renderers.hero) {
            if (renderers.heroRenderer) {
                renderers.heroRenderer.render(ctx, renderers.hero, false);
            } else if (typeof entity.render === 'function') {
                entity.render(ctx);
            }
            if (timing) timing.entHeroTime = (timing.entHeroTime || 0) + performance.now() - tSub;
        } else if (type === EntityTypes.DINOSAUR && renderers.dinosaurRenderer) {
            renderers.dinosaurRenderer.render(ctx, entity, false);
            if (timing) timing.entDinoTime = (timing.entDinoTime || 0) + performance.now() - tSub;
        } else if (type === EntityTypes.RESOURCE && renderers.resourceRenderer) {
            renderers.resourceRenderer.render(ctx, entity, false);
            if (timing) timing.entResTime = (timing.entResTime || 0) + performance.now() - tSub;
        } else if (type === EntityTypes.MERCHANT) {
            if (typeof entity.render === 'function') entity.render(ctx);
            if (timing) {
                timing.entMerchantTime = (timing.entMerchantTime || 0) + performance.now() - tSub;
                timing.entMerchantCount = (timing.entMerchantCount || 0) + 1;
            }
        } else if (type === EntityTypes.DROPPED_ITEM) {
            if (typeof entity.render === 'function') entity.render(ctx);
            if (timing) {
                timing.entDroppedTime = (timing.entDroppedTime || 0) + performance.now() - tSub;
                timing.entDroppedCount = (timing.entDroppedCount || 0) + 1;
            }
        } else {
            if (typeof entity.render === 'function') entity.render(ctx);
            if (timing) {
                timing.entOtherTime = (timing.entOtherTime || 0) + performance.now() - tSub;
                const typeName = type || entity.constructor?.name || 'unknown';
                timing.entOtherTypes = timing.entOtherTypes || {};
                timing.entOtherTypes[typeName] = (timing.entOtherTypes[typeName] || 0) + 1;
            }
        }

        if (timing) timing.entCount = (timing.entCount || 0) + 1;
    },

    /**
     * Render all entities in the sorted collection
     * @param {CanvasRenderingContext2D} ctx
     * @param {array} entities - Y-sorted entity array
     * @param {object} renderers - Renderer references
     * @param {object} timing - Optional profiling object
     */
    renderAll(ctx, entities, renderers, timing = null) {
        // Initialize timing counters
        if (timing) {
            timing.entHeroTime = timing.entHeroTime || 0;
            timing.entDinoTime = timing.entDinoTime || 0;
            timing.entResTime = timing.entResTime || 0;
            timing.entOtherTime = timing.entOtherTime || 0;
            timing.entCount = timing.entCount || 0;
        }

        for (const entity of entities) {
            this.renderEntity(ctx, entity, renderers, timing);
        }
    },

    /**
     * Render UI overlays (health bars) for all entities
     * @param {CanvasRenderingContext2D} ctx
     * @param {array} entities
     * @param {object} timing
     */
    renderUIOverlays(ctx, entities, timing = null) {
        const tSub = timing ? performance.now() : 0;

        for (const entity of entities) {
            if (typeof entity.renderUI === 'function') {
                entity.renderUI(ctx);
            }
        }

        if (timing) timing.entUITime = (timing.entUITime || 0) + performance.now() - tSub;
    }
};

if (Registry) Registry.register('EntityRenderService', EntityRenderService);

export { EntityRenderService };
