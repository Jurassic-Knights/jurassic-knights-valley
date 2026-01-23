/**
 * SFX_Human_Hauptmann - T4_03 Elite commander
 * Powerful commanding presence
 */
(function () {
    const handlers = {
        sfx_aggro_human_t4_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(85, t + 0.65);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 350;
            filter.Q.value = 5;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.85, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.7);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.75);

            SFX.playNoise(0.25, 0.04, 0.2, SFX.TARGET_VOLUME * 0.38, 380);
        },
        sfx_hurt_human_t4_03: function () {
            SFX.playTone(160, 0.3, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.24);
        },
        sfx_death_human_t4_03: function () {
            SFX.playTone(100, 0.95, 'sawtooth', SFX.TARGET_VOLUME, 0.15, 0.78);
            SFX.playNoise(0.5, 0.1, 0.4, SFX.TARGET_VOLUME * 0.42, 340);
        },
        sfx_spawn_human_t4_03: function () {
            SFX.playNoise(0.3, 0.05, 0.24, SFX.TARGET_VOLUME * 0.38, 400);
        },
        sfx_flee_human_t4_03: function () {
            SFX.playTone(130, 0.35, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.04, 0.28);
        }
    };
    if (SFX) SFX.register(handlers);
})();

