/** SFX_Herbivore_T1_03 - Maiasaura */
import { SFX } from './SFX_Core';
(function () {
    const handlers = {
        sfx_aggro_herbivore_t1_03: function () { SFX.playTone(200, 0.3, 'sine', SFX.TARGET_VOLUME * 0.6, 0.05, 0.22); },
        sfx_hurt_herbivore_t1_03: function () { SFX.playTone(250, 0.2, 'sine', SFX.TARGET_VOLUME, 0.02, 0.15); },
        sfx_death_herbivore_t1_03: function () { SFX.playTone(180, 0.6, 'sine', SFX.TARGET_VOLUME, 0.1, 0.45); },
        sfx_spawn_herbivore_t1_03: function () { SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.25, 1200); },
        sfx_flee_herbivore_t1_03: function () { SFX.playTone(230, 0.25, 'sine', SFX.TARGET_VOLUME * 0.55, 0.03, 0.2); }
    };
    if (SFX) SFX.register(handlers);
})();
