/**
 * SFX_Saurian_Warlord - T4_02 Elite boss saurian
 * Massive threatening roar
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_saurian_t4_02: function () {
            const t = SFX.ctx.currentTime;
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(32, t);
            bassOsc.frequency.linearRampToValueAtTime(25, t + 1.2);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.85, t + 0.15);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 1.35);

            SFX.playTone(60, 1.1, 'sawtooth', SFX.TARGET_VOLUME * 0.7, 0.12, 0.9);
            SFX.playNoise(0.95, 0.15, 0.75, SFX.TARGET_VOLUME * 0.45, 280);
        },
        sfx_hurt_saurian_t4_02: function () {
            SFX.playTone(95, 0.5, 'sawtooth', SFX.TARGET_VOLUME, 0.04, 0.42);
            SFX.playNoise(0.35, 0.04, 0.28, SFX.TARGET_VOLUME * 0.42, 240);
        },
        sfx_death_saurian_t4_02: function () {
            SFX.playTone(40, 1.6, 'sawtooth', SFX.TARGET_VOLUME, 0.18, 1.35);
            SFX.playNoise(0.7, 0.12, 0.55, SFX.TARGET_VOLUME * 0.55, 110);
        },
        sfx_spawn_saurian_t4_02: function () {
            SFX.playNoise(0.7, 0.12, 0.55, SFX.TARGET_VOLUME * 0.5, 140);
            SFX.playTone(28, 0.8, 'sine', SFX.TARGET_VOLUME * 0.6, 0.25, 0.5);
        },
        sfx_flee_saurian_t4_02: function () {
            SFX.playNoise(0.4, 0.05, 0.32, SFX.TARGET_VOLUME * 0.5, 160);
            SFX.playTone(48, 0.45, 'sine', SFX.TARGET_VOLUME * 0.55, 0.08, 0.35);
        }
    };
    if (SFX) SFX.register(handlers);
})();

