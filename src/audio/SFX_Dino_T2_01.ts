/**
 * SFX_Dino_Pachycephalosaurus - T2_01 Pachycephalosaurus Sound Handlers
 * War beast with battering ram head
 */
import { SFX } from './SFX_Core';

(function () {
    const handlers = {
        sfx_aggro_dinosaur_t2_01: function () {
            const t = SFX.ctx.currentTime;
            // Layer 1: Deep bass rumble
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(45, t);
            bassOsc.frequency.linearRampToValueAtTime(35, t + 0.4);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.08);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 0.55);

            // Layer 2: Mid growl
            const midOsc = SFX.ctx.createOscillator();
            midOsc.type = 'sawtooth';
            midOsc.frequency.setValueAtTime(120, t);
            midOsc.frequency.exponentialRampToValueAtTime(80, t + 0.4);

            const midGain = SFX.ctx.createGain();
            midGain.gain.setValueAtTime(0, t);
            midGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.05);
            midGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

            midOsc.connect(midGain);
            midGain.connect(SFX.masterGain);
            midOsc.start(t);
            midOsc.stop(t + 0.5);

            // Layer 3: Armor clank noise
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.3, 300);
        },
        sfx_hurt_dinosaur_t2_01: function () {
            SFX.playTone(200, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.3, 250);
        },
        sfx_death_dinosaur_t2_01: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.15, 0.01, 0.12, SFX.TARGET_VOLUME * 0.4, 200);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.7);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(6, t);
            lfo.frequency.linearRampToValueAtTime(1, t + 0.6);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 15;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.85);
            osc.stop(t + 0.85);
        },
        sfx_spawn_dinosaur_t2_01: function () {
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.4, 220);
            SFX.playTone(100, 0.3, 'sine', SFX.TARGET_VOLUME * 0.4, 0.05, 0.22);
        },
        sfx_flee_dinosaur_t2_01: function () {
            SFX.playTone(140, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.15);
        }
    };

    if (SFX) {
        SFX.register(handlers);
    }
})();
