/**
 * SFX_Human_TrenchKnight - T1_03 Melee, plate armor
 * Deep warrior cry + sword draw
 */
(function () {
    const handlers = {
        sfx_aggro_human_t1_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.35);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 380;
            filter.Q.value = 3;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.45);

            SFX.playNoise(0.08, 0.01, 0.06, SFX.TARGET_VOLUME * 0.3, 600);
        },
        sfx_hurt_human_t1_03: function () {
            SFX.playTone(240, 0.2, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.15);
        },
        sfx_death_human_t1_03: function () {
            SFX.playTone(160, 0.6, 'sawtooth', SFX.TARGET_VOLUME, 0.1, 0.48);
            SFX.playNoise(0.2, 0.03, 0.15, SFX.TARGET_VOLUME * 0.3, 500);
        },
        sfx_spawn_human_t1_03: function () {
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 700);
        },
        sfx_flee_human_t1_03: function () {
            SFX.playTone(200, 0.22, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.02, 0.18);
        }
    };
    if (SFX) SFX.register(handlers);
})();

