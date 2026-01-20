/**
 * SFX_Saurian_WarbandChieftain - T3_04 Heavy armored saurian
 * Commanding war cry
 */
(function () {
    const handlers = {
        sfx_aggro_saurian_t3_04: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(75, t);
            osc.frequency.exponentialRampToValueAtTime(50, t + 0.7);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 250;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.8);

            SFX.playNoise(0.25, 0.03, 0.2, SFX.TARGET_VOLUME * 0.38, 120);
        },
        sfx_hurt_saurian_t3_04: function () {
            SFX.playTone(85, 0.3, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.25);
        },
        sfx_death_saurian_t3_04: function () {
            SFX.playTone(50, 1.1, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.88);
            SFX.playNoise(0.6, 0.12, 0.48, SFX.TARGET_VOLUME * 0.48, 100);
        },
        sfx_spawn_saurian_t3_04: function () {
            SFX.playNoise(0.4, 0.08, 0.32, SFX.TARGET_VOLUME * 0.42, 110);
        },
        sfx_flee_saurian_t3_04: function () {
            SFX.playTone(70, 0.38, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.05, 0.3);
        }
    };
    if (window.SFX) SFX.register(handlers);
})();

