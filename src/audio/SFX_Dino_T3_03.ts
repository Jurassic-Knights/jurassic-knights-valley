/**
 * SFX_Dino_Ankylosaurus - T3_03 Ankylosaurus Sound Handlers
 * Armored tank
 */
import { SFX } from './SFX_Core';

(function () {
    const handlers = {
        sfx_aggro_dinosaur_t3_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            // Armor clank
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.4, 150);
        },
        sfx_hurt_dinosaur_t3_03: function () {
            // Armor deflection sound
            SFX.playTone(100, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.5, 200);
        },
        sfx_death_dinosaur_t3_03: function () {
            SFX.playTone(60, 0.9, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.7);
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.45, 100);
        },
        sfx_spawn_dinosaur_t3_03: function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.45, 120);
        },
        sfx_flee_dinosaur_t3_03: function () {
            SFX.playTone(80, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        }
    };

    if (SFX) {
        SFX.register(handlers);
    }
})();
