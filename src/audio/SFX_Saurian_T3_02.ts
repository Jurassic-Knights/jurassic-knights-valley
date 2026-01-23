/**
 * SFX_Saurian_StegosaurusHeavy - T3_02 Tank with flail
 * Deep rumble + plate rattle + weapon ready
 */
(function () {
    const handlers = {
        sfx_aggro_saurian_t3_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.6);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.7);

            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.4, 150);
        },
        sfx_hurt_saurian_t3_02: function () {
            SFX.playTone(100, 0.3, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.25);
        },
        sfx_death_saurian_t3_02: function () {
            SFX.playTone(60, 1.0, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.8);
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.4, 120);
        },
        sfx_spawn_saurian_t3_02: function () {
            SFX.playNoise(0.3, 0.06, 0.25, SFX.TARGET_VOLUME * 0.4, 130);
        },
        sfx_flee_saurian_t3_02: function () {
            SFX.playTone(85, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.28);
        }
    };
    if (SFX) SFX.register(handlers);
})();

