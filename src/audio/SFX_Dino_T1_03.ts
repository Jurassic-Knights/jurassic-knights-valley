/**
 * SFX_Dino_Oviraptor - T1_03 Oviraptor Sound Handlers
 * Beaked, feathered, bird-like predator
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_dinosaur_t1_03: function () {
            const t = SFX.ctx.currentTime;
            // Bird-like squawk with frequency modulation
            const osc = SFX.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(550, t);
            osc.frequency.exponentialRampToValueAtTime(450, t + 0.1);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.02);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        sfx_hurt_dinosaur_t1_03: function () {
            SFX.playTone(650, 0.15, 'square', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        sfx_death_dinosaur_t1_03: function () {
            const t = SFX.ctx.currentTime;
            // Descending warble
            const osc = SFX.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.5);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(12, t);
            lfo.frequency.linearRampToValueAtTime(3, t + 0.45);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 50;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.6);
            osc.stop(t + 0.6);
        },
        sfx_spawn_dinosaur_t1_03: function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.3, 4000);
            SFX.playTone(500, 0.2, 'square', SFX.TARGET_VOLUME * 0.4, 0.03, 0.15);
        },
        sfx_flee_dinosaur_t1_03: function () {
            const t = SFX.ctx.currentTime;
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    SFX.playTone(
                        600 + Math.random() * 100,
                        0.08,
                        'square',
                        SFX.TARGET_VOLUME * 0.5,
                        0.01,
                        0.06
                    );
                }, i * 60);
            }
        }
    };

    if (SFX) {
        SFX.register(handlers);    }
})();

