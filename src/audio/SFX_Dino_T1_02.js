/**
 * SFX_Dino_Dilophosaurus - T1_02 Dilophosaurus Sound Handlers
 * Twin crests, spitting hiss predator
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t1_02: function () {
            const t = SFX.ctx.currentTime;
            // Layer 1: Low warning growl
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(120, t);
            bassOsc.frequency.exponentialRampToValueAtTime(80, t + 0.4);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.05);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.3);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 0.5);

            // Layer 2: Hissing frill display
            SFX.playNoise(0.35, 0.05, 0.25, SFX.TARGET_VOLUME * 0.4, 1800);

            // Layer 3: High screech overtone
            const screechOsc = SFX.ctx.createOscillator();
            screechOsc.type = 'square';
            screechOsc.frequency.setValueAtTime(500, t + 0.1);
            screechOsc.frequency.exponentialRampToValueAtTime(350, t + 0.35);

            const screechGain = SFX.ctx.createGain();
            screechGain.gain.setValueAtTime(0, t + 0.1);
            screechGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.3, t + 0.15);
            screechGain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            screechOsc.connect(screechGain);
            screechGain.connect(SFX.masterGain);
            screechOsc.start(t + 0.1);
            screechOsc.stop(t + 0.45);
        },
        sfx_hurt_dinosaur_t1_02: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.15, 0.01, 0.12, SFX.TARGET_VOLUME * 0.5, 2000);
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.25);
        },
        sfx_death_dinosaur_t1_02: function () {
            const t = SFX.ctx.currentTime;
            // Extended death rattle with fading hiss
            SFX.playNoise(0.8, 0.1, 0.6, SFX.TARGET_VOLUME * 0.4, 1200);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.7);

            // Vibrato for dying effect
            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(8, t);
            lfo.frequency.linearRampToValueAtTime(2, t + 0.6);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 20;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.85);
            osc.stop(t + 0.85);
        },
        sfx_spawn_dinosaur_t1_02: function () {
            SFX.playTone(150, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.15, 0.2);
            SFX.playNoise(0.25, 0.05, 0.18, SFX.TARGET_VOLUME * 0.3, 1500);
        },
        sfx_flee_dinosaur_t1_02: function () {
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 1500);
            SFX.playTone(350, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.15);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_Dilophosaurus] Registered 5 sounds');
    }
})();

