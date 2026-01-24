/**
 * SFX_Human_Sturmtruppen - T2_01 Assault armor, SMG
 * Aggressive assault cry
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t2_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.4);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 350;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.5);

            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.3, 500);
        },
        sfx_hurt_human_t2_01: function () {
            SFX.playTone(220, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.17);
        },
        sfx_death_human_t2_01: function () {
            SFX.playTone(140, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
            SFX.playNoise(0.3, 0.05, 0.22, SFX.TARGET_VOLUME * 0.35, 450);
        },
        sfx_spawn_human_t2_01: function () {
            SFX.playNoise(0.18, 0.03, 0.14, SFX.TARGET_VOLUME * 0.28, 550);
        },
        sfx_flee_human_t2_01: function () {
            SFX.playTone(180, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };
    if (SFX) SFX.register(handlers);
})();

