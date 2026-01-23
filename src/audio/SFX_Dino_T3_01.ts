/**
 * SFX_Dino_Carnotaurus - T3_01 Carnotaurus Sound Handlers
 * Horned bull predator
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t3_01: function () {
            const t = SFX.ctx.currentTime;
            // Layer 1: Deep bass foundation
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(35, t);
            bassOsc.frequency.linearRampToValueAtTime(28, t + 0.6);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 0.75);

            // Layer 2: Bull-like snort
            const snort = SFX.ctx.createOscillator();
            snort.type = 'sawtooth';
            snort.frequency.setValueAtTime(80, t);
            snort.frequency.exponentialRampToValueAtTime(50, t + 0.5);

            const snortGain = SFX.ctx.createGain();
            snortGain.gain.setValueAtTime(0, t);
            snortGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.08);
            snortGain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            snort.connect(snortGain);
            snortGain.connect(SFX.masterGain);
            snort.start(t);
            snort.stop(t + 0.6);

            // Layer 3: Breath noise
            SFX.playNoise(0.3, 0.05, 0.2, SFX.TARGET_VOLUME * 0.35, 350);
        },
        sfx_hurt_dinosaur_t3_01: function () {
            SFX.playTone(150, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.4, 400);
        },
        sfx_death_dinosaur_t3_01: function () {
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.45, 180);
            SFX.playTone(100, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.6);
        },
        sfx_spawn_dinosaur_t3_01: function () {
            SFX.playNoise(0.25, 0.03, 0.2, SFX.TARGET_VOLUME * 0.4, 200);
            SFX.playTone(70, 0.4, 'sine', SFX.TARGET_VOLUME * 0.45, 0.08, 0.28);
        },
        sfx_flee_dinosaur_t3_01: function () {
            SFX.playTone(100, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        }
    };

    if (SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_Carnotaurus] Registered 5 sounds');
    }
})();

