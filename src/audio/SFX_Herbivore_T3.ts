/** SFX_Herbivore_T3 - Triceratops, Brachiosaurus */
import { SFX } from './SFX_Core';
(function () {
    const handlers = {
        sfx_aggro_herbivore_t3_01: function () {
            const t = SFX.ctx.currentTime;
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(45, t);
            bassOsc.frequency.linearRampToValueAtTime(35, t + 0.6);
            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);
            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 0.75);
            const midOsc = SFX.ctx.createOscillator();
            midOsc.type = 'sawtooth';
            midOsc.frequency.setValueAtTime(60, t);
            midOsc.frequency.exponentialRampToValueAtTime(45, t + 0.6);
            const midGain = SFX.ctx.createGain();
            midGain.gain.setValueAtTime(0, t);
            midGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.1);
            midGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
            midOsc.connect(midGain);
            midGain.connect(SFX.masterGain);
            midOsc.start(t);
            midOsc.stop(t + 0.7);
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 120);
        },
        sfx_hurt_herbivore_t3_01: function () { SFX.playTone(90, 0.3, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.25); },
        sfx_death_herbivore_t3_01: function () {
            SFX.playTone(50, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.4, 100);
        },
        sfx_spawn_herbivore_t3_01: function () { SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.4, 110); },
        sfx_flee_herbivore_t3_01: function () { SFX.playTone(70, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.28); },
        sfx_aggro_herbivore_t3_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.4);
            osc.frequency.linearRampToValueAtTime(35, t + 0.8);
            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.value = 3;
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 8;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.9);
            osc.stop(t + 0.9);
        },
        sfx_hurt_herbivore_t3_02: function () { SFX.playTone(60, 0.35, 'sine', SFX.TARGET_VOLUME, 0.05, 0.28); },
        sfx_death_herbivore_t3_02: function () { SFX.playTone(35, 1.2, 'sine', SFX.TARGET_VOLUME, 0.2, 0.95); },
        sfx_spawn_herbivore_t3_02: function () {
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.35, 80);
            SFX.playTone(45, 0.5, 'sine', SFX.TARGET_VOLUME * 0.4, 0.12, 0.35);
        },
        sfx_flee_herbivore_t3_02: function () { SFX.playTone(50, 0.4, 'sine', SFX.TARGET_VOLUME * 0.5, 0.06, 0.32); }
    };
    if (SFX) SFX.register(handlers);
})();
