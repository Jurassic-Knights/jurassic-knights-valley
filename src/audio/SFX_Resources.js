/**
 * SFX_Resources - Combat and Resource Sounds
 */

(function () {
    const handlers = {
        // Combat
        'sfx_hero_swing': function () {
            const { filter } = SFX.playNoise(0.2, 0.02, 0.18, 0.25, 1000);
            filter.frequency.setValueAtTime(200, SFX.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(600, SFX.ctx.currentTime + 0.15);
        },

        'sfx_hero_shoot': function () {
            SFX.playNoise(0.1, 0.001, 0.1, 0.4, 2000);
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120, SFX.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(40, SFX.ctx.currentTime + 0.15);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SFX.ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.15);
        },

        'sfx_hero_impact_metal': function () {
            SFX.playNoise(0.05, 0.001, 0.05, 0.25, 4000);
            SFX.playTone(300, 0.2, 'square', 0.15, 0.01, 0.15);
            SFX.playTone(800, 0.1, 'sine', 0.1);
        },

        'sfx_hero_impact_wood': function () {
            SFX.playNoise(0.08, 0.001, 0.08, 0.35, 800);
            SFX.playTone(80, 0.1, 'square', 0.2, 0.01, 0.05);
        },

        'sfx_hero_impact_stone': function () {
            SFX.playNoise(0.06, 0.001, 0.06, 0.4, 1500);
            SFX.playTone(40, 0.1, 'triangle', 0.2, 0.01, 0.08);
        },

        // Mining
        'sfx_mine_scrap_metal': function () {
            SFX.playTone(220, 0.05, 'sawtooth', 0.15, 0.005, 0.04);
            setTimeout(() => SFX.playTone(180, 0.04, 'sawtooth', 0.1, 0.005, 0.03), 30);
            SFX.playNoise(0.08, 0.001, 0.07, 0.1, 2000);
        },

        'sfx_mine_iron_ore': function () {
            SFX.playTone(100, 0.15, 'triangle', 0.25, 0.01, 0.12);
            SFX.playNoise(0.1, 0.01, 0.09, 0.15, 800);
            setTimeout(() => SFX.playTone(60, 0.1, 'triangle', 0.1), 50);
        },

        'sfx_mine_fossil_fuel': function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, SFX.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(30, SFX.ctx.currentTime + 0.15);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SFX.ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.2);

            SFX.playNoise(0.15, 0.05, 0.1, 0.05, 200);
        },

        'sfx_mine_wood': function () {
            SFX.playTone(150, 0.06, 'triangle', 0.2, 0.005, 0.05);
            setTimeout(() => SFX.playNoise(0.08, 0.01, 0.07, 0.08, 800), 20);
        },

        'sfx_mine_gold': function () {
            SFX.playTone(400, 0.1, 'triangle', 0.12, 0.01, 0.08);
            setTimeout(() => SFX.playTone(500, 0.08, 'sine', 0.08, 0.02, 0.06), 40);
        },

        // Collect/Break
        'sfx_resource_collect': function () {
            const pitchVariation = 0.9 + Math.random() * 0.2;
            SFX.playTone(120 * pitchVariation, 0.08, 'triangle', 0.15, 0.01, 0.06);
            setTimeout(() => SFX.playTone(220 * pitchVariation, 0.1, 'triangle', 0.08, 0.02, 0.08), 40);
        },

        'sfx_resource_break_wood': function () {
            SFX.playNoise(0.15, 0.001, 0.15, 0.3, 1000);
            SFX.playTone(60, 0.15, 'square', 0.25);
        },

        'sfx_resource_break_metal': function () {
            SFX.playNoise(0.2, 0.01, 0.2, 0.3, 3000);
            SFX.playTone(200, 0.1, 'sawtooth', 0.15);
        },

        'sfx_resource_break_stone': function () {
            const { filter } = SFX.playNoise(0.3, 0.01, 0.3, 0.3, 800);
            filter.frequency.linearRampToValueAtTime(200, SFX.ctx.currentTime + 0.3);
            SFX.playTone(40, 0.25, 'triangle', 0.3);
        },

        // Respawn
        'sfx_respawn_wood': function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(80, SFX.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(180, SFX.ctx.currentTime + 0.4);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SFX.ctx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.5);

            SFX.playNoise(0.3, 0.1, 0.2, 0.05, 1500);
        },

        'sfx_respawn_stone': function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(40, SFX.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, SFX.ctx.currentTime + 0.3);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SFX.ctx.currentTime + 0.4);

            osc.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.4);

            SFX.playNoise(0.2, 0.05, 0.15, 0.1, 600);
        },

        'sfx_respawn_metal': function () {
            const osc = SFX.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, SFX.ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(300, SFX.ctx.currentTime + 0.25);

            const gain = SFX.ctx.createGain();
            gain.gain.setValueAtTime(SFX.TARGET_VOLUME, SFX.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, SFX.ctx.currentTime + 0.35);

            const filter = SFX.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 600;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(SFX.masterGain);
            osc.start();
            osc.stop(SFX.ctx.currentTime + 0.35);
        },

        'sfx_rest_melody': function () {
            // Gentle rest sound
            SFX.playTone(262, 0.3, 'triangle', 0.2, 0.05, 0.25);
            setTimeout(() => SFX.playTone(330, 0.3, 'triangle', 0.15, 0.05, 0.25), 150);
            setTimeout(() => SFX.playTone(392, 0.4, 'triangle', 0.15, 0.05, 0.35), 300);
        }
    };

    if (window.SFX) {
        SFX.register(handlers);
        console.log('[SFX_Resources] Registered 17 sounds');
    }
})();
