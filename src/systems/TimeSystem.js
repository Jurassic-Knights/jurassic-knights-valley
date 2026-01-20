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
class TimeSystem {
    constructor() {
        // Configuration reference
        this.config = GameConstants.Time;

        this.totalTime = 0; // Total seconds played
        this.dayTime = 0.5; // Start at midday (DAY phase)
        this.dayCount = 1; // Current day number

        // State
        this.currentPhase = 'DAWN'; // DAWN, DAY, DUSK, NIGHT
        this.currentSeasonIdx = 0; // 0: Spring
        this.seasonDayCount = 1; // Day within current season

        this.isRunning = true;

        // Override State (Cheat Bar)
        this.overrideEnabled = false;
        this.overrideTime = null;
        this.overrideSeason = null;
    }

    init(game) {
        this.game = game;
        Logger.info('[TimeSystem] Initialized');
    }

    /**
     * Set a time override (locks dayTime to a specific phase)
     * @param {string|null} phase - 'dawn', 'day', 'dusk', 'night' or null to disable
     */
    setTimeOverride(phase) {
        if (!phase || phase === 'auto') {
            this.overrideEnabled = false;
            this.overrideTime = null;
            Logger.info('[TimeSystem] Override Disabled (Auto)');
            return;
        }

        this.overrideEnabled = true;
        // Map phase name to a fixed dayTime
        switch (phase.toLowerCase()) {
            case 'dawn':
                this.overrideTime = 0.22;
                break; // Early morning
            case 'day':
                this.overrideTime = 0.5;
                break; // Noon
            case 'dusk':
                this.overrideTime = 0.77;
                break; // Evening
            case 'night':
                this.overrideTime = 0.05;
                break; // Midnight
            default:
                this.overrideTime = 0.5;
        }
        this.dayTime = this.overrideTime;
        Logger.info(`[TimeSystem] Override Enabled: ${phase} (dayTime=${this.overrideTime})`);

        // Emit immediately so lighting updates
        this.checkPhase();
        EventBus.emit(GameConstants.Events.TIME_TICK, {
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
    setSeasonOverride(season) {
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
            EventBus.emit(GameConstants.Events.SEASON_CHANGE, {
                season: season,
                prevSeason: season // Forcing same to avoid logic issues
            });
        }
    }

    /**
     * Update loop
     * @param {number} dt Delta time in ms
     */
    update(dt) {
        if (!this.isRunning) return;

        // If override is active, just emit tick but don't advance time
        if (this.overrideEnabled) {
            // Emit Tick (static dayTime)
            EventBus.emit(GameConstants.Events.TIME_TICK, {
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
            Logger.warn(`[TimeSystem] Invalid dayTime detected: ${this.dayTime}, resetting to 0.5`);
            this.dayTime = 0.5;
        }

        // Check for new day (wrapped from ~1.0 to ~0.0)
        if (this.dayTime < prevDayTime) {
            this.handleNewDay();
        }

        // Check Phase
        this.checkPhase();

        // Emit Tick (Optional: Throttle this if too noisy, but useful for smooth lighting)
        EventBus.emit(GameConstants.Events.TIME_TICK, {
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
        // NIGHT: 0.9 â†’ 1.0 â†’ 0.0 â†’ 0.05
        // DAWN: 0.05 â†’ 0.15
        // DAY: 0.15 â†’ 0.75
        // DUSK: 0.75 â†’ 0.9
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
            Logger.info(`[TimeSystem] Phase Change: ${prevPhase} -> ${newPhase} (dayTime: ${this.dayTime.toFixed(3)})`);
            EventBus.emit(GameConstants.Events.DAY_PHASE_CHANGE, {
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
        EventBus.emit(GameConstants.Events.SEASON_CHANGE, {
            season: newSeason,
            prevSeason: prevSeason
        });
    }
}

window.TimeSystem = new TimeSystem();

