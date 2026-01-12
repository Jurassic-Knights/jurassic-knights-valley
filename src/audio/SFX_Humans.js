/**
 * SFX_Humans - Human Enemy Sounds (WWI-Era Soldiers)
 * 12 humans × 5 sounds = 60 unique high-fidelity sounds
 * 
 * WWI-era audio signature with bandpass-filtered voices (gas mask muffling)
 * Mechanical weapon sounds (rifle bolts, gear clicks)
 */

(function () {
    const handlers = {
        // ===== T1_01 CONSCRIPT - Basic recruit, tattered =====
        'sfx_aggro_human_t1_01': function () {
            const t = SFX.ctx.currentTime;
            // Muffled shout through mask
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(250, t);
            osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 350;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.3);
        },
        'sfx_hurt_human_t1_01': function () {
            SFX.playTone(350, 0.15, 'triangle', SFX.TARGET_VOLUME, 0.01, 0.12);
        },
        'sfx_death_human_t1_01': function () {
            SFX.playTone(200, 0.5, 'triangle', SFX.TARGET_VOLUME, 0.08, 0.4);
        },
        'sfx_spawn_human_t1_01': function () {
            SFX.playNoise(0.1, 0.02, 0.08, SFX.TARGET_VOLUME * 0.2, 1800);
        },
        'sfx_flee_human_t1_01': function () {
            SFX.playTone(300, 0.18, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.14);
        },

        // ===== T1_02 RIFLEMAN - Infantry, bolt-action =====
        'sfx_aggro_human_t1_02': function () {
            const t = SFX.ctx.currentTime;
            // Muffled battle cry
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 320;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.32);
        },
        'sfx_hurt_human_t1_02': function () {
            SFX.playTone(300, 0.18, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        'sfx_death_human_t1_02': function () {
            SFX.playTone(180, 0.55, 'triangle', SFX.TARGET_VOLUME, 0.08, 0.44);
        },
        'sfx_spawn_human_t1_02': function () {
            SFX.playNoise(0.12, 0.02, 0.1, SFX.TARGET_VOLUME * 0.22, 1500);
        },
        'sfx_flee_human_t1_02': function () {
            SFX.playTone(280, 0.2, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.16);
        },

        // ===== T1_03 TRENCH KNIGHT - Melee, plate armor =====
        'sfx_aggro_human_t1_03': function () {
            const t = SFX.ctx.currentTime;
            // Deep warrior cry + sword draw
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.35);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 380;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.45);

            // Armor rattle
            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.3, 600);
        },
        'sfx_hurt_human_t1_03': function () {
            SFX.playTone(240, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        'sfx_death_human_t1_03': function () {
            SFX.playTone(160, 0.6, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.48);
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 500);
        },
        'sfx_spawn_human_t1_03': function () {
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 700);
        },
        'sfx_flee_human_t1_03': function () {
            SFX.playTone(200, 0.22, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.18);
        },

        // ===== T2_01 STURMTRUPPEN - Assault armor, SMG =====
        'sfx_aggro_human_t2_01': function () {
            const t = SFX.ctx.currentTime;
            // Aggressive assault cry
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.4);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 350;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.5);

            // Gear clatter
            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.3, 500);
        },
        'sfx_hurt_human_t2_01': function () {
            SFX.playTone(220, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.17);
        },
        'sfx_death_human_t2_01': function () {
            SFX.playTone(140, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
            SFX.playNoise(0.3, 0.05, 0.22, SFX.TARGET_VOLUME * 0.35, 450);
        },
        'sfx_spawn_human_t2_01': function () {
            SFX.playNoise(0.18, 0.03, 0.14, SFX.TARGET_VOLUME * 0.28, 550);
        },
        'sfx_flee_human_t2_01': function () {
            SFX.playTone(180, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.2);
        },

        // ===== T2_02 CROSSBOWMAN - Ranged, visor helmet =====
        'sfx_aggro_human_t2_02': function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(160, t + 0.3);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 340;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        'sfx_hurt_human_t2_02': function () {
            SFX.playTone(280, 0.18, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        'sfx_death_human_t2_02': function () {
            SFX.playTone(170, 0.6, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.48);
        },
        'sfx_spawn_human_t2_02': function () {
            SFX.playNoise(0.14, 0.02, 0.1, SFX.TARGET_VOLUME * 0.24, 1200);
        },
        'sfx_flee_human_t2_02': function () {
            SFX.playTone(240, 0.2, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.16);
        },

        // ===== T2_03 HALBERDIER - Heavy melee, full plate =====
        'sfx_aggro_human_t2_03': function () {
            const t = SFX.ctx.currentTime;
            // Armored warrior shout
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.45);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 360;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.55);

            // Heavy armor + weapon ready
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.35, 350);
        },
        'sfx_hurt_human_t2_03': function () {
            SFX.playTone(200, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.17);
        },
        'sfx_death_human_t2_03': function () {
            SFX.playTone(120, 0.75, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.6);
            SFX.playNoise(0.35, 0.06, 0.28, SFX.TARGET_VOLUME * 0.35, 320);
        },
        'sfx_spawn_human_t2_03': function () {
            SFX.playNoise(0.2, 0.03, 0.16, SFX.TARGET_VOLUME * 0.3, 400);
        },
        'sfx_flee_human_t2_03': function () {
            SFX.playTone(160, 0.28, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.22);
        },

        // ===== T3_01 MACHINE GUNNER - Heavy weapons, slow =====
        'sfx_aggro_human_t3_01': function () {
            const t = SFX.ctx.currentTime;
            // Deep grunt + weapon ready
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(90, t + 0.5);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 330;
            filter.Q.value = 5;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            // Machine gun mechanism
            SFX.playNoise(0.18, 0.02, 0.15, SFX.TARGET_VOLUME * 0.35, 300);
        },
        'sfx_hurt_human_t3_01': function () {
            SFX.playTone(170, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.2);
        },
        'sfx_death_human_t3_01': function () {
            SFX.playTone(100, 0.85, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.68);
            SFX.playNoise(0.4, 0.08, 0.32, SFX.TARGET_VOLUME * 0.38, 280);
        },
        'sfx_spawn_human_t3_01': function () {
            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.32, 350);
        },
        'sfx_flee_human_t3_01': function () {
            SFX.playTone(140, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.24);
        },

        // ===== T3_02 FLAMETROOPER - Fire attacker, heavy armor =====
        'sfx_aggro_human_t3_02': function () {
            const t = SFX.ctx.currentTime;
            // Deep muffled shout + pilot light hiss
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(75, t + 0.45);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 300;
            filter.Q.value = 6;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.55);

            // Fuel tank hiss
            SFX.playNoise(0.4, 0.05, 0.3, SFX.TARGET_VOLUME * 0.35, 1000);
        },
        'sfx_hurt_human_t3_02': function () {
            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.35, 1200);
            SFX.playTone(150, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.18);
        },
        'sfx_death_human_t3_02': function () {
            // Fuel ignition on death
            SFX.playNoise(0.5, 0.08, 0.4, SFX.TARGET_VOLUME * 0.45, 800);
            SFX.playTone(90, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
        },
        'sfx_spawn_human_t3_02': function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.35, 900);
        },
        'sfx_flee_human_t3_02': function () {
            SFX.playNoise(0.2, 0.02, 0.16, SFX.TARGET_VOLUME * 0.35, 1100);
        },

        // ===== T4_01 FELDWEBEL - Sergeant, officer =====
        'sfx_aggro_human_t4_01': function () {
            const t = SFX.ctx.currentTime;
            // Commanding officer shout
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(110, t + 0.5);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 370;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.75, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.6);

            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.32, 420);
        },
        'sfx_hurt_human_t4_01': function () {
            SFX.playTone(200, 0.25, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.2);
        },
        'sfx_death_human_t4_01': function () {
            SFX.playTone(130, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
            SFX.playNoise(0.4, 0.07, 0.32, SFX.TARGET_VOLUME * 0.38, 380);
        },
        'sfx_spawn_human_t4_01': function () {
            SFX.playNoise(0.22, 0.04, 0.18, SFX.TARGET_VOLUME * 0.32, 450);
        },
        'sfx_flee_human_t4_01': function () {
            SFX.playTone(170, 0.28, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.22);
        },

        // ===== T4_02 LEUTNANT - Elite officer =====
        'sfx_aggro_human_t4_02': function () {
            const t = SFX.ctx.currentTime;
            // Elite commanding voice
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(95, t + 0.6);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 360;
            filter.Q.value = 5;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.7);

            // Officer gear rattle
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 400);
        },
        'sfx_hurt_human_t4_02': function () {
            SFX.playTone(180, 0.28, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.22);
        },
        'sfx_death_human_t4_02': function () {
            SFX.playTone(110, 0.9, 'sawtooth', SFX.TARGET_VOLUME, 0.14, 0.72);
            SFX.playNoise(0.45, 0.08, 0.36, SFX.TARGET_VOLUME * 0.4, 360);
        },
        'sfx_spawn_human_t4_02': function () {
            SFX.playNoise(0.28, 0.05, 0.22, SFX.TARGET_VOLUME * 0.35, 420);
        },
        'sfx_flee_human_t4_02': function () {
            SFX.playTone(150, 0.32, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.26);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        console.log('[SFX_Humans] Registered 60 high-fidelity sounds (12 humans × 5)');
    }
})();
