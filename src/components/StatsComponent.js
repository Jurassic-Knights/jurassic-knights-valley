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
        this.attack = config.attack || 10;           // Base attack power (03-hero-stats)
        this.critMultiplier = config.critMultiplier || 1.5;  // (03-hero-stats)

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
                EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, { current: this.stamina, max: this.maxStamina });
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
            EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, { current: this.stamina, max: this.maxStamina });
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

    // === Effective Stats (03-hero-stats) ===

    /**
     * Get effective attack (with level scaling)
     * @returns {number}
     */
    getAttack() {
        return this.attack + (this.level - 1) * 2; // +2 per level
    }

    /**
     * Get effective defense (with level scaling)
     * @returns {number}
     */
    getDefense() {
        return this.defense + (this.level - 1) * 1; // +1 per level
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

