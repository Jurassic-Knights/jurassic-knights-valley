/**
 * HealthComponent - Manages Health and Death
 */
class HealthComponent extends Component {
    constructor(parent, config = {}) {
        super(parent);
        this.maxHealth = config.maxHealth || 100;
        this.health = config.health || this.maxHealth;
        this.isDead = false;
    }

    takeDamage(amount) {
        if (this.isDead) return;

        this.health -= amount;

        // Clamp
        if (this.health < 0) this.health = 0;

        // Emit Event (Local or Global?)
        // Global is easier for UI
        if (this.parent.id === 'hero' && window.EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        } else if (window.EventBus) {
            EventBus.emit('ENTITY_DAMAGED', {
                entity: this.parent,
                amount: amount,
                current: this.health,
                max: this.maxHealth
            });
        }

        if (this.health <= 0) {
            this.die();
            if (window.EventBus) {
                EventBus.emit('ENTITY_DIED', { entity: this.parent });
            }
            return true; // Killed
        }
        return false;
    }

    heal(amount) {
        if (this.isDead) return;

        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;

        if (this.parent.id === 'hero' && window.EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        }
    }

    die() {
        this.isDead = true;
        this.health = 0;
        // Parent handle death?
    }

    respawn() {
        this.isDead = false;
        this.health = this.maxHealth;
        if (this.parent.id === 'hero' && window.EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        }
    }
}

window.HealthComponent = HealthComponent;
if (window.Registry) Registry.register('HealthComponent', HealthComponent);

// ES6 Module Export
export { HealthComponent };
