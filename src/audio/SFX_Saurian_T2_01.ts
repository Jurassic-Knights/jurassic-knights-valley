/**
 * SFX_Saurian_DeinonychusLancer - T2_01 Lance cavalry
 * Aggressive raptor screech + lance ready
 */
(function () {
    const handlers = {
        sfx_aggro_saurian_t2_01: function () {
            const t = SFX.ctx.currentTime;
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
        sfx_hurt_saurian_t2_01: function () {
            SFX.playTone(420, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        sfx_death_saurian_t2_01: function () {
            SFX.playTone(380, 0.7, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.55);
            SFX.playNoise(0.35, 0.06, 0.28, SFX.TARGET_VOLUME * 0.35, 500);
        },
        sfx_spawn_saurian_t2_01: function () {
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 800);
            SFX.playTone(300, 0.25, 'sawtooth', SFX.TARGET_VOLUME * 0.4, 0.05, 0.18);
        },
        sfx_flee_saurian_t2_01: function () {
            SFX.playTone(370, 0.22, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.17);
        }
    };
    if (SFX) SFX.register(handlers);
})();

