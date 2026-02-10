/**
 * GameConfig - Tunable game values with HMR support
 *
 * This file contains ONLY values that should be editable at runtime.
 * For immutable constants (grid size, world dimensions, events), see GameConstants.ts
 *
 * All systems should read from getConfig() to get HMR-reactive values.
 */
import { Logger } from '@core/Logger';

// Original defaults - used for reset functionality
const DEFAULTS = {
    Hero: {
        SPEED: 1400,
        MAX_HEALTH: 100
    },
    Combat: {
        DEFAULT_GUN_RANGE: 8000,
        DEFAULT_MINING_RANGE: 150,
        DEFAULT_DAMAGE: 10,
        ATTACK_COOLDOWN: 500,
        ARMOR_FORMULA_DIVISOR: 100
    },
    Interaction: {
        REST_AREA_RADIUS: 250,
        FORGE_AREA_RADIUS: 200,
        MERCHANT_RADIUS: 150,
        RESOURCE_PICKUP_RADIUS: 750,
        DROPPED_ITEM_PICKUP_RADIUS: 50
    },
    AI: {
        WANDER_TIMER_MIN: 2000,
        WANDER_TIMER_MAX: 5000,
        DROP_SPAWN_DISTANCE: 30,
        DROP_SPAWN_VARIANCE: 20,
        PATROL_AREA_RADIUS: 400,
        LEASH_DISTANCE: 800,
        AGGRO_RANGE: 500,
        PACK_AGGRO_RADIUS: 300
    },
    Spawning: {
        EDGE_SPACING: 100,
        MIN_SPAWN_DISTANCE: 50,
        HOME_GOLD_COUNT: 3,
        HOME_GOLD_AMOUNT_MIN: 10,
        ELITE_SPAWN_CHANCE: 0.08,

        BOSS_RESPAWN_DEFAULT: 30000,

        // Merchant Layout
        MERCHANT_OFFSET_X: 60,
        MERCHANT_OFFSET_Y: 60,
        MERCHANT_PADDING: 70,

        PROPS: {
            CLUSTER_COUNT_MIN: 4,
            CLUSTER_COUNT_RND: 3,
            PROPS_PER_CLUSTER_MIN: 3,
            PROPS_PER_CLUSTER_RND: 3,
            CLUSTER_RADIUS: 120,
            ITEM_COUNT_MIN: 2,
            ITEM_COUNT_RND: 3,
            MIN_DIST: 80
        }
    },
    Time: {
        REAL_SECONDS_PER_GAME_DAY: 300,
        DAYS_PER_SEASON: 7,
        WEATHER_DECAY_RATE: 1000
    },
    PlayerResources: {
        INITIAL_GOLD: 10000,
        INITIAL_SCRAPS: 20,
        INITIAL_MINERALS: 10,
        INITIAL_WOOD: 10,
        INITIAL_FOOD: 10
    },
    BodyTypes: {
        muscle: { scale: 1.25 },
        medium: { scale: 1.0 },
        skinny: { scale: 0.9 },
        fat: { scale: 1.3 }
    },
    WeaponDefaults: {
        // Melee weapons
        sword: { range: 0, damage: 8, attackSpeed: 1.2 },
        axe: { range: 280, damage: 10, attackSpeed: 1.0 },
        war_axe: { range: 350, damage: 12, attackSpeed: 0.9 },
        war_hammer: { range: 320, damage: 15, attackSpeed: 0.8 },
        knife: { range: 200, damage: 6, attackSpeed: 1.8 },
        spear: { range: 400, damage: 9, attackSpeed: 1.1 },
        lance: { range: 450, damage: 11, attackSpeed: 0.85 },
        mace: { range: 280, damage: 12, attackSpeed: 0.95 },
        flail: { range: 350, damage: 13, attackSpeed: 0.9 },
        halberd: { range: 420, damage: 14, attackSpeed: 0.8 },
        greatsword: { range: 0, damage: 16, attackSpeed: 0.7 },
        // Ranged weapons
        pistol: { range: 0, damage: 8, attackSpeed: 1.5 },
        rifle: { range: 600, damage: 12, attackSpeed: 0.8 },
        shotgun: { range: 300, damage: 20, attackSpeed: 0.6 },
        sniper_rifle: { range: 600, damage: 18, attackSpeed: 0.5 },
        machine_gun: { range: 500, damage: 6, attackSpeed: 3.0 },
        submachine_gun: { range: 350, damage: 5, attackSpeed: 4.0 },
        bazooka: { range: 600, damage: 40, attackSpeed: 0.3 },
        flamethrower: { range: 250, damage: 15, attackSpeed: 2.0 }
    }
};

// Current config values - starts as copy of defaults
// On HMR reload, this module re-executes with new DEFAULTS, creating fresh GameConfig
const GameConfig = JSON.parse(JSON.stringify(DEFAULTS)) as typeof DEFAULTS & { [key: string]: unknown };

// Type for the config
export type GameConfigType = typeof DEFAULTS & { [key: string]: unknown };

/**
 * getConfig() - Returns current tunable game values
 *
 * Reads from window.__GAME_CONFIG__ which is updated by HMR.
 * On first call before HMR runs, returns module-level GameConfig.
 */
export function getConfig(): GameConfigType {
    // Always read from window (HMR updates this)
    if (typeof window !== 'undefined' && window.__GAME_CONFIG__) {
        return window.__GAME_CONFIG__;
    }
    return GameConfig;
}

/**
 * getWeaponStats() - Get weapon stats using ADDITIVE model
 *
 * Config WeaponDefaults = BASE values
 * Entity weapon.stats = BONUS values (added to base)
 * Total = base + bonus
 *
 * Example: pistol default range=400, entity bonus=200 → total=600
 */
export function getWeaponStats(weapon: {
    weaponSubtype?: string;
    stats?: { range?: number; damage?: number; attackSpeed?: number };
}) {
    const subtype = weapon.weaponSubtype as keyof typeof DEFAULTS.WeaponDefaults;
    const configDefaults = getConfig().WeaponDefaults;
    const base =
        subtype && configDefaults?.[subtype]
            ? configDefaults[subtype]
            : { range: 300, damage: 10, attackSpeed: 1.0 };

    // Additive: base + entity bonus (ensure numeric values)
    const bonus = weapon.stats || {};
    const result = {
        range: Number(base.range) + Number(bonus.range || 0),
        damage: Number(base.damage) + Number(bonus.damage || 0),
        attackSpeed: Number(base.attackSpeed) + Number(bonus.attackSpeed || 0)
    };

    return result;
}

/**
 * getDefaults() - Get original default values for reset functionality
 */
export function getDefaults(): GameConfigType {
    return DEFAULTS;
}

/**
 * resetSection() - Reset a section to its defaults
 */
export function resetSection(section: keyof GameConfigType): void {
    const config = getConfig();
    (config as Record<string, unknown>)[section] = JSON.parse(JSON.stringify((DEFAULTS as Record<string, unknown>)[section]));
}

// ============================================
// VITE HMR - Hot reload without full page refresh
// ============================================

declare global {
    interface Window {
        __GAME_CONFIG__: GameConfigType;
    }
}

// On first load, store reference. On HMR, update the stored reference.
if (typeof window !== 'undefined') {
    if (!window.__GAME_CONFIG__) {
        window.__GAME_CONFIG__ = GameConfig;
    } else {
        // HMR update - merge new values into the persisted object
        const persisted = window.__GAME_CONFIG__;
        for (const key of Object.keys(GameConfig)) {
            const typedKey = key as keyof GameConfigType;
            if (typedKey === 'WeaponDefaults') {
                // Deep merge WeaponDefaults (each weapon is a nested object)
                const newWeapons = GameConfig.WeaponDefaults;
                if (!persisted.WeaponDefaults) persisted.WeaponDefaults = {} as Record<string, unknown>;
                for (const weaponKey of Object.keys(newWeapons)) {
                    (persisted.WeaponDefaults as Record<string, unknown>)[weaponKey] = {
                        ...((persisted.WeaponDefaults as Record<string, unknown>)[weaponKey] as object),
                        ...((newWeapons as Record<string, unknown>)[weaponKey] as object)
                    };
                }
            } else if (typeof GameConfig[typedKey] === 'object') {
                Object.assign(persisted[typedKey], GameConfig[typedKey]);
            } else {
                (persisted as Record<string, unknown>)[typedKey] = GameConfig[typedKey];
            }
        }
        Logger.info('[HMR] GameConfig updated:', {
            restRadius: persisted.Interaction?.REST_AREA_RADIUS,
            merchantRadius: persisted.Interaction?.MERCHANT_RADIUS,
            pistolRange: persisted.WeaponDefaults?.pistol?.range,
            interactionExists: !!persisted.Interaction
        });
    }
}

if (import.meta.hot) {
    import.meta.hot.accept();
}

// === BroadcastChannel for direct dashboard→game config updates ===
// This bypasses file/HMR - dashboard sends updates directly to game window
if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    const configChannel = new BroadcastChannel('game-config-updates');
    configChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'CONFIG_UPDATE') {
            const { section, key, value } = event.data;
            if (window.__GAME_CONFIG__ && window.__GAME_CONFIG__[section]) {
                (window.__GAME_CONFIG__[section] as Record<string, unknown>)[key] = value;
                Logger.info(`[Config] Live update: ${section}.${key} = ${value}`);
            }
        }
    };
}

export { GameConfig, DEFAULTS };
