/**
 * SFX_Human_Flametrooper - T3_02 Fire attacker, heavy armor
 * Deep muffled shout + pilot light hiss
 */
(function () {
    const handlers = {
        sfx_aggro_human_t3_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, t);
            osc.frequency.exponentialRampToValueAtTime(75, t + 0.45);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 300;
            filter.Q.value = 6;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.65, t + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.55);

            SFX.playNoise(0.4, 0.05, 0.3, SFX.TARGET_VOLUME * 0.35, 1000);
        },
        sfx_hurt_human_t3_02: function () {
            SFX.playNoise(0.12, 0.01, 0.1, SFX.TARGET_VOLUME * 0.35, 1200);
            SFX.playTone(150, 0.22, 'sawtooth', SFX.TARGET_VOLUME, 0.02, 0.18);
        },
        sfx_death_human_t3_02: function () {
            SFX.playNoise(0.5, 0.08, 0.4, SFX.TARGET_VOLUME * 0.45, 800);
            SFX.playTone(90, 0.8, 'sawtooth', SFX.TARGET_VOLUME, 0.12, 0.65);
        },
        sfx_spawn_human_t3_02: function () {
            SFX.playNoise(0.3, 0.05, 0.25, SFX.TARGET_VOLUME * 0.35, 900);
        },
        sfx_flee_human_t3_02: function () {
            SFX.playNoise(0.2, 0.02, 0.16, SFX.TARGET_VOLUME * 0.35, 1100);
        }
    };
    if (SFX) SFX.register(handlers);
})();

