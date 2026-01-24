/**
 * SFX_Human_Leutnant - T4_02 Elite officer
 * Elite commanding voice
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t4_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(95, t + 0.6);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 360;
            filter.Q.value = 5;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.7);

            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 400);
        },
        sfx_hurt_human_t4_02: function () {
            SFX.playTone(180, 0.28, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.22);
        },
        sfx_death_human_t4_02: function () {
            SFX.playTone(110, 0.9, 'sawtooth', SFX.TARGET_VOLUME, 0.14, 0.72);
            SFX.playNoise(0.45, 0.08, 0.36, SFX.TARGET_VOLUME * 0.4, 360);
        },
        sfx_spawn_human_t4_02: function () {
            SFX.playNoise(0.28, 0.05, 0.22, SFX.TARGET_VOLUME * 0.35, 420);
        },
        sfx_flee_human_t4_02: function () {
            SFX.playTone(150, 0.32, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.26);
        }
    };
    if (SFX) SFX.register(handlers);
})();

