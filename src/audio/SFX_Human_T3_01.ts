/**
 * SFX_Human_MachineGunner - T3_01 Heavy weapons, slow
 * Deep grunt + weapon ready
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_human_t3_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.5);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 330;
            filter.Q.value = 5;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.18, 0.02, 0.15, SFX.TARGET_VOLUME * 0.35, 300);
        },
        sfx_hurt_human_t3_01: function () {
            SFX.playTone(170, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.2);
        },
        sfx_death_human_t3_01: function () {
            SFX.playTone(100, 0.85, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.68);
            SFX.playNoise(0.4, 0.08, 0.32, SFX.TARGET_VOLUME * 0.38, 280);
        },
        sfx_spawn_human_t3_01: function () {
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.32, 350);
        },
        sfx_flee_human_t3_01: function () {
            SFX.playTone(140, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        }
    };
    if (SFX) SFX.register(handlers);
})();

