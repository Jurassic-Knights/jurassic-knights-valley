/**
 * SFX_Saurian_ParasaurolophusHerald - T2_02 War horn, ranged
 * Distinctive war horn call from crest
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_saurian_t2_02: function () {
            const t = SFX.ctx.currentTime;
            const osc1 = SFX.ctx.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(150, t);
            osc1.frequency.linearRampToValueAtTime(200, t + 0.3);
            osc1.frequency.linearRampToValueAtTime(140, t + 0.6);

            const gain1 = SFX.ctx.createGain();
            gain1.gain.setValueAtTime(0, t);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.45);
            gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc1.connect(gain1);
            gain1.connect(SFX.masterGain);
            osc1.start(t);
            osc1.stop(t + 0.7);

            const osc2 = SFX.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(200, t);
            osc2.frequency.linearRampToValueAtTime(260, t + 0.25);

            const gain2 = SFX.ctx.createGain();
            gain2.gain.setValueAtTime(0, t);
            gain2.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.4, t + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc2.connect(gain2);
            gain2.connect(SFX.masterGain);
            osc2.start(t);
            osc2.stop(t + 0.55);
        },
        sfx_hurt_saurian_t2_02: function () {
            SFX.playTone(180, 0.25, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        sfx_death_saurian_t2_02: function () {
            SFX.playTone(130, 0.8, 'triangle', SFX.TARGET_VOLUME, 0.12, 0.65);
        },
        sfx_spawn_saurian_t2_02: function () {
            SFX.playTone(160, 0.4, 'triangle', SFX.TARGET_VOLUME * 0.45, 0.08, 0.3);
        },
        sfx_flee_saurian_t2_02: function () {
            SFX.playTone(170, 0.3, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        }
    };
    if (SFX) SFX.register(handlers);
})();

