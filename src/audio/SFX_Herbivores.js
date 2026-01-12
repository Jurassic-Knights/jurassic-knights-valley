/**
 * SFX_Herbivores - Herbivore Enemy Sounds (Passive/Defensive Dinosaurs)
 * 10 herbivores × 5 sounds = 50 unique high-fidelity sounds
 * 
 * Non-predatory vocalizations: honks, bellows, warning calls
 * Parasaurolophus uses resonant crest sounds
 * Large sauropods use earth-shaking bass
 */

(function () {
    const handlers = {
        // ===== T1_01 IGUANODON - Thumb spike, bulky herbivore =====
        'sfx_aggro_herbivore_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Low warning grunt
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        'sfx_hurt_herbivore_t1_01': function () {
            SFX.playTone(220, 0.2, 'sine', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_herbivore_t1_01': function () {
            SFX.playTone(150, 0.6, 'sine', SFX.TARGET_VOLUME, 0.08, 0.48);
        },
        'sfx_spawn_herbivore_t1_01': function () {
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 1000);
        },
        'sfx_flee_herbivore_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Panicked honks
            for (let i = 0; i < 3; i++) {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200 + i * 20, t + i * 0.12);

                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(SFX.TARGET_VOLUME * 0.5, t + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.1);

                osc.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start(t + i * 0.12);
                osc.stop(t + i * 0.12 + 0.12);
            }
        },

        // ===== T1_02 PARASAUROLOPHUS - Tubular head crest, resonant calls =====
        'sfx_aggro_herbivore_t1_02': function () {
            const t = SFX.ctx.currentTime;
            // Distinctive hollow crest resonance
            const osc1 = SFX.ctx.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(120, t);
            osc1.frequency.linearRampToValueAtTime(150, t + 0.3);
            osc1.frequency.linearRampToValueAtTime(100, t + 0.6);

            const gain1 = SFX.ctx.createGain();
            gain1.gain.setValueAtTime(0, t);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.1);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.4);
            gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc1.connect(gain1);
            gain1.connect(SFX.masterGain);
            osc1.start(t);
            osc1.stop(t + 0.7);

            // Harmonic overtone
            const osc2 = SFX.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(180, t);
            osc2.frequency.linearRampToValueAtTime(220, t + 0.25);

            const gain2 = SFX.ctx.createGain();
            gain2.gain.setValueAtTime(0, t);
            gain2.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.35, t + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc2.connect(gain2);
            gain2.connect(SFX.masterGain);
            osc2.start(t);
            osc2.stop(t + 0.55);
        },
        'sfx_hurt_herbivore_t1_02': function () {
            SFX.playTone(160, 0.25, 'triangle', SFX.TARGET_VOLUME, 0.03, 0.2);
        },
        'sfx_death_herbivore_t1_02': function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(6, t);
            lfo.frequency.linearRampToValueAtTime(1, t + 0.7);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 15;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.9);
            osc.stop(t + 0.9);
        },
        'sfx_spawn_herbivore_t1_02': function () {
            SFX.playTone(140, 0.35, 'triangle', SFX.TARGET_VOLUME * 0.4, 0.08, 0.25);
        },
        'sfx_flee_herbivore_t1_02': function () {
            SFX.playTone(150, 0.3, 'triangle', SFX.TARGET_VOLUME * 0.55, 0.04, 0.24);
        },

        // ===== T1_03 MAIASAURA - Herd animal, duck-bill =====
        'sfx_aggro_herbivore_t1_03': function () {
            SFX.playTone(200, 0.3, 'sine', SFX.TARGET_VOLUME * 0.6, 0.05, 0.22);
        },
        'sfx_hurt_herbivore_t1_03': function () {
            SFX.playTone(250, 0.2, 'sine', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_herbivore_t1_03': function () {
            SFX.playTone(180, 0.6, 'sine', SFX.TARGET_VOLUME, 0.1, 0.45);
        },
        'sfx_spawn_herbivore_t1_03': function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.25, 1200);
        },
        'sfx_flee_herbivore_t1_03': function () {
            SFX.playTone(230, 0.25, 'sine', SFX.TARGET_VOLUME * 0.55, 0.03, 0.2);
        },

        // ===== T2_01 STEGOSAURUS - Back plates, spiked tail =====
        'sfx_aggro_herbivore_t2_01': function () {
            const t = SFX.ctx.currentTime;
            // Low rumbling with plate rattling
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, t);
            osc.frequency.exponentialRampToValueAtTime(65, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            // Plate rattle noise
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.3, 200);
        },
        'sfx_hurt_herbivore_t2_01': function () {
            SFX.playTone(120, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        'sfx_death_herbivore_t2_01': function () {
            SFX.playTone(70, 0.9, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.7);
        },
        'sfx_spawn_herbivore_t2_01': function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 150);
        },
        'sfx_flee_herbivore_t2_01': function () {
            SFX.playTone(100, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        },

        // ===== T2_02 STYRACOSAURUS - Spiked frill, nose horn =====
        'sfx_aggro_herbivore_t2_02': function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(70, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.3, 250);
        },
        'sfx_hurt_herbivore_t2_02': function () {
            SFX.playTone(140, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        'sfx_death_herbivore_t2_02': function () {
            SFX.playTone(80, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
        },
        'sfx_spawn_herbivore_t2_02': function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 180);
        },
        'sfx_flee_herbivore_t2_02': function () {
            SFX.playTone(110, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        },

        // ===== T2_03 PACHYCEPHALOSAURUS (herbivore) - Dome skull =====
        'sfx_aggro_herbivore_t2_03': function () {
            SFX.playTone(110, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.6, 0.06, 0.32);
        },
        'sfx_hurt_herbivore_t2_03': function () {
            SFX.playTone(150, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_herbivore_t2_03': function () {
            SFX.playTone(90, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        'sfx_spawn_herbivore_t2_03': function () {
            SFX.playNoise(0.18, 0.02, 0.14, SFX.TARGET_VOLUME * 0.3, 220);
        },
        'sfx_flee_herbivore_t2_03': function () {
            SFX.playTone(130, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T3_01 TRICERATOPS - Three horns, massive frill =====
        'sfx_aggro_herbivore_t3_01': function () {
            const t = SFX.ctx.currentTime;
            // Deep bellowing charge warning
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(45, t);
            bassOsc.frequency.linearRampToValueAtTime(35, t + 0.6);

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
            midOsc.frequency.setValueAtTime(60, t);
            midOsc.frequency.exponentialRampToValueAtTime(45, t + 0.6);

            const midGain = SFX.ctx.createGain();
            midGain.gain.setValueAtTime(0, t);
            midGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.1);
            midGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            midOsc.connect(midGain);
            midGain.connect(SFX.masterGain);
            midOsc.start(t);
            midOsc.stop(t + 0.7);

            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 120);
        },
        'sfx_hurt_herbivore_t3_01': function () {
            SFX.playTone(90, 0.3, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.25);
        },
        'sfx_death_herbivore_t3_01': function () {
            SFX.playTone(50, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.4, 100);
        },
        'sfx_spawn_herbivore_t3_01': function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.4, 110);
        },
        'sfx_flee_herbivore_t3_01': function () {
            SFX.playTone(70, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.28);
        },

        // ===== T3_02 BRACHIOSAURUS - Extremely long neck, towering =====
        'sfx_aggro_herbivore_t3_02': function () {
            const t = SFX.ctx.currentTime;
            // Whale-like deep call
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40, t);
            osc.frequency.linearRampToValueAtTime(50, t + 0.4);
            osc.frequency.linearRampToValueAtTime(35, t + 0.8);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.value = 3;
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 8;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.9);
            osc.stop(t + 0.9);
        },
        'sfx_hurt_herbivore_t3_02': function () {
            SFX.playTone(60, 0.35, 'sine', SFX.TARGET_VOLUME, 0.05, 0.28);
        },
        'sfx_death_herbivore_t3_02': function () {
            SFX.playTone(35, 1.2, 'sine', SFX.TARGET_VOLUME, 0.2, 0.95);
        },
        'sfx_spawn_herbivore_t3_02': function () {
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.35, 80);
            SFX.playTone(45, 0.5, 'sine', SFX.TARGET_VOLUME * 0.4, 0.12, 0.35);
        },
        'sfx_flee_herbivore_t3_02': function () {
            SFX.playTone(50, 0.4, 'sine', SFX.TARGET_VOLUME * 0.5, 0.06, 0.32);
        },

        // ===== T4_01 DIPLODOCUS - Massive sauropod =====
        'sfx_aggro_herbivore_t4_01': function () {
            const t = SFX.ctx.currentTime;
            // Earth-shaking low rumble
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(30, t);
            osc.frequency.linearRampToValueAtTime(25, t + 1.0);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.1);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 1.15);

            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.35, 60);
        },
        'sfx_hurt_herbivore_t4_01': function () {
            SFX.playTone(50, 0.4, 'sine', SFX.TARGET_VOLUME, 0.06, 0.32);
        },
        'sfx_death_herbivore_t4_01': function () {
            SFX.playTone(25, 1.5, 'sine', SFX.TARGET_VOLUME, 0.25, 1.2);
            SFX.playNoise(0.6, 0.12, 0.5, SFX.TARGET_VOLUME * 0.4, 50);
        },
        'sfx_spawn_herbivore_t4_01': function () {
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.4, 60);
            SFX.playTone(35, 0.6, 'sine', SFX.TARGET_VOLUME * 0.4, 0.15, 0.4);
        },
        'sfx_flee_herbivore_t4_01': function () {
            SFX.playTone(40, 0.5, 'sine', SFX.TARGET_VOLUME * 0.5, 0.08, 0.4);
        },

        // ===== T4_02 ARGENTINOSAURUS - Colossal sauropod =====
        'sfx_aggro_herbivore_t4_02': function () {
            const t = SFX.ctx.currentTime;
            // The deepest, most earth-shaking call
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(25, t);
            osc.frequency.linearRampToValueAtTime(20, t + 1.2);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.value = 2;
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.85, t + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.3);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 1.35);
            osc.stop(t + 1.35);

            SFX.playNoise(0.6, 0.12, 0.5, SFX.TARGET_VOLUME * 0.4, 45);
        },
        'sfx_hurt_herbivore_t4_02': function () {
            SFX.playTone(40, 0.5, 'sine', SFX.TARGET_VOLUME, 0.08, 0.4);
        },
        'sfx_death_herbivore_t4_02': function () {
            SFX.playTone(20, 1.8, 'sine', SFX.TARGET_VOLUME, 0.3, 1.45);
            SFX.playNoise(0.8, 0.15, 0.65, SFX.TARGET_VOLUME * 0.45, 40);
        },
        'sfx_spawn_herbivore_t4_02': function () {
            SFX.playNoise(0.6, 0.12, 0.5, SFX.TARGET_VOLUME * 0.4, 50);
            SFX.playTone(28, 0.7, 'sine', SFX.TARGET_VOLUME * 0.45, 0.18, 0.48);
        },
        'sfx_flee_herbivore_t4_02': function () {
            SFX.playTone(35, 0.55, 'sine', SFX.TARGET_VOLUME * 0.5, 0.1, 0.42);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        console.log('[SFX_Herbivores] Registered 50 high-fidelity sounds (10 herbivores × 5)');
    }
})();
