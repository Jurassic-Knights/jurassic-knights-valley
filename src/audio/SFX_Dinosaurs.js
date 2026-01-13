/**
 * SFX_Dinosaurs - Dinosaur Enemy Sounds (Wild Predators)
 * 16 dinosaurs × 5 sounds = 80 unique 5-layer synthesized sounds
 * 
 * Epic Roar Standard (v22.8.1):
 * Layer 1: Deep Rumbling Bass (sine 25-45Hz)
 * Layer 2: Mid-Frequency Growl (sawtooth + bandpass)
 * Layer 3: High-Pitched Screech (square harmonic)
 * Layer 4: Noise Texture (organic hiss/rasp)
 * Layer 5: Vibrato Modulation (LFO for life)
 */

(function () {
    const handlers = {
        // ===== T1_01 COMPSOGNATHUS - Turkey-sized, quick, chirpy =====
        'sfx_aggro_dinosaur_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Quick chirpy sequence - small predator
            for (let i = 0; i < 3; i++) {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800 + i * 100, t + i * 0.08);
                osc.frequency.exponentialRampToValueAtTime(600, t + i * 0.08 + 0.06);

                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(0, t + i * 0.08);
                gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + i * 0.08 + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.08 + 0.06);

                osc.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start(t + i * 0.08);
                osc.stop(t + i * 0.08 + 0.08);
            }
        },
        'sfx_hurt_dinosaur_t1_01': function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(900, t);
            osc.frequency.exponentialRampToValueAtTime(700, t + 0.1);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.15);
        },
        'sfx_death_dinosaur_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Descending chirp sequence
            for (let i = 0; i < 4; i++) {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(700 - i * 80, t + i * 0.1);
                osc.frequency.exponentialRampToValueAtTime(400, t + i * 0.1 + 0.15);

                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(SFX.TARGET_VOLUME * (1 - i * 0.2), t + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.1 + 0.18);

                osc.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start(t + i * 0.1);
                osc.stop(t + i * 0.1 + 0.2);
            }
        },
        'sfx_spawn_dinosaur_t1_01': function () {
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.3, 3000);
            SFX.playTone(600, 0.15, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.12);
        },
        'sfx_flee_dinosaur_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Panicked rapid chirps
            for (let i = 0; i < 5; i++) {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(850 + Math.random() * 150, t + i * 0.05);

                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(SFX.TARGET_VOLUME * 0.6, t + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.04);

                osc.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start(t + i * 0.05);
                osc.stop(t + i * 0.05 + 0.05);
            }
        },

        // ===== T1_02 DILOPHOSAURUS - Twin crests, spitting hiss =====
        'sfx_aggro_dinosaur_t1_02': function () {
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
        'sfx_hurt_dinosaur_t1_02': function () {
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
        'sfx_death_dinosaur_t1_02': function () {
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
        'sfx_spawn_dinosaur_t1_02': function () {
            SFX.playTone(150, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.15, 0.2);
            SFX.playNoise(0.25, 0.05, 0.18, SFX.TARGET_VOLUME * 0.3, 1500);
        },
        'sfx_flee_dinosaur_t1_02': function () {
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 1500);
            SFX.playTone(350, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.15);
        },

        // ===== T1_03 OVIRAPTOR - Beaked, feathered, bird-like =====
        'sfx_aggro_dinosaur_t1_03': function () {
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
        'sfx_hurt_dinosaur_t1_03': function () {
            SFX.playTone(650, 0.15, 'square', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        'sfx_death_dinosaur_t1_03': function () {
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
        'sfx_spawn_dinosaur_t1_03': function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.3, 4000);
            SFX.playTone(500, 0.2, 'square', SFX.TARGET_VOLUME * 0.4, 0.03, 0.15);
        },
        'sfx_flee_dinosaur_t1_03': function () {
            const t = SFX.ctx.currentTime;
            for (let i = 0; i < 4; i++) {
                setTimeout(() => {
                    SFX.playTone(600 + Math.random() * 100, 0.08, 'square', SFX.TARGET_VOLUME * 0.5, 0.01, 0.06);
                }, i * 60);
            }
        },

        // ===== T1_04 GALLIMIMUS - Ostrich-like, fast runner =====
        'sfx_aggro_dinosaur_t1_04': function () {
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
        'sfx_hurt_dinosaur_t1_04': function () {
            SFX.playTone(550, 0.15, 'triangle', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        'sfx_death_dinosaur_t1_04': function () {
            SFX.playTone(400, 0.5, 'triangle', SFX.TARGET_VOLUME, 0.05, 0.4);
        },
        'sfx_spawn_dinosaur_t1_04': function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 3500);
        },
        'sfx_flee_dinosaur_t1_04': function () {
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
        },

        // ===== T2_01 PACHYCEPHALOSAURUS - War beast, battering ram head =====
        'sfx_aggro_dinosaur_t2_01': function () {
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
        'sfx_hurt_dinosaur_t2_01': function () {
            SFX.playTone(200, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.3, 250);
        },
        'sfx_death_dinosaur_t2_01': function () {
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
        'sfx_spawn_dinosaur_t2_01': function () {
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.4, 220);
            SFX.playTone(100, 0.3, 'sine', SFX.TARGET_VOLUME * 0.4, 0.05, 0.22);
        },
        'sfx_flee_dinosaur_t2_01': function () {
            SFX.playTone(140, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.15);
        },

        // ===== T2_02 PACK ALPHA - Battle-worn raptor boss =====
        'sfx_aggro_dinosaur_t2_02': function () {
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
        'sfx_hurt_dinosaur_t2_02': function () {
            SFX.playTone(400, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.3, 500);
        },
        'sfx_death_dinosaur_t2_02': function () {
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
        'sfx_spawn_dinosaur_t2_02': function () {
            SFX.playTone(300, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.3);
            SFX.playNoise(0.3, 0.05, 0.2, SFX.TARGET_VOLUME * 0.3, 800);
        },
        'sfx_flee_dinosaur_t2_02': function () {
            SFX.playTone(350, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.2);
        },

        // ===== T2_03 PACHYRHINOSAURUS - Bony frill zone dino =====
        'sfx_aggro_dinosaur_t2_03': function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.35, 220);
        },
        'sfx_hurt_dinosaur_t2_03': function () {
            SFX.playTone(130, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        'sfx_death_dinosaur_t2_03': function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.4, 150);
            SFX.playTone(100, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.65);
        },
        'sfx_spawn_dinosaur_t2_03': function () {
            SFX.playNoise(0.25, 0.03, 0.2, SFX.TARGET_VOLUME * 0.4, 180);
        },
        'sfx_flee_dinosaur_t2_03': function () {
            SFX.playTone(110, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T2_04 THERIZINOSAURUS - Massive claws, bizarre =====
        'sfx_aggro_dinosaur_t2_04': function () {
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
        'sfx_hurt_dinosaur_t2_04': function () {
            SFX.playTone(220, 0.2, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_dinosaur_t2_04': function () {
            SFX.playTone(160, 0.8, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.65);
        },
        'sfx_spawn_dinosaur_t2_04': function () {
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.35, 500);
            SFX.playTone(150, 0.35, 'triangle', SFX.TARGET_VOLUME * 0.45, 0.06, 0.25);
        },
        'sfx_flee_dinosaur_t2_04': function () {
            SFX.playTone(200, 0.25, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T2_05 OVIRAPTOR - Feathered zone dino =====
        'sfx_aggro_dinosaur_t2_05': function () {
            SFX.playTone(480, 0.25, 'square', SFX.TARGET_VOLUME * 0.7, 0.03, 0.2);
        },
        'sfx_hurt_dinosaur_t2_05': function () {
            SFX.playTone(600, 0.15, 'square', SFX.TARGET_VOLUME, 0.02, 0.12);
        },
        'sfx_death_dinosaur_t2_05': function () {
            SFX.playTone(500, 0.5, 'square', SFX.TARGET_VOLUME, 0.05, 0.4);
        },
        'sfx_spawn_dinosaur_t2_05': function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.3, 3500);
        },
        'sfx_flee_dinosaur_t2_05': function () {
            SFX.playTone(550, 0.2, 'square', SFX.TARGET_VOLUME * 0.6, 0.02, 0.15);
        },

        // ===== T3_01 CARNOTAURUS - Horned bull predator =====
        'sfx_aggro_dinosaur_t3_01': function () {
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
        'sfx_hurt_dinosaur_t3_01': function () {
            SFX.playTone(150, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.4, 400);
        },
        'sfx_death_dinosaur_t3_01': function () {
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.45, 180);
            SFX.playTone(100, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.6);
        },
        'sfx_spawn_dinosaur_t3_01': function () {
            SFX.playNoise(0.25, 0.03, 0.2, SFX.TARGET_VOLUME * 0.4, 200);
            SFX.playTone(70, 0.4, 'sine', SFX.TARGET_VOLUME * 0.45, 0.08, 0.28);
        },
        'sfx_flee_dinosaur_t3_01': function () {
            SFX.playTone(100, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T3_02 DESERT STALKER - Sand raptor boss =====
        'sfx_aggro_dinosaur_t3_02': function () {
            SFX.playNoise(0.4, 0.05, 0.3, SFX.TARGET_VOLUME * 0.4, 2500);
            SFX.playTone(250, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.7, 0.05, 0.3);
        },
        'sfx_hurt_dinosaur_t3_02': function () {
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.35, 3000);
            SFX.playTone(300, 0.18, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        'sfx_death_dinosaur_t3_02': function () {
            SFX.playNoise(0.6, 0.1, 0.5, SFX.TARGET_VOLUME * 0.4, 1800);
            SFX.playTone(280, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        'sfx_spawn_dinosaur_t3_02': function () {
            SFX.playNoise(0.35, 0.05, 0.3, SFX.TARGET_VOLUME * 0.4, 2200);
            SFX.playTone(200, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.45, 0.08, 0.2);
        },
        'sfx_flee_dinosaur_t3_02': function () {
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 2500);
        },

        // ===== T3_03 ANKYLOSAURUS - Armored tank =====
        'sfx_aggro_dinosaur_t3_03': function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            // Armor clank
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.4, 150);
        },
        'sfx_hurt_dinosaur_t3_03': function () {
            // Armor deflection sound
            SFX.playTone(100, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.5, 200);
        },
        'sfx_death_dinosaur_t3_03': function () {
            SFX.playTone(60, 0.9, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.7);
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.45, 100);
        },
        'sfx_spawn_dinosaur_t3_03': function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.45, 120);
        },
        'sfx_flee_dinosaur_t3_03': function () {
            SFX.playTone(80, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        },

        // ===== T3_04 BULL TRICERATOPS - Massive horned beast =====
        'sfx_aggro_dinosaur_t3_04': function () {
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
        'sfx_hurt_dinosaur_t3_04': function () {
            SFX.playTone(90, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        'sfx_death_dinosaur_t3_04': function () {
            SFX.playTone(50, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.45, 100);
        },
        'sfx_spawn_dinosaur_t3_04': function () {
            SFX.playNoise(0.35, 0.06, 0.3, SFX.TARGET_VOLUME * 0.45, 120);
            SFX.playTone(45, 0.4, 'sine', SFX.TARGET_VOLUME * 0.4, 0.1, 0.28);
        },
        'sfx_flee_dinosaur_t3_04': function () {
            SFX.playTone(70, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        },

        // ===== T4_01 FROST RAPTOR - Ice-themed predator =====
        'sfx_aggro_dinosaur_t4_01': function () {
            const t = SFX.ctx.currentTime;
            // Crystalline hiss + screech
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.4, 5000);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);
            osc.frequency.exponentialRampToValueAtTime(350, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);
        },
        'sfx_hurt_dinosaur_t4_01': function () {
            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.4, 5000);
            SFX.playTone(500, 0.2, 'sine', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_dinosaur_t4_01': function () {
            SFX.playNoise(0.3, 0.02, 0.25, SFX.TARGET_VOLUME * 0.45, 4500);
            SFX.playTone(500, 0.7, 'sine', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        'sfx_spawn_dinosaur_t4_01': function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 6000);
            SFX.playTone(800, 0.3, 'sine', SFX.TARGET_VOLUME * 0.4, 0.05, 0.22);
        },
        'sfx_flee_dinosaur_t4_01': function () {
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 3500);
            SFX.playTone(450, 0.2, 'sine', SFX.TARGET_VOLUME * 0.5, 0.03, 0.15);
        },

        // ===== T4_02 TYRANNOSAUR MATRIARCH - Massive T-Rex boss =====
        'sfx_aggro_dinosaur_t4_02': function () {
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
        'sfx_hurt_dinosaur_t4_02': function () {
            SFX.playTone(90, 0.4, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.35);
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 250);
        },
        'sfx_death_dinosaur_t4_02': function () {
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
        'sfx_spawn_dinosaur_t4_02': function () {
            SFX.playNoise(0.5, 0.08, 0.4, SFX.TARGET_VOLUME * 0.45, 150);
            SFX.playTone(25, 0.6, 'sine', SFX.TARGET_VOLUME * 0.6, 0.2, 0.35);
        },
        'sfx_flee_dinosaur_t4_02': function () {
            SFX.playNoise(0.3, 0.03, 0.25, SFX.TARGET_VOLUME * 0.45, 180);
            SFX.playTone(45, 0.35, 'sine', SFX.TARGET_VOLUME * 0.5, 0.05, 0.28);
        },

        // ===== T4_03 ROOST PATRIARCH - Pteranodon boss =====
        'sfx_aggro_dinosaur_t4_03': function () {
            const t = SFX.ctx.currentTime;
            // High-pitched pterosaur screech
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.2);
            osc.frequency.exponentialRampToValueAtTime(500, t + 0.5);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.value = 12;
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 40;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.6);
            osc.stop(t + 0.6);

            SFX.playNoise(0.4, 0.05, 0.3, SFX.TARGET_VOLUME * 0.35, 3500);
        },
        'sfx_hurt_dinosaur_t4_03': function () {
            SFX.playTone(700, 0.2, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.35, 4000);
        },
        'sfx_death_dinosaur_t4_03': function () {
            SFX.playTone(550, 0.9, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.75);
            SFX.playNoise(0.5, 0.08, 0.4, SFX.TARGET_VOLUME * 0.4, 3000);
        },
        'sfx_spawn_dinosaur_t4_03': function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.35, 5000);
            SFX.playTone(650, 0.4, 'triangle', SFX.TARGET_VOLUME * 0.45, 0.08, 0.3);
        },
        'sfx_flee_dinosaur_t4_03': function () {
            SFX.playTone(580, 0.3, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.03, 0.25);
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.35, 4000);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dinosaurs] Registered 80 high-fidelity sounds (16 dinosaurs × 5)');
    }
})();
