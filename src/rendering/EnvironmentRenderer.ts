/**
 * EnvironmentRenderer
 * Manages environmental visuals including Day/Night lighting and Weather Effects.
 *
 * Responsibilities:
 * - Ambient Light Overlay (Day/Night cycle)
 * - Weather Particles (Rain, Snow, Fog)
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { SFX } from '../audio/SFX_Core';
import { RainVFX } from '@vfx/weather/RainVFX';
import { SnowVFX } from '@vfx/weather/SnowVFX';
import type { IGame, IViewport, ISystem } from '@app-types/core';
import { computeLighting, computeShadows } from './EnvironmentRendererLighting';
import {
    createLightningState,
    createWindState,
    updateLightning,
    triggerLightning,
    updateWind,
    renderLightning,
    type LightningState,
    type WindState
} from './EnvironmentRendererStorm';

interface VFXModules {
    RAIN: RainVFX | null;
    SNOW: SnowVFX | null;
}

class EnvironmentRenderer {
    // Canvas references
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    game: IGame | null = null;

    // Ambient Lighting State
    ambientColor: string = 'rgba(0,0,0,0)';
    overlayAlpha: number = 0;

    // Shadow State
    shadowScaleY: number = 0.3;
    shadowAlpha: number = 0.3;
    shadowOffsetX: number = 0;
    shadowSkew: number = 0;

    // Camera Tracking
    lastViewport: { x: number; y: number } = { x: 0, y: 0 };

    // Current Weather State
    weatherType: string = 'CLEAR';

    lightning: LightningState = createLightningState();
    wind: WindState = createWindState();

    // Weather Modules
    vfx: VFXModules = {
        RAIN: null,
        SNOW: null
    };

    constructor() {
        // All properties initialized as class fields above
    }

    init(game: IGame) {
        this.game = game;

        // Listen for Time Ticks to update lighting state
        if (EventBus && GameConstants) {
            EventBus.on(GameConstants.Events.TIME_TICK, (data: { dayTime: number }) => this.updateLighting(data));
            EventBus.on(GameConstants.Events.WEATHER_CHANGE, (data: { type: string }) =>
                this.setWeather(data.type)
            );
        }

        // Initialize VFX Modules
        if (RainVFX) {
            this.vfx.RAIN = new RainVFX();
            this.vfx.RAIN.init();
        }
        if (SnowVFX) {
            this.vfx.SNOW = new SnowVFX();
            this.vfx.SNOW.init();
        }

        Logger.info('[EnvironmentRenderer] Initialized');
    }

    /**
     * Set active weather effect
     * @param {string} type - Weather Type (RAIN, SNOW, FOG, CLEAR)
     */
    setWeather(type: string) {
        Logger.info(`[EnvironmentRenderer] Weather set to: ${type}`);
        this.weatherType = type;

        // Reset all
        if (this.vfx.RAIN) this.vfx.RAIN.active = false;
        if (this.vfx.SNOW) this.vfx.SNOW.active = false;

        // Activate specific
        if (type === 'RAIN' && this.vfx.RAIN) this.vfx.RAIN.active = true;
        else if (type === 'STORM' && this.vfx.RAIN)
            this.vfx.RAIN.active = true; // Storm reuses Rain for now
        else if (type === 'SNOW' && this.vfx.SNOW) this.vfx.SNOW.active = true;

        if (type === 'STORM') this.lightning.timer = 1 + Math.random() * 3;

        // DIRECT AUDIO SYNC: Trigger weather ambience
        if (SFX && SFX.ctx) {
            SFX.setWeather(type);
        }
    }

    /**
     * Update loop (called by Game.js if registered system has update method)
     */
    update(dt: number) {
        // Get Camera Delta from GameRenderer
        const delta = { x: 0, y: 0 };
        let viewport = null;

        if (this.game) {
            const renderer = this.game.getSystem<ISystem & { viewport?: IViewport; updateCamera?: () => void }>('GameRenderer');
            if (renderer) {
                // Force update camera to get latest world position (minimizes lag)
                if (typeof renderer.updateCamera === 'function') {
                    renderer.updateCamera();
                }

                if (renderer.viewport) {
                    viewport = renderer.viewport;
                    // Initialize lastViewport if first run
                    if (
                        this.lastViewport.x === 0 &&
                        this.lastViewport.y === 0 &&
                        (viewport.x !== 0 || viewport.y !== 0)
                    ) {
                        this.lastViewport.x = viewport.x;
                        this.lastViewport.y = viewport.y;
                    }

                    delta.x = viewport.x - this.lastViewport.x;
                    delta.y = viewport.y - this.lastViewport.y;

                    this.lastViewport.x = viewport.x;
                    this.lastViewport.y = viewport.y;
                }
            }
        }

        updateWind(dt, this.wind, this.weatherType);
        updateLightning(dt, this.lightning, this.weatherType, () => this.triggerLightning());

        const isStorm = this.weatherType === 'STORM';
        if (this.vfx.RAIN) this.vfx.RAIN.update(dt, delta, viewport, this.wind, isStorm);
        if (this.vfx.SNOW) this.vfx.SNOW.update(dt, delta, viewport, this.wind);
    }

    triggerLightning() {
        const getCtx = () => {
            if (this.ctx) return this.ctx;
            if (this.game) {
                const r = this.game.getSystem<ISystem & { ctx?: CanvasRenderingContext2D }>('GameRenderer');
                if (r?.ctx) { this.ctx = r.ctx; return this.ctx; }
            }
            return null;
        };
        triggerLightning(this.lightning, this.ctx, getCtx);
    }

    updateLighting(data: { dayTime: number }) {
        const { ambientColor, overlayAlpha } = computeLighting(data.dayTime);
        this.ambientColor = ambientColor;
        this.overlayAlpha = overlayAlpha;
        const shadows = computeShadows(data.dayTime);
        this.shadowScaleY = shadows.shadowScaleY;
        this.shadowAlpha = shadows.shadowAlpha;
        this.shadowSkew = shadows.shadowSkew;
    }

    /**
     * Render the environment overlay
     * @param {CanvasRenderingContext2D} ctx - The game canvas context
     * @param {Object} viewport - Current camera viewport
     */
    render(ctx: CanvasRenderingContext2D, _viewport: IViewport) {
        // Cache context for update loop usage
        if (!this.ctx) this.ctx = ctx;

        // Render Weather (Overlay)
        if (this.vfx.RAIN) this.vfx.RAIN.render(ctx);
        if (this.vfx.SNOW) this.vfx.SNOW.render(ctx);

        if (this.weatherType === 'STORM') renderLightning(ctx, this.lightning);

        // --- AMBIENT OVERLAY (Day/Night Cycle) ---
        if (this.overlayAlpha > 0.01) {
            ctx.save();
            // Reset transform to draw in screen space (UI layer style)
            // But GameRenderer might call this inside or outside a transform.
            // Standard practice: assume GameRenderer passes us a customized state,
            // OR we reset. Since this is a fullscreen overlay, we want screen space.
            // GameRenderer typically restores context after calls, so we can be bold.
            ctx.setTransform(1, 0, 0, 1, 0, 0);

            ctx.fillStyle = this.ambientColor;
            ctx.globalCompositeOperation = 'multiply'; // Blend it nicely
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.restore();
        }
    }
}

// Create singleton and export
const environmentRenderer = new EnvironmentRenderer();

import { Registry } from '@core/Registry';
Registry.register('EnvironmentRenderer', environmentRenderer);

export { EnvironmentRenderer, environmentRenderer };
