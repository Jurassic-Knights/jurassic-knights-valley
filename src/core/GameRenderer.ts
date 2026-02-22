/**
 * GameRenderer - Canvas rendering system with viewport
 *
 * Mobile shows a cropped view, PC shows more of the world
 *
 * Owner: Director
 */

import { Logger } from './Logger';
import { Registry } from './Registry';
import { getWorldWidth, getWorldHeight } from './GameRendererWorldSize';
import { renderGameLayers } from './GameRendererLayers';
import {
    updateViewport as updateViewportImpl,
    updateCamera as updateCameraImpl,
    resizeCanvas
} from './GameRendererViewport';
import { RenderProfiler, RenderTiming } from '../rendering/RenderProfiler';
import { ShadowRenderer } from '../rendering/ShadowRenderer';
import { DOMUtils } from './DOMUtils';
import { IGame, IEntity } from '../types/core';
import type { IRenderer } from '../types/core';

// Import specific system types
import { PlatformManager } from './PlatformManager';
import { VFXController } from '../vfx/VFXController';
import { WorldRenderer } from '../rendering/WorldRenderer';
import { RoadRenderer } from '../rendering/RoadRenderer';
import { HeroRenderer } from '../rendering/HeroRenderer';
import { DinosaurRenderer } from '../rendering/DinosaurRenderer';
import { ResourceRenderer } from '../rendering/ResourceRenderer';
import { AmbientSystem } from '../world/AmbientSystem';
import { FogOfWarSystem } from '../vfx/FogOfWarSystem';
import { EnvironmentRenderer } from '../rendering/EnvironmentRenderer';
import { LightingSystem } from '../vfx/LightingSystem';
import { HomeBase } from '../world/HomeBase';

const GameRenderer = {
    canvas: null as HTMLCanvasElement | null,
    ctx: null as CanvasRenderingContext2D | null,
    hero: null as IEntity | null,
    debugMode: false,
    gridMode: false, // Separate toggle for grid overlay
    game: null as IGame | null,
    shadowCanvas: null as HTMLCanvasElement | null,
    shadowCtx: null as CanvasRenderingContext2D | null,
    _worldRenderer: null as WorldRenderer | null,
    _roadRenderer: null as RoadRenderer | null,
    _vfxController: null as typeof VFXController | null,
    _homeBase: null as typeof HomeBase | null,
    _heroRenderer: null as typeof HeroRenderer | null,
    _dinosaurRenderer: null as typeof DinosaurRenderer | null,
    _resourceRenderer: null as typeof ResourceRenderer | null,
    _ambientSystem: null as typeof AmbientSystem | null,
    _fogSystem: null as typeof FogOfWarSystem | null,
    _envRenderer: null as EnvironmentRenderer | null,
    _lightingSystem: null as typeof LightingSystem | null,
    _renderTiming: null as RenderTiming | null, // Profiler data container

    get worldWidth() {
        return getWorldWidth();
    },
    get worldHeight() {
        return getWorldHeight();
    },

    // Viewport (what portion of the world is visible)
    viewport: {
        x: 0,
        y: 0,
        width: 450, // Mobile default (9:16 aspect)
        height: 800
    },

    // GC Optimization: Pre-allocated array for Y-sorting
    _sortableEntities: [] as IEntity[],

    /**
     * Initialize the renderer
     */
    init(game: IGame) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        if (!this.canvas) {
            Logger.error('[GameRenderer] Canvas not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');

        // Create Shadow Buffer (Offscreen Canvas)
        this.shadowCanvas = DOMUtils.createCanvas();
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        // Initial size sync
        this.resizeShadowBuffer();

        // Listen for platform changes
        const platformManager = this.game
            ? this.game.getSystem<typeof PlatformManager>('PlatformManager')
            : null;
        if (platformManager) {
            platformManager.on('modechange', () => this.updateViewport());
            this.updateViewport();
        } else {
            this.resize();
        }

        // Handle window resize
        addEventListener('resize', () => {
            if (this.game) {
                const pm = this.game.getSystem<typeof PlatformManager>('PlatformManager');
                if (pm && pm.isMobile()) {
                    this.updateViewport(); // Recalculate aspect ratio on mobile
                } else {
                    this.resize();
                }
            }
        });

        // GC Optimization: Cache system references for render loop
        this._worldRenderer = this.game.getSystem<WorldRenderer>('WorldRenderer');
        this._roadRenderer = this.game.getSystem<RoadRenderer>('RoadRenderer');
        this._vfxController = this.game.getSystem<typeof VFXController>('VFXController');
        this._homeBase = this.game.getSystem<typeof HomeBase>('HomeBase');
        this._heroRenderer = this.game.getSystem<typeof HeroRenderer>('HeroRenderer');
        this._dinosaurRenderer = this.game.getSystem<typeof DinosaurRenderer>('DinosaurRenderer');
        this._resourceRenderer = this.game.getSystem<typeof ResourceRenderer>('ResourceRenderer');
        this._ambientSystem = this.game.getSystem<typeof AmbientSystem>('AmbientSystem');
        this._fogSystem = this.game.getSystem<typeof FogOfWarSystem>('FogOfWarSystem');
        this._envRenderer = this.game.getSystem<EnvironmentRenderer>('EnvironmentRenderer');
        this._lightingSystem = this.game.getSystem<typeof LightingSystem>('LightingSystem');

        Logger.info('[GameRenderer] Initialized');
        return true;
    },

    resizeShadowBuffer() {
        if (this.shadowCanvas && this.canvas) {
            this.shadowCanvas.width = this.canvas.width;
            this.shadowCanvas.height = this.canvas.height;
        }
    },

    updateViewport() {
        updateViewportImpl({
            canvas: this.canvas!,
            viewport: this.viewport,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight,
            hero: this.hero
        });
        this.resize();
        if (this.ctx) this.render();
    },

    updateCamera() {
        updateCameraImpl({
            canvas: this.canvas!,
            viewport: this.viewport,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight,
            hero: this.hero
        });
    },

    /**
     * Set the hero reference
     * @param {Hero} hero
     */
    setHero(hero: IEntity) {
        this.hero = hero;
    },

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX: number, worldY: number) {
        return {
            x: worldX - this.viewport.x,
            y: worldY - this.viewport.y
        };
    },

    /**
     * Get the visible world bounds
     */
    getVisibleBounds() {
        return {
            left: this.viewport.x,
            top: this.viewport.y,
            right: this.viewport.x + this.viewport.width,
            bottom: this.viewport.y + this.viewport.height,
            width: this.viewport.width,
            height: this.viewport.height
        };
    },

    resize() {
        resizeCanvas({ canvas: this.canvas!, viewport: this.viewport });
        this.resizeShadowBuffer();
    },

    /**
     * Render the composite shadow pass (delegates to ShadowRenderer)
     */
    simpleShadows: false,

    renderShadowPass(entities: IEntity[]) {
        if (ShadowRenderer) {
            ShadowRenderer.simpleShadows = this.simpleShadows;
            ShadowRenderer.renderShadowPass(
                this.ctx,
                entities,
                this.viewport,
                {
                    heroRenderer: this._heroRenderer,
                    dinosaurRenderer: this._dinosaurRenderer as any,
                    resourceRenderer: this._resourceRenderer as any
                },
                this._renderTiming
            );
        }
    },

    /**
     * Fast simple ellipse shadows (delegates to ShadowRenderer)
     */
    renderSimpleShadows(entities: IEntity[]) {
        if (ShadowRenderer) {
            ShadowRenderer.renderSimpleShadows(this.ctx, entities, this.viewport);
        }
    },

    /**
     * Clear and render all entities
     */
    render(alpha = 1) {
        if (!this.ctx) return;

        this.updateCamera();

        renderGameLayers(
            {
                ctx: this.ctx,
                canvas: this.canvas,
                viewport: this.viewport,
                worldWidth: this.worldWidth,
                worldHeight: this.worldHeight,
                hero: this.hero,
                game: this.game,
                debugMode: this.debugMode,
                gridMode: this.gridMode,
                simpleShadows: this.simpleShadows,
                _worldRenderer: this._worldRenderer,
                _roadRenderer: this._roadRenderer,
                _vfxController: this._vfxController,
                _homeBase: this._homeBase,
                _heroRenderer: this._heroRenderer,
                _dinosaurRenderer: this._dinosaurRenderer,
                _resourceRenderer: this._resourceRenderer,
                _ambientSystem: this._ambientSystem,
                _fogSystem: this._fogSystem,
                _envRenderer: this._envRenderer,
                _lightingSystem: this._lightingSystem,
                _renderTiming: this._renderTiming,
                getVisibleBounds: () => this.getVisibleBounds(),
                renderShadowPass: (e) => this.renderShadowPass(e)
            },
            alpha
        );
    },

    /**
     * Start detailed render profiling (delegates to RenderProfiler)
     */
    startRenderProfile() {
        if (RenderProfiler) {
            this._renderTiming = RenderProfiler.start();
        }
    },

    /**
     * Stop render profiling and print results (delegates to RenderProfiler)
     */
    stopRenderProfile() {
        if (RenderProfiler) {
            RenderProfiler.stop();
        }
        this._renderTiming = null;
    },

    drawGrid() {
        GridRenderer?.drawGrid(this.ctx, this.viewport, this.canvas, this.game);
    },
    toggleDebug() {
        this.debugMode = !this.debugMode;
        Logger.info(`[GameRenderer] Debug mode: ${this.debugMode}`);
        return this.debugMode;
    },
    toggleGrid() {
        this.gridMode = !this.gridMode;
        Logger.info(`[GameRenderer] Grid mode: ${this.gridMode}`);
        return this.gridMode;
    },
    drawWorldBoundary() {
        DebugOverlays?.drawWorldBoundary(
            this.ctx,
            this.viewport,
            this.worldWidth,
            this.worldHeight,
            this.game
        );
    },
    drawDebugGrid() {
        DebugOverlays?.drawDebugGrid(this.ctx, this.getVisibleBounds());
    },
    drawHomeOutpost() {
        HomeOutpostRenderer?.draw(this.ctx, this.worldWidth, this.worldHeight, this.game);
    }
};

// Export
if (Registry) Registry.register('GameRenderer', GameRenderer);

// ES6 Module Export
export { GameRenderer };
