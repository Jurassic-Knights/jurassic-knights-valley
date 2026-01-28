/**
 * HeroCombatService - Handles auto-targeting and attack execution
 *
 * Extracted from HeroSystem to reduce file size and improve maintainability.
 * Owner: HeroCombatService
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { entityManager } from '@core/EntityManager';
import { GameConstants, getConfig } from '@data/GameConstants';
import { AudioManager } from '../audio/AudioManager';
import { ProjectileVFX } from '@vfx/ProjectileVFX';
import { VFXConfig } from '@data/VFXConfig';
import { FloatingTextManager } from '@vfx/FloatingText';
import { Registry } from '@core/Registry';
import { inputSystem } from '../input/InputSystem';
import { EntityTypes } from '@config/EntityTypes';
import { getWeaponStats } from '@data/GameConfig';
import { MathUtils } from '@core/MathUtils';

// Unmapped modules - need manual import

const HeroCombatService = {
    game: null as any,

    /**
     * Initialize service with game reference
     * @param {Game} game
     */
    init(game) {
        this.game = game;
    },

    /**
     * Update combat logic: auto-targeting and attack execution
     * @param {number} dt - Delta time in ms
     * @param {Hero} hero
     */
    update(dt, hero) {
        // Update attack timer
        if (hero.attackTimer > 0) {
            hero.attackTimer -= dt / 1000;
        }

        // Components update
        if (hero.components.combat) hero.components.combat.update(dt);

        // Find nearest valid target
        const target = this.findTarget(hero);

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
     * Find nearest valid target for auto-attacking
     * Priority: Enemies > Dinosaurs > Resources
     * @param {Hero} hero
     * @returns {Entity|null}
     */
    findTarget(hero) {
        if (!entityManager) return null;

        let target = null;
        let minDistSq = Infinity;

        // Compute scan range as max of equipped weapon ranges using getWeaponStats
        const activeWeapons = hero.equipment?.getActiveWeapons?.() || {};
        const hand1Range = activeWeapons.mainHand
            ? getWeaponStats(activeWeapons.mainHand).range
            : 0;
        const hand2Range = activeWeapons.offHand ? getWeaponStats(activeWeapons.offHand).range : 0;
        const scanRange = Math.max(
            hand1Range,
            hand2Range,
            getConfig().Combat.DEFAULT_MINING_RANGE || 125
        );

        // Check Enemies (HIGHEST Priority)
        const enemyTypes = ['Enemy', 'Boss'];
        for (const enemyType of enemyTypes) {
            const candidates = entityManager.getByType(enemyType);
            for (const candidate of candidates) {
                if (!candidate.active || candidate.isDead) continue;

                const distSq = MathUtils.distanceSq(hero.x, hero.y, candidate.x, candidate.y);
                const rangeSq = scanRange * scanRange;

                if (distSq <= rangeSq && distSq < minDistSq) {
                    minDistSq = distSq;
                    target = candidate;
                }
            }
        }

        // Check Dinosaurs (Second Priority)
        if (!target) {
            const candidates = entityManager.getInRadius(hero.x, hero.y, scanRange, 'Dinosaur');
            for (const candidate of candidates) {
                if (!candidate.active || candidate.state === 'dead') continue;

                const dx = candidate.x - hero.x;
                const dy = candidate.y - hero.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    target = candidate;
                }
            }
        }

        // Check Resources (Lowest Priority, mining)
        if (!target) {
            const miningRange = hero.miningRange || getConfig().Combat.DEFAULT_MINING_RANGE;
            const candidates = entityManager.getInRadius(hero.x, hero.y, miningRange, 'Resource');
            for (const candidate of candidates) {
                if (!candidate.active || candidate.state === 'depleted') continue;

                const dx = candidate.x - hero.x;
                const dy = candidate.y - hero.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < minDistSq) {
                    minDistSq = distSq;
                    target = candidate;
                }
            }
        }

        return target;
    },

    /**
     * Attempt to attack a target with each equipped weapon independently
     * Each weapon only attacks if target is within its range
     * @param {Hero} hero
     * @param {Entity} target
     * @returns {boolean} Whether the target was killed
     */
    tryAttack(hero, target) {
        if (!target || !target.active) return false;

        // Determine target type
        const isEnemy =
            target.constructor.name === 'Enemy' ||
            target.constructor.name === 'Boss' ||
            target.isBoss === true;
        const isDino =
            target.constructor.name === 'Dinosaur' || target.entityType === EntityTypes?.DINOSAUR;
        const isRangedTarget = isDino || isEnemy;

        // Skip if resource is depleted (but not for enemies/dinos)
        if (!isRangedTarget && target.state === 'depleted') return false;
        // Skip if enemy is dead
        if (isEnemy && target.isDead) return false;

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
        const hand1InRange = isRangedTarget && hand1Item && dist <= hand1Range;
        const hand2InRange = isRangedTarget && hand2Item && dist <= hand2Range;

        // For ranged targets, at least one weapon must be in range
        if (isRangedTarget && !hand1InRange && !hand2InRange) return false;

        // Update Hero State for Renderer - per-weapon attack state
        hero.targetResource = target;
        hero.isAttacking = true;
        hero.hand1Attacking = hand1InRange;
        hero.hand2Attacking = hand2InRange;

        // Combat Component Cooldown Check
        const combat = hero.components.combat;
        if (combat) {
            if (!combat.attack()) return false;
            hero.attackTimer = 1 / combat.rate;
        } else {
            if (hero.attackTimer > 0) return false;
            hero.attackTimer = 0.5;
        }

        // Calculate total damage from weapons in range
        let totalDmg = 0;

        // Hand1 Attack
        if (hand1InRange) {
            const weaponStats = getWeaponStats(hand1Item);
            const weaponDmg = weaponStats.damage;
            totalDmg += weaponDmg;

            // VFX: Per-weapon muzzle flash
            if (hand1Item.weaponType === 'ranged') {
                this.playMuzzleFlashForSlot(hero, target, activeSlots.mainHand);
            }

            // SFX based on weapon type
            if (AudioManager) {
                AudioManager.playSFX(
                    hand1Item.weaponType === 'ranged' ? 'sfx_hero_shoot' : 'sfx_hero_swing'
                );
            }
        }

        // Hand2 Attack
        if (hand2InRange) {
            const weaponStats = getWeaponStats(hand2Item);
            const weaponDmg = weaponStats.damage;
            totalDmg += weaponDmg;

            // VFX: Per-weapon muzzle flash
            if (hand2Item.weaponType === 'ranged') {
                this.playMuzzleFlashForSlot(hero, target, activeSlots.offHand);
            }

            // SFX based on weapon type (only if different from hand1)
            if (AudioManager && !hand1InRange) {
                AudioManager.playSFX(
                    hand2Item.weaponType === 'ranged' ? 'sfx_hero_shoot' : 'sfx_hero_swing'
                );
            }
        }

        // Fallback for non-ranged targets (mining)
        if (!isRangedTarget) {
            totalDmg = combat ? combat.damage : getConfig().Combat.DEFAULT_DAMAGE;
            if (AudioManager) {
                AudioManager.playSFX('sfx_hero_swing');
            }
        }

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

        // Spawn damage popup
        if (FloatingTextManager && totalDmg > 0) {
            FloatingTextManager.showDamage(target.x, target.y, totalDmg, false);
        }

        return justKilled;
    },

    /**
     * Play muzzle flash for a specific weapon slot
     * @param {Hero} hero
     * @param {Entity} target
     * @param {string} slotId - 'hand1' or 'hand2'
     */
    playMuzzleFlashForSlot(hero, target, slotId) {
        if (!ProjectileVFX) return;

        const item = hero.equipment?.getSlot?.(slotId);
        const weaponType = item?.weaponSubtype || 'pistol';

        ProjectileVFX.spawn({ x: hero.x, y: hero.y }, { x: target.x, y: target.y }, weaponType);
    },

    /**
     * Play muzzle flash and projectile VFX when attacking ranged targets
     * @param {Hero} hero
     * @param {Entity} target
     * @param {boolean} isRangedTarget
     */
    playMuzzleFlash(hero, target, isRangedTarget) {
        if (!isRangedTarget) return;

        // Use new ProjectileVFX system
        if (ProjectileVFX) {
            const weaponType = ProjectileVFX.getWeaponType(hero);
            ProjectileVFX.spawn({ x: hero.x, y: hero.y }, { x: target.x, y: target.y }, weaponType);
            return;
        }

        // Fallback to legacy VFX system
        if (!VFXConfig || !this.game) return;

        const vfxController = this.game.getSystem('VFXController');
        if (!vfxController) return;

        const cfg = VFXConfig.HERO.MUZZLE_FLASH;
        const dx = target.x - hero.x;
        const dy = target.y - hero.y;
        const angle = Math.atan2(dy, dx);
        const tipX = hero.x + Math.cos(angle) * cfg.DISTANCE;
        const tipY = hero.y + Math.sin(angle) * cfg.DISTANCE;

        if (VFXConfig.TEMPLATES.MUZZLE_FLASH_FX) {
            const fx = { ...VFXConfig.TEMPLATES.MUZZLE_FLASH_FX, angle: angle, spread: 1.0 };
            vfxController.playForeground(tipX, tipY, fx);
        }
    }
};

// Export
if (Registry) Registry.register('HeroCombatService', HeroCombatService);

export { HeroCombatService };
