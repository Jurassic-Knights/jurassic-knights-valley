/**
 * SFX_Dino_Therizinosaurus - T2_04 Therizinosaurus Sound Handlers
 * Massive claws, bizarre predator
 */
import { SFX } from './SFX_Core';

(function () {
    const handlers = {
        sfx_aggro_dinosaur_t2_04: function () {
            const t = SFX.ctx.currentTime;
            // Strange warbling call
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(250, t + 0.2);
            osc.frequency.exponentialRampToValueAtTime(150, t + 0.5);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.value = 8;
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 25;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.6);
            osc.stop(t + 0.6);

            SFX.playNoise(0.3, 0.03, 0.25, SFX.TARGET_VOLUME * 0.3, 600);
        },
        sfx_hurt_dinosaur_t2_04: function () {
            SFX.playTone(220, 0.2, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        sfx_death_dinosaur_t2_04: function () {
            SFX.playTone(160, 0.8, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.65);
        },
        sfx_spawn_dinosaur_t2_04: function () {
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.35, 500);
            SFX.playTone(150, 0.35, 'triangle', SFX.TARGET_VOLUME * 0.45, 0.06, 0.25);
        },
        sfx_flee_dinosaur_t2_04: function () {
            SFX.playTone(200, 0.25, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };

    if (SFX) {
        SFX.register(handlers);
    }
})();
