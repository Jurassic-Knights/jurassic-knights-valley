/**
 * SFX_Saurian_TRexGeneral - T4_01 Boss saurian
 * Earth-shaking bass, terrifying commanding roar
 */
(function () {
    const handlers = {
        sfx_aggro_saurian_t4_01: function () {
            const t = SFX.ctx.currentTime;
            const bassOsc = SFX.ctx.createOscillator();
            bassOsc.type = 'sine';
            bassOsc.frequency.setValueAtTime(35, t);
            bassOsc.frequency.linearRampToValueAtTime(28, t + 1.1);

            const bassGain = SFX.ctx.createGain();
            bassGain.gain.setValueAtTime(0, t);
            bassGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.8, t + 0.12);
            bassGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

            bassOsc.connect(bassGain);
            bassGain.connect(SFX.masterGain);
            bassOsc.start(t);
            bassOsc.stop(t + 1.25);

            const roar = SFX.ctx.createOscillator();
            roar.type = 'sawtooth';
            roar.frequency.setValueAtTime(70, t);
            roar.frequency.exponentialRampToValueAtTime(45, t + 1.1);

            const roarGain = SFX.ctx.createGain();
            roarGain.gain.setValueAtTime(0, t);
            roarGain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.75, t + 0.1);
            roarGain.gain.exponentialRampToValueAtTime(0.01, t + 1.15);

            roar.connect(roarGain);
            roarGain.connect(SFX.masterGain);
            roar.start(t);
            roar.stop(t + 1.2);

            SFX.playNoise(0.9, 0.12, 0.7, SFX.TARGET_VOLUME * 0.4, 250);
            SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 500);
        },
        sfx_hurt_saurian_t4_01: function () {
            SFX.playTone(100, 0.45, 'sawtooth', SFX.TARGET_VOLUME, 0.03, 0.4);
            SFX.playNoise(0.3, 0.03, 0.25, SFX.TARGET_VOLUME * 0.4, 220);
        },
        sfx_death_saurian_t4_01: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.5, 0.03, 0.45, SFX.TARGET_VOLUME * 0.5, 120);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 1.4);

            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(8, t);
            lfo.frequency.linearRampToValueAtTime(0.5, t + 1.3);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 15;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.5);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 1.55);
            osc.stop(t + 1.55);
        },
        sfx_spawn_saurian_t4_01: function () {
            SFX.playNoise(0.6, 0.1, 0.5, SFX.TARGET_VOLUME * 0.45, 130);
            SFX.playTone(30, 0.7, 'sine', SFX.TARGET_VOLUME * 0.55, 0.22, 0.45);
        },
        sfx_flee_saurian_t4_01: function () {
            SFX.playNoise(0.35, 0.04, 0.3, SFX.TARGET_VOLUME * 0.45, 150);
            SFX.playTone(50, 0.4, 'sine', SFX.TARGET_VOLUME * 0.5, 0.06, 0.32);
        }
    };
    if (window.SFX) SFX.register(handlers);
})();

