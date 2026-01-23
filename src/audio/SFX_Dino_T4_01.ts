/**
 * SFX_Dino_FrostRaptor - T4_01 Frost Raptor Sound Handlers
 * Ice-themed predator
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t4_01: function () {
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
        sfx_hurt_dinosaur_t4_01: function () {
            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.4, 5000);
            SFX.playTone(500, 0.2, 'sine', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        sfx_death_dinosaur_t4_01: function () {
            SFX.playNoise(0.3, 0.02, 0.25, SFX.TARGET_VOLUME * 0.45, 4500);
            SFX.playTone(500, 0.7, 'sine', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        sfx_spawn_dinosaur_t4_01: function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.35, 6000);
            SFX.playTone(800, 0.3, 'sine', SFX.TARGET_VOLUME * 0.4, 0.05, 0.22);
        },
        sfx_flee_dinosaur_t4_01: function () {
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 3500);
            SFX.playTone(450, 0.2, 'sine', SFX.TARGET_VOLUME * 0.5, 0.03, 0.15);
        }
    };

    if (SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_FrostRaptor] Registered 5 sounds');
    }
})();

