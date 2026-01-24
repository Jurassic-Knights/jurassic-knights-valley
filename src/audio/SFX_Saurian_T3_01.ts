/**
 * SFX_Saurian_AllosaurusGunner - T3_01 Ranged, machine gun
 * Powerful roar + gun ready
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_saurian_t3_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(130, t + 0.45);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.55);

            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.35, 350);
        },
        sfx_hurt_saurian_t3_01: function () {
            SFX.playTone(260, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        sfx_death_saurian_t3_01: function () {
            SFX.playTone(180, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.65);
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.35, 300);
        },
        sfx_spawn_saurian_t3_01: function () {
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.35, 320);
            SFX.playTone(160, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.4, 0.06, 0.22);
        },
        sfx_flee_saurian_t3_01: function () {
            SFX.playTone(220, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };
    if (SFX) SFX.register(handlers);
})();

