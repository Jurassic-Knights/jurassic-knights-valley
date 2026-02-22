/**
 * GameRendererLayers - Render pass execution for GameRenderer
 */
import { Logger } from './Logger';
import { EntityRenderService } from '../rendering/EntityRenderService';
import { DebugOverlays } from '../rendering/DebugOverlays';
import { CollisionSystem } from '../systems/CollisionSystem';
import type { IEntity, IGame } from '../types/core';
import type { RenderTiming } from '../rendering/RenderProfiler';
import type { WorldRenderer } from '../rendering/WorldRenderer';
import type { RoadRenderer } from '../rendering/RoadRenderer';
import type { HeroRenderer } from '../rendering/HeroRenderer';
import type { DinosaurRenderer } from '../rendering/DinosaurRenderer';
import type { ResourceRenderer } from '../rendering/ResourceRenderer';
import type { EnvironmentRenderer } from '../rendering/EnvironmentRenderer';

export interface GameRendererState {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    viewport: { x: number; y: number; width: number; height: number };
    worldWidth: number;
    worldHeight: number;
    hero: IEntity | null;
    game: IGame | null;
    debugMode: boolean;
    gridMode: boolean;
    simpleShadows: boolean;
    _worldRenderer: WorldRenderer | null;
    _roadRenderer: RoadRenderer | null;
    _vfxController: {
        bgParticles?: { render: (ctx: CanvasRenderingContext2D) => void };
        render?: (ctx: CanvasRenderingContext2D) => void;
    } | null;
    _homeBase: { render: (ctx: CanvasRenderingContext2D) => void } | null;
    _heroRenderer: HeroRenderer | null;
    _dinosaurRenderer: DinosaurRenderer | null;
    _resourceRenderer: ResourceRenderer | null;
    _ambientSystem: { render: (ctx: CanvasRenderingContext2D) => void } | null;
    _fogSystem: { render: (ctx: CanvasRenderingContext2D, viewport: unknown) => void } | null;
    _envRenderer: EnvironmentRenderer | null;
    _lightingSystem: { render: (ctx: CanvasRenderingContext2D) => void } | null;
    _renderTiming: RenderTiming | null;
    getVisibleBounds: () => { left: number; top: number; right: number; bottom: number };
    renderShadowPass: (entities: IEntity[]) => void;
}

export function renderGameLayers(state: GameRendererState, alpha: number): void {
    const {
        ctx,
        canvas,
        viewport,
        worldWidth,
        worldHeight,
        debugMode,
        gridMode,
        game,
        _worldRenderer,
        _roadRenderer,
        _vfxController,
        _homeBase,
        _heroRenderer,
        _dinosaurRenderer,
        _resourceRenderer,
        _ambientSystem,
        _fogSystem,
        _envRenderer,
        _lightingSystem,
        _renderTiming,
        getVisibleBounds,
        renderShadowPass
    } = state;

    const timing = _renderTiming;
    if (timing) timing.frames++;

    let t0: number;

    if (timing) t0 = performance.now();
    if (_worldRenderer) {
        _worldRenderer.render(ctx, viewport);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (timing) timing.world += performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_roadRenderer) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        _roadRenderer.render(ctx, viewport);
        ctx.restore();
    }
    if (timing) timing.roads = (timing.roads || 0) + performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_vfxController?.bgParticles) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        _vfxController.bgParticles.render(ctx);
        ctx.restore();
    }
    if (timing) timing.vfxBg += performance.now() - t0;

    if (timing) t0 = performance.now();
    const sortableEntities = EntityRenderService
        ? EntityRenderService.collectAndSort(getVisibleBounds())
        : [];
    if (timing) timing.entitySort += performance.now() - t0;

    if (timing) t0 = performance.now();
    renderShadowPass(sortableEntities);
    if (timing) timing.shadows += performance.now() - t0;

    if (timing) t0 = performance.now();
    ctx.save();
    ctx.translate(-viewport.x, -viewport.y);

    let tSub: number;
    if (timing) tSub = performance.now();
    if (_homeBase) _homeBase.render(ctx);
    if (timing) timing.entHomeBase = (timing.entHomeBase || 0) + performance.now() - tSub;

    if (EntityRenderService) {
        const renderers = {
            hero: state.hero,
            heroRenderer: _heroRenderer,
            dinosaurRenderer: _dinosaurRenderer,
            resourceRenderer: _resourceRenderer
        };
        EntityRenderService.renderAll(ctx, sortableEntities, renderers, timing, alpha);
        EntityRenderService.renderUIOverlays(ctx, sortableEntities, timing);
    }

    ctx.restore();
    if (timing) timing.entities += performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_ambientSystem) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        _ambientSystem.render(ctx);
        ctx.restore();
    }
    if (timing) timing.ambient += performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_fogSystem) _fogSystem.render(ctx, viewport);
    if (timing) timing.fog += performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_vfxController?.render) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        _vfxController.render(ctx);
        ctx.restore();
    }
    if (timing) timing.vfxFg += performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_envRenderer) _envRenderer.render(ctx, viewport);
    if (timing) timing.envOverlay += performance.now() - t0;

    if (timing) t0 = performance.now();
    if (_lightingSystem?.render) {
        try {
            ctx.save();
            ctx.translate(-viewport.x, -viewport.y);
            _lightingSystem.render(ctx);
            ctx.restore();
        } catch (e) {
            ctx.restore();
            Logger.warn('[GameRenderer] LightingSystem render error:', (e as Error).message);
        }
    }
    if (timing) timing.lighting = (timing.lighting || 0) + performance.now() - t0;

    if (debugMode && DebugOverlays) {
        DebugOverlays.drawWorldBoundary(ctx, viewport, worldWidth, worldHeight, game);
    }

    const collisionSystem = game?.getSystem<CollisionSystem>('CollisionSystem');
    if (collisionSystem?.renderDebug) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        collisionSystem.renderDebug(ctx);
        ctx.restore();
    }

    if (gridMode && DebugOverlays) {
        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);
        DebugOverlays.drawDebugGrid(ctx, getVisibleBounds());
        ctx.restore();
    }
}
