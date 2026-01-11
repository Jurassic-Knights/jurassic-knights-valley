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

        this.totalTime = 0;          // Total seconds played
        this.dayTime = 0.5; // Start at midday (DAY phase)
        this.dayCount = 1;           // Current day number

        // State
        this.currentPhase = 'DAWN';   // DAWN, DAY, DUSK, NIGHT
        this.currentSeasonIdx = 0;   // 0: Spring
        this.seasonDayCount = 1;     // Day within current season

        this.isRunning = true;

        // Override State (Cheat Bar)
        this.overrideEnabled = false;
        this.overrideTime = null;
        this.overrideSeason = null;
    }

    init(game) {
        this.game = game;
        console.log('[TimeSystem] Initialized');
    }

    /**
     * Set a time override (locks dayTime to a specific phase)
     * @param {string|null} phase - 'dawn', 'day', 'dusk', 'night' or null to disable
     */
    setTimeOverride(phase) {
        if (!phase || phase === 'auto') {
            this.overrideEnabled = false;
            this.overrideTime = null;
            console.log('[TimeSystem] Override Disabled (Auto)');
            return;
        }

        this.overrideEnabled = true;
        // Map phase name to a fixed dayTime
        switch (phase.toLowerCase()) {
            case 'dawn': this.overrideTime = 0.22; break;  // Early morning
            case 'day': this.overrideTime = 0.50; break;   // Noon
            case 'dusk': this.overrideTime = 0.77; break;  // Evening
            case 'night': this.overrideTime = 0.05; break; // Midnight
            default: this.overrideTime = 0.50;
        }
        this.dayTime = this.overrideTime;
        console.log(`[TimeSystem] Override Enabled: ${phase} (dayTime=${this.overrideTime})`);

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
            console.log('[TimeSystem] Season Override Disabled');
            return;
        }
        const idx = this.config.SEASONS.indexOf(season);
        if (idx !== -1) {
            this.overrideSeason = season;
            this.currentSeasonIdx = idx;
            console.log(`[TimeSystem] Season Override: ${season}`);
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

        // Update game time
        this.totalTime += dtSeconds;

        // Calculate day progression
        // Amount of day to advance this frame
        const dayProgress = dtSeconds / this.config.REAL_SECONDS_PER_GAME_DAY;
        this.dayTime = (this.dayTime + dayProgress) % 1.0;

        // Check for new day
        if (this.dayTime < dayProgress) { // Wrapped around
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
        if (this.dayTime >= phases.NIGHT || this.dayTime < phases.DAWN) {
            newPhase = 'NIGHT';
        } else if (this.dayTime >= phases.DUSK) {
            newPhase = 'DUSK';
        } else if (this.dayTime >= phases.DAY) {
            newPhase = 'DAY';
        } else if (this.dayTime >= phases.DAWN) {
            newPhase = 'DAWN';
        }

        if (newPhase !== this.currentPhase) {
            const prevPhase = this.currentPhase;
            this.currentPhase = newPhase;
            console.log(`[TimeSystem] Phase Change: ${prevPhase} -> ${newPhase}`);
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

        console.log(`[TimeSystem] Day ${this.dayCount} Started`);

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

        console.log(`[TimeSystem] Season Change: ${prevSeason} -> ${newSeason}`);
        EventBus.emit(GameConstants.Events.SEASON_CHANGE, {
            season: newSeason,
            prevSeason: prevSeason
        });
    }
}

window.TimeSystem = new TimeSystem();
