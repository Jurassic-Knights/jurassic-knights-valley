/**
 * DebugUIOverrides - Time, Season, Weather override dropdown handlers
 */

import { Logger } from '@core/Logger';
import { timeSystem } from '@systems/TimeSystem';
import { weatherSystem } from '@systems/WeatherSystem';

export function setupOverrideDropdowns(): void {
    const timeSelect = document.getElementById('cheat-time');
    if (timeSelect) {
        timeSelect.addEventListener('change', (e) => {
            Logger.info('[DebugUI] Time dropdown changed to:', (e.target as HTMLSelectElement).value);
            if (timeSystem) {
                timeSystem.setTimeOverride((e.target as HTMLSelectElement).value);
            } else {
                Logger.warn('[DebugUI] timeSystem not found on window!');
            }
            (e.target as HTMLElement).blur();
        });
    } else {
        Logger.warn('[DebugUI] cheat-time select not found!');
    }

    const seasonSelect = document.getElementById('cheat-season');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', (e) => {
            Logger.info('[DebugUI] Season dropdown changed to:', (e.target as HTMLSelectElement).value);
            if (timeSystem) {
                timeSystem.setSeasonOverride((e.target as HTMLSelectElement).value);
            } else {
                Logger.warn('[DebugUI] timeSystem not found on window!');
            }
            (e.target as HTMLElement).blur();
        });
    } else {
        Logger.warn('[DebugUI] cheat-season select not found!');
    }

    const weatherSelect = document.getElementById('cheat-weather');
    if (weatherSelect) {
        weatherSelect.addEventListener('change', (e) => {
            Logger.info('[DebugUI] Weather dropdown changed to:', (e.target as HTMLSelectElement).value);
            if (weatherSystem) {
                weatherSystem.setWeatherOverride((e.target as HTMLSelectElement).value);
            } else {
                Logger.warn('[DebugUI] weatherSystem not found on window!');
            }
            (e.target as HTMLElement).blur();
        });
    } else {
        Logger.warn('[DebugUI] cheat-weather select not found!');
    }
}
