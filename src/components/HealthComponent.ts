/**
 * HealthComponent - Data-only health state.
 * Systems (DamageSystem, etc.) apply damage/heal and emit events.
 */
import { Component } from '@core/Component';
import { Registry } from '@core/Registry';
import { getConfig } from '@data/GameConstants';
import { EntityTypes } from '@config/EntityTypes';
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
        const defaultMax = parent?.entityType === EntityTypes.HERO ? getConfig().Hero.MAX_HEALTH : getConfig().Combat.DEFAULT_MAX_HEALTH_NPC;
        this.maxHealth = config.maxHealth || defaultMax;
        this.health = config.health || this.maxHealth;
        this.isDead = false;
    }

    /** Returns max health; for hero reads from config each call. */
    getMaxHealth(): number {
        if (this.parent?.entityType === EntityTypes.HERO) {
            return getConfig().Hero.MAX_HEALTH ?? this.maxHealth;
        }
        return this.maxHealth;
    }
}

if (Registry) Registry.register('HealthComponent', HealthComponent);

export { HealthComponent };
