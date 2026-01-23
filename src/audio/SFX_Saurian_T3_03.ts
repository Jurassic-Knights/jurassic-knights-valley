/**
 * SFX_Saurian_AnkylosaurusSiege - T3_03 Artillery unit
 * Heavy armored grunt + mechanical sound
 */
(function () {
    const handlers = {
        sfx_aggro_saurian_t3_03: function () {
            const t = SFX.ctx.currentTime;
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

            SFX.playNoise(0.18, 0.02, 0.15, SFX.TARGET_VOLUME * 0.4, 100);
        },
        sfx_hurt_saurian_t3_03: function () {
            SFX.playTone(90, 0.28, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.23);
        },
        sfx_death_saurian_t3_03: function () {
            SFX.playTone(55, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.55, 0.1, 0.45, SFX.TARGET_VOLUME * 0.45, 90);
        },
        sfx_spawn_saurian_t3_03: function () {
            SFX.playNoise(0.35, 0.07, 0.28, SFX.TARGET_VOLUME * 0.4, 100);
        },
        sfx_flee_saurian_t3_03: function () {
            SFX.playTone(75, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.28);
        }
    };
    if (SFX) SFX.register(handlers);
})();

