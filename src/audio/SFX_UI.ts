/**
 * SFX_UI - User Interface Sounds
 */

import { SFX } from './SFX_Core';
import { Logger } from '@core/Logger';

(function () {
    const handlers = {
        sfx_ui_click: function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, SFX.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, SFX.ctx.currentTime + 0.04);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SFX.ctx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.04);
        },

        sfx_ui_hover: function () {
            // Subtle high-pitch tick
            SFX.playTone(800, 0.03, 'sine', 0.1, 0.005, 0.02);
        },

        sfx_ui_unlock: function () {
            SFX.playNoise(0.4, 0.05, 0.3, 0.2, 400);
            setTimeout(() => {
                const osc = SFX.ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, SFX.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, SFX.ctx.currentTime + 0.3);

                const gain = SFX.ctx.createGain();
                gain.gain.setValueAtTime(0, SFX.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, SFX.ctx.currentTime + 0.3);

                const filter = SFX.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 800;

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(SFX.masterGain);
                osc.start();
                osc.stop(SFX.ctx.currentTime + 0.3);
            }, 100);
        },

        sfx_ui_buy: function () {
            SFX.playNoise(0.05, 0.001, 0.05, 0.3, 1000);
            setTimeout(() => SFX.playTone(880, 0.15, 'triangle', 0.15), 10);
            setTimeout(() => SFX.playTone(1100, 0.1, 'sine', 0.1), 40);
        },

        sfx_ui_purchase: function () {
            this.sfx_ui_buy();
        },

        sfx_ui_error: function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 55;

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, SFX.ctx.currentTime + 0.1);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.1);
        },

        sfx_ui_magnet: function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(60, SFX.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(200, SFX.ctx.currentTime + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, SFX.ctx.currentTime + 0.3);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(200, SFX.ctx.currentTime);
            filter.frequency.linearRampToValueAtTime(1000, SFX.ctx.currentTime + 0.3);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.3);
        },

        sfx_ui_resolve_shatter: function () {
            // 1. Glass Crack (High pass noise)
            SFX.playNoise(0.1, 0.01, 0.1, 0.2, 3000); // Short, sharp

            // 2. Energy Dissipation (Descending Sine)
            SFX.playTone(800, 0.2, 'sine', 0.1, 0.01, 0.2); // Starts high, fades out

            // 3. Subtle Thump (Low impact)
            SFX.playTone(150, 0.1, 'triangle', 0.2, 0.01, 0.1);
        }
    };

    if (SFX) {
        SFX.register(handlers);
        Logger.info('[SFX_UI] Registered 6 sounds');
    }
})();
