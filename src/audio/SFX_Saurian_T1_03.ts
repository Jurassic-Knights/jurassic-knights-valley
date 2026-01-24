/**
 * SFX_Saurian_TriceratopsShieldbearer - T1_03 Tank with shield
 * Deep horn + shield clang
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_saurian_t1_03: function () {
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

            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.4, 250);
        },
        sfx_hurt_saurian_t1_03: function () {
            SFX.playTone(140, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.35, 300);
        },
        sfx_death_saurian_t1_03: function () {
            SFX.playTone(85, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.35, 200);
        },
        sfx_spawn_saurian_t1_03: function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 250);
        },
        sfx_flee_saurian_t1_03: function () {
            SFX.playTone(115, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };
    if (SFX) SFX.register(handlers);
})();

