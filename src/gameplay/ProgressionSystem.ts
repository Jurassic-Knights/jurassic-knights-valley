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
import { GameConstants, getConfig } from '@data/GameConstants';
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
            EventBus.on(Events.ENEMY_DIED, (data: any) => this.onEnemyKilled(data));
        }
    },

    onEnemyKilled(data: { enemy: IEntity; xpReward: number }) {
        const { enemy, xpReward } = data;
        if (!xpReward || !this.game?.hero) return;

        this.grantXP(this.game.hero, xpReward);
    },

    /**
     * Grant XP to hero
     */
    grantXP(hero: IEntity, amount: number) {
        const stats = hero.components?.stats;
        if (!stats) return;

        const oldLevel = stats.level;
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
        const getXP = (lvl: number) => {
            return stats.getXPForLevel ? stats.getXPForLevel(lvl) : 100 * Math.pow(1.5, lvl - 1);
        };

        let nextLevelXP = getXP(stats.level);
        while (stats.xp >= nextLevelXP) {
            stats.xp -= nextLevelXP;
            stats.level++;
            this.onLevelUp(hero, stats.level);
            nextLevelXP = getXP(stats.level);
        }

        // Emit if leveled
        if (stats.level > oldLevel) {
            if (EventBus) {
                EventBus.emit(Events.HERO_LEVEL_UP, {
                    hero,
                    oldLevel,
                    newLevel: stats.level,
                    levelsGained: stats.level - oldLevel
                });
            }
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

        // VFX
        const VFXController = Registry.get('VFXController');
        const VFXConfig = Registry.get('VFXConfig');
        if (VFXController && VFXConfig) {
            VFXController.playForeground(
                hero.x,
                hero.y,
                VFXConfig.TEMPLATES?.LEVEL_UP_FX || {
                    type: 'burst',
                    color: '#FFD700',
                    count: 30,
                    lifetime: 1000
                }
            );
        }

        // SFX
        const AudioManager = Registry.get('AudioManager');
        if (AudioManager) {
            AudioManager.playSFX('sfx_level_up');
        }

        Logger.info(`[ProgressionSystem] Hero leveled up to ${newLevel}!`);
    },

    /**
     * Get XP required for specific level
     */
    getXPForLevel(level: number): number {
        const base = EntityRegistry.hero?.['hero']?.xpToNextLevel || 100;
        const scaling = EntityRegistry.hero?.['hero']?.xpScaling || 1.5;
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
        const required = stats.getXPForLevel ? stats.getXPForLevel(stats.level) : this.getXPForLevel(stats.level);
        return stats.xp / required;
    },

    // Legacy compatibility
    meetsRequirements(requirements: any = {}): boolean {
        const hero = this.game?.hero;
        if (!hero) return true;

        const stats = hero.components?.stats;
        if (requirements.level && stats && stats.level < requirements.level) return false;
        return true;
    },

    getAvailableUnlocks(): any[] {
        return [];
    }
};

if (Registry) Registry.register('ProgressionSystem', ProgressionSystem);

// ES6 Module Export
export { ProgressionSystem };
