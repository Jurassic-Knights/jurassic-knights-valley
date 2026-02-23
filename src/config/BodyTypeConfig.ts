/**
 * BodyTypeConfig - Scale multipliers for different body types
 *
 * Used by entity renderers to apply consistent scaling based on bodyType field.
 * Reads from GameConfig.BodyTypes for live dashboard updates.
 */

import { getConfig } from '@data/GameConstants';
import { Logger } from '@core/Logger';

export const BodyTypeConfig: Record<string, { scale: number }> = {
    muscle: { scale: 1.25 },
    medium: { scale: 1.0 },
    skinny: { scale: 0.9 },
    fat: { scale: 1.3 }
};

/**
 * Get scale for a body type (reads from config dynamically)
 * @param bodyType - The body type string
 * @returns Scale multiplier (defaults to 1.0 if not found)
 */
export function getBodyTypeScale(bodyType: string | undefined): number {
    if (!bodyType) return 1.0;
    // Read from live config first, fallback to static
    const configTypes = (getConfig() as { BodyTypes?: Record<string, { scale?: number }> }).BodyTypes;
    if (configTypes && configTypes[bodyType]) {
        return configTypes[bodyType].scale ?? 1.0;
    }
    return BodyTypeConfig[bodyType]?.scale ?? 1.0;
}

// Vite HMR - update in place without reload
if (import.meta.hot) {
    import.meta.hot.accept((newModule) => {
        if (newModule) {
            Object.assign(BodyTypeConfig, newModule.BodyTypeConfig);
            Logger.info('[HMR] BodyTypeConfig updated');
        }
    });
}
