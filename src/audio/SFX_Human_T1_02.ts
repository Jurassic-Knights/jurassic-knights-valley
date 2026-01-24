/**
 * SFX_Human_Rifleman - T1_02 Infantry, bolt-action
 * Muffled battle cry
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t1_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 320;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.32);
        },
        sfx_hurt_human_t1_02: function () {
            SFX.playTone(300, 0.18, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        sfx_death_human_t1_02: function () {
            SFX.playTone(180, 0.55, 'triangle', SFX.TARGET_VOLUME, 0.08, 0.44);
        },
        sfx_spawn_human_t1_02: function () {
            SFX.playNoise(0.12, 0.02, 0.1, SFX.TARGET_VOLUME * 0.22, 1500);
        },
        sfx_flee_human_t1_02: function () {
            SFX.playTone(280, 0.2, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.16);
        }
    };
    if (SFX) SFX.register(handlers);
})();

