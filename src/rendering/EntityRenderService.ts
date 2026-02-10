/**
 * EntityRenderService - Handles entity collection, Y-sorting, and render dispatch
 *
 * Extracted from GameRenderer to reduce file size and improve maintainability.
 * Owner: EntityRenderService
 */

import { entityManager } from '@core/EntityManager';
import { Registry } from '@core/Registry';
import { EntityTypes } from '@config/EntityTypes';
import { IEntity, IViewport } from '@app-types/core';
import { RenderTiming } from './RenderProfiler';
import { RendererCollection } from '../types/rendering';
import { isRenderable } from '../utils/typeGuards';

interface IVisibleBounds {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

// Unmapped modules - need manual import

const EntityRenderService = {
    // GC Optimization: Pre-allocated array for Y-sorting
    _sortableEntities: [] as IEntity[],

    /**
     * Collect visible entities from entityManager and Y-sort them
     * @param {object} visibleBounds - {left, top, right, bottom, width, height}
     * @returns {array} Sorted array of active entities
     */
    collectAndSort(visibleBounds: IVisibleBounds) {
        const sortableEntities = this._sortableEntities;
        sortableEntities.length = 0; // Clear without deallocation

        if (!entityManager) return sortableEntities;

        // Add padding to prevent culling objects partially on screen
        const bounds = {
            x: visibleBounds.left - 200,
            y: visibleBounds.top - 200,
            width: visibleBounds.width + 400,
            height: visibleBounds.height + 400
        };

        const allEntities = entityManager.queryRect(bounds);

        // Filter active entities
        for (const e of allEntities) {
            if (e.active) sortableEntities.push(e);
        }

        // Helper to determine render layer priority
        const getRenderLayer = (e: IEntity) => {
            if (e.entityType === EntityTypes.DROPPED_ITEM) return 2; // Top priority
            if (e.entityType === EntityTypes.HERO) return 1; // Middle priority (above nodes)
            return 0; // Standard (nodes, enemies, etc.)
        };

        sortableEntities.sort((a, b) => {
            const layerA = getRenderLayer(a);
            const layerB = getRenderLayer(b);

            // Primary Sort: Layer Priority
            if (layerA !== layerB) {
                return layerA - layerB;
            }

            // Secondary Sort: Y Position (within same layer)
            const ay = a.y + (a.height ? a.height / 2 : 0);
            const by = b.y + (b.height ? b.height / 2 : 0);

            // Stable sort for equal Y
            if (Math.abs(ay - by) < 0.1) {
                return a.id > b.id ? 1 : -1;
            }
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
     * @param {number} alpha - Interpolation factor
     */
    renderEntity(ctx: CanvasRenderingContext2D, entity: IEntity, renderers: RendererCollection, timing: RenderTiming | null = null, alpha = 1) {
        const tSub = timing ? performance.now() : 0;
        const type = entity.entityType;

        // Pass 'false' for includeShadow to prevent double rendering
        if (entity === renderers.hero) {
            if (renderers.heroRenderer) {
                renderers.heroRenderer.render(ctx, renderers.hero, false, alpha);
            } else if (isRenderable(entity)) {
                entity.render(ctx);
            }
            if (timing) timing.entHeroTime = (timing.entHeroTime || 0) + performance.now() - tSub;
        } else if (type === EntityTypes.DINOSAUR && renderers.dinosaurRenderer) {
            renderers.dinosaurRenderer.render(ctx, entity, false, alpha);
            if (timing) timing.entDinoTime = (timing.entDinoTime || 0) + performance.now() - tSub;
        } else if (type === EntityTypes.RESOURCE && renderers.resourceRenderer) {
            renderers.resourceRenderer.render(ctx, entity, false);
            if (timing) timing.entResTime = (timing.entResTime || 0) + performance.now() - tSub;
        } else if (type === EntityTypes.MERCHANT) {
            if (isRenderable(entity)) entity.render(ctx);
            if (timing) {
                timing.entMerchantTime = (timing.entMerchantTime || 0) + performance.now() - tSub;
                timing.entMerchantCount = (timing.entMerchantCount || 0) + 1;
            }
        } else if (type === EntityTypes.DROPPED_ITEM) {
            if (isRenderable(entity)) entity.render(ctx);
            if (timing) {
                timing.entDroppedTime = (timing.entDroppedTime || 0) + performance.now() - tSub;
                timing.entDroppedCount = (timing.entDroppedCount || 0) + 1;
            }
        } else {
            if (isRenderable(entity)) entity.render(ctx);
            if (timing) {
                timing.entOtherTime = (timing.entOtherTime || 0) + performance.now() - tSub;
                const typeName = type || (entity.constructor?.name) || 'unknown';
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
     * @param {number} alpha - Interpolation factor (0-1)
     */
    renderAll(ctx: CanvasRenderingContext2D, entities: IEntity[], renderers: RendererCollection, timing: RenderTiming | null = null, alpha = 1) {
        // Initialize timing counters
        if (timing) {
            timing.entHeroTime = timing.entHeroTime || 0;
            timing.entDinoTime = timing.entDinoTime || 0;
            timing.entResTime = timing.entResTime || 0;
            timing.entOtherTime = timing.entOtherTime || 0;
            timing.entCount = timing.entCount || 0;
        }

        for (const entity of entities) {
            this.renderEntity(ctx, entity, renderers, timing, alpha);
        }
    },

    /**
     * Render UI overlays (health bars) for all entities
     * @param {CanvasRenderingContext2D} ctx
     * @param {array} entities
     * @param {object} timing
     */
    renderUIOverlays(ctx: CanvasRenderingContext2D, entities: IEntity[], timing: RenderTiming | null = null) {
        const tSub = timing ? performance.now() : 0;

        for (const entity of entities) {
            if (entity.renderUI) {
                entity.renderUI(ctx);
            }
        }

        if (timing) timing.entUITime = (timing.entUITime || 0) + performance.now() - tSub;
    }
};

if (Registry) Registry.register('EntityRenderService', EntityRenderService);

export { EntityRenderService };
