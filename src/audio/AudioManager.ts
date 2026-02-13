/**
 * Audio Manager
 * Handles all audio playback using Web Audio API
 *
 * Owner: SFX Engineer
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { SFX } from './SFX_Core';
import { weatherSystem } from '@systems/WeatherSystem';
import { AssetLoader } from '@core/AssetLoader';
import { Registry } from '@core/Registry';
import { environmentRenderer } from '../rendering/EnvironmentRenderer';

const AudioManager = {
    context: null as AudioContext | null,
    masterGain: null as GainNode | null,
    sfxGain: null as GainNode | null,
    musicGain: null as GainNode | null,
    initialized: false,

    init() {
        // Defer AudioContext creation until user interaction
        document.addEventListener('click', () => this.warmUp(), { once: true });

        // Listen for Weather
        if (EventBus && GameConstants) {
            EventBus.on(GameConstants.Events.WEATHER_CHANGE, (data: { type: string }) => {
                if (SFX) {
                    SFX.setWeather(data.type);
                }
            });
            EventBus.on(GameConstants.Events.HERO_LEVEL_UP, () => {
                this.playSFX('sfx_level_up');
            });
        }

        Logger.info('[AudioManager] Waiting for user interaction...');
    },

    warmUp() {
        if (this.initialized) return;

        try {
            const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.context = new AudioCtor();

            // Create gain nodes
            this.masterGain = this.context.createGain();
            this.sfxGain = this.context.createGain();
            this.musicGain = this.context.createGain();

            // Set default volumes
            this.sfxGain.gain.value = 0.7;
            this.musicGain.gain.value = 0.5;

            // Connect: Source -> Category Gain -> Master -> Destination
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.context.destination);

            // Initialize procedural SFX
            if (SFX) {
                SFX.init(this.context, this.sfxGain);

                // Sync weather from EnvironmentRenderer (visual source of truth)
                if (environmentRenderer?.weatherType) {
                    SFX.setWeather(environmentRenderer.weatherType);
                } else if (weatherSystem?.currentWeather) {
                    SFX.setWeather(weatherSystem.currentWeather);
                }
            }

            this.initialized = true;
            Logger.info('[AudioManager] Initialized with SFX');
        } catch (e) {
            Logger.error('[AudioManager] Failed to initialize:', e);
        }
    },

    /**
     * Play a sound effect by ID
     * @param {string} id - Asset ID from registry
     */
    playSFX(id: string) {
        if (!this.initialized) {
            // Try to warm up on first SFX call
            this.warmUp();
            if (!this.initialized) return;
        }

        // Use procedural synthesis
        if (SFX) {
            SFX.play(id);
        }
    },

    /**
     * Play background music by ID
     * @param {string} id - Asset ID from registry
     */
    playBGM(id: string) {
        if (!this.initialized) return;

        const config = AssetLoader.getAudio(id);
        if (!config) return;

        Logger.info(`[AudioManager] Play BGM: ${id}`);
    },

    /**
     * Set volume for a category
     */
    setVolume(category: string, value: number) {
        const gain =
            category === 'master'
                ? this.masterGain
                : category === 'sfx'
                    ? this.sfxGain
                    : category === 'music'
                        ? this.musicGain
                        : null;

        if (gain) {
            gain.gain.value = Math.max(0, Math.min(1, value));
        }
    }
};

if (Registry) Registry.register('AudioManager', AudioManager);

export { AudioManager };
