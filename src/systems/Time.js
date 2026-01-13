/**
 * Time System
 * Handles day/night cycle and seasons
 * 
 * Owner: Gameplay Designer
 */

/**
 * Time System
 * Handles day/night cycle and seasons
 * 
 * Owner: Gameplay Designer
 */

class TimeSystem {
    constructor() {
        // Time constants
        this.MINUTES_PER_HOUR = 60;
        this.HOURS_PER_DAY = 24;
        this.DAYS_PER_SEASON = 28;
        this.SEASONS = ['spring', 'summer', 'fall', 'winter'];

        this.initialized = false;
        Logger.info('[TimeSystem] Constructed');
    }

    /**
     * Initialize time system
     */
    init() {
        // Set defaults if not saved
        if (window.GameState && GameState.get('day') === undefined) {
            GameState.update({
                minute: 360, // 6:00 AM (360 minutes from midnight)
                day: 1,
                season: 0, // spring
                year: 1
            });
        }
        this.initialized = true;
        Logger.info('[TimeSystem] Initialized');
    }

    /**
     * Advance time by minutes
     * @param {number} minutes - Minutes to advance
     */
    advanceTime(minutes) {
        if (!window.GameState) return;

        let currentMinute = GameState.get('minute') + minutes;
        let day = GameState.get('day');
        let season = GameState.get('season');
        let year = GameState.get('year');

        // Roll over to next day
        while (currentMinute >= this.HOURS_PER_DAY * this.MINUTES_PER_HOUR) {
            currentMinute -= this.HOURS_PER_DAY * this.MINUTES_PER_HOUR;
            day++;
            this.onNewDay();
        }

        // Roll over to next season
        while (day > this.DAYS_PER_SEASON) {
            day -= this.DAYS_PER_SEASON;
            season++;
            this.onNewSeason();
        }

        // Roll over to next year
        while (season >= this.SEASONS.length) {
            season -= this.SEASONS.length;
            year++;
            this.onNewYear();
        }

        GameState.update({ minute: currentMinute, day, season, year });
    }

    /**
     * Get formatted time string
     */
    getTimeString() {
        if (!window.GameState) return '00:00';
        const minute = GameState.get('minute') || 0;
        const hours = Math.floor(minute / 60);
        const mins = minute % 60;
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
    }

    /**
     * Get current season name
     */
    getSeason() {
        if (!window.GameState) return 'spring';
        const season = GameState.get('season') || 0;
        return this.SEASONS[season];
    }

    /**
     * Get date string
     */
    getDateString() {
        if (!window.GameState) return 'Day 1';
        const day = GameState.get('day') || 1;
        const season = this.getSeason();
        const year = GameState.get('year') || 1;
        return `${season.charAt(0).toUpperCase() + season.slice(1)} ${day}, Year ${year}`;
    }

    /**
     * Check if it's nighttime
     */
    isNight() {
        if (!window.GameState) return false;
        const minute = GameState.get('minute') || 0;
        const hour = Math.floor(minute / 60);
        return hour >= 20 || hour < 6; // 8 PM to 6 AM
    }

    // Event callbacks (override or subscribe)
    onNewDay() {
        Logger.info('[TimeSystem] New day');
        // Trigger daily updates
        if (window.Farming) Farming.updateDaily();
    }

    onNewSeason() {
        Logger.info('[TimeSystem] New season:', this.getSeason());
    }

    onNewYear() {
        Logger.info('[TimeSystem] New year:', GameState.get('year'));
    }
}

window.TimeSystem = new TimeSystem();
