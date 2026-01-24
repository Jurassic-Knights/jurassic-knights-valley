/**
 * SFX_Human_Conscript - T1_01 Basic recruit, tattered
 * Muffled shout through mask
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t1_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 350;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.3);
        },
        sfx_hurt_human_t1_01: function () {
            SFX.playTone(350, 0.15, 'triangle', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        sfx_death_human_t1_01: function () {
            SFX.playTone(200, 0.5, 'triangle', SFX.TARGET_VOLUME, 0.08, 0.4);
        },
        sfx_spawn_human_t1_01: function () {
            SFX.playNoise(0.1, 0.02, 0.08, SFX.TARGET_VOLUME * 0.2, 1800);
        },
        sfx_flee_human_t1_01: function () {
            SFX.playTone(300, 0.18, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.14);
        }
    };
    if (SFX) SFX.register(handlers);
})();

