/**
 * SFX_Dino_Triceratops - T3_04 Bull Triceratops Sound Handlers
 * Massive horned beast
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_dinosaur_t3_04: function () {
            const t = SFX.ctx.currentTime;
            // Deep bellowing charge
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(30, t);
            bassOsc.frequency.linearRampToValueAtTime(25, t + 0.6);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 0.75);

            const midOsc = SFX.ctx.createOscillator();
            midOsc.type = 'sawtooth';
            midOsc.frequency.setValueAtTime(55, t);
            midOsc.frequency.exponentialRampToValueAtTime(40, t + 0.6);

            const midGain = SFX.ctx.createGain();
            midGain.gain.setValueAtTime(0, t);
            midGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.1);
            midGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            midOsc.connect(midGain);
            midGain.connect(SFX.masterGain);
            midOsc.start(t);
            midOsc.stop(t + 0.7);

            SFX.playNoise(0.25, 0.03, 0.2, SFX.TARGET_VOLUME * 0.35, 150);
        },
        sfx_hurt_dinosaur_t3_04: function () {
            SFX.playTone(90, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        sfx_death_dinosaur_t3_04: function () {
            SFX.playTone(50, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.45, 100);
        },
        sfx_spawn_dinosaur_t3_04: function () {
            SFX.playNoise(0.35, 0.06, 0.3, SFX.TARGET_VOLUME * 0.45, 120);
            SFX.playTone(45, 0.4, 'sine', SFX.TARGET_VOLUME * 0.4, 0.1, 0.28);
        },
        sfx_flee_dinosaur_t3_04: function () {
            SFX.playTone(70, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        }
    };

    if (SFX) {
        SFX.register(handlers);    }
})();

