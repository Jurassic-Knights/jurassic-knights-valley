/**
 * SFX_Human_Crossbowman - T2_02 Ranged, visor helmet
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t2_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(160, t + 0.3);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 340;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        sfx_hurt_human_t2_02: function () {
            SFX.playTone(280, 0.18, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        sfx_death_human_t2_02: function () {
            SFX.playTone(170, 0.6, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.48);
        },
        sfx_spawn_human_t2_02: function () {
            SFX.playNoise(0.14, 0.02, 0.1, SFX.TARGET_VOLUME * 0.24, 1200);
        },
        sfx_flee_human_t2_02: function () {
            SFX.playTone(240, 0.2, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.16);
        }
    };
    if (SFX) SFX.register(handlers);
})();

