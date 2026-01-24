/**
 * SFX_Human_Feldwebel - T4_01 Sergeant, officer
 * Commanding officer shout
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t4_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(110, t + 0.5);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 370;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.75, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.32, 420);
        },
        sfx_hurt_human_t4_01: function () {
            SFX.playTone(200, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        sfx_death_human_t4_01: function () {
            SFX.playTone(130, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
            SFX.playNoise(0.4, 0.07, 0.32, SFX.TARGET_VOLUME * 0.38, 380);
        },
        sfx_spawn_human_t4_01: function () {
            SFX.playNoise(0.22, 0.04, 0.18, SFX.TARGET_VOLUME * 0.32, 450);
        },
        sfx_flee_human_t4_01: function () {
            SFX.playTone(170, 0.28, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.22);
        }
    };
    if (SFX) SFX.register(handlers);
})();

