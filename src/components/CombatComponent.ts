/**
 * CombatComponent - Manages Attack Stats and Cooldowns
 */
class CombatComponent extends Component {
    constructor(parent: any, config: any = {}) {
        super(parent);
        this.damage = config.damage || 10;
        this.rate = config.rate || 1;
        this.range = config.range || 100;
        this.staminaCost = config.staminaCost || 0;
        this.cooldownTimer = 0;
        this.canAttack = true;
    }

    update(dt: number) {
        if (this.cooldownTimer > 0) {
            this.cooldownTimer -= dt / 1000;
            if (this.cooldownTimer <= 0) {
                this.cooldownTimer = 0;
                this.canAttack = true;
            }
        }
    }

    attack() {
        if (!this.canAttack) return false;

        if (this.staminaCost > 0 && this.parent.stamina !== undefined) {
            if (this.parent.stamina < this.staminaCost) return false;
            this.parent.stamina -= this.staminaCost;
            if (EventBus)
                EventBus.emit('HERO_STAMINA_CHANGE', {
                    current: this.parent.stamina,
                    max: this.parent.maxStamina
                });
        }

        this.cooldownTimer = 1 / this.rate;
        this.canAttack = false;
        return true;
    }
}

if (Registry) Registry.register('CombatComponent', CombatComponent);

export { CombatComponent };
