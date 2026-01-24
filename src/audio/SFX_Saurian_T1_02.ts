/**
 * SFX_Saurian_OviraptorScout - T1_02 Fast, dual blades
 * Quick chirp + blade sound
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_saurian_t1_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(550, t);
            osc.frequency.exponentialRampToValueAtTime(450, t + 0.2);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.3);
        },
        sfx_hurt_saurian_t1_02: function () {
            SFX.playTone(650, 0.15, 'square', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        sfx_death_saurian_t1_02: function () {
            SFX.playTone(500, 0.5, 'square', SFX.TARGET_VOLUME, 0.06, 0.4);
        },
        sfx_spawn_saurian_t1_02: function () {
            SFX.playNoise(0.1, 0.02, 0.08, SFX.TARGET_VOLUME * 0.2, 1800);
        },
        sfx_flee_saurian_t1_02: function () {
            SFX.playTone(600, 0.18, 'square', SFX.TARGET_VOLUME * 0.5, 0.02, 0.14);
        }
    };
    if (SFX) SFX.register(handlers);
})();

