/**
 * SFX_Dino_Pteranodon - T4_03 Roost Patriarch Sound Handlers
 * Pteranodon boss
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t4_03: function () {
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
        sfx_hurt_dinosaur_t4_03: function () {
            SFX.playTone(700, 0.2, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.35, 4000);
        },
        sfx_death_dinosaur_t4_03: function () {
            SFX.playTone(550, 0.9, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.75);
            SFX.playNoise(0.5, 0.08, 0.4, SFX.TARGET_VOLUME * 0.4, 3000);
        },
        sfx_spawn_dinosaur_t4_03: function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.35, 5000);
            SFX.playTone(650, 0.4, 'triangle', SFX.TARGET_VOLUME * 0.45, 0.08, 0.3);
        },
        sfx_flee_dinosaur_t4_03: function () {
            SFX.playTone(580, 0.3, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.03, 0.25);
            SFX.playNoise(0.2, 0.02, 0.15, SFX.TARGET_VOLUME * 0.35, 4000);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_Pteranodon] Registered 5 sounds');
    }
})();

