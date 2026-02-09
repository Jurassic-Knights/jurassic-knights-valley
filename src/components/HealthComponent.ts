/**
 * HealthComponent - Data-only health state.
 * Systems (DamageSystem, etc.) apply damage/heal and emit events.
 */
import { Component } from '@core/Component';
import { Registry } from '@core/Registry';
import { getConfig } from '@data/GameConstants';
import type { IEntity } from '../types/core';

interface HealthComponentConfig {
    maxHealth?: number;
    health?: number;
}

class HealthComponent extends Component {
    maxHealth: number;
    health: number;
    isDead: boolean;

    constructor(parent: IEntity | null, config: HealthComponentConfig = {}) {
        super(parent);
        // For hero, read from config; for others, use provided value
        const defaultMax = parent.id === 'hero' ? getConfig().Hero.MAX_HEALTH : getConfig().Combat.DEFAULT_MAX_HEALTH_NPC;
        this.maxHealth = config.maxHealth || defaultMax;
        this.health = config.health || this.maxHealth;
        this.isDead = false;
    }

    // Dynamic getter for hero max health (reads from config each call)
    getMaxHealth(): number {
        if (this.parent.id === 'hero') {
            return getConfig().Hero.MAX_HEALTH ?? this.maxHealth;
        }
        return this.maxHealth;
    }

    /** Data-only: apply damage and clamp. Caller (e.g. DamageSystem) must emit health/death events. */
    takeDamage(amount: number): boolean {
        if (this.isDead) return false;
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) this.die();
        return this.health <= 0;
    }

    damage(amount: number) {
        this.takeDamage(amount);
    }

    /** Data-only: apply heal and clamp. Caller must emit HERO_HEALTH_CHANGE / ENTITY_HEALTH_CHANGE if needed. */
    heal(amount: number) {
        if (this.isDead) return;
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /** Data-only: set dead state. Caller must emit ENTITY_DIED / HERO_DIED as appropriate. */
    die() {
        this.isDead = true;
        this.health = 0;
    }

    /** Data-only: reset to alive and full health. Caller must emit HERO_HEALTH_CHANGE if hero. */
    respawn() {
        this.isDead = false;
        this.health = this.maxHealth;
    }
}

if (Registry) Registry.register('HealthComponent', HealthComponent);

export { HealthComponent };
