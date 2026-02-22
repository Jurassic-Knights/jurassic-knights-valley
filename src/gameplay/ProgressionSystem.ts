/**
 * ProgressionSystem
 * Handles XP gain, leveling, and stat increases.
 *
 * Owner: Gameplay Designer
 */
import { Registry } from '@core/Registry';
import { EntityRegistry } from '@entities/EntityLoader';
import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { IGame, IEntity } from '@app-types/core';

// Helper to access Events from GameConstants
const Events = GameConstants.Events;

const ProgressionSystem = {
    game: null as IGame | null,

    init(game: IGame) {
        this.game = game;
        this.initListeners();
        Logger.info('[ProgressionSystem] Initialized');
    },

    initListeners() {
        if (EventBus) {
            EventBus.on(
                Events.ENEMY_DIED,
                (data: { entity?: IEntity; xpReward?: number; [key: string]: unknown }) =>
                    this.onEnemyKilled(data)
            );
        }
    },

    onEnemyKilled(data: { enemy: IEntity; xpReward: number }) {
        const { xpReward } = data;
        if (!xpReward || !this.game?.hero) return;

        this.grantXP(this.game.hero, xpReward);
    },

    /**
     * Grant XP to hero
     */
    grantXP(hero: IEntity, amount: number) {
        const stats = hero.components?.stats;
        if (!stats) return;

        stats.xp += amount;

        // Emit XP gain event
        if (EventBus) {
            EventBus.emit(Events.XP_GAINED, {
                hero,
                amount,
                total: stats.xp,
                level: stats.level
            });
        }

        // Check for level up(s) - multiple levels can be gained from one kill
        // Ensure getXPForLevel exists or use safe fallback logic
        const prog = GameConstants?.Progression;
        const getXP = (lvl: number) => {
            const base = prog.XP_BASE;
            const scaling = prog.XP_SCALING;
            return stats.getXPForLevel
                ? stats.getXPForLevel(lvl)
                : base * Math.pow(scaling, lvl - 1);
        };

        let nextLevelXP = getXP(stats.level);
        while (stats.xp >= nextLevelXP) {
            stats.xp -= nextLevelXP;
            stats.level++;
            this.onLevelUp(hero, stats.level);
            nextLevelXP = getXP(stats.level);
        }
    },

    /**
     * Handle level up bonuses
     */
    onLevelUp(hero: IEntity, newLevel: number) {
        const stats = hero.components?.stats;
        const health = hero.components?.health;

        // Stat increases per level (config-driven)
        // Check hero registry (skin) or use defaults
        const perLevel = EntityRegistry.hero?.['hero']?.levelBonuses || {
            maxHealth: 10,
            attack: 2,
            defense: 1,
            maxStamina: 5
        };

        // Apply stat gains
        if (health) {
            health.maxHealth += perLevel.maxHealth;
            health.health = health.maxHealth; // Full heal on level
        }

        if (stats) {
            stats.attack = (stats.attack || 10) + perLevel.attack;
            stats.defense = (stats.defense || 0) + perLevel.defense;
            stats.maxStamina += perLevel.maxStamina;
            stats.stamina = stats.maxStamina; // Full restore
        }

        if (EventBus) {
            EventBus.emit(Events.HERO_LEVEL_UP, {
                hero,
                oldLevel: newLevel - 1,
                newLevel,
                levelsGained: 1
            });
        }
        Logger.info(`[ProgressionSystem] Hero leveled up to ${newLevel}!`);
    },

    /**
     * Get XP required for specific level
     */
    getXPForLevel(level: number): number {
        const prog = GameConstants?.Progression;
        const base = EntityRegistry.hero?.['hero']?.xpToNextLevel ?? prog.XP_BASE;
        const scaling = EntityRegistry.hero?.['hero']?.xpScaling ?? prog.XP_SCALING;
        return Math.floor(base * Math.pow(scaling, level - 1));
    },

    /**
     * Get hero's current XP progress as percentage
     */
    getXPProgress(hero: IEntity): number {
        const stats = hero?.components?.stats;
        if (!stats) return 0;
        // Use local helper or component method if available?
        // Component method is standard if it exists.
        // Assuming component has getXPForLevel?
        // Let's use internal calculator if component doesn't have it, to be safe.
        // But logic above used stats.getXPForLevel...
        // Let's assume stats component matches the logic or we use ours.
        const required = stats.getXPForLevel
            ? stats.getXPForLevel(stats.level)
            : this.getXPForLevel(stats.level);
        return stats.xp / required;
    },

    // Legacy compatibility
    meetsRequirements(requirements: Record<string, unknown> = {}): boolean {
        const hero = this.game?.hero;
        if (!hero) return true;

        const stats = hero.components?.stats;
        if (requirements.level && stats && stats.level < requirements.level) return false;
        return true;
    },

    getAvailableUnlocks(): Array<{ id: string; [key: string]: unknown }> {
        return [];
    }
};

if (Registry) Registry.register('ProgressionSystem', ProgressionSystem);

// ES6 Module Export
export { ProgressionSystem };
