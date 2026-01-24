/**
 * ProgressionSystem
 * Handles XP gain, leveling, and stat increases.
 *
 * Owner: Gameplay Designer
 */
import { Registry } from '../core/Registry';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameConstants } from '../data/GameConstants';

// Helper to access Events from GameConstants
const Events = GameConstants.Events;
const ProgressionSystem = {
    init(game) {
        this.game = game;
        this.initListeners();
        Logger.info('[ProgressionSystem] Initialized');
    },

    initListeners() {
        if (EventBus) {
            EventBus.on(Events.ENEMY_DIED, (data) => this.onEnemyKilled(data));
        }
    },

    onEnemyKilled(data) {
        const { enemy, xpReward } = data;
        if (!xpReward || !this.game?.hero) return;

        this.grantXP(this.game.hero, xpReward);
    },

    /**
     * Grant XP to hero
     * @param {Hero} hero
     * @param {number} amount
     */
    grantXP(hero, amount) {
        const stats = hero.components?.stats;
        if (!stats) return;

        const oldLevel = stats.level;
        stats.xp += amount;

        // Emit XP gain event
        if (EventBus) {
            EventBus.emit('XP_GAINED', {
                hero,
                amount,
                total: stats.xp,
                level: stats.level
            });
        }

        // Check for level up(s) - multiple levels can be gained from one kill
        while (stats.xp >= stats.getXPForLevel(stats.level)) {
            stats.xp -= stats.getXPForLevel(stats.level);
            stats.level++;
            this.onLevelUp(hero, stats.level);
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
     * @param {Hero} hero
     * @param {number} newLevel
     */
    onLevelUp(hero, newLevel) {
        const stats = hero.components?.stats;
        const health = hero.components?.health;

        // Stat increases per level (config-driven)
        const perLevel = EntityConfig?.hero?.base?.levelBonuses || {
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
        const VFXController = Registry?.get('VFXController');
        const VFXConfig = Registry?.get('VFXConfig');
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
        const AudioManager = Registry?.get('AudioManager');
        if (AudioManager) {
            AudioManager.playSFX('sfx_level_up');
        }

        Logger.info(`[ProgressionSystem] Hero leveled up to ${newLevel}!`);
    },

    /**
     * Get XP required for specific level
     */
    getXPForLevel(level) {
        const base = EntityConfig?.hero?.base?.xpToNextLevel || 100;
        const scaling = EntityConfig?.hero?.base?.xpScaling || 1.5;
        return Math.floor(base * Math.pow(scaling, level - 1));
    },

    /**
     * Get hero's current XP progress as percentage
     */
    getXPProgress(hero) {
        const stats = hero?.components?.stats;
        if (!stats) return 0;

        const required = stats.getXPForLevel(stats.level);
        return stats.xp / required;
    },

    // Legacy compatibility
    meetsRequirements(requirements: any = {}) {
        const hero = this.game?.hero;
        if (!hero) return true;

        const stats = hero.components?.stats;
        if (requirements.level && stats && stats.level < requirements.level) return false;
        return true;
    },

    getAvailableUnlocks() {
        return [];
    }
};

if (Registry) Registry.register('ProgressionSystem', ProgressionSystem);

// ES6 Module Export
export { ProgressionSystem };
