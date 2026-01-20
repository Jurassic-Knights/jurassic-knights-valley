/**
 * ProceduralSFX - Legacy compatibility wrapper
 *
 * This file now just re-exports SFX for backward compatibility.
 * The actual sounds are in the modular SFX_*.js files.
 *
 * Load order:
 * 1. SFX_Core.js (required first)
 * 2. SFX_UI.js, SFX_Resources.js, SFX_Enemies.js
 * 3. SFX_Dinosaurs.js, SFX_Herbivores.js, SFX_Saurians.js, SFX_Humans.js
 * 4. This file (last - for backward compatibility alias)
 */

// If SFX is already loaded from SFX_Core.js, just create alias
if (window.SFX) {
    window.ProceduralSFX = window.SFX;
    Logger.info('[ProceduralSFX] Using modular SFX system');
} else {
    // Fallback: Load SFX_Core inline for environments that can't load multiple files
    Logger.warn('[ProceduralSFX] SFX_Core not found - loading inline fallback');

    const SFX = {
        ctx: null,
        masterGain: null,
        TARGET_VOLUME: 0.5,
        handlers: {},

        init(audioContext, masterGain) {
            this.ctx = audioContext;
            this.masterGain = masterGain;
            Logger.info('[SFX] Initialized');
        },

        register(categoryHandlers) {
            Object.assign(this.handlers, categoryHandlers);
        },

        play(id) {
            if (!this.ctx) return;
            const handler = this.handlers[id];
            if (handler) {
                handler.call(this);
            } else {
                Logger.warn(`[SFX] Unknown sound: ${id}`);
            }
        },

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

    window.SFX = SFX;
    window.ProceduralSFX = SFX;
}

// ES6 Module Export
export { SFX };
