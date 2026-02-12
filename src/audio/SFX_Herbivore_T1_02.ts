/** SFX_Herbivore_T1_02 - Parasaurolophus */
import { SFX } from './SFX_Core';
(function () {
    const handlers = {
        sfx_aggro_herbivore_t1_02: function () {
            const t = SFX.ctx.currentTime;
            const osc1 = SFX.ctx.createOscillator();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(120, t);
            osc1.frequency.linearRampToValueAtTime(150, t + 0.3);
            osc1.frequency.linearRampToValueAtTime(100, t + 0.6);
            const gain1 = SFX.ctx.createGain();
            gain1.gain.setValueAtTime(0, t);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.1);
            gain1.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.4);
            gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
            osc1.connect(gain1);
            gain1.connect(SFX.masterGain);
            osc1.start(t);
            osc1.stop(t + 0.7);
            const osc2 = SFX.ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(180, t);
            osc2.frequency.linearRampToValueAtTime(220, t + 0.25);
            const gain2 = SFX.ctx.createGain();
            gain2.gain.setValueAtTime(0, t);
            gain2.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.35, t + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
            osc2.connect(gain2);
            gain2.connect(SFX.masterGain);
            osc2.start(t);
            osc2.stop(t + 0.55);
        },
        sfx_hurt_herbivore_t1_02: function () { SFX.playTone(160, 0.25, 'triangle', SFX.TARGET_VOLUME, 0.03, 0.2); },
        sfx_death_herbivore_t1_02: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);
            const lfo = SFX.ctx.createOscillator();
            lfo.frequency.setValueAtTime(6, t);
            lfo.frequency.linearRampToValueAtTime(1, t + 0.7);
            const lfoGain = SFX.ctx.createGain();
            lfoGain.gain.value = 15;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);
            osc.connect(gain);
            gain.connect(SFX.masterGain);
            lfo.start(t);
            osc.start(t);
            lfo.stop(t + 0.9);
            osc.stop(t + 0.9);
        },
        sfx_spawn_herbivore_t1_02: function () { SFX.playTone(140, 0.35, 'triangle', SFX.TARGET_VOLUME * 0.4, 0.08, 0.25); },
        sfx_flee_herbivore_t1_02: function () { SFX.playTone(150, 0.3, 'triangle', SFX.TARGET_VOLUME * 0.55, 0.04, 0.24); }
    };
    if (SFX) SFX.register(handlers);
})();
