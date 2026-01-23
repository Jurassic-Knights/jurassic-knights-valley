/**
 * SFX_Human_Sniper - T3_03 Long range specialist
 * Quiet, focused hunter
 */
(function () {
    const handlers = {
        sfx_aggro_human_t3_03: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.35);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 320;
            filter.Q.value = 4;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.55, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.45);
        },
        sfx_hurt_human_t3_03: function () {
            SFX.playTone(220, 0.18, 'triangle', SFX.TARGET_VOLUME, 0.02, 0.14);
        },
        sfx_death_human_t3_03: function () {
            SFX.playTone(140, 0.65, 'triangle', SFX.TARGET_VOLUME, 0.1, 0.52);
        },
        sfx_spawn_human_t3_03: function () {
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 1100);
        },
        sfx_flee_human_t3_03: function () {
            SFX.playTone(180, 0.22, 'triangle', SFX.TARGET_VOLUME * 0.5, 0.02, 0.18);
        }
    };
    if (SFX) SFX.register(handlers);
})();

