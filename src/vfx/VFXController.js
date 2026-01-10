/**
 * VFX Controller (System 2.0)
 * Orchestrates all visual effects using a Data-Driven Sequencer.
 * 
 * Owner: VFX Specialist
 */

class VFXSystem {
    constructor() {
        this.bgParticles = null;
        this.fgParticles = null;
        this.texts = []; // Canvas-based floating text
        this.activeSequences = []; // List of sequences currently playing
        this.initialized = false;

        console.log('[VFXSystem] Constructed');
    }

    init(game) {
        this.game = game;
        // Initialize dual-layer canvas system
        // Note: ParticleSystem is expected to be a global or imported class
        if (window.ParticleSystem) {
            this.bgParticles = Object.create(ParticleSystem);
            this.fgParticles = Object.create(ParticleSystem);

            this.bgParticles.init('vfx-canvas');
            this.fgParticles.init('vfx-canvas-fg');
            console.log('[VFXSystem] Particles initialized');
        } else {
            console.error('[VFXSystem] ParticleSystem not found! Check load order.');
        }

        // Subscribe to game state for implicit event detection
        // const gameState = this.game ? this.game.getSystem('GameState') : null;

        this.initialized = true;
        console.log('[VFXSystem] Initialized');
        if (window.Registry) Registry.register('VFXController', this);
    }

    /**
     * Update all VFX systems
     */
    update(dt) {
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
                this.executeCue(cue, seq.x, seq.y, seq.options);
            }

            // Remove finished sequences
            if (seq.cues.length === 0) {
                this.activeSequences.splice(i, 1);
            }
        }
    }

    /**
     * Execute a single cue from a sequence
     */
    executeCue(cue, x, y, contextOptions = {}) {
        // Resolve Template if present
        let config = {};

        if (cue.template && window.VFXConfig && VFXConfig.TEMPLATES[cue.template]) {
            // Merge Template with Cue Params (Cue wins)
            config = { ...VFXConfig.TEMPLATES[cue.template], ...(cue.params || {}) };
        } else if (cue.type) {
            // Direct definition
            config = { type: cue.type, ...(cue.params || {}) };
        } else {
            // cue.template might refer to a template that doesn't exist?
            console.warn('[VFXSystem] Invalid cue config:', cue);
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
    playSequence(sequenceName, x, y, options = {}) {
        if (!window.VFXConfig || !VFXConfig.SEQUENCES[sequenceName]) {
            console.warn(`[VFXSystem] Sequence not found: ${sequenceName}`);
            return;
        }

        const rawSequence = VFXConfig.SEQUENCES[sequenceName];

        // GC Optimization: Build cues array more efficiently
        const cues = [];
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
    playEffect(configOrTemplateName, x, y, layer = 'fg') {
        let config = configOrTemplateName;

        // Check if string -> Template
        if (typeof configOrTemplateName === 'string') {
            if (window.VFXConfig && VFXConfig.TEMPLATES[configOrTemplateName]) {
                config = VFXConfig.TEMPLATES[configOrTemplateName];
            } else {
                console.warn(`[VFXSystem] Template not found: ${configOrTemplateName}`);
                return;
            }
        }

        const system = layer === 'bg' ? this.bgParticles : this.fgParticles;
        if (system) system.emit(x, y, config);
    }

    /**
     * Render (Called by GameRenderer with main context)
     */
    render(ctx) {
        if (!this.initialized) return;

        // Render all floating texts to the game canvas
        for (const text of this.texts) {
            text.render(ctx);
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
    playForeground(x, y, options = {}) {
        if (this.fgParticles) this.fgParticles.emit(x, y, options);
    }

    /**
     * Legacy Compat: Play a background effect (behind UI)
     */
    playBackground(x, y, options = {}) {
        if (this.bgParticles) this.bgParticles.emit(x, y, options);
    }

    /**
     * Map UI DOM coordinates to Canvas coordinates
     */
    uiToCanvas(clientX, clientY, canvasId = 'vfx-canvas-fg') {
        const canvas = document.getElementById(canvasId);
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
    spawnFloatingText(text, worldX, worldY, color = '#FFD700', duration = 2000) {
        if (window.FloatingText) {
            const ft = new FloatingText(text, worldX, worldY, color, duration);
            this.texts.push(ft);
        }
    }

    // -------------------------------------------------------------------------
    // Legacy Methods (To be deprecated/migrated to Config)
    // -------------------------------------------------------------------------

    // triggerUIProgressSparks, triggerUIExplosion, createExplosion, bombardZone 
    // are TEMPORARILY kept or re-routed to use new system if possible
    // For now, let's keep them but wrap them to use the new playEffect or playSequence if applicable
    // or just leave as is for "Phase 24.3 Migration"

    bombardZone(zone) {
        // ... (Keep existing logic or migrate?)
        // Migration Plan says to Migrate. Let's redirect to a sequence if it exists, else use old logic?
        // For now, I'll keep the old logic but add a TODO to migrate it fully.
        // Actually, the user asked to "update how we handle vfx", so we should try to use the new system.
        // But Bombardment has complex logic (random targeting in a zone).
        // A static sequence cannot handle "random point in zone".
        // SO: Complex logic remains in Controller/System, but the *Visuals* should use Templates.

        if (!zone) return;

        const shellCount = 15;
        const duration = 2500;

        for (let i = 0; i < shellCount; i++) {
            const delay = Math.random() * duration;
            setTimeout(() => {
                const tx = zone.worldX + 50 + Math.random() * (zone.width - 100);
                const ty = zone.worldY + 50 + Math.random() * (zone.height - 100);
                const sx = tx - 100 + Math.random() * 200;
                const sy = ty - 1000;

                // Use new playEffect with raw config or template
                // Ideally we define 'ARTILLERY_SHELL' in templates.
                // But it needs custom velocity vx/vy.
                // So we stick to direct emit but maybe pull colors from constants?

                const flightTime = 600;
                const frames = flightTime / 16.666;
                const vx = (tx - sx) / frames;
                const vy = (ty - sy) / frames;

                this.playForeground(sx, sy, {
                    type: 'streak', color: '#FFCC00', size: 40, lifetime: flightTime + 100,
                    vx: vx, vy: vy, stretch: true,
                    trail: { color: '#FF0000', size: 20, interval: 5, lifetime: 1000 }
                });

                setTimeout(() => {
                    // Start generic explosion sequence at impact
                    this.playSequence('EXPLOSION_GENERIC', tx, ty);
                    // Camera Shake
                    if (this.game && typeof this.game.shake === 'function') this.game.shake(5, 200);
                }, flightTime);

            }, delay);
        }
    }

    createExplosion(x, y) {
        // Redirect to new Sequence
        this.playSequence('EXPLOSION_GENERIC', x, y);
    }
}

// Export Singleton
window.VFXController = new VFXSystem();
