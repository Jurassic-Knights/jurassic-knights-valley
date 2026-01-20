/**
 * SFX_Saurian_VelociraptorRider - T1_01 Swift soldier, sword-wielder
 * Raptor snarl + sword draw, metal gear click
 */
(function () {
    const handlers = {
        sfx_aggro_saurian_t1_01: function () {
            const t = SFX.ctx.currentTime;
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

            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.35, 1000);
        },
        sfx_hurt_saurian_t1_01: function () {
            SFX.playTone(500, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
            SFX.playNoise(0.05, 0.01, 0.04, SFX.TARGET_VOLUME * 0.3, 800);
        },
        sfx_death_saurian_t1_01: function () {
            SFX.playTone(450, 0.6, 'sawtooth', SFX.TARGET_VOLUME, 0.08, 0.48);
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.35, 600);
        },
        sfx_spawn_saurian_t1_01: function () {
            SFX.playNoise(0.15, 0.02, 0.1, SFX.TARGET_VOLUME * 0.25, 1200);
            SFX.playTone(350, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.4, 0.04, 0.14);
        },
        sfx_flee_saurian_t1_01: function () {
            SFX.playTone(420, 0.2, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.15);
        }
    };
    if (window.SFX) SFX.register(handlers);
})();

