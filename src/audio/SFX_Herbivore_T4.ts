/** SFX_Herbivore_T4 - Diplodocus, Argentinosaurus */
import { SFX } from './SFX_Core';
(function () {
    const handlers = {
        sfx_aggro_herbivore_t4_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(30, t);
            osc.frequency.linearRampToValueAtTime(25, t + 1.0);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.1);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 1.15);
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.35, 60);
        },
        sfx_hurt_herbivore_t4_01: function () { SFX.playTone(50, 0.4, 'sine', SFX.TARGET_VOLUME, 0.06, 0.32); },
        sfx_death_herbivore_t4_01: function () {
            SFX.playTone(25, 1.5, 'sine', SFX.TARGET_VOLUME, 0.25, 1.2);
            SFX.playNoise(0.6, 0.12, 0.5, SFX.TARGET_VOLUME * 0.4, 50);
        },
        sfx_spawn_herbivore_t4_01: function () {
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.4, 60);
            SFX.playTone(35, 0.6, 'sine', SFX.TARGET_VOLUME * 0.4, 0.15, 0.4);
        },
        sfx_flee_herbivore_t4_01: function () { SFX.playTone(40, 0.5, 'sine', SFX.TARGET_VOLUME * 0.5, 0.08, 0.4); },
        sfx_aggro_herbivore_t4_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(25, t);
            osc.frequency.linearRampToValueAtTime(20, t + 1.2);
            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.value = 2;
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.85, t + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 1.35);
            osc.stop(t + 1.35);
            SFX.playNoise(0.6, 0.12, 0.5, SFX.TARGET_VOLUME * 0.4, 45);
        },
        sfx_hurt_herbivore_t4_02: function () { SFX.playTone(40, 0.5, 'sine', SFX.TARGET_VOLUME, 0.08, 0.4); },
        sfx_death_herbivore_t4_02: function () {
            SFX.playTone(20, 1.8, 'sine', SFX.TARGET_VOLUME, 0.3, 1.45);
            SFX.playNoise(0.8, 0.15, 0.65, SFX.TARGET_VOLUME * 0.45, 40);
        },
        sfx_spawn_herbivore_t4_02: function () {
            SFX.playNoise(0.6, 0.12, 0.5, SFX.TARGET_VOLUME * 0.4, 50);
            SFX.playTone(28, 0.7, 'sine', SFX.TARGET_VOLUME * 0.45, 0.18, 0.48);
        },
        sfx_flee_herbivore_t4_02: function () { SFX.playTone(35, 0.55, 'sine', SFX.TARGET_VOLUME * 0.5, 0.1, 0.42); }
    };
    if (SFX) SFX.register(handlers);
})();
