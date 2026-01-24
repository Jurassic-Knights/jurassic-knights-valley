/**
 * SFX_Dino_Pachyrhinosaurus - T2_03 Pachyrhinosaurus Sound Handlers
 * Bony frill zone dino
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_dinosaur_t2_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.35, 220);
        },
        sfx_hurt_dinosaur_t2_03: function () {
            SFX.playTone(130, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        sfx_death_dinosaur_t2_03: function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.4, 150);
            SFX.playTone(100, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.65);
        },
        sfx_spawn_dinosaur_t2_03: function () {
            SFX.playNoise(0.25, 0.03, 0.2, SFX.TARGET_VOLUME * 0.4, 180);
        },
        sfx_flee_dinosaur_t2_03: function () {
            SFX.playTone(110, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };

    if (SFX) {
        SFX.register(handlers);    }
})();

