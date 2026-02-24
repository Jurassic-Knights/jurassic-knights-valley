/**
 * SFX_Enemies - Generic Enemy Sounds (Fallback)
 * Used for unmapped enemy IDs and generic enemy sound triggers
 */

import { SFX } from './SFX_Core';
import { Logger } from '@core/Logger';

(function () {
    const handlers = {
        // Generic dino sounds
        sfx_dino_hurt: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.35);
        },

        sfx_dino_death: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.6, 0.1, 0.5, 0.25, 400);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.9);
        },

        sfx_dino_respawn: function () {
            SFX.playNoise(0.3, 0.05, 0.25, 0.2, 1000);
            SFX.playTone(150, 0.4, 'triangle', 0.3, 0.05);
        },

        sfx_enemy_aggro: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);
            osc.frequency.exponentialRampToValueAtTime(120, t + 0.4);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.45);

            SFX.playNoise(0.25, 0.05, 0.2, 0.15, 600);
        },

        sfx_boss_aggro: function () {
            const t = SFX.ctx.currentTime;

            // Deep menacing roar
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, t);
            osc.frequency.linearRampToValueAtTime(120, t + 0.4);
            osc.frequency.linearRampToValueAtTime(60, t + 1.2);

            const sub = SFX.ctx.createOscillator();
            sub.type = 'square';
            sub.frequency.setValueAtTime(40, t);
            sub.frequency.linearRampToValueAtTime(30, t + 1.2);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME, t + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);

            osc.connect(gain);
            sub.connect(gain);
            gain.connect(SFX.masterGain);

            osc.start(t);
            sub.start(t);
            osc.stop(t + 1.3);
            sub.stop(t + 1.3);

            SFX.playNoise(1.2, 0.1, 1.0, 0.4, 100);
        },

        sfx_enemy_attack: function () {
            SFX.playNoise(0.15, 0.01, 0.12, 0.25, 800);
            SFX.playTone(200, 0.15, 'sawtooth', 0.3, 0.01);
        },

        sfx_enemy_hurt: function () {
            const t = SFX.ctx.currentTime;
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.35);
        },

        sfx_enemy_death: function () {
            const t = SFX.ctx.currentTime;
            SFX.playNoise(0.6, 0.1, 0.5, 0.25, 400);

            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.8);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t);
            osc.stop(t + 0.9);
        },

        sfx_loot_drop: function () {
            SFX.playTone(200, 0.15, 'triangle', 0.2, 0.02, 0.12);
            setTimeout(() => SFX.playTone(300, 0.1, 'triangle', 0.15, 0.02), 80);
        },

        sfx_pack_aggro: function () {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const t = SFX.ctx.currentTime;
                    const osc = SFX.ctx.createOscillator();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(130 + i * 20, t);
                    osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);

                    const gain = SFX.ctx.createGain();
                    gain.gain.setValueAtTime(0, t);
                    gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.5, t + 0.03);
                    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

                    osc.connect(gain);
                    gain.connect(SFX.masterGain);
                    osc.start(t);
                    osc.stop(t + 0.28);
                }, i * 80);
            }
        },

        sfx_pterodactyl_swoop: function () {
            const t = SFX.ctx.currentTime;
            const { filter } = SFX.playNoise(0.5, 0.05, 0.4, 0.3, 2000);
            if (filter) {
                filter.frequency.setValueAtTime(500, t);
                filter.frequency.exponentialRampToValueAtTime(2000, t + 0.25);
                filter.frequency.exponentialRampToValueAtTime(500, t + 0.5);
            }

            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, t + 0.1);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.35);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(0, t + 0.1);
            gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME * 0.6, t + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start(t + 0.1);
            osc.stop(t + 0.4);
        }
    };

    if (SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_Enemies] Registered 11 sounds');
    }
})();
