/**
 * SFX_Dino_Gallimimus - T1_04 Gallimimus Sound Handlers
 * Ostrich-like, fast runner
 */
import { SFX } from './SFX_Core';

(function () {
    const handlers = {
        sfx_aggro_dinosaur_t1_04: function () {
            const t = SFX.ctx.currentTime;
            // High-pitched honk
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(500, t + 0.1);
            osc.frequency.exponentialRampToValueAtTime(350, t + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        sfx_hurt_dinosaur_t1_04: function () {
            SFX.playTone(550, 0.15, 'triangle', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        sfx_death_dinosaur_t1_04: function () {
            SFX.playTone(400, 0.5, 'triangle', SFX.TARGET_VOLUME, 0.05, 0.4);
        },
        sfx_spawn_dinosaur_t1_04: function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 3500);
        },
        sfx_flee_dinosaur_t1_04: function () {
            const t = SFX.ctx.currentTime;
            // Rapid panicked honks
            for (let i = 0; i < 6; i++) {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(500 + i * 30, t + i * 0.05);

                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(SFX.TARGET_VOLUME * 0.6, t + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.04);

                osc.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start(t + i * 0.05);
                osc.stop(t + i * 0.05 + 0.05);
            }
        }
    };

    if (SFX) {
        SFX.register(handlers);
    }
})();
