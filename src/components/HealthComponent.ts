/**
 * HealthComponent - Manages Health and Death
 */
import { Component } from '../core/Component';
import { Registry } from '../core/Registry';
import { EventBus } from '../core/EventBus';
import { GameConstants } from '../data/GameConstants';

class HealthComponent extends Component {
    maxHealth: number;
    health: number;
    isDead: boolean;

    constructor(parent: any, config: any = {}) {
        super(parent);
        this.maxHealth = config.maxHealth || 100;
        this.health = config.health || this.maxHealth;
        this.isDead = false;
    }

    takeDamage(amount: number) {
        if (this.isDead) return;

        this.health -= amount;
        if (this.health < 0) this.health = 0;

        if (this.parent.id === 'hero' && EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        } else if (EventBus) {
            EventBus.emit('ENTITY_DAMAGED', {
                entity: this.parent,
                amount: amount,
                current: this.health,
                max: this.maxHealth
            });
        }

        if (this.health <= 0) {
            this.die();
            if (EventBus) {
                EventBus.emit('ENTITY_DIED', { entity: this.parent });
            }
            return true;
        }
        return false;
    }

    heal(amount: number) {
        if (this.isDead) return;
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;

        if (this.parent.id === 'hero' && EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        }
    }

    die() {
        this.isDead = true;
        this.health = 0;
    }

    respawn() {
        this.isDead = false;
        this.health = this.maxHealth;
        if (this.parent.id === 'hero' && EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        }
    }
}

if (Registry) Registry.register('HealthComponent', HealthComponent);

export { HealthComponent };
