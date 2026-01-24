/**
 * SFX_Saurian_PachycephalosaurusCharger - T2_03 Headbutt attacker
 * Charging grunt
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_saurian_t2_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.3, 250);
        },
        sfx_hurt_saurian_t2_03: function () {
            SFX.playTone(170, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.17);
        },
        sfx_death_saurian_t2_03: function () {
            SFX.playTone(120, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        sfx_spawn_saurian_t2_03: function () {
            SFX.playNoise(0.18, 0.02, 0.14, SFX.TARGET_VOLUME * 0.3, 220);
        },
        sfx_flee_saurian_t2_03: function () {
            SFX.playTone(150, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };
    if (SFX) SFX.register(handlers);
})();

