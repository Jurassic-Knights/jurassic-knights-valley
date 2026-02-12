/** SFX_Herbivore_T1_01 - Iguanon */
import { SFX } from './SFX_Core';
(function () {
    const handlers = {
        sfx_aggro_herbivore_t1_01: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.4);
        },
        sfx_hurt_herbivore_t1_01: function () { SFX.playTone(220, 0.2, 'sine', SFX.TARGET_VOLUME, 0.02, 0.15); },
        sfx_death_herbivore_t1_01: function () { SFX.playTone(150, 0.6, 'sine', SFX.TARGET_VOLUME, 0.08, 0.48); },
        sfx_spawn_herbivore_t1_01: function () { SFX.playNoise(0.15, 0.02, 0.12, SFX.TARGET_VOLUME * 0.25, 1000); },
        sfx_flee_herbivore_t1_01: function () {
            const t = SFX.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(200 + i * 20, t + i * 0.12);
                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(SFX.TARGET_VOLUME * 0.5, t + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.12 + 0.1);
                osc.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start(t + i * 0.12);
                osc.stop(t + i * 0.12 + 0.12);
            }
        }
    };
    if (SFX) SFX.register(handlers);
})();
