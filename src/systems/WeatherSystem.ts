/**
 * WeatherSystem
 * Manages weather states based on the current season and RNG.
 *
 * Responsibilities:
 * - Listens for Season changes to update weather probabilities
 * - Periodically rolls for weather changes
 * - Emits WEATHER_CHANGE events
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { Registry } from '@core/Registry';
import type { IGame } from '../types/core.d';

class WeatherSystem {
    // Property declarations
    game: IGame | null = null;
    currentWeather: string = 'CLEAR';
    currentSeason: string = 'SPRING';
    nextChangeCheck: number = 0;
    config: typeof GameConstants.Weather;
    overrideEnabled: boolean = false;

    constructor() {
        this.config = GameConstants.Weather;
    }

    init(game: IGame) {
        this.game = game;

        // Subscribe to events
        EventBus.on(GameConstants.Events.SEASON_CHANGE, this.handleSeasonChange.bind(this));

        // Initial weather roll
        this.rollWeather();

        Logger.info('[WeatherSystem] Initialized');
    }

    /**
     * Set a weather override
     * @param {string|null} type - Weather type or 'auto' to disable
     */
    setWeatherOverride(type: string | null) {
        if (!type || type === 'auto') {
            this.overrideEnabled = false;
            Logger.info('[WeatherSystem] Override Disabled (Auto)');
            // Force a roll to pick new weather naturally
            this.rollWeather();
            return;
        }

        this.overrideEnabled = true;
        this.setWeather(type);
        Logger.info(`[WeatherSystem] Override Enabled: ${type}`);
    }

    update(dt: number) {
        // Skip auto changes when override is active
        if (this.overrideEnabled) return;

        // We use TimeSystem's time, but we can also track our own interval
        // Simple Real-time check is fine
        this.nextChangeCheck -= dt / (getConfig().Time as any).WEATHER_DECAY_RATE;

        if (this.nextChangeCheck <= 0) {
            this.tryChangeWeather();
            this.nextChangeCheck = this.config.CHANGE_INTERVAL;
        }
    }

    handleSeasonChange(data: any) {
        this.currentSeason = data.season;
        Logger.info(
            `[WeatherSystem] Season updated to ${this.currentSeason}, rerolling weather...`
        );
        // Force a weather change on season start (if not overridden)
        if (!this.overrideEnabled) {
            this.tryChangeWeather(true);
        }
    }

    /**
     * Attempt to change weather
     * @param {boolean} force - If true, guarantees a roll happens (though result might be same)
     */
    tryChangeWeather(force = false) {
        // RNG roll could simply be weighted based on season
        this.rollWeather();
    }

    rollWeather() {
        // Get probabilities for current season
        const probs = this.config.PROBABILITIES[this.currentSeason as keyof typeof this.config.PROBABILITIES];
        if (!probs) return;

        const roll = Math.random();
        let cumulative = 0;
        let selectedWeather = 'CLEAR'; // Default

        for (const [type, chance] of Object.entries(probs) as [string, number][]) {
            cumulative += chance;
            if (roll <= cumulative) {
                selectedWeather = type;
                break;
            }
        }

        if (selectedWeather !== this.currentWeather) {
            this.setWeather(selectedWeather);
        }
    }

    setWeather(type: string) {
        this.currentWeather = type;
        Logger.info(`[WeatherSystem] Weather Changed to: ${type}`);

        EventBus.emit(GameConstants.Events.WEATHER_CHANGE, {
            type: type,
            intensity: 1.0 // Future: Variable intensity
        });
    }
}

// Create singleton and export
const weatherSystem = new WeatherSystem();

// Register at module load time (before Game.init looks for it)
Registry.register('WeatherSystem', weatherSystem);

export { WeatherSystem, weatherSystem };
