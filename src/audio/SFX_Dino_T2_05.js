/**
 * SFX_Dino_OviraptorT2 - T2_05 Oviraptor (Zone) Sound Handlers
 * Feathered zone dino
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t2_05: function () {
            SFX.playTone(480, 0.25, 'square', SFX.TARGET_VOLUME * 0.7, 0.03, 0.2);
        },
        sfx_hurt_dinosaur_t2_05: function () {
            SFX.playTone(600, 0.15, 'square', SFX.TARGET_VOLUME, 0.02, 0.12);
        },
        sfx_death_dinosaur_t2_05: function () {
            SFX.playTone(500, 0.5, 'square', SFX.TARGET_VOLUME, 0.05, 0.4);
        },
        sfx_spawn_dinosaur_t2_05: function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.3, 3500);
        },
        sfx_flee_dinosaur_t2_05: function () {
            SFX.playTone(550, 0.2, 'square', SFX.TARGET_VOLUME * 0.6, 0.02, 0.15);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_OviraptorT2] Registered 5 sounds');
    }
})();

