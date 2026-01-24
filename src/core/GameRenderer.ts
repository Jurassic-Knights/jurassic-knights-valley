/**
 * GameRenderer - Canvas rendering system with viewport
 *
 * Mobile shows a cropped view, PC shows more of the world
 *
 * Owner: Director
 */

import { Logger } from './Logger';
import { Registry } from './Registry';
import { GameConstants } from '../data/GameConstants';
import { ShadowRenderer } from '../rendering/ShadowRenderer';
import { EntityRenderService } from '../rendering/EntityRenderService';
import { RenderProfiler } from '../rendering/RenderProfiler';
import { GridRenderer } from '../rendering/GridRenderer';
import { DebugOverlays } from '../rendering/DebugOverlays';
import { HomeOutpostRenderer } from '../rendering/HomeOutpostRenderer';


const GameRenderer = {
    canvas: null,
    ctx: null,
    hero: null, // Still track hero for camera centering
    debugMode: false,
    gridMode: false, // Separate toggle for grid overlay

    // Dynamic world size - uses full biome world if defined, else Ironhaven-only
    get worldWidth() {
        const gc = GameConstants?.World;
        // If expanded world is defined, use it
        if (gc?.TOTAL_WIDTH) {
            return gc.TOTAL_WIDTH;
        }
        // Fallback: Ironhaven-only (old formula)
        const defaults = { MAP_PADDING: 2048, GRID_COLS: 3, ISLAND_SIZE: 1024, WATER_GAP: 256 };
        const cfg = gc || defaults;
        return (
            cfg.MAP_PADDING * 2 +
            cfg.GRID_COLS * cfg.ISLAND_SIZE +
            (cfg.GRID_COLS - 1) * cfg.WATER_GAP
        );
    },
    get worldHeight() {
        const gc = GameConstants?.World;
        // If expanded world is defined, use it
        if (gc?.TOTAL_HEIGHT) {
            return gc.TOTAL_HEIGHT;
        }
        // Fallback: Ironhaven-only (old formula)
        const defaults = { MAP_PADDING: 2048, GRID_ROWS: 3, ISLAND_SIZE: 1024, WATER_GAP: 256 };
        const cfg = gc || defaults;
        return (
            cfg.MAP_PADDING * 2 +
            cfg.GRID_ROWS * cfg.ISLAND_SIZE +
            (cfg.GRID_ROWS - 1) * cfg.WATER_GAP
        );
    },

    // Viewport (what portion of the world is visible)
    viewport: {
        x: 0,
        y: 0,
        width: 450, // Mobile default (9:16 aspect)
        height: 800
    },

    // GC Optimization: Pre-allocated array for Y-sorting
    _sortableEntities: [],

    /**
     * Initialize the renderer
     */
    init(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            Logger.error('[GameRenderer] Canvas not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');

        // Create Shadow Buffer (Offscreen Canvas)
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        // Initial size sync
        this.resizeShadowBuffer();

        // Listen for platform changes
        const platformManager = this.game ? this.game.getSystem('PlatformManager') : null;
        if (platformManager) {
            platformManager.on('modechange', () => this.updateViewport());
            this.updateViewport();
        } else {
            this.resize();
        }

        // Handle window resize
        addEventListener('resize', () => {
            if (this.game && this.game.getSystem('PlatformManager').isMobile()) {
                this.updateViewport(); // Recalculate aspect ratio on mobile
            } else {
                this.resize();
            }
        });

        // GC Optimization: Cache system references for render loop
        this._worldRenderer = this.game.getSystem('WorldRenderer');
        this._roadRenderer = this.game.getSystem('RoadRenderer');
        this._vfxController = this.game.getSystem('VFXController');
        this._homeBase = this.game.getSystem('HomeBase');
        this._heroRenderer = this.game.getSystem('HeroRenderer');
        this._dinosaurRenderer = this.game.getSystem('DinosaurRenderer');
        this._resourceRenderer = this.game.getSystem('ResourceRenderer');
        this._ambientSystem = this.game.getSystem('AmbientSystem');
        this._fogSystem = this.game.getSystem('FogOfWarSystem');
        this._envRenderer = this.game.getSystem('EnvironmentRenderer');
        this._lightingSystem = this.game.getSystem('LightingSystem');

        Logger.info('[GameRenderer] Initialized');
        return true;
    },

    resizeShadowBuffer() {
        if (this.shadowCanvas && this.canvas) {
            this.shadowCanvas.width = this.canvas.width;
            this.shadowCanvas.height = this.canvas.height;
        }
    },

    /**
     * Update viewport based on platform mode
     */
    updateViewport() {
        const container = this.canvas ? this.canvas.parentElement : null;
        if (!container) return;

        // Use container dimensions (not window) for accurate aspect ratio
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerAspect = containerWidth / containerHeight;
        const isPortrait = containerHeight > containerWidth;

        if (isPortrait) {
            // Portrait (Mobile): Fixed width, dynamic height
            // Shows more world vertically on tall screens
            this.viewport.width = 1100;
            this.viewport.height = this.viewport.width / containerAspect;
        } else {
            // Landscape (PC): Fixed height, dynamic width
            // Shows more world horizontally on wide screens (same zoom level as mobile)
            this.viewport.height = 1950;
            this.viewport.width = this.viewport.height * containerAspect;
        }

        // Viewport position will be set by updateCamera()
        this.resize();
        // Force re-render to clear artifacts immediately
        if (this.ctx) this.render();
        Logger.info(
            `[GameRenderer] Viewport Updated: ${Math.floor(this.viewport.width)}x${Math.floor(this.viewport.height)} (Container: ${containerWidth}x${containerHeight})`
        );
    },

    /**
     * Update camera to center on hero
     */
    updateCamera() {
        if (!this.hero) return;

        // Center viewport on hero
        this.viewport.x = this.hero.x - this.viewport.width / 2;
        this.viewport.y = this.hero.y - this.viewport.height / 2;

        // Clamp viewport to world bounds
        this.viewport.x = Math.max(
            0,
            Math.min(this.worldWidth - this.viewport.width, this.viewport.x)
        );
        this.viewport.y = Math.max(
            0,
            Math.min(this.worldHeight - this.viewport.height, this.viewport.y)
        );
    },

    /**
     * Set the hero reference
     * @param {Hero} hero
     */
    setHero(hero) {
        this.hero = hero;
    },

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
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

    /**
     * Resize canvas to fit container while maintaining aspect ratio
     */
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate aspect ratio from viewport
        const viewportAspect = this.viewport.width / this.viewport.height;
        const containerAspect = containerWidth / containerHeight;

        let canvasWidth, canvasHeight;

        if (containerAspect > viewportAspect) {
            // Container is wider than viewport - fit to height
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * viewportAspect;
        } else {
            // Container is taller than viewport - fit to width
            canvasWidth = containerWidth;
            canvasHeight = containerWidth / viewportAspect;
        }

        // Set canvas size (internal rendering resolution)
        this.canvas.width = this.viewport.width;
        this.canvas.height = this.viewport.height;

        // Sync shadow buffer
        this.resizeShadowBuffer();

        // Set display size (CSS)
        // Set display size (CSS) - Force fill container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.margin = '0';
    },

    /**
     * Render the composite shadow pass (delegates to ShadowRenderer)
     */
    simpleShadows: false,

    renderShadowPass(entities) {
        if (ShadowRenderer) {
            ShadowRenderer.simpleShadows = this.simpleShadows;
            ShadowRenderer.renderShadowPass(
                this.ctx,
                entities,
                this.viewport,
                {
                    heroRenderer: this._heroRenderer,
                    dinosaurRenderer: this._dinosaurRenderer,
                    resourceRenderer: this._resourceRenderer
                },
                this._renderTiming
            );
        }
    },

    /**
     * Fast simple ellipse shadows (delegates to ShadowRenderer)
     */
    renderSimpleShadows(entities) {
        if (ShadowRenderer) {
            ShadowRenderer.renderSimpleShadows(this.ctx, entities, this.viewport);
        }
    },

    /**
     * Clear and render all entities
     */
    render() {
        if (!this.ctx) return;

        // Detailed profiling when enabled
        const timing = this._renderTiming;
        if (timing) timing.frames++;
        let t0, t1;

        // Update camera to follow hero
        this.updateCamera();

        // --- WORLD LAYER --- (Use cached ref)
        if (timing) t0 = performance.now();
        const worldRenderer = this._worldRenderer;
        if (worldRenderer) {
            worldRenderer.render(this.ctx, this.viewport);
        } else {
            // Safe fallback if not yet registered
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (timing) {
            timing.world += performance.now() - t0;
        }

        // --- ROAD LAYER --- (After world, before entities)
        if (timing) t0 = performance.now();
        const roadRenderer = this._roadRenderer;
        if (roadRenderer) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            roadRenderer.render(this.ctx, this.viewport);
            this.ctx.restore();
        }
        if (timing) {
            timing.roads = (timing.roads || 0) + performance.now() - t0;
        }

        // --- VFX LAYER (Background) --- (Use cached ref)
        if (timing) t0 = performance.now();
        const vfxController = this._vfxController;

        if (vfxController && vfxController.bgParticles) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            vfxController.bgParticles.render(this.ctx);
            this.ctx.restore();
        }
        if (timing) {
            timing.vfxBg += performance.now() - t0;
        }

        // Y-SORT: Collect all active world entities via EntityRenderService
        if (timing) t0 = performance.now();
        const sortableEntities = EntityRenderService
            ? EntityRenderService.collectAndSort(this.getVisibleBounds())
            : [];
        if (timing) {
            timing.entitySort += performance.now() - t0;
        }

        // --- SHADOW PASS ---
        if (timing) t0 = performance.now();
        this.renderShadowPass(sortableEntities);
        if (timing) {
            timing.shadows += performance.now() - t0;
        }

        // Render all entities (with viewport offset)
        if (timing) t0 = performance.now();
        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);

        // Render HomeBase first (Use cached ref)
        let tSub;
        if (timing) tSub = performance.now();
        const homeBase = this._homeBase;
        if (homeBase) {
            homeBase.render(this.ctx);
        }
        if (timing) {
            timing.entHomeBase = (timing.entHomeBase || 0) + performance.now() - tSub;
        }

        // Delegate entity rendering to EntityRenderService
        if (EntityRenderService) {
            const renderers = {
                hero: this.hero,
                heroRenderer: this._heroRenderer,
                dinosaurRenderer: this._dinosaurRenderer,
                resourceRenderer: this._resourceRenderer
            };
            EntityRenderService.renderAll(this.ctx, sortableEntities, renderers, timing);
            EntityRenderService.renderUIOverlays(this.ctx, sortableEntities, timing);
        }

        this.ctx.restore();
        if (timing) {
            timing.entities += performance.now() - t0;
        }

        // Render Ambient Layer (Sky/Cloud level) - Use cached ref
        if (timing) t0 = performance.now();
        const ambientSystem = this._ambientSystem;
        if (ambientSystem) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            ambientSystem.render(this.ctx);
            this.ctx.restore();
        }
        if (timing) {
            timing.ambient += performance.now() - t0;
        }

        // Render Fog of War - Use cached ref
        if (timing) t0 = performance.now();
        const fogSystem = this._fogSystem;
        if (fogSystem) {
            fogSystem.render(this.ctx, this.viewport);
        }
        if (timing) {
            timing.fog += performance.now() - t0;
        }

        // Render Foreground VFX (e.g. Explosions) ON TOP of everything
        if (timing) t0 = performance.now();
        if (vfxController) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);

            // Particles
            // fgParticles now rendered via VFXController.renderForeground() to overlay canvas
            // if (VFXController.fgParticles) {
            //    VFXController.fgParticles.render(this.ctx);
            // }

            // Floating Text (Canvas)
            if (typeof vfxController.render === 'function') {
                vfxController.render(this.ctx);
            }

            this.ctx.restore();
        }
        if (timing) {
            timing.vfxFg += performance.now() - t0;
        }

        // --- AMBIENT OVERLAY (Day/Night Cycle) --- Use cached ref
        if (timing) t0 = performance.now();
        const envRenderer = this._envRenderer;
        if (envRenderer) {
            envRenderer.render(this.ctx, this.viewport);
        }
        if (timing) {
            timing.envOverlay += performance.now() - t0;
        }

        // --- DYNAMIC LIGHTS ---
        if (timing) t0 = performance.now();
        const lightingSystem = this._lightingSystem;
        if (lightingSystem && typeof lightingSystem.render === 'function') {
            try {
                this.ctx.save();
                this.ctx.translate(-this.viewport.x, -this.viewport.y);
                lightingSystem.render(this.ctx);
                this.ctx.restore();
            } catch (e) {
                this.ctx.restore();
                Logger.warn('[GameRenderer] LightingSystem render error:', e.message);
            }
        }
        if (timing) {
            timing.lighting = (timing.lighting || 0) + performance.now() - t0;
        }

        // --- DEBUG OVERLAY ---
        if (this.debugMode) {
            this.drawWorldBoundary();
        }

        // --- GRID OVERLAY (separate toggle) ---
        if (this.gridMode) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            this.drawDebugGrid();
            this.ctx.restore();
        }
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

    /**
     * Draw islands and bridges (delegates to GridRenderer)
     */
    drawGrid() {
        if (GridRenderer) {
            GridRenderer.drawGrid(this.ctx, this.viewport, this.canvas, this.game);
        }
    },

    /**
     * Toggle debug overlays
     */
    toggleDebug() {
        this.debugMode = !this.debugMode;
        Logger.info(`[GameRenderer] Debug mode: ${this.debugMode}`);
        return this.debugMode;
    },

    /**
     * Toggle grid overlay (separate from debug)
     */
    toggleGrid() {
        this.gridMode = !this.gridMode;
        Logger.info(`[GameRenderer] Grid mode: ${this.gridMode}`);
        return this.gridMode;
    },

    /**
     * Draw world boundary indicator (delegates to DebugOverlays)
     */
    drawWorldBoundary() {
        if (DebugOverlays) {
            DebugOverlays.drawWorldBoundary(
                this.ctx,
                this.viewport,
                this.worldWidth,
                this.worldHeight,
                this.game
            );
        }
    },

    /**
     * Draw 128px gameplay grid overlay (delegates to DebugOverlays)
     */
    drawDebugGrid() {
        if (DebugOverlays) {
            DebugOverlays.drawDebugGrid(this.ctx, this.getVisibleBounds());
        }
    },

    /**
     * Draw home outpost (delegates to HomeOutpostRenderer)
     */
    drawHomeOutpost() {
        if (HomeOutpostRenderer) {
            HomeOutpostRenderer.draw(this.ctx, this.worldWidth(), this.worldHeight(), this.game);
        }
    }
};

// Export
if (Registry) Registry.register('GameRenderer', GameRenderer);

// ES6 Module Export
export { GameRenderer };
