/**
 * VFX Controller (System 2.0)
 * Orchestrates all visual effects using a Data-Driven Sequencer.
 *
 * Owner: VFX Specialist
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { ParticleSystem } from './ParticleSystem';
import { Registry } from '@core/Registry';
import { ProjectileVFX } from './ProjectileVFX';
import { MeleeTrailVFX } from './MeleeTrailVFX';
import { FloatingTextManager, FloatingText } from './FloatingText';
import { VFXConfig } from '@data/VFXConfig';
import { GameRenderer } from '@core/GameRenderer';
import type { IGame } from '../types/core.d';
import type { ParticleOptions, VFXCue } from '../types/vfx';

class VFXSystem {
    // Property declarations
    game: IGame | null = null;
    bgParticles: typeof ParticleSystem | null = null;
    fgParticles: typeof ParticleSystem | null = null;
    texts: FloatingText[] = [];
    activeSequences: Array<{
        name?: string;
        x: number;
        y: number;
        elapsed: number;
        cues: VFXCue[];
        options?: ParticleOptions;
    }> = [];
    initialized: boolean = false;

    constructor() {
        Logger.info('[VFXSystem] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        // Initialize dual-layer canvas system
        // Note: ParticleSystem is expected to be a global or imported class
        if (ParticleSystem) {
            this.bgParticles = Object.create(ParticleSystem);
            this.fgParticles = Object.create(ParticleSystem);

            this.bgParticles!.init('vfx-canvas');
            this.fgParticles!.init('vfx-canvas-fg');
            Logger.info('[VFXSystem] Particles initialized');
        } else {
            Logger.error('[VFXSystem] ParticleSystem not found! Check load order.');
        }

        if (EventBus && GameConstants) {
            EventBus.on(GameConstants.Events.VFX_PLAY_FOREGROUND as 'VFX_PLAY_FOREGROUND', (data: any) => {
                if (data && typeof data.x === 'number' && typeof data.y === 'number') {
                    this.playForeground(data.x, data.y, data.options);
                }
            });
            EventBus.on(GameConstants.Events.HERO_LEVEL_UP as 'HERO_LEVEL_UP', (data: any) => {
                const hero = data?.hero;
                if (hero && typeof hero.x === 'number' && typeof hero.y === 'number') {
                    const opts = (VFXConfig.TEMPLATES?.LEVEL_UP_FX || { type: 'burst', color: '#FFD700', count: 30, lifetime: 1000 }) as ParticleOptions;
                    this.playForeground(hero.x, hero.y, opts);
                }
            });
        }

        this.initialized = true;
        Logger.info('[VFXSystem] Initialized');
    }

    /**
     * Update all VFX systems
     */
    update(dt: number) {
        if (!this.initialized) return;

        if (this.bgParticles) this.bgParticles.update(dt);
        if (this.fgParticles) this.fgParticles.update(dt);

        // Update Texts
        for (let i = this.texts.length - 1; i >= 0; i--) {
            const text = this.texts[i];
            text.update(dt);
            if (!text.active) {
                this.texts.splice(i, 1);
            }
        }

        // Update Active Sequences
        for (let i = this.activeSequences.length - 1; i >= 0; i--) {
            const seq = this.activeSequences[i];
            seq.elapsed += dt;

            // Check for cues to fire
            while (seq.cues.length > 0 && seq.cues[0].time <= seq.elapsed) {
                const cue = seq.cues.shift(); // Remove and fire
                if (cue) this.executeCue(cue, seq.x, seq.y, seq.options);
            }

            // Remove finished sequences
            if (seq.cues.length === 0) {
                this.activeSequences.splice(i, 1);
            }
        }

        // Update traveling projectiles
        if (ProjectileVFX) {
            ProjectileVFX.update(dt);
        }

        // Update melee trails
        if (MeleeTrailVFX) {
            MeleeTrailVFX.update(dt);
        }

        // Update floating text (damage numbers, etc.)
        if (FloatingTextManager) {
            FloatingTextManager.update(dt);
        }
    }

    /**
     * Execute a single cue from a sequence
     */
    executeCue(cue: VFXCue, x: number, y: number, _contextOptions: ParticleOptions = {}) {
        // Resolve Template if present
        let config: ParticleOptions = {};

        if (cue.template && VFXConfig && VFXConfig.TEMPLATES[cue.template]) {
            // Merge Template with Cue Params (Cue wins)
            config = { ...VFXConfig.TEMPLATES[cue.template], ...(cue.params || {}) };
        } else if (cue.type) {
            // Direct definition
            // Cast strictly to ensure 'type' matches allowed string literals
            config = { type: cue.type as ParticleOptions['type'], ...(cue.params || {}) };
        } else {
            // cue.template might refer to a template that doesn't exist?
            Logger.warn('[VFXSystem] Invalid cue config:', cue);
            return;
        }

        // Determine Layer
        const layer = cue.layer || 'fg';
        const system = layer === 'bg' ? this.bgParticles : this.fgParticles;

        if (!system) return;

        // Emit Particle
        system.emit(x, y, config);
    }

    /**
     * Play a named sequence from VFXConfig
     * @param {string} sequenceName - Key in VFXConfig.SEQUENCES
     * @param {number} x - World X
     * @param {number} y - World Y
     * @param {object} options - Optional overrides
     */
    playSequence(sequenceName: string, x: number, y: number, options: ParticleOptions = {}) {
        if (!VFXConfig || !VFXConfig.SEQUENCES[sequenceName]) {
            Logger.warn(`[VFXSystem] Sequence not found: ${sequenceName}`);
            return;
        }

        const rawSequence = VFXConfig.SEQUENCES[sequenceName];

        // GC Optimization: Build cues array more efficiently
        const cues: VFXCue[] = [];
        for (let i = 0; i < rawSequence.length; i++) {
            const src = rawSequence[i];
            cues.push({
                time: src.time,
                template: src.template,
                type: src.type,
                layer: src.layer,
                params: src.params
            });
        }
        // Sort by time just in case config is out of order
        cues.sort((a, b) => a.time - b.time);

        this.activeSequences.push({
            name: sequenceName,
            cues: cues,
            elapsed: 0,
            x: x,
            y: y,
            options: options
        });
    }

    /**
     * Helper: Play a generic effect immediately (using Template or raw config)
     */
    playEffect(configOrTemplateName: string | ParticleOptions, x: number, y: number, layer = 'fg') {
        let config = configOrTemplateName;

        // Check if string -> Template
        if (typeof configOrTemplateName === 'string') {
            if (VFXConfig && VFXConfig.TEMPLATES[configOrTemplateName]) {
                config = VFXConfig.TEMPLATES[configOrTemplateName];
            } else {
                Logger.warn(`[VFXSystem] Template not found: ${configOrTemplateName}`);
                return;
            }
        }

        const system = layer === 'bg' ? this.bgParticles : this.fgParticles;
        if (system) system.emit(x, y, config as ParticleOptions);
    }

    /**
     * Render (Called by GameRenderer with main context)
     */
    render(ctx: CanvasRenderingContext2D) {
        if (!this.initialized) return;

        // Render all floating texts to the game canvas
        for (const text of this.texts) {
            text.render(ctx);
        }

        // Render traveling projectiles (no camera offset needed - ctx is already translated)
        if (ProjectileVFX) {
            ProjectileVFX.render(ctx);
        }

        // Render melee trails (needs viewport for world-to-screen conversion)
        if (MeleeTrailVFX && GameRenderer) {
            const viewport = {
                x: GameRenderer.viewport.x,
                y: GameRenderer.viewport.y,
                scale: 1, // GameRenderer doesn't use scale, always 1:1
                screenX: 0,
                screenY: 0
            };
            MeleeTrailVFX.render(ctx, viewport);
        }

        // Render floating text (damage numbers, etc.)
        if (FloatingTextManager) {
            FloatingTextManager.render(ctx);
        }
    }

    /**
     * Render Foreground Particles to their own overlay canvas
     * Called by Game.js main loop, NOT GameRenderer
     */
    renderForeground() {
        if (!this.initialized || !this.fgParticles) return;
        this.fgParticles.render();
    }

    /**
     * Legacy Compat: Play a foreground effect (above UI)
     */
    playForeground(x: number, y: number, options: ParticleOptions = {}) {
        if (this.fgParticles) this.fgParticles.emit(x, y, options);
    }

    /**
     * Legacy Compat: Play a background effect (behind UI)
     */
    playBackground(x: number, y: number, options: ParticleOptions = {}) {
        if (this.bgParticles) this.bgParticles.emit(x, y, options);
    }

    /**
     * Map UI DOM coordinates to Canvas coordinates
     */
    uiToCanvas(clientX: number, clientY: number, canvasId: string = 'vfx-canvas-fg') {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    /**
     * Spawn floating text at world coordinates
     */
    spawnFloatingText(text: string, worldX: number, worldY: number, color = '#FFD700', duration = 2000) {
        if (FloatingText) {
            // FloatingText expects a config object, not separate color/duration params
            const config = {
                color: color,
                floatDuration: duration / 2000, // Convert ms to seconds
                holdDuration: 0.2
            };
            const ft = new FloatingText(text, worldX, worldY, config, 0);
            this.texts.push(ft);
        }
    }

    createExplosion(x: number, y: number) {
        // Redirect to sequence system
        this.playSequence('EXPLOSION_GENERIC', x, y);
    }

    getActiveCount(): number {
        let count = 0;
        if (this.fgParticles?.particles) count += this.fgParticles.particles.length;
        if (this.bgParticles?.particles) count += this.bgParticles.particles.length;
        count += this.texts.length;
        count += this.activeSequences.length;
        return count;
    }

    triggerUIProgressSparks(x: number, y: number, _config: ParticleOptions = {}) {
        this.playForeground(x, y, {
            type: 'spark',
            color: '#FFD700',
            count: 8,
            speed: 5,
            lifetime: 500,
            size: 3
        });
    }

    get presets() {
        return VFXConfig?.TEMPLATES || {};
    }
}

// Export Singleton
const VFXController = new VFXSystem();

// Register at module load time
Registry.register('VFXController', VFXController);

export { VFXSystem, VFXController };
