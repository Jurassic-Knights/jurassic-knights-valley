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
class StatsComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        this.type = 'StatsComponent';

        // Movement
        this.speed = config.speed || 100;

        // Resource / Energy
        this.maxStamina = config.maxStamina || 100;
        this.stamina = config.stamina !== undefined ? config.stamina : this.maxStamina;

        // Combat Stats
        this.critChance = config.critChance || 0;
        this.defense = config.defense || 0;
        this.attack = config.attack || 10; // Base attack power (03-hero-stats)
        this.critMultiplier = config.critMultiplier || 1.5; // (03-hero-stats)

        // Leveling (03-hero-stats)
        this.level = config.level || 1;
        this.xp = config.xp || 0;
        this.xpToNextLevel = config.xpToNextLevel || 100;
        this.xpScaling = config.xpScaling || 1.5;

        Logger.info(`[StatsComponent] Attached to ${parent.constructor.name}`);
    }

    /**
     * Consume stamina
     * @param {number} amount
     * @returns {boolean} true if successful
     */
    consumeStamina(amount) {
        if (this.stamina >= amount) {
            this.stamina -= amount;
            if (this.parent.id === 'hero' && window.EventBus) {
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                    current: this.stamina,
                    max: this.maxStamina
                });
            }
            return true;
        }
        return false;
    }

    /**
     * Restore stamina
     * @param {number} amount
     */
    restoreStamina(amount) {
        this.stamina = Math.min(this.stamina + amount, this.maxStamina);
        if (this.parent.id === 'hero' && window.EventBus) {
            EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                current: this.stamina,
                max: this.maxStamina
            });
        }
    }

    /**
     * Modify speed (e.g. for buffs/debuffs)
     * @param {number} multiplier
     */
    getSpeed(multiplier = 1) {
        return this.speed * multiplier;
    }

    // === Leveling Methods (03-hero-stats) ===

    /**
     * Calculate XP needed for a specific level
     * @param {number} targetLevel
     * @returns {number}
     */
    getXPForLevel(targetLevel) {
        return Math.floor(this.xpToNextLevel * Math.pow(this.xpScaling, targetLevel - 1));
    }

    /**
     * Get total XP needed from level 1 to target
     * @param {number} targetLevel
     * @returns {number}
     */
    getTotalXPForLevel(targetLevel) {
        let total = 0;
        for (let i = 1; i < targetLevel; i++) {
            total += this.getXPForLevel(i);
        }
        return total;
    }

    // === Effective Stats (03-hero-stats, Phase 18 Equipment) ===

    /**
     * Get effective attack (base + level + equipment)
     * @returns {number}
     */
    getAttack() {
        const base = this.attack + (this.level - 1) * 2; // +2 per level
        const equipBonus = this.parent.equipment?.getStatBonus('damage') || 0;
        return base + equipBonus;
    }

    /**
     * Get effective defense (base + level + equipment armor)
     * @returns {number}
     */
    getDefense() {
        const base = this.defense + (this.level - 1) * 1; // +1 per level
        const equipBonus = this.parent.equipment?.getStatBonus('armor') || 0;
        return base + equipBonus;
    }

    /**
     * Get effective crit chance (base + equipment)
     * @returns {number} Percentage (0-100)
     */
    getCritChance() {
        const base = this.critChance * 100; // Convert decimal to %
        const equipBonus = this.parent.equipment?.getStatBonus('critChance') || 0;
        return base + equipBonus;
    }

    /**
     * Get effective attack range (base + equipment range bonuses)
     * Uses getStatBonus to sum all range contributions (allows future modifiers)
     * @returns {number} Pixels
     */
    getAttackRange() {
        const baseRange = 80; // Unarmed/default range
        const equipBonus = this.parent.equipment?.getStatBonus('range') || 0;
        return baseRange + equipBonus;
    }

    /**
     * Get the attack range for a specific weapon slot
     * @param {string} slotId - 'hand1' or 'hand2'
     * @returns {number} Pixels
     */
    getWeaponRange(slotId) {
        const baseRange = 80; // Unarmed/default range
        const item = this.parent.equipment?.getSlot?.(slotId);
        if (!item) return baseRange;
        return item.stats?.range || baseRange;
    }

    /**
     * Get effective attack rate (base + equipment)
     * @returns {number} Attacks per second
     */
    getAttackRate() {
        const base = this.parent.components?.combat?.rate || 1.0;
        const equipBonus = this.parent.equipment?.getStatBonus('attackRate') || 0;
        return base + equipBonus;
    }

    /**
     * Calculate damage after reduction from defense
     * @param {number} incomingDamage
     * @returns {number}
     */
    getDamageReduction(incomingDamage) {
        const reduction = this.getDefense() / (this.getDefense() + 100);
        return Math.floor(incomingDamage * (1 - reduction));
    }

    /**
     * Get current XP progress as percentage (0-1)
     * @returns {number}
     */
    getXPProgress() {
        const required = this.getXPForLevel(this.level);
        return this.xp / required;
    }
}

window.StatsComponent = StatsComponent;

