/**
 * StatsComponent
 * managed generic RPG stats for an entity (Hero, Dinosaur, Army Unit).
 * 
 * Properties:
 * - Speed (Movement)
 * - Stamina (Action points)
 * - CritChance (Combat)
 * - Defense (Mitigation)
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

        // Combat Stats (Optional, could remain in CombatComponent or move here)
        this.critChance = config.critChance || 0;
        this.defense = config.defense || 0;

        console.log(`[StatsComponent] Attached to ${parent.constructor.name}`);
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
}

window.StatsComponent = StatsComponent;
