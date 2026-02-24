/**
 * TimeSystem
 * Manages the global game time, day/night cycles, and seasons.
 *
 * Responsibilities:
 * - Tracks total game time and normalized day time (0.0 - 1.0)
 * - Determines the current day phase (Dawn, Day, Dusk, Night)
 * - Manages Seasons (Spring, Summer, Autumn, Winter)
 * - Emits time-based events for other systems to consume
 */

import { Logger } from '@core/Logger';
import { GameConstants, getConfig } from '@data/GameConstants';
import { EventBus } from '@core/EventBus';
import { Registry } from '@core/Registry';
import { IGame } from '../types/core';

class TimeSystem {
    // Property declarations
    game: IGame | null = null;
    totalTime: number = 0;
    dayTime: number = GameConstants.Timing.DEFAULT_DAY_TIME;
    dayCount: number = 1;
    currentPhase: string = 'DAWN';
    currentSeasonIdx: number = 0;
    seasonDayCount: number = 1;
    isRunning: boolean = true;
    overrideEnabled: boolean = false;
    overrideTime: number | null = null;
    overrideSeason: string | null = null;

    // Dynamic getter for config - always reads live values
    get config() {
        return { ...GameConstants.Time, ...getConfig().Time };
    }

    constructor() {
        // Config is now a getter, no initialization needed
    }

    init(game: IGame) {
        this.game = game;
        Logger.info('[TimeSystem] Initialized');
    }

    /**
     * Set a time override (locks dayTime to a specific phase)
     * @param {string|null} phase - 'dawn', 'day', 'dusk', 'night' or null to disable
     */
    setTimeOverride(phase: string | null) {
        if (!phase || phase === 'auto') {
            this.overrideEnabled = false;
            this.overrideTime = null;
            Logger.info('[TimeSystem] Override Disabled (Auto)');
            return;
        }

        this.overrideEnabled = true;
        const overrides = GameConstants.Time.DEBUG_PHASE_OVERRIDES;
        switch (phase.toLowerCase()) {
            case 'dawn':
                this.overrideTime = overrides.dawn;
                break;
            case 'day':
                this.overrideTime = overrides.day;
                break;
            case 'dusk':
                this.overrideTime = overrides.dusk;
                break;
            case 'night':
                this.overrideTime = overrides.night;
                break;
            default:
                this.overrideTime = overrides.day;
        }
        this.dayTime = this.overrideTime;
        Logger.info(`[TimeSystem] Override Enabled: ${phase} (dayTime=${this.overrideTime})`);

        // Emit immediately so lighting updates
        this.checkPhase();
        EventBus.emit('TIME_TICK', {
            totalTime: this.totalTime,
            dayTime: this.dayTime,
            phase: this.currentPhase,
            season: this.config.SEASONS[this.currentSeasonIdx],
            dayCount: this.dayCount
        });
    }

    /**
     * Set a season override
     * @param {string|null} season - 'SPRING', 'SUMMER', 'AUTUMN', 'WINTER' or null/auto
     */
    setSeasonOverride(season: string | null) {
        if (!season || season === 'auto') {
            this.overrideSeason = null;
            Logger.info('[TimeSystem] Season Override Disabled');
            return;
        }
        const idx = this.config.SEASONS.indexOf(season);
        if (idx !== -1) {
            this.overrideSeason = season;
            this.currentSeasonIdx = idx;
            Logger.info(`[TimeSystem] Season Override: ${season}`);
            EventBus.emit('SEASON_CHANGE', {
                season: season,
                prevSeason: season // Forcing same to avoid logic issues
            });
        }
    }

    /**
     * Update loop
     * @param {number} dt Delta time in ms
     */
    update(dt: number) {
        if (!this.isRunning) return;

        // If override is active, just emit tick but don't advance time
        if (this.overrideEnabled) {
            // Emit Tick (static dayTime)
            EventBus.emit('TIME_TICK', {
                totalTime: this.totalTime,
                dayTime: this.dayTime,
                phase: this.currentPhase,
                season: this.overrideSeason || this.config.SEASONS[this.currentSeasonIdx],
                dayCount: this.dayCount
            });
            return;
        }

        // Convert dt to seconds
        const dtSeconds = dt / 1000;

        // Sanity check: clamp dt to prevent huge jumps (e.g., tab was inactive)
        const clampedDt = Math.min(dtSeconds, 1.0); // Max 1 second per frame

        // Update game time
        this.totalTime += clampedDt;

        // Calculate day progression
        // Amount of day to advance this frame
        const dayProgress = clampedDt / this.config.REAL_SECONDS_PER_GAME_DAY;
        const prevDayTime = this.dayTime;
        this.dayTime = (this.dayTime + dayProgress) % 1.0;

        // Defensive: Ensure dayTime is always valid (0.0 - 1.0)
        if (this.dayTime < 0 || this.dayTime >= 1.0 || isNaN(this.dayTime)) {
            Logger.warn(`[TimeSystem] Invalid dayTime detected: ${this.dayTime}, resetting to default`);
            this.dayTime = GameConstants.Timing.DEFAULT_DAY_TIME;
        }

        // Check for new day (wrapped from ~1.0 to ~0.0)
        if (this.dayTime < prevDayTime) {
            this.handleNewDay();
        }

        // Check Phase
        this.checkPhase();

        // Emit Tick (Optional: Throttle this if too noisy, but useful for smooth lighting)
        EventBus.emit('TIME_TICK', {
            totalTime: this.totalTime,
            dayTime: this.dayTime,
            phase: this.currentPhase,
            season: this.overrideSeason || this.config.SEASONS[this.currentSeasonIdx],
            dayCount: this.dayCount
        });
    }

    /**
     * Handle transitions between Dawn, Day, Dusk, Night
     */
    checkPhase() {
        const phases = this.config.PHASES;
        let newPhase = this.currentPhase;

        // Determine phase based on dayTime
        // NIGHT: 0.9 → 1.0 → 0.0 → 0.05
        // DAWN: 0.05 → 0.15
        // DAY: 0.15 → 0.75
        // DUSK: 0.75 → 0.9
        if (this.dayTime >= phases.NIGHT || this.dayTime < phases.DAWN) {
            newPhase = 'NIGHT';
        } else if (this.dayTime >= phases.DUSK) {
            newPhase = 'DUSK';
        } else if (this.dayTime >= phases.DAY) {
            newPhase = 'DAY';
        } else {
            // Must be DAWN (dayTime >= phases.DAWN is implied by reaching here)
            newPhase = 'DAWN';
        }

        if (newPhase !== this.currentPhase) {
            const prevPhase = this.currentPhase;
            this.currentPhase = newPhase;
            Logger.info(
                `[TimeSystem] Phase Change: ${prevPhase} -> ${newPhase} (dayTime: ${this.dayTime.toFixed(3)})`
            );
            EventBus.emit('DAY_PHASE_CHANGE', {
                phase: newPhase,
                prevPhase: prevPhase
            });
        }
    }

    /**
     * Logic for when a new day starts
     */
    handleNewDay() {
        this.dayCount++;
        this.seasonDayCount++;

        Logger.info(`[TimeSystem] Day ${this.dayCount} Started`);

        // Check Season Change
        if (this.seasonDayCount > this.config.DAYS_PER_SEASON) {
            this.advanceSeason();
        }
    }

    /**
     * Advance to the next season
     */
    advanceSeason() {
        const prevSeason = this.config.SEASONS[this.currentSeasonIdx];

        this.currentSeasonIdx = (this.currentSeasonIdx + 1) % this.config.SEASONS.length;
        this.seasonDayCount = 1;

        const newSeason = this.config.SEASONS[this.currentSeasonIdx];

        Logger.info(`[TimeSystem] Season Change: ${prevSeason} -> ${newSeason}`);
        EventBus.emit('SEASON_CHANGE', {
            season: newSeason,
            prevSeason: prevSeason
        });
    }
}

// Create singleton and export
const timeSystem = new TimeSystem();

// Register at module load time
Registry.register('TimeSystem', timeSystem);

export { TimeSystem, timeSystem };
