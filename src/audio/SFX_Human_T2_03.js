/**
 * SFX_Human_Halberdier - T2_03 Heavy melee, full plate
 * Armored warrior shout
 */
(function () {
    const handlers = {
        sfx_aggro_human_t2_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.45);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 360;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.7, t + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.55);

            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.35, 350);
        },
        sfx_hurt_human_t2_03: function () {
            SFX.playTone(200, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.17);
        },
        sfx_death_human_t2_03: function () {
            SFX.playTone(120, 0.75, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.6);
            SFX.playNoise(0.35, 0.06, 0.28, SFX.TARGET_VOLUME * 0.35, 320);
        },
        sfx_spawn_human_t2_03: function () {
            SFX.playNoise(0.2, 0.03, 0.16, SFX.TARGET_VOLUME * 0.3, 400);
        },
        sfx_flee_human_t2_03: function () {
            SFX.playTone(160, 0.28, 'sawtooth', SFX.TARGET_VOLUME * 0.5, 0.03, 0.22);
        }
    };
    if (window.SFX) SFX.register(handlers);
})();

