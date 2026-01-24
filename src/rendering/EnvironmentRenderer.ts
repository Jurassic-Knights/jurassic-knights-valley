/**
 * EnvironmentRenderer
 * Manages environmental visuals including Day/Night lighting and Weather Effects.
 *
 * Responsibilities:
 * - Ambient Light Overlay (Day/Night cycle)
 * - Weather Particles (Rain, Snow, Fog)
 */

import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameConstants } from '../data/GameConstants';
import { ProceduralSFX } from '../audio/ProceduralSFX';
import { RainVFX } from '../vfx/weather/RainVFX';
import { SnowVFX } from '../vfx/weather/SnowVFX';

class EnvironmentRenderer {
    // Canvas references
    canvas: HTMLCanvasElement | null = null;
    ctx: CanvasRenderingContext2D | null = null;
    game: any = null;

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

    // Lightning State
    lightning: any = {
        timer: 0,
        flashAlpha: 0,
        bolt: null,
        boltColor: '#ffffff'
    };

    // Wind State (Gust System)
    wind: any = {
        currentX: 0,
        targetX: 0,
        baseX: 10,
        gusting: false,
        timer: 0
    };

    // Lighting Keyframes
    lightingSchedule: any[] = [
        { time: 0.0, color: { r: 10, g: 10, b: 35 }, alpha: 0.85 },
        { time: 0.05, color: { r: 10, g: 10, b: 35 }, alpha: 0.7 },
        { time: 0.1, color: { r: 255, g: 100, b: 50 }, alpha: 0.3 },
        { time: 0.15, color: { r: 255, g: 255, b: 255 }, alpha: 0.0 },
        { time: 0.7, color: { r: 255, g: 255, b: 255 }, alpha: 0.0 },
        { time: 0.75, color: { r: 180, g: 100, b: 200 }, alpha: 0.25 },
        { time: 0.85, color: { r: 100, g: 50, b: 150 }, alpha: 0.5 },
        { time: 0.9, color: { r: 10, g: 10, b: 35 }, alpha: 0.75 },
        { time: 1.0, color: { r: 10, g: 10, b: 35 }, alpha: 0.85 }
    ];

    // Weather Modules
    vfx: any = {
        RAIN: null,
        SNOW: null
    };

    constructor() {
        // All properties initialized as class fields above
    }

    init(game) {
        this.game = game;

        // Listen for Time Ticks to update lighting state
        if (EventBus && GameConstants) {
            EventBus.on(GameConstants.Events.TIME_TICK, (data: any) => this.updateLighting(data));
            EventBus.on(GameConstants.Events.WEATHER_CHANGE, (data: any) => this.setWeather(data.type));
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
    setWeather(type) {
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

        // Reset Lightning Timer on switch
        if (type === 'STORM') {
            this.lightning.timer = 1 + Math.random() * 3; // Start soon
        }

        // DIRECT AUDIO SYNC: Trigger weather ambience
        if (ProceduralSFX && ProceduralSFX.ctx) {
            ProceduralSFX.setWeather(type);
        }
    }

    /**
     * Update loop (called by Game.js if registered system has update method)
     */
    update(dt) {
        // Get Camera Delta from GameRenderer
        let delta = { x: 0, y: 0 };
        let viewport = null;

        if (this.game) {
            const renderer = this.game.getSystem('GameRenderer');
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

        // Pass delta and viewport to VFX
        this.updateWind(dt);
        if (this.weatherType === 'STORM') this.updateLightning(dt);

        const isStorm = this.weatherType === 'STORM';
        if (this.vfx.RAIN) this.vfx.RAIN.update(dt, delta, viewport, this.wind, isStorm);
        if (this.vfx.SNOW) this.vfx.SNOW.update(dt, delta, viewport, this.wind);
    }

    updateLightning(dt) {
        // Flash Decay
        if (this.lightning.flashAlpha > 0) {
            this.lightning.flashAlpha -= dt / 200; // Fade in 200ms
            if (this.lightning.flashAlpha < 0) this.lightning.flashAlpha = 0;
        }

        // Bolt Life
        if (this.lightning.bolt) {
            this.lightning.bolt.life -= dt;
            if (this.lightning.bolt.life <= 0) {
                this.lightning.bolt = null;
            }
        }

        // Strike Timer
        this.lightning.timer -= dt / 1000;
        if (this.lightning.timer <= 0) {
            this.triggerLightning();
            // Next strike: 2-8 seconds random
            this.lightning.timer = 2 + Math.random() * 6;
        }
    }

    triggerLightning() {
        // Ensure ctx is available
        if (!this.ctx) {
            if (this.game) {
                const renderer = this.game.getSystem('GameRenderer');
                if (renderer && renderer.ctx) {
                    this.ctx = renderer.ctx;
                }
            }
        }
        if (!this.ctx) return; // Cannot generate without canvas dimensions

        // 1. Flash
        this.lightning.flashAlpha = 0.6 + Math.random() * 0.4; // Bright flash

        // 2. Generate Bolt
        // Start top (random x), jitter down to middle/bottom
        const startX = Math.random() * this.ctx.canvas.width;
        const startY = -50;
        const points = [{ x: startX, y: startY }];
        let currX = startX;
        let currY = startY;

        // Create jagged path
        while (currY < this.ctx.canvas.height * (0.5 + Math.random() * 0.3)) {
            currY += 20 + Math.random() * 50;
            currX += (Math.random() - 0.5) * 80; // Jitter X
            points.push({ x: currX, y: currY });

            // Branch chance? Maybe too complex for now.
        }

        this.lightning.bolt = {
            points: points,
            life: 150 // Visible for 150ms
        };

        // Sound effect
        if (ProceduralSFX) {
            ProceduralSFX.playThunder();
        }
        Logger.info('[Weather] Lightning Strike!');
    }

    updateWind(dt) {
        // Wind Logic
        // 1. Timer
        this.wind.timer -= dt / 1000;

        if (this.wind.timer <= 0) {
            // Storm Tuning: Aggressive
            const isStorm = this.weatherType === 'STORM';

            if (this.wind.gusting) {
                // End Gust
                this.wind.gusting = false;
                this.wind.targetX = isStorm ? 50 : this.wind.baseX; // Basic storm wind is higher
                this.wind.timer = isStorm ? 1 + Math.random() * 2 : 5 + Math.random() * 10; // Storm: short calm
                // Logger.info('[Weather] Wind Gust Ended');
            } else {
                // Start Gust
                // Storm: Almost always gust again soon
                const chance = isStorm ? 0.9 : 0.7;

                if (Math.random() < chance) {
                    this.wind.gusting = true;
                    // Storm Strength: Stronger
                    const strength = isStorm
                        ? 300 + Math.random() * 300
                        : 100 + Math.random() * 150;
                    this.wind.targetX = strength;
                    this.wind.timer = isStorm ? 3 + Math.random() * 3 : 2 + Math.random() * 4;
                    // Logger.info(`[Weather] Wind Gust Started (Force: ${this.wind.targetX.toFixed(0)})`);
                } else {
                    // Stay calm a bit longer
                    this.wind.timer = 2 + Math.random() * 3;
                }
            }
        }

        // 2. Smooth Transition (Lerp)
        // dt is ms. Lerner factor depends on frame rate.
        // Let's use a fixed factor adjusted by dt approx
        const lerpSpeed = 2.0 * (dt / 1000); // Reach target in ~0.5s ?
        const diff = this.wind.targetX - this.wind.currentX;

        if (Math.abs(diff) > 1) {
            this.wind.currentX += diff * Math.min(1.0, lerpSpeed);
        } else {
            this.wind.currentX = this.wind.targetX;
        }

        // Add some noise to currentX? Maybe later for micro-turbulence.
    }

    updateLighting(data) {
        const t = data.dayTime;
        const schedule = this.lightingSchedule;

        // Find the two keyframes we are between
        let k1 = schedule[0];
        let k2 = schedule[schedule.length - 1];

        // Ensure we find the correct interval
        for (let i = 0; i < schedule.length - 1; i++) {
            if (t >= schedule[i].time && t < schedule[i + 1].time) {
                k1 = schedule[i];
                k2 = schedule[i + 1];
                break;
            }
        }

        // Calculate progress between k1 and k2 (0.0 - 1.0)
        let progress = 0;
        const duration = k2.time - k1.time;
        if (duration > 0) {
            progress = (t - k1.time) / duration;
        }

        // Interpolate Color and Alpha
        const r = Math.floor(k1.color.r + (k2.color.r - k1.color.r) * progress);
        const g = Math.floor(k1.color.g + (k2.color.g - k1.color.g) * progress);
        const b = Math.floor(k1.color.b + (k2.color.b - k1.color.b) * progress);
        const a = k1.alpha + (k2.alpha - k1.alpha) * progress;

        this.ambientColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.ambientColor = `rgba(${r}, ${g}, ${b}, ${a})`;
        this.overlayAlpha = a;

        this.updateShadows(data.dayTime);
    }

    updateShadows(dayTime) {
        // Continuous Cycle to prevent snapping
        // Noon (0.5) = Shortest Shadow, Highest Alpha
        // Midnight (0.0/1.0) = Longest Shadow, Lowest Alpha

        const distFromNoon = Math.abs(dayTime - 0.5); // 0.0 (Noon) -> 0.5 (Midnight)
        const t = distFromNoon * 2; // Normalized 0.0 (Noon) -> 1.0 (Midnight)

        // Scale Logic:
        // Noon: 0.3
        // Midnight: 0.8 (Reduced from 1.5 per request "half scale")
        // Lerp(0.3, 0.8, t)
        const minScale = 0.1;
        const maxScale = 0.35;
        this.shadowScaleY = minScale + (maxScale - minScale) * t;

        // Alpha Logic:
        // Noon: 0.3
        // Midnight: 0.2
        const maxAlpha = 0.3;
        const minAlpha = 0.2;
        this.shadowAlpha = maxAlpha - (maxAlpha - minAlpha) * t;

        // Skew Logic (Continuous Sine Wave):
        // 0.25 (Dawn) -> +1.5 (West)
        // 0.75 (Dusk) -> -1.5 (East)
        // 0.50 (Noon) -> 0.0
        // 0.00 (Midnight) -> 0.0 (Smooth loop, no snap)

        let skewStrength = 1.5;
        let skew = Math.sin(dayTime * Math.PI * 2) * skewStrength;

        // Clamp not needed for Sine, but good practice if strength > 2
        this.shadowSkew = skew;
    }

    /**
     * Render the environment overlay
     * @param {CanvasRenderingContext2D} ctx - The game canvas context
     * @param {Object} viewport - Current camera viewport
     */
    render(ctx, viewport) {
        // Cache context for update loop usage
        if (!this.ctx) this.ctx = ctx;

        // Render Weather (Overlay)
        if (this.vfx.RAIN) this.vfx.RAIN.render(ctx);
        if (this.vfx.SNOW) this.vfx.SNOW.render(ctx);

        // Lightning
        if (this.weatherType === 'STORM') {
            this.renderLightning(ctx);
        }

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

    renderLightning(ctx) {
        // Flash
        if (this.lightning.flashAlpha > 0) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen space
            ctx.fillStyle = `rgba(255, 255, 255, ${this.lightning.flashAlpha})`;
            ctx.globalCompositeOperation = 'screen';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        // Bolt
        if (this.lightning.bolt) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Screen space
            ctx.strokeStyle = this.lightning.boltColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            ctx.beginPath();
            const points = this.lightning.bolt.points;
            if (points.length > 0) {
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
            }
            ctx.stroke();
            ctx.restore();
        }
    }
}

// Create singleton and export
const environmentRenderer = new EnvironmentRenderer();

import { Registry } from '../core/Registry';
Registry.register('EnvironmentRenderer', environmentRenderer);

export { EnvironmentRenderer, environmentRenderer };
