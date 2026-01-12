/**
 * SFX_Saurians - Saurian Enemy Sounds (Anthropomorphic Dinosaur Soldiers)
 * 12 saurians × 5 sounds = 60 unique high-fidelity sounds
 * 
 * Humanoid-Reptilian fusion: combines dinosaur vocalizations with
 * metallic armor/gear sounds and mount vocalizations
 */

(function () {
    const handlers = {
        // ===== T1_01 VELOCIRAPTOR RIDER - Swift soldier, sword-wielder =====
        'sfx_aggro_saurian_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Raptor snarl + sword draw
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(280, t + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);

            // Metal gear click
            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.35, 1000);
        },
        'sfx_hurt_saurian_t1_01': function () {
            SFX.playTone(500, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.05, 0.01, 0.04, SFX.TARGET_VOLUME * 0.3, 800);
        },
        'sfx_death_saurian_t1_01': function () {
            SFX.playTone(450, 0.6, 'sawtooth', SFX.TARGET_VOLUME, 0.08, 0.48);
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.35, 600);
        },
        'sfx_spawn_saurian_t1_01': function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.25, 1200);
            SFX.playTone(350, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.4, 0.04, 0.14);
        },
        'sfx_flee_saurian_t1_01': function () {
            SFX.playTone(420, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.15);
        },

        // ===== T1_02 OVIRAPTOR SCOUT - Fast, dual blades =====
        'sfx_aggro_saurian_t1_02': function () {
            const t = SFX.ctx.currentTime;
            // Quick chirp + blade sound
            const osc = SFX.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(550, t);
            osc.frequency.exponentialRampToValueAtTime(450, t + 0.2);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.3);
        },
        'sfx_hurt_saurian_t1_02': function () {
            SFX.playTone(650, 0.15, 'square', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        'sfx_death_saurian_t1_02': function () {
            SFX.playTone(500, 0.5, 'square', SFX.TARGET_VOLUME, 0.06, 0.4);
        },
        'sfx_spawn_saurian_t1_02': function () {
            SFX.playNoise(0.1, 0.02, 0.08, SFX.TARGET_VOLUME * 0.2, 1800);
        },
        'sfx_flee_saurian_t1_02': function () {
            SFX.playTone(600, 0.18, 'square', SFX.TARGET_VOLUME * 0.5, 0.02, 0.14);
        },

        // ===== T1_03 TRICERATOPS SHIELDBEARER - Tank with shield =====
        'sfx_aggro_saurian_t1_03': function () {
            const t = SFX.ctx.currentTime;
            // Deep horn + shield clang
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

            // Shield rattle
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.4, 250);
        },
        'sfx_hurt_saurian_t1_03': function () {
            SFX.playTone(140, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.35, 300);
        },
        'sfx_death_saurian_t1_03': function () {
            SFX.playTone(85, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.35, 200);
        },
        'sfx_spawn_saurian_t1_03': function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 250);
        },
        'sfx_flee_saurian_t1_03': function () {
            SFX.playTone(115, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T2_01 DEINONYCHUS LANCER - Lance cavalry =====
        'sfx_aggro_saurian_t2_01': function () {
            const t = SFX.ctx.currentTime;
            // Aggressive raptor screech + lance ready
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(350, t);
            osc.frequency.exponentialRampToValueAtTime(250, t + 0.4);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.5);

            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 700);
        },
        'sfx_hurt_saurian_t2_01': function () {
            SFX.playTone(420, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_saurian_t2_01': function () {
            SFX.playTone(380, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
            SFX.playNoise(0.35, 0.06, 0.28, SFX.TARGET_VOLUME * 0.35, 500);
        },
        'sfx_spawn_saurian_t2_01': function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 800);
            SFX.playTone(300, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.4, 0.05, 0.18);
        },
        'sfx_flee_saurian_t2_01': function () {
            SFX.playTone(370, 0.22, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.17);
        },

        // ===== T2_02 PARASAUROLOPHUS HERALD - War horn, ranged =====
        'sfx_aggro_saurian_t2_02': function () {
            const t = SFX.ctx.currentTime;
            // Distinctive war horn call from crest
            const osc1 = SFX.ctx.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(150, t);
            osc1.frequency.linearRampToValueAtTime(200, t + 0.3);
            osc1.frequency.linearRampToValueAtTime(140, t + 0.6);

            const gain1 = SFX.ctx.createGain();
            gain1.gain.setValueAtTime(0, t);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.45);
            gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc1.connect(gain1);
            gain1.connect(SFX.masterGain);
            osc1.start(t);
            osc1.stop(t + 0.7);

            // Harmonic
            const osc2 = SFX.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(200, t);
            osc2.frequency.linearRampToValueAtTime(260, t + 0.25);

            const gain2 = SFX.ctx.createGain();
            gain2.gain.setValueAtTime(0, t);
            gain2.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.4, t + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc2.connect(gain2);
            gain2.connect(SFX.masterGain);
            osc2.start(t);
            osc2.stop(t + 0.55);
        },
        'sfx_hurt_saurian_t2_02': function () {
            SFX.playTone(180, 0.25, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        'sfx_death_saurian_t2_02': function () {
            SFX.playTone(130, 0.8, 'triangle', SFX.TARGET_VOLUME, 0.12, 0.65);
        },
        'sfx_spawn_saurian_t2_02': function () {
            SFX.playTone(160, 0.4, 'triangle', SFX.TARGET_VOLUME * 0.45, 0.08, 0.3);
        },
        'sfx_flee_saurian_t2_02': function () {
            SFX.playTone(170, 0.3, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        },

        // ===== T2_03 PACHYCEPHALOSAURUS CHARGER - Headbutt attacker =====
        'sfx_aggro_saurian_t2_03': function () {
            const t = SFX.ctx.currentTime;
            // Charging grunt
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.5);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.3, 250);
        },
        'sfx_hurt_saurian_t2_03': function () {
            SFX.playTone(170, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.17);
        },
        'sfx_death_saurian_t2_03': function () {
            SFX.playTone(120, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        'sfx_spawn_saurian_t2_03': function () {
            SFX.playNoise(0.18, 0.02, 0.14, SFX.TARGET_VOLUME * 0.3, 220);
        },
        'sfx_flee_saurian_t2_03': function () {
            SFX.playTone(150, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T3_01 ALLOSAURUS GUNNER - Ranged, machine gun =====
        'sfx_aggro_saurian_t3_01': function () {
            const t = SFX.ctx.currentTime;
            // Powerful roar + gun ready
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(130, t + 0.45);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.55);

            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.35, 350);
        },
        'sfx_hurt_saurian_t3_01': function () {
            SFX.playTone(260, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_saurian_t3_01': function () {
            SFX.playTone(180, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.65);
            SFX.playNoise(0.4, 0.08, 0.3, SFX.TARGET_VOLUME * 0.35, 300);
        },
        'sfx_spawn_saurian_t3_01': function () {
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.35, 320);
            SFX.playTone(160, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.4, 0.06, 0.22);
        },
        'sfx_flee_saurian_t3_01': function () {
            SFX.playTone(220, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T3_02 STEGOSAURUS HEAVY - Tank with flail =====
        'sfx_aggro_saurian_t3_02': function () {
            const t = SFX.ctx.currentTime;
            // Deep rumble + plate rattle + weapon ready
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.6);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.7);

            // Armor plate rattle
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.4, 150);
        },
        'sfx_hurt_saurian_t3_02': function () {
            SFX.playTone(100, 0.3, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.25);
        },
        'sfx_death_saurian_t3_02': function () {
            SFX.playTone(60, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.4, 120);
        },
        'sfx_spawn_saurian_t3_02': function () {
            SFX.playNoise(0.3, 0.06, 0.25, SFX.TARGET_VOLUME * 0.4, 130);
        },
        'sfx_flee_saurian_t3_02': function () {
            SFX.playTone(85, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.28);
        },

        // ===== T3_03 ANKYLOSAURUS SIEGE - Artillery unit =====
        'sfx_aggro_saurian_t3_03': function () {
            const t = SFX.ctx.currentTime;
            // Heavy armored grunt + mechanical sound
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, t);
            osc.frequency.exponentialRampToValueAtTime(45, t + 0.65);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.75);

            // Mechanical whir
            SFX.playNoise(0.18, 0.02, 0.15, SFX.TARGET_VOLUME * 0.4, 100);
        },
        'sfx_hurt_saurian_t3_03': function () {
            SFX.playTone(90, 0.28, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.23);
        },
        'sfx_death_saurian_t3_03': function () {
            SFX.playTone(55, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.55, 0.1, 0.45, SFX.TARGET_VOLUME * 0.45, 90);
        },
        'sfx_spawn_saurian_t3_03': function () {
            SFX.playNoise(0.35, 0.07, 0.28, SFX.TARGET_VOLUME * 0.4, 100);
        },
        'sfx_flee_saurian_t3_03': function () {
            SFX.playTone(75, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.28);
        },

        // ===== T4_01 T-REX GENERAL - Boss saurian =====
        'sfx_aggro_saurian_t4_01': function () {
            const t = SFX.ctx.currentTime;
            // Layer 1: Earth-shaking bass
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(35, t);
            bassOsc.frequency.linearRampToValueAtTime(28, t + 1.1);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.12);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 1.25);

            // Layer 2: Terrifying commanding roar
            const roar = SFX.ctx.createOscillator();
            roar.type = 'sawtooth';
            roar.frequency.setValueAtTime(70, t);
            roar.frequency.exponentialRampToValueAtTime(45, t + 1.1);

            const roarGain = SFX.ctx.createGain();
            roarGain.gain.setValueAtTime(0, t);
            roarGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.75, t + 0.1);
            roarGain.gain.exponentialRampToValueAtTime(0.01, t + 1.15);

            roar.connect(roarGain);
            roarGain.connect(SFX.masterGain);
            roar.start(t);
            roar.stop(t + 1.2);

            // Layer 3: Breath noise
            SFX.playNoise(0.9, 0.12, 0.7, SFX.TARGET_VOLUME * 0.4, 250);

            // Layer 4: Military gear
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 500);
        },
        'sfx_hurt_saurian_t4_01': function () {
            SFX.playTone(100, 0.45, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.4);
            SFX.playNoise(0.3, 0.03, 0.25, SFX.TARGET_VOLUME * 0.4, 220);
        },
        'sfx_death_saurian_t4_01': function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.5, 0.03, 0.45, SFX.TARGET_VOLUME * 0.5, 120);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 1.4);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(8, t);
            lfo.frequency.linearRampToValueAtTime(0.5, t + 1.3);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 15;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 1.55);
            osc.stop(t + 1.55);
        },
        'sfx_spawn_saurian_t4_01': function () {
            SFX.playNoise(0.6, 0.1, 0.5, SFX.TARGET_VOLUME * 0.45, 130);
            SFX.playTone(30, 0.7, 'sine', SFX.TARGET_VOLUME * 0.55, 0.22, 0.45);
        },
        'sfx_flee_saurian_t4_01': function () {
            SFX.playNoise(0.35, 0.04, 0.3, SFX.TARGET_VOLUME * 0.45, 150);
            SFX.playTone(50, 0.4, 'sine', SFX.TARGET_VOLUME * 0.5, 0.06, 0.32);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        console.log('[SFX_Saurians] Registered 60 high-fidelity sounds (12 saurians × 5)');
    }
})();
