/**
 * CombatComponent - Manages Attack Stats and Cooldowns
 */
class CombatComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        this.damage = config.damage || 10;
        this.rate = config.rate || 1; // Attacks per second
        this.range = config.range || 100;
        this.staminaCost = config.staminaCost || 0;

        this.cooldownTimer = 0;
        this.canAttack = true;
    }

    update(dt) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt / 1000;
            if (this.cooldownTimer <= 0) {
                this.cooldownTimer = 0;
                this.canAttack = true;
            }
        }
    }

    /**
     * Attempt to attack
     * @returns {boolean} True if attack started
     */
    attack() {
        if (!this.canAttack) return false;

        // Check Stamina if Hero
        if (this.staminaCost > 0 && this.parent.stamina !== undefined) {
            if (this.parent.stamina < this.staminaCost) return false;
            this.parent.stamina -= this.staminaCost;
            if (window.EventBus)
                EventBus.emit('HERO_STAMINA_CHANGE', {
                    current: this.parent.stamina,
                    max: this.parent.maxStamina
                });
        }

        // Start Cooldown
        this.cooldownTimer = 1 / this.rate;
        this.canAttack = false;

        return true;
    }
}

window.CombatComponent = CombatComponent;
if (window.Registry) Registry.register('CombatComponent', CombatComponent);

