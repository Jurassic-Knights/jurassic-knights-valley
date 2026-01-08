/**
 * ProceduralSFX - Web Audio API Sound Synthesis
 * 
 * Generates all game sounds procedurally without audio files.
 * Each sound uses oscillators, noise, and envelopes.
 * 
 * Owner: SFX Engineer
 */

const ProceduralSFX = {
    ctx: null,
    masterGain: null,

    /**
     * Initialize with AudioContext from AudioManager
     */
    init(audioContext, masterGain) {
        this.ctx = audioContext;
        this.masterGain = masterGain;
        console.log('[ProceduralSFX] Initialized');
    },

    /**
     * Play a sound by ID
     * @param {string} id - Sound effect ID
     */
    play(id) {
        if (!this.ctx) return;

        const handlers = {
            // UI Sounds
            'sfx_ui_click': () => this.uiClick(),
            'sfx_ui_unlock': () => this.uiUnlock(),
            'sfx_ui_buy': () => this.uiBuy(),
            'sfx_ui_error': () => this.uiError(),
            'sfx_ui_magnet': () => this.uiMagnet(),

            // Combat Sounds
            'sfx_hero_swing': () => this.heroSwing(),
            'sfx_hero_shoot': () => this.heroShoot(),
            'sfx_hero_impact_metal': () => this.impactMetal(),
            'sfx_hero_impact_wood': () => this.impactWood(),
            'sfx_hero_impact_stone': () => this.impactStone(),
            'sfx_mine_scrap_metal': () => this.mineScrapMetal(),
            'sfx_mine_iron_ore': () => this.mineIronOre(),
            'sfx_mine_fossil_fuel': () => this.mineFossilFuel(),
            'sfx_mine_wood': () => this.mineWood(),
            'sfx_mine_gold': () => this.mineGold(),

            // Gameplay Sounds
            'sfx_resource_collect': () => this.collect(),
            'sfx_resource_break_wood': () => this.breakWood(),
            'sfx_resource_break_metal': () => this.breakMetal(),
            'sfx_resource_break_stone': () => this.breakStone(),
            'sfx_rest_melody': () => this.restMelody(),
            'sfx_respawn_wood': () => this.respawnWood(),
            'sfx_respawn_stone': () => this.respawnStone(),
            'sfx_respawn_metal': () => this.respawnMetal(),

            // Dinosaur Sounds
            'sfx_dino_hurt': () => this.dinoHurt(),
            'sfx_dino_death': () => this.dinoDeath(),
            'sfx_dino_respawn': () => this.dinoRespawn(),
            'sfx_pterodactyl_swoop': () => this.pterodactylSwoop(),
        };

        const handler = handlers[id];
        if (handler) {
            handler();
        } else {
            console.warn(`[ProceduralSFX] Unknown sound: ${id}`);
        }
    },

    // ==================== HELPERS ====================

    /**
     * Create white noise buffer
     */
    createNoise(duration = 0.5) {
        const sampleRate = this.ctx.sampleRate;
        const samples = sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < samples; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    },

    /**
     * Play noise with envelope
     */
    playNoise(duration, attack, decay, volume = 0.3, filterFreq = 2000) {
        if (!this.ctx) return { noise: null, gain: null, filter: null };

        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoise(duration);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + attack);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
        return { noise, gain, filter };
    },

    /**
     * Play tone with envelope
     */
    playTone(freq, duration, type = 'sine', volume = 0.3, attack = 0.01, decay = null) {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + attack);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + (decay || duration));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
        return { osc, gain };
    },

    // ==================== UI SOUNDS ====================

    uiClick() {
        // Mechanical switch: 600Hz → 200Hz, quick snap
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle'; // Triangle for more body than sine
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.04);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    },

    uiUnlock() {
        // Heavy hydraulic release: Lower freq sweep
        // Layer 1: Low rumble
        this.playNoise(0.4, 0.05, 0.3, 0.2, 400);

        // Layer 2: Mech servo sweep
        setTimeout(() => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.3);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        }, 100);
    },

    uiBuy() {
        // Heavy coin drop: Metal thud + ring
        this.playNoise(0.05, 0.001, 0.05, 0.3, 1000); // Thud
        setTimeout(() => this.playTone(880, 0.15, 'triangle', 0.15), 10); // Ring (A5)
        setTimeout(() => this.playTone(1100, 0.1, 'sine', 0.1), 40); // Ring overtone
    },

    uiError() {
        // Dull Clunk: Low square wave, short
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 55; // Lower A1

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    uiMagnet() {
        // Magnetic hum: Low frequency sweep
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.3);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(1000, this.ctx.currentTime + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    // ==================== COMBAT SOUNDS ====================

    heroSwing() {
        // Heavy Woosh: Lower frequency noise
        const { filter } = this.playNoise(0.2, 0.02, 0.18, 0.25, 1000);
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    },

    heroShoot() {
        // Heavy Caliber: Deep thump + noise burst
        this.playNoise(0.1, 0.001, 0.1, 0.4, 2000); // Muzzle blast

        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15); // Deep drop

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    },

    impactMetal() {
        // Metallic Clang: Heavy impact + resonance
        this.playNoise(0.05, 0.001, 0.05, 0.25, 4000); // Thud
        this.playTone(300, 0.2, 'square', 0.15, 0.01, 0.15); // Low clang
        this.playTone(800, 0.1, 'sine', 0.1); // Resonance
    },

    impactWood() {
        // Wood Thud: Low frequency thunk
        this.playNoise(0.08, 0.001, 0.08, 0.35, 800);
        this.playTone(80, 0.1, 'square', 0.2, 0.01, 0.05); // Chop sound
    },

    impactStone() {
        // Stone Crack: Noise focus
        this.playNoise(0.06, 0.001, 0.06, 0.4, 1500); // Sharp crack
        this.playTone(40, 0.1, 'triangle', 0.2, 0.01, 0.08); // Sub impact
    },

    // Per-resource mining sounds
    mineScrapMetal() {
        // Scrappy clanking: Multiple quick metal hits
        this.playTone(220, 0.05, 'sawtooth', 0.15, 0.005, 0.04);
        setTimeout(() => this.playTone(180, 0.04, 'sawtooth', 0.1, 0.005, 0.03), 30);
        this.playNoise(0.08, 0.001, 0.07, 0.1, 2000);
    },

    mineIronOre() {
        // Heavy pickaxe on ore: Deep clang with rock debris
        this.playTone(100, 0.15, 'triangle', 0.25, 0.01, 0.12);
        this.playNoise(0.1, 0.01, 0.09, 0.15, 800);
        setTimeout(() => this.playTone(60, 0.1, 'triangle', 0.1), 50);
    },

    mineFossilFuel() {
        // Squelchy tar extraction: Low gloopy sound
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.15);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);

        // Bubbling noise
        this.playNoise(0.15, 0.05, 0.1, 0.05, 200);
    },

    mineWood() {
        // Axe chopping wood: Sharp thunk + crack
        this.playTone(150, 0.06, 'triangle', 0.2, 0.005, 0.05);
        setTimeout(() => {
            this.playNoise(0.08, 0.01, 0.07, 0.08, 800);
        }, 20);
    },

    mineGold() {
        // Coin-like ring: Bright but warm
        this.playTone(400, 0.1, 'triangle', 0.12, 0.01, 0.08);
        setTimeout(() => this.playTone(500, 0.08, 'sine', 0.08, 0.02, 0.06), 40);
    },

    // ==================== GAMEPLAY SOUNDS ====================

    collect() {
        // Material Pickup: Low thump + subtle ring (style guide compliant)
        // Uses triangle wave for warmth
        this.playTone(120, 0.08, 'triangle', 0.15, 0.01, 0.06);  // Low thump
        setTimeout(() => {
            this.playTone(220, 0.1, 'triangle', 0.08, 0.02, 0.08); // Subtle mid ring
        }, 40);
    },

    breakWood() {
        // Heavy Snap: Low thump + noise
        this.playNoise(0.15, 0.001, 0.15, 0.3, 1000);
        this.playTone(60, 0.15, 'square', 0.25); // Deep crack
    },

    breakMetal() {
        // Scrap Crumple: Noisy, jagged
        this.playNoise(0.2, 0.01, 0.2, 0.3, 3000);
        this.playTone(200, 0.1, 'sawtooth', 0.15); // Grinding metal
    },

    breakStone() {
        // Rock Fall: Deep rumble
        const { filter } = this.playNoise(0.3, 0.01, 0.3, 0.3, 800);
        filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.3); // Lowpass sweep down
        this.playTone(40, 0.25, 'triangle', 0.3); // Sub bass
    },

    // Material-specific respawn sounds
    respawnWood() {
        // Creaking growth: Rising pitch with wooden texture
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.4);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);

        // Subtle crackle
        this.playNoise(0.3, 0.1, 0.2, 0.03, 600);
    },

    respawnStone() {
        // Rumbling emergence: Low frequency build
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(35, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.3);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);

        // Gravel settling
        this.playNoise(0.25, 0.1, 0.15, 0.05, 300);
    },

    respawnMetal() {
        // Metallic materialization: Bright clang with resonance
        this.playTone(180, 0.1, 'sawtooth', 0.12, 0.01, 0.08);
        setTimeout(() => {
            this.playTone(280, 0.15, 'triangle', 0.08, 0.02, 0.12);
        }, 80);
        // Subtle hiss
        this.playNoise(0.2, 0.05, 0.15, 0.02, 1200);
    },

    restMelody() {
        // Medieval Campfire: Low, warm, minor key
        // Uses triangle waves for warmth, D minor pentatonic
        // D3 → A2 → F3 → D3 (somber, grounded)
        const notes = [147, 110, 175, 147]; // D3, A2, F3, D3
        const noteDelay = 350; // Slower, more deliberate
        const noteDuration = 0.5;
        const volume = 0.15;

        // Low drone (D2) underneath
        this.playTone(73, 2.5, 'triangle', 0.08, 0.3, 2.0);

        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, noteDuration, 'triangle', volume, 0.05, noteDuration * 0.7);
            }, i * noteDelay + 200); // Offset from drone start
        });

        // Soft noise fade (crackling fire effect)
        setTimeout(() => {
            this.playNoise(1.5, 0.2, 1.2, 0.03, 400);
        }, noteDelay * 2);
    },

    // ==================== DINOSAUR SOUNDS ====================

    dinoHurt() {
        // Gutteral Snarl: Saw + Noise
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime); // Deep
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.2);

        // AM Mod for growl texture
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 35; // Fast rattle
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 300; // Heavy mod
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.masterGain);

        lfo.start();
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
        lfo.stop(this.ctx.currentTime + 0.25);
    },

    dinoDeath() {
        // Realistic Dino Death: Low rumbling roar with descending pitch
        // Uses sawtooth for organic texture, layered with noise for breath
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime); // Start low
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.8); // Descend

        // FM modulation for growl texture
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 8; // Slow vibrato
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 15;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        lfo.start();
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
        lfo.stop(this.ctx.currentTime + 0.8);

        // Dying breath (noise layer)
        this.playNoise(0.6, 0.1, 0.5, 0.1, 300);
    },

    dinoRespawn() {
        // Distant Roar: Reverb-y noise
        const { filter } = this.playNoise(0.4, 0.1, 0.3, 0.2, 400);
        filter.frequency.setValueAtTime(200, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.4);
    },

    pterodactylSwoop() {
        // Distant wing whoosh: Subtle but audible
        // Bandpass noise for wind-like effect
        const { filter } = this.playNoise(0.8, 0.2, 0.6, 0.15, 300);
        filter.frequency.setValueAtTime(150, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.4);
        filter.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.8);
    },

    // ==================== AMBIENT WEATHER ====================

    setWeather(type) {
        // CRITICAL: Check ctx availability
        if (!this.ctx) {
            console.warn('[ProceduralSFX] setWeather called but ctx is NULL. Skipping.');
            return;
        }

        // Resume if suspended
        if (this.ctx.state === 'suspended') {
            console.log('[ProceduralSFX] Resuming suspended AudioContext');
            this.ctx.resume();
        }

        // Stop current
        this.stopAmbience();

        console.log(`[ProceduralSFX] Set Weather Ambience: ${type} (ctx.state: ${this.ctx.state})`);

        try {
            switch (type) {
                case 'RAIN':
                    this.createRainLoop();
                    break;
                case 'STORM':
                    this.createStormLoop();
                    break;
                case 'SNOW':
                    this.createSnowLoop();
                    break;
                case 'CLEAR':
                default:
                    // No sound
                    break;
            }
        } catch (e) {
            console.error('[ProceduralSFX] Error in setWeather:', e);
        }
    },

    stopAmbience() {
        if (this.ambientNodes) {
            try {
                if (this.ambientNodes.source) this.ambientNodes.source.stop();
                if (this.ambientNodes.gain) this.ambientNodes.gain.disconnect();
                if (this.ambientNodes.lfo) this.ambientNodes.lfo.stop();
            } catch (e) { }
            this.ambientNodes = null;
        }
    },

    createRainLoop() {
        console.log('[ProceduralSFX] Creating Rain Loop...');

        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.015; // Very subtle ambient

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        source.start();
        console.log('[ProceduralSFX] Rain Loop STARTED');

        this.ambientNodes = { source, gain };
    },

    createStormLoop() {
        // 1. Base Rain (Heavier)
        this.createRainLoop();
        this.ambientNodes.gain.gain.value = 0.015; // Match rain level

        // Note: Thunder is no longer scheduled here. 
        // It is triggered by EnvironmentRenderer.js when visual lightning strikes.
    },

    createSnowLoop() {
        // Wind: Bandpass filtered noise
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 1.0;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.015; // Very subtle wind

        // LFO for wind howling
        const lfo = this.ctx.createOscillator();
        lfo.frequency.value = 0.2; // Slow gusts
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 200; // Modulate filter freq
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        lfo.start();
        source.start();

        this.ambientNodes = { source, gain, lfo };
    },

    playThunder() {
        if (!this.ctx) return; // Guard: Audio not ready

        // Deep Rumble
        const duration = 2.0;
        const { filter, gain } = this.playNoise(duration, 0.1, 1.5, 0.4, 600);

        // Wobble filter for rolling thunder
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + duration);
    }
};

window.ProceduralSFX = ProceduralSFX;
