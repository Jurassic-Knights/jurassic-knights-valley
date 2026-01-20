/**
 * SFX_Dino_Compsognathus - T1_01 Compsognathus Sound Handlers
 * Turkey-sized, quick, chirpy predator
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t1_01: function () {
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
        sfx_hurt_dinosaur_t1_01: function () {
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
        sfx_death_dinosaur_t1_01: function () {
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
        sfx_spawn_dinosaur_t1_01: function () {
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.3, 3000);
            SFX.playTone(600, 0.15, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.12);
        },
        sfx_flee_dinosaur_t1_01: function () {
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
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_Compsognathus] Registered 5 sounds');
    }
})();

