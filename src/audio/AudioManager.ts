/**
 * Audio Manager
 * Handles all audio playback using Web Audio API
 *
 * Owner: SFX Engineer
 */

// Ambient declarations for global dependencies
declare const Logger: any;
declare const EventBus: any;
declare const GameConstants: any;
declare const ProceduralSFX: any;
declare const EnvironmentRenderer: any;
declare const WeatherSystem: any;
declare const AssetLoader: any;
declare const Registry: any;

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
            EventBus.on(GameConstants.Events.WEATHER_CHANGE, (data: any) => {
                if (ProceduralSFX) {
                    ProceduralSFX.setWeather(data.type);
                }
            });
        }

        Logger.info('[AudioManager] Waiting for user interaction...');
    },

    warmUp() {
        if (this.initialized) return;

        try {
            this.context = new (AudioContext || (window as any).webkitAudioContext)();

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
            if (ProceduralSFX) {
                ProceduralSFX.init(this.context, this.sfxGain);

                // Sync weather from EnvironmentRenderer (visual source of truth)
                if (EnvironmentRenderer && EnvironmentRenderer.weatherType) {
                    ProceduralSFX.setWeather(EnvironmentRenderer.weatherType);
                } else if (WeatherSystem) {
                    ProceduralSFX.setWeather(WeatherSystem.currentWeather);
                }
            }

            this.initialized = true;
            Logger.info('[AudioManager] Initialized with ProceduralSFX');
        } catch (e) {
            Logger.error('[AudioManager] Failed to initialize:', e);
        }
    },

    /**
     * Play a sound effect by ID
     * @param {string} id - Asset ID from registry
     */
    playSFX(id) {
        if (!this.initialized) {
            // Try to warm up on first SFX call
            this.warmUp();
            if (!this.initialized) return;
        }

        // Use procedural synthesis
        if (ProceduralSFX) {
            ProceduralSFX.play(id);
        }
    },

    /**
     * Play background music by ID
     * @param {string} id - Asset ID from registry
     */
    playBGM(id) {
        if (!this.initialized) return;

        const config = AssetLoader.getAudio(id);
        if (!config) return;

        Logger.info(`[AudioManager] Play BGM: ${id}`);
    },

    /**
     * Set volume for a category
     */
    setVolume(category, value) {
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
