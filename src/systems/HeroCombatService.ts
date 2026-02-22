/**
 * HeroCombatService - Handles auto-targeting and attack execution
 *
 * Extracted from HeroSystem to reduce file size and improve maintainability.
 * Owner: HeroCombatService
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { AudioManager } from '../audio/AudioManager';
import { ProjectileVFX } from '@vfx/ProjectileVFX';
import { VFXConfig } from '@data/VFXConfig';
import { Registry } from '@core/Registry';
import { inputSystem } from '../input/InputSystem';
import { EntityTypes } from '@config/EntityTypes';
import { getWeaponStats } from '@data/GameConfig';
import { MathUtils } from '@core/MathUtils';
import { findTarget as findTargetFn } from './HeroCombatTargeting';

// Unmapped modules - need manual import
import type { Hero } from '../gameplay/Hero';
import type { IEntity } from '../types/core';
import type { Game } from '@core/Game';

const HeroCombatService = {
    game: null as Game | null,

    /**
     * Initialize service with game reference
     * @param {Game} game
     */
    init(game: Game) {
        this.game = game;
    },

    /**
     * Update combat logic: auto-targeting and attack execution
     * @param {number} dt - Delta time in ms
     */
    update(dt: number) {
        const hero = this.game?.hero as Hero | null;
        if (!hero) return;
        // Update attack timer
        if (hero.attackTimer > 0) {
            hero.attackTimer -= dt / 1000;
        }

        if (hero.components.combat) {
            const c = hero.components.combat;
            if (c.cooldownTimer > 0) {
                c.cooldownTimer -= dt / 1000;
                if (c.cooldownTimer <= 0) {
                    c.cooldownTimer = 0;
                    c.canAttack = true;
                }
            }
        }

        const target = findTargetFn(hero);

        // Auto-Attack
        if (target) {
            this.tryAttack(hero, target);
        } else {
            // Only reset attack state after animation completes
            if (hero.attackTimer <= 0) {
                hero.isAttacking = false;
                hero.targetResource = null;
            }
        }

        // Manual Interaction check (future expansion)
        if (
            inputSystem &&
            typeof inputSystem.hasIntent === 'function' &&
            inputSystem.hasIntent('INTERACT')
        ) {
            // Placeholder for interaction intent handling
        }
    },

    /**
     * Play muzzle flash for a specific weapon slot
     * Each weapon only attacks if target is within its range
     * @param {Hero} hero
     * @param {IEntity} target
     * @returns {boolean} Whether the target was killed
     */
    tryAttack(hero: Hero, target: IEntity) {
        if (!target || !target.active) return false;

        // Determine target type
        const isEnemy =
            target.constructor.name === 'Enemy' ||
            target.constructor.name === 'Boss' ||
            (target as unknown as { isBoss: boolean }).isBoss === true;
        const isDino =
            target.constructor.name === 'Dinosaur' || target.entityType === EntityTypes?.DINOSAUR;
        const isRangedTarget = isDino || isEnemy;

        // Skip if resource is depleted (but not for enemies/dinos)
        if (!isRangedTarget && (target as unknown as { state: string }).state === 'depleted') return false;
        // Skip if enemy is dead
        if (isEnemy && (target as unknown as { isDead: boolean }).isDead) return false;

        // Calculate distance to target
        const dist = MathUtils.distance(hero.x, hero.y, target.x, target.y);

        // Get equipped weapons from the active weapon set
        const activeWeapons = hero.equipment?.getActiveWeapons?.() || {};
        const hand1Item = activeWeapons.mainHand;
        const hand2Item = activeWeapons.offHand;
        const activeSlots = hero.equipment?.getActiveWeaponSlots?.() || {
            mainHand: 'hand1',
            offHand: 'hand2'
        };

        // Use getWeaponStats for consistent range (base + bonus)
        const hand1Range = hand1Item ? getWeaponStats(hand1Item).range : 80;
        const hand2Range = hand2Item ? getWeaponStats(hand2Item).range : 80;

        // For non-combat (mining), use mining range
        if (!isRangedTarget) {
            const miningRange = hero.miningRange || getConfig().Combat.DEFAULT_MINING_RANGE;
            if (dist > miningRange) return false;
        }

        // Determine which weapons can attack based on range
        const hand1InRange = isRangedTarget && !!hand1Item && dist <= hand1Range;
        const hand2InRange = isRangedTarget && !!hand2Item && dist <= hand2Range;

        // For ranged targets, at least one weapon must be in range
        if (isRangedTarget && !hand1InRange && !hand2InRange) return false;

        // Update Hero State for Renderer - per-weapon attack state
        hero.targetResource = target;
        hero.isAttacking = true;
        hero.hand1Attacking = hand1InRange;
        hero.hand2Attacking = hand2InRange;

        const combat = hero.components.combat;
        if (combat) {
            if (!combat.canAttack) return false;
            if (combat.staminaCost > 0 && hero.stamina !== undefined) {
                if (hero.stamina < combat.staminaCost) return false;
                hero.stamina -= combat.staminaCost;
                if (EventBus) {
                    EventBus.emit(GameConstants.Events.HERO_STAMINA_CHANGE, {
                        current: hero.stamina,
                        max: hero.maxStamina
                    });
                }
            }
            combat.cooldownTimer = 1 / combat.rate;
            combat.canAttack = false;
            hero.attackTimer = 1 / combat.rate;
        } else {
            if (hero.attackTimer > 0) return false;
            hero.attackTimer = GameConstants.Combat.ATTACK_COOLDOWN;
        }

        // Calculate total damage and play SFX/VFX
        const totalDmg = this._calculateTotalDamage(
            hero, target,
            hand1InRange, hand1Item, activeSlots.mainHand,
            hand2InRange, hand2Item, activeSlots.offHand,
            isRangedTarget, combat
        );

        // Legacy muzzle flash for ranged targets if neither weapon has ranged type
        if (isRangedTarget && !hand1InRange && !hand2InRange) {
            this.playMuzzleFlash(hero, target, isRangedTarget);
        }

        Logger.info(
            `[HeroCombatService] Attacking ${target.constructor.name}, damage: ${totalDmg} (H1:${hand1InRange}, H2:${hand2InRange})`
        );

        // Damage Logic
        // Damage Logic - Delegated to DamageSystem
        if (EventBus) {
            EventBus.emit(GameConstants.Events.ENTITY_DAMAGED, {
                entity: target,
                amount: totalDmg, // Use totalDmg
                source: hero,
                type: 'physical'
            });
        }

        const justKilled = false; // DamageSystem handles death, this is just for local return if needed
        // We assume false for now as death is async event

        // Spawn damage popup via EventBus; FloatingTextManager subscribes
        if (EventBus && totalDmg > 0) {
            EventBus.emit(GameConstants.Events.DAMAGE_NUMBER_REQUESTED, {
                x: target.x,
                y: target.y,
                amount: totalDmg,
                isCrit: false
            });
        }

        return justKilled;
    },

    /**
     * Play muzzle flash for a specific weapon slot
     * @param {Hero} hero
     * @param {IEntity} target
     * @param {string} slotId - 'hand1' or 'hand2'
     */
    playMuzzleFlashForSlot(hero: Hero, target: IEntity, slotId: string) {
        if (!ProjectileVFX) return;

        const item = hero.equipment?.getSlot?.(slotId);
        const weaponType = item?.weaponSubtype || 'pistol';

        ProjectileVFX.spawn({ x: hero.x, y: hero.y }, { x: target.x, y: target.y }, weaponType);
    },

    /**
     * Play muzzle flash and projectile VFX when attacking ranged targets
     * @param {Hero} hero
     * @param {IEntity} target
     * @param {boolean} isRangedTarget
     */
    playMuzzleFlash(hero: Hero, target: IEntity, isRangedTarget: boolean) {
        if (!isRangedTarget) return;

        // Use new ProjectileVFX system
        if (ProjectileVFX) {
            const weaponType = ProjectileVFX.getWeaponType(hero);
            ProjectileVFX.spawn({ x: hero.x, y: hero.y }, { x: target.x, y: target.y }, weaponType);
            return;
        }

        if (!VFXConfig) return;
        const cfg = (VFXConfig as unknown as { HERO: { MUZZLE_FLASH: { DISTANCE: number } } }).HERO.MUZZLE_FLASH;
        const dx = target.x - hero.x;
        const dy = target.y - hero.y;
        const angle = Math.atan2(dy, dx);
        const tipX = hero.x + Math.cos(angle) * cfg.DISTANCE;
        const tipY = hero.y + Math.sin(angle) * cfg.DISTANCE;
        const tvfx = (VFXConfig as unknown as { TEMPLATES: { MUZZLE_FLASH_FX: Record<string, unknown> } }).TEMPLATES;
        if (tvfx && tvfx.MUZZLE_FLASH_FX && EventBus) {
            const fx = { ...tvfx.MUZZLE_FLASH_FX, angle, spread: 1.0 };
            EventBus.emit(GameConstants.Events.VFX_PLAY_FOREGROUND, { x: tipX, y: tipY, options: fx });
        }
    },

    /**
     * Helper to compute total damage and trigger attack FX
     */
    _calculateTotalDamage(
        hero: Hero, target: IEntity,
        hand1InRange: boolean, hand1Item: unknown, hand1Slot: string,
        hand2InRange: boolean, hand2Item: unknown, hand2Slot: string,
        isRangedTarget: boolean, combat: unknown
    ): number {
        let totalDmg = 0;

        if (hand1InRange && hand1Item) {
            const h1 = hand1Item as { weaponType?: string };
            totalDmg += getWeaponStats(hand1Item).damage || 0;
            if (h1.weaponType === 'ranged') {
                this.playMuzzleFlashForSlot(hero, target, hand1Slot);
            }
            if (AudioManager) AudioManager.playSFX(h1.weaponType === 'ranged' ? 'sfx_hero_shoot' : 'sfx_hero_swing');
        }

        if (hand2InRange && hand2Item) {
            const h2 = hand2Item as { weaponType?: string };
            totalDmg += getWeaponStats(hand2Item).damage || 0;
            if (h2.weaponType === 'ranged') {
                this.playMuzzleFlashForSlot(hero, target, hand2Slot);
            }
            if (AudioManager && !hand1InRange) AudioManager.playSFX(h2.weaponType === 'ranged' ? 'sfx_hero_shoot' : 'sfx_hero_swing');
        }

        if (!isRangedTarget) {
            const combatComponent = combat as { damage: number } | undefined;
            totalDmg = combatComponent ? combatComponent.damage : getConfig().Combat.DEFAULT_DAMAGE;
            if (AudioManager) AudioManager.playSFX('sfx_hero_swing');
        }

        return totalDmg;
    }
};

// Export
if (Registry) Registry.register('HeroCombatService', HeroCombatService);

export { HeroCombatService };
