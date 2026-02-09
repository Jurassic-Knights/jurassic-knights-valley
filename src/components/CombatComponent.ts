/**
 * CombatComponent - Data-only attack stats and cooldown state.
 * Systems (HeroCombatService, EnemySystem) perform cooldown tick and attack logic and emit events.
 */
import { Component } from '@core/Component';
import { Registry } from '@core/Registry';
import { getConfig } from '@data/GameConstants';
import { IEntity } from '../types/core';

export interface CombatConfig {
    damage?: number;
    rate?: number;
    range?: number;
    staminaCost?: number;
}

export interface ICombatant extends IEntity {
    stamina?: number;
    maxStamina?: number;
}

class CombatComponent extends Component {
    damage: number;
    rate: number;
    range: number;
    staminaCost: number;
    cooldownTimer: number;
    canAttack: boolean;
    declare parent: ICombatant;

    constructor(parent: ICombatant, config: CombatConfig = {}) {
        super(parent);
        const C = getConfig().Combat;
        this.damage = config.damage ?? C.DEFAULT_DAMAGE;
        this.rate = config.rate ?? C.DEFAULT_ATTACK_RATE;
        this.range = config.range ?? C.DEFAULT_ATTACK_RANGE;
        this.staminaCost = config.staminaCost ?? 0;
        this.cooldownTimer = 0;
        this.canAttack = true;
    }
}

if (Registry) Registry.register('CombatComponent', CombatComponent);

export { CombatComponent };
