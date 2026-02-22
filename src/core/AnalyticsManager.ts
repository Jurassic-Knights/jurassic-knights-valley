/**
 * Analytics - Game analytics wrapper using GameAnalytics SDK
 *
 * Free tier: Unlimited events
 * Dashboard: https://gameanalytics.com
 *
 * Setup:
 * 1. Create account at gameanalytics.com
 * 2. Add game, get Game Key and Secret Key
 * 3. Set keys in ANALYTICS_CONFIG below
 */

const ANALYTICS_CONFIG = {
    enabled: false, // Enable when ready for production data
    gameKey: '8ac6be4add5322270364152da68e97ca',
    secretKey: 'cdc6600ca0727e16cc74f30d23c520a07918f04c',
    build: '1.0.0'
};

import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';

const Analytics = {
    initialized: false,

    /**
     * Initialize analytics (called once on game start)
     */
    init() {
        if (!ANALYTICS_CONFIG.enabled) {
            Logger.info('[Analytics] Disabled - set keys in AnalyticsManager.js');
            return;
        }

        // Load GameAnalytics SDK
        if (!gameanalytics) {
            Logger.warn('[Analytics] GameAnalytics SDK not loaded');
            return;
        }

        try {
            gameanalytics.GameAnalytics.configureBuild(ANALYTICS_CONFIG.build);
            gameanalytics.GameAnalytics.initialize(
                ANALYTICS_CONFIG.gameKey,
                ANALYTICS_CONFIG.secretKey
            );
            this.initialized = true;
            Logger.info('[Analytics] Initialized');
        } catch {
            Logger.warn('[Analytics] Failed to send progression event');
        }
    },

    /**
     * Track game progression (level complete, boss killed, etc.)
     */
    trackProgression(status: string, area: string, step: string | null = null) {
        if (!this.initialized) return;

        // status: 'Start', 'Complete', 'Fail'
        // area: 'Zone_Grasslands', 'Boss_Alpha', etc.
        try {
            if (step) {
                gameanalytics.GameAnalytics.addProgressionEvent(
                    gameanalytics.EGAProgressionStatus[status],
                    area,
                    step
                );
            } else {
                gameanalytics.GameAnalytics.addProgressionEvent(
                    gameanalytics.EGAProgressionStatus[status],
                    area
                );
            }
        } catch {
            /* ignore */
        }
    },

    /**
     * Track resource/economy events (gold earned, items crafted)
     */
    trackResource(
        flowType: string,
        currency: string,
        amount: number,
        itemType: string,
        itemId: string
    ) {
        if (!this.initialized) return;

        // flowType: 'Source' (earned) or 'Sink' (spent)
        // currency: 'gold', 'gems', etc.
        try {
            gameanalytics.GameAnalytics.addResourceEvent(
                gameanalytics.EGAResourceFlowType[flowType],
                currency,
                amount,
                itemType,
                itemId
            );
        } catch {
            /* ignore */
        }
    },

    /**
     * Track custom design events
     */
    trackEvent(eventId: string, value: number | null = null) {
        if (!this.initialized) return;

        try {
            if (value !== null) {
                gameanalytics.GameAnalytics.addDesignEvent(eventId, value);
            } else {
                gameanalytics.GameAnalytics.addDesignEvent(eventId);
            }
        } catch {
            /* ignore */
        }
    },

    /**
     * Track errors
     */
    trackError(severity: string, message: string) {
        if (!this.initialized) return;

        // severity: 'Debug', 'Info', 'Warning', 'Error', 'Critical'
        try {
            gameanalytics.GameAnalytics.addErrorEvent(
                gameanalytics.EGAErrorSeverity[severity],
                message
            );
        } catch {
            /* ignore */
        }
    }
};

if (Registry) Registry.register('Analytics', Analytics);

// ES6 Module Export
export { Analytics };
