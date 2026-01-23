/**
 * SFX_Dino_DesertStalker - T3_02 Desert Stalker Sound Handlers
 * Sand raptor boss
 */
(function () {
    const handlers = {
        sfx_aggro_dinosaur_t3_02: function () {
            SFX.playNoise(0.4, 0.05, 0.3, SFX.TARGET_VOLUME * 0.4, 2500);
            SFX.playTone(250, 0.4, 'sawtooth', SFX.TARGET_VOLUME * 0.7, 0.05, 0.3);
        },
        sfx_hurt_dinosaur_t3_02: function () {
            SFX.playNoise(0.1, 0.01, 0.08, SFX.TARGET_VOLUME * 0.35, 3000);
            SFX.playTone(300, 0.18, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        sfx_death_dinosaur_t3_02: function () {
            SFX.playNoise(0.6, 0.1, 0.5, SFX.TARGET_VOLUME * 0.4, 1800);
            SFX.playTone(280, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
        },
        sfx_spawn_dinosaur_t3_02: function () {
            SFX.playNoise(0.35, 0.05, 0.3, SFX.TARGET_VOLUME * 0.4, 2200);
            SFX.playTone(200, 0.3, 'sawtooth', SFX.TARGET_VOLUME * 0.45, 0.08, 0.2);
        },
        sfx_flee_dinosaur_t3_02: function () {
            SFX.playNoise(0.25, 0.02, 0.2, SFX.TARGET_VOLUME * 0.4, 2500);
        }
    };

    if (SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Dino_DesertStalker] Registered 5 sounds');
    }
})();

