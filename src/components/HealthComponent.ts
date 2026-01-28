/**
 * HealthComponent - Manages Health and Death
 */
import { Component } from '@core/Component';
import { Registry } from '@core/Registry';
import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';

class HealthComponent extends Component {
    maxHealth: number;
    health: number;
    isDead: boolean;

    constructor(parent: any, config: any = {}) {
        super(parent);
        // For hero, read from config; for others, use provided value
        const defaultMax = parent.id === 'hero' ? getConfig().Hero?.MAX_HEALTH || 100 : 100;
        this.maxHealth = config.maxHealth || defaultMax;
        this.health = config.health || this.maxHealth;
        this.isDead = false;
    }

    // Dynamic getter for hero max health (reads from config each call)
    getMaxHealth(): number {
        if (this.parent.id === 'hero') {
            return getConfig().Hero?.MAX_HEALTH || this.maxHealth;
        }
        return this.maxHealth;
    }

    takeDamage(amount: number) {
        if (this.isDead) return;

        Logger.info(`[HealthComponent] Before: ${this.health}/${this.maxHealth}, Dmg: ${amount}`);
        this.health -= amount;
        if (this.health < 0) this.health = 0;
        Logger.info(`[HealthComponent] After: ${this.health}/${this.maxHealth}`);

        if (this.parent.id === 'hero' && EventBus) {
            EventBus.emit(GameConstants.Events.HERO_HEALTH_CHANGE, {
                current: this.health,
                max: this.maxHealth
            });
        } else if (EventBus) {
            // Avoid recursion with DamageSystem
            EventBus.emit(GameConstants.Events.ENTITY_HEALTH_CHANGE, {
                entity: this.parent,
                current: this.health,
                max: this.maxHealth
            });
        }

        if (this.health <= 0) {
            this.die();
            // DamageSystem handles ENTITY_DIED event now
            // if (EventBus) {
            //     EventBus.emit('ENTITY_DIED', { entity: this.parent });
            // }
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
