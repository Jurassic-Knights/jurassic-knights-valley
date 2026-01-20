/**
 * SFX_Core - Core Sound System
 *
 * Base module with init, play dispatcher, and helper functions.
 * Category-specific sounds are loaded from separate files.
 *
 * ============================================================================
 * SOUND DESIGN RULES - ALL NEW SOUNDS MUST FOLLOW THESE
 * ============================================================================
 * 1. VOLUME: Always use `SFX.TARGET_VOLUME` for peak gain values.
 * 2. HELPERS: Use SFX.playNoise() and SFX.playTone() which auto-apply TARGET_VOLUME.
 * ============================================================================
 */

// Logger fallback for dashboard context
if (typeof Logger === 'undefined') {
    window.Logger = {
        info: (...args) => console.log('[INFO]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args)
    };
}

const SFX = {
    ctx: null,
    masterGain: null,
    TARGET_VOLUME: 0.5,

    // Sound handlers registry - populated by category files
    handlers: {},

    init(audioContext, masterGain) {
        this.ctx = audioContext;
        this.masterGain = masterGain;
        Logger.info('[SFX] Core initialized');
    },

    /**
     * Register sound handlers from category modules
     */
    register(categoryHandlers) {
        Object.assign(this.handlers, categoryHandlers);
    },

    /**
     * Play a sound by ID
     */
    play(id) {
        if (!this.ctx) return;

        const handler = this.handlers[id];
        if (handler) {
            handler.call(this);
            return;
        }

        Logger.warn(`[SFX] Unknown sound: ${id}`);
    },

    // ==================== HELPERS ====================

    createNoise(duration = 0.5) {
        const sampleRate = this.ctx.sampleRate;
        const samples = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < samples; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    playNoise(duration, attack, decay, volume = 0.3, filterFreq = 2000) {
        if (!this.ctx) return { noise: null, gain: null, filter: null };

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoise(duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.TARGET_VOLUME, this.ctx.currentTime + attack);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
        return { noise, gain, filter };
    },

    playTone(freq, duration, type = 'sine', volume = 0.3, attack = 0.01, decay = null) {
        if (!this.ctx) return { osc: null, gain: null };

        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.TARGET_VOLUME, this.ctx.currentTime + attack);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + (decay || duration));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
        return { osc, gain };
    },

    // Weather ambience (stub - implement proper looping ambience later)
    setWeather(type) {
        Logger.info(`[SFX] Weather ambience: ${type}`);
        // TODO: Implement looping rain/storm ambience
    },

    playThunder() {
        // Low rumbling thunder
        this.playNoise(1.5, 0.1, 1.2, 0.4, 200);
    }
};

// Backwards compatibility alias
window.ProceduralSFX = SFX;
window.SFX = SFX;

// ES6 Module Export
export { SFX };
