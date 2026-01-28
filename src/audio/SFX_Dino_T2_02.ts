/**
 * SFX_Dino_PackAlpha - T2_02 Pack Alpha Sound Handlers
 * Battle-worn raptor boss
 */
import { SFX } from './SFX_Core';

(function () {
    const handlers = {
        sfx_aggro_dinosaur_t2_02: function () {
            const t = SFX.ctx.currentTime;
            // Layer 1: Bass foundation
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(55, t);
            bassOsc.frequency.linearRampToValueAtTime(40, t + 0.5);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.1);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 0.65);

            // Layer 2: Dominant snarl
            const snarl = SFX.ctx.createOscillator();
            snarl.type = 'sawtooth';
            snarl.frequency.setValueAtTime(350, t);
            snarl.frequency.exponentialRampToValueAtTime(200, t + 0.4);

            const snarlGain = SFX.ctx.createGain();
            snarlGain.gain.setValueAtTime(0, t);
            snarlGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.05);
            snarlGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            snarl.connect(snarlGain);
            snarlGain.connect(SFX.masterGain);
            snarl.start(t);
            snarl.stop(t + 0.55);

            // Layer 3: Noise texture
            SFX.playNoise(0.4, 0.05, 0.3, SFX.TARGET_VOLUME * 0.35, 700);
        },
        sfx_hurt_dinosaur_t2_02: function () {
            SFX.playTone(400, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.3, 500);
        },
        sfx_death_dinosaur_t2_02: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.35, 500);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(350, t);
            osc.frequency.exponentialRampToValueAtTime(80, t + 0.9);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(10, t);
            lfo.frequency.linearRampToValueAtTime(2, t + 0.8);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 30;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.0);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 1.05);
            osc.stop(t + 1.05);
        },
        sfx_spawn_dinosaur_t2_02: function () {
            SFX.playTone(300, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.3);
            SFX.playNoise(0.3, 0.05, 0.2, SFX.TARGET_VOLUME * 0.3, 800);
        },
        sfx_flee_dinosaur_t2_02: function () {
            SFX.playTone(350, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.2);
        }
    };

    if (SFX) {
        SFX.register(handlers);
    }
})();
