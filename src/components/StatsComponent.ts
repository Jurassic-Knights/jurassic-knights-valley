/**
 * StatsComponent
 * managed generic RPG stats for an entity (Hero, Dinosaur, Army Unit).
 *
 * Properties:
 * - Speed (Movement)
 * - Stamina (Action points)
 * - CritChance (Combat)
 * - Defense (Mitigation)
 * - Attack (03-hero-stats)
 * - Level/XP (03-hero-stats)
 */
import { Component } from '../core/Component';
import { Logger } from '../core/Logger';
import { EventBus } from '../core/EventBus';
import { GameConstants, getConfig } from '../data/GameConstants';
import { getWeaponStats } from '../data/GameConfig';
class StatsComponent extends Component {
    type: string = 'StatsComponent';
    speed: number = 100;
    maxStamina: number = 100;
    stamina: number = 100;
    critChance: number = 0;
    defense: number = 0;
    attack: number = 10;
    critMultiplier: number = 1.5;
    level: number = 1;
    xp: number = 0;
    xpToNextLevel: number = 100;
    xpScaling: number = 1.5;

    constructor(parent: any, config: any = {}) {
        super(parent);
        this.type = 'StatsComponent';

        this.speed = config.speed || 100;
        this.maxStamina = config.maxStamina || 100;
        this.stamina = config.stamina !== undefined ? config.stamina : this.maxStamina;
        this.critChance = config.critChance || 0;
        this.defense = config.defense || 0;
        this.attack = config.attack || 10;
        this.critMultiplier = config.critMultiplier || 1.5;
        this.level = config.level || 1;
        this.xp = config.xp || 0;
        this.xpToNextLevel = config.xpToNextLevel || 100;
        this.xpScaling = config.xpScaling || 1.5;

        Logger.info(`[StatsComponent] Attached to ${parent.constructor.name}`);
    }

    consumeStamina(amount: number) {
        if (this.stamina >= amount) {
            this.stamina -= amount;
            if (this.parent.id === 'hero' && EventBus) {
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                    current: this.stamina,
                    max: this.maxStamina
                });
            }
            return true;
        }
        return false;
    }

    restoreStamina(amount: number) {
        this.stamina = Math.min(this.stamina + amount, this.maxStamina);
        if (this.parent.id === 'hero' && EventBus) {
            EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                current: this.stamina,
                max: this.maxStamina
            });
        }
    }

    getSpeed(multiplier: number = 1) {
        // Always read from config for live updates
        const configSpeed = getConfig().Hero?.SPEED || this.speed;
        return configSpeed * multiplier;
    }

    getXPForLevel(targetLevel: number) {
        return Math.floor(this.xpToNextLevel * Math.pow(this.xpScaling, targetLevel - 1));
    }

    getTotalXPForLevel(targetLevel: number) {
        let total = 0;
        for (let i = 1; i < targetLevel; i++) {
            total += this.getXPForLevel(i);
        }
        return total;
    }

    getAttack() {
        const base = this.attack + (this.level - 1) * 2;
        const equipBonus = this.parent.equipment?.getStatBonus('damage') || 0;
        return base + equipBonus;
    }

    getDefense() {
        const base = this.defense + (this.level - 1) * 1;
        const equipBonus = this.parent.equipment?.getStatBonus('armor') || 0;
        return base + equipBonus;
    }

    getCritChance() {
        const base = this.critChance * 100;
        const equipBonus = this.parent.equipment?.getStatBonus('critChance') || 0;
        return base + equipBonus;
    }

    getAttackRange() {
        // Base hand range + equipment bonuses
        const baseRange = getConfig().Combat?.DEFAULT_MINING_RANGE || 80;
        const equipBonus = this.parent.equipment?.getStatBonus('range') || 0;
        return baseRange + equipBonus;
    }

    getWeaponRange(slotId: string) {
        // Use additive model: base + entity bonus
        const item = this.parent.equipment?.getSlot?.(slotId);
        if (!item) return getConfig().Combat?.DEFAULT_MINING_RANGE || 80;
        const stats = getWeaponStats(item);
        return stats.range;
    }

    getAttackRate() {
        const combat = this.parent.components?.combat as any;
        const base = combat?.rate || 1.0;
        const equipBonus = this.parent.equipment?.getStatBonus('attackRate') || 0;
        return base + equipBonus;
    }

    getDamageReduction(incomingDamage: number) {
        const divisor = getConfig().Combat?.ARMOR_FORMULA_DIVISOR || 100;
        const reduction = this.getDefense() / (this.getDefense() + divisor);
        return Math.floor(incomingDamage * (1 - reduction));
    }

    getXPProgress() {
        const required = this.getXPForLevel(this.level);
        return this.xp / required;
    }
}

export { StatsComponent };
