/** SFX_Herbivore_T2 - Stegosaurus, Styracosaurus, Pachycephalosaurus */
import { SFX } from './SFX_Core';
(function () {
    const handlers = {
        sfx_aggro_herbivore_t2_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, t);
            osc.frequency.exponentialRampToValueAtTime(65, t + 0.5);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.3, 200);
        },
        sfx_hurt_herbivore_t2_01: function () { SFX.playTone(120, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2); },
        sfx_death_herbivore_t2_01: function () { SFX.playTone(70, 0.9, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.7); },
        sfx_spawn_herbivore_t2_01: function () { SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 150); },
        sfx_flee_herbivore_t2_01: function () { SFX.playTone(100, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24); },
        sfx_aggro_herbivore_t2_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(70, t + 0.5);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.3, 250);
        },
        sfx_hurt_herbivore_t2_02: function () { SFX.playTone(140, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2); },
        sfx_death_herbivore_t2_02: function () { SFX.playTone(80, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65); },
        sfx_spawn_herbivore_t2_02: function () { SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 180); },
        sfx_flee_herbivore_t2_02: function () { SFX.playTone(110, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24); },
        sfx_aggro_herbivore_t2_03: function () { SFX.playTone(110, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.6, 0.06, 0.32); },
        sfx_hurt_herbivore_t2_03: function () { SFX.playTone(150, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15); },
        sfx_death_herbivore_t2_03: function () { SFX.playTone(90, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55); },
        sfx_spawn_herbivore_t2_03: function () { SFX.playNoise(0.18, 0.02, 0.14, SFX.TARGET_VOLUME * 0.3, 220); },
        sfx_flee_herbivore_t2_03: function () { SFX.playTone(130, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2); }
    };
    if (SFX) SFX.register(handlers);
})();
