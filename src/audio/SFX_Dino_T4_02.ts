/**
 * SFX_Dino_Tyrannosaur - T4_02 Tyrannosaur Matriarch Sound Handlers
 * Massive T-Rex boss
 */
import { SFX } from './SFX_Core';


(function () {
    const handlers = {
        sfx_aggro_dinosaur_t4_02: function () {
            const t = SFX.ctx.currentTime;
            // Layer 1: Earth-shaking bass
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(28, t);
            bassOsc.frequency.linearRampToValueAtTime(22, t + 1.0);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.15);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.8);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 1.1);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 1.15);

            // Layer 2: Terrifying mid growl
            const growl = SFX.ctx.createOscillator();
            growl.type = 'sawtooth';
            growl.frequency.setValueAtTime(60, t);
            growl.frequency.exponentialRampToValueAtTime(40, t + 1.0);

            const growlGain = SFX.ctx.createGain();
            growlGain.gain.setValueAtTime(0, t);
            growlGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            growlGain.gain.exponentialRampToValueAtTime(0.01, t + 1.05);

            growl.connect(growlGain);
            growlGain.connect(SFX.masterGain);
            growl.start(t);
            growl.stop(t + 1.1);

            // Layer 3: Noise breath
            SFX.playNoise(0.8, 0.1, 0.6, SFX.TARGET_VOLUME * 0.35, 280);

            // Layer 4: High screech overtone
            const screech = SFX.ctx.createOscillator();
            screech.type = 'square';
            screech.frequency.setValueAtTime(150, t + 0.2);
            screech.frequency.exponentialRampToValueAtTime(100, t + 0.8);

            const screechGain = SFX.ctx.createGain();
            screechGain.gain.setValueAtTime(0, t + 0.2);
            screechGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.3, t + 0.3);
            screechGain.gain.exponentialRampToValueAtTime(0.01, t + 0.9);

            screech.connect(screechGain);
            screechGain.connect(SFX.masterGain);
            screech.start(t + 0.2);
            screech.stop(t + 0.95);
        },
        sfx_hurt_dinosaur_t4_02: function () {
            SFX.playTone(90, 0.4, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.35);
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 250);
        },
        sfx_death_dinosaur_t4_02: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.4, 0.02, 0.35, SFX.TARGET_VOLUME * 0.45, 150);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, t);
            osc.frequency.exponentialRampToValueAtTime(25, t + 1.3);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(8, t);
            lfo.frequency.linearRampToValueAtTime(0.5, t + 1.2);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 12;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.4);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 1.45);
            osc.stop(t + 1.45);
        },
        sfx_spawn_dinosaur_t4_02: function () {
            SFX.playNoise(0.5, 0.08, 0.4, SFX.TARGET_VOLUME * 0.45, 150);
            SFX.playTone(25, 0.6, 'sine', SFX.TARGET_VOLUME * 0.6, 0.2, 0.35);
        },
        sfx_flee_dinosaur_t4_02: function () {
            SFX.playNoise(0.3, 0.03, 0.25, SFX.TARGET_VOLUME * 0.45, 180);
            SFX.playTone(45, 0.35, 'sine', SFX.TARGET_VOLUME * 0.5, 0.05, 0.28);
        }
    };

    if (SFX) {
        SFX.register(handlers);    }
})();

