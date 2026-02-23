/**
 * GameConstants - Centralized configuration for the game
 *
 * Contains magic numbers, configuration settings, and balance values.
 * Split by domain for maintainability (max 300 lines per file).
 */
import { Logger } from '@core/Logger';
import { Grid, World, UnlockCosts } from './Grid';
import { Core, Hero, Combat, Damage } from './Combat';
import { Equipment, Weapons } from './Equipment';
import { Interaction, Time, Weather } from './Interaction';
import { UI, Rendering, CollisionDebug, Components } from './UI';
import { AI, Timing } from './AI';
import {
    Entities,
    Boss,
    EntityLoader,
    Enemy,
    Dinosaur,
    HeroDefaults,
    Resource,
    Progression,
    Crafting,
    Quest,
    DroppedItem,
    FloatingText,
    EnemyRender
} from './Entities';
import { Biome, Ground } from './Biome';
import { Spawning } from './Spawning';
import { PlayerResources } from './PlayerResources';
import { Events } from './Events';

const GameConstants = {
    Grid,
    World,
    UnlockCosts,
    Core,
    Hero,
    Combat,
    Damage,
    Equipment,
    Weapons,
    Interaction,
    Time,
    Weather,
    VFX: {},
    UI,
    Rendering,
    CollisionDebug,
    Components,
    AI,
    Timing,
    Entities,
    Boss,
    EntityLoader,
    Enemy,
    Dinosaur,
    HeroDefaults,
    Resource,
    Progression,
    Crafting,
    Quest,
    DroppedItem,
    FloatingText,
    EnemyRender,
    Biome,
    Ground,
    Spawning,
    PlayerResources,
    Events
};

export { GameConstants };

/**
 * getConfig() - HMR-safe accessor for GameConstants
 *
 * Use this instead of importing GameConstants directly to get
 * hot-reloadable config values that update without page refresh.
 *
 * Usage: const speed = getConfig().Hero.SPEED;
 */
export function getConfig(): typeof GameConstants {
    const tunables: Record<string, Record<string, unknown>> =
        typeof window !== 'undefined' && window.__GAME_CONFIG__
            ? ((window as Window & { __GAME_CONFIG__?: Record<string, Record<string, unknown>> }).__GAME_CONFIG__ as Record<string, Record<string, unknown>>) || {}
            : {};
    const base =
        typeof window !== 'undefined' && window.__GAME_CONSTANTS__
            ? window.__GAME_CONSTANTS__
            : GameConstants;

    const mergedWeaponDefaults: Record<string, Record<string, unknown>> = {
        ...(base as { WeaponDefaults?: Record<string, Record<string, unknown>> }).WeaponDefaults
    };
    if (tunables.WeaponDefaults) {
        for (const weapon of Object.keys(tunables.WeaponDefaults)) {
            mergedWeaponDefaults[weapon] = {
                ...(mergedWeaponDefaults[weapon] || {}),
                ...((tunables.WeaponDefaults[weapon] as Record<string, unknown>) || {})
            };
        }
    }

    return {
        ...base,
        Hero: tunables.Hero || base.Hero,
        Combat: tunables.Combat || base.Combat,
        Interaction: tunables.Interaction || base.Interaction,
        AI: tunables.AI || base.AI,
        Spawning: tunables.Spawning || base.Spawning,
        Time: tunables.Time || base.Time,
        BodyTypes: tunables.BodyTypes || (base as { BodyTypes?: Record<string, unknown> }).BodyTypes,
        WeaponDefaults: mergedWeaponDefaults,
        PlayerResources:
            tunables.PlayerResources ||
            (base as { PlayerResources?: Record<string, unknown> }).PlayerResources
    } as unknown as typeof GameConstants;
}

declare global {
    interface Window {
        __GAME_CONSTANTS__: typeof GameConstants;
    }
}

if (typeof window !== 'undefined') {
    if (!window.__GAME_CONSTANTS__) {
        window.__GAME_CONSTANTS__ = GameConstants;
    } else {
        const persisted = window.__GAME_CONSTANTS__;
        for (const key of Object.keys(GameConstants)) {
            const typedKey = key as keyof typeof GameConstants;
            if (
                typeof GameConstants[typedKey] === 'object' &&
                !Array.isArray(GameConstants[typedKey])
            ) {
                const target = persisted[typedKey] as Record<string, unknown>;
                const source = GameConstants[typedKey] as Record<string, unknown>;
                Object.assign(target, source);
            } else {
                (persisted as Record<string, unknown>)[typedKey] = GameConstants[typedKey];
            }
        }
        Logger.info('[HMR] GameConstants updated in-place');
    }
}

if (import.meta.hot) {
    import.meta.hot.accept();
}
