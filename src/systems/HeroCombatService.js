/**
 * HeroCombatService - Handles auto-targeting and attack execution
 *
 * Extracted from HeroSystem to reduce file size and improve maintainability.
 * Owner: HeroCombatService
 */

const HeroCombatService = {
    game: null,

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
            window.InputSystem &&
            typeof InputSystem.hasIntent === 'function' &&
            InputSystem.hasIntent('INTERACT')
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
        if (!window.EntityManager) return null;

        let target = null;
        let minDistSq = Infinity;
        const scanRange = hero.stats?.getAttackRange?.() || GameConstants.Combat.DEFAULT_GUN_RANGE;

        // Check Enemies (HIGHEST Priority)
        const enemyTypes = ['Enemy', 'Boss'];
        for (const enemyType of enemyTypes) {
            const candidates = EntityManager.getByType(enemyType);
            for (const candidate of candidates) {
                if (!candidate.active || candidate.isDead) continue;

                const dx = candidate.x - hero.x;
                const dy = candidate.y - hero.y;
                const distSq = dx * dx + dy * dy;
                const rangeSq = scanRange * scanRange;

                if (distSq <= rangeSq && distSq < minDistSq) {
                    minDistSq = distSq;
                    target = candidate;
                }
            }
        }

        // Check Dinosaurs (Second Priority)
        if (!target) {
            const candidates = EntityManager.getInRadius(hero.x, hero.y, scanRange, 'Dinosaur');
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
            const miningRange = hero.miningRange || GameConstants.Combat.DEFAULT_MINING_RANGE;
            const candidates = EntityManager.getInRadius(hero.x, hero.y, miningRange, 'Resource');
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
        const dx = hero.x - target.x;
        const dy = hero.y - target.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Get equipped weapons from the active weapon set
        const activeWeapons = hero.equipment?.getActiveWeapons?.() || {};
        const hand1Item = activeWeapons.mainHand;
        const hand2Item = activeWeapons.offHand;
        const activeSlots = hero.equipment?.getActiveWeaponSlots?.() || { mainHand: 'hand1', offHand: 'hand2' };
        const hand1Range = hero.stats?.getWeaponRange?.(activeSlots.mainHand) || 80;
        const hand2Range = hero.stats?.getWeaponRange?.(activeSlots.offHand) || 80;

        // For non-combat (mining), use mining range
        if (!isRangedTarget) {
            const miningRange = hero.miningRange || GameConstants.Combat.DEFAULT_MINING_RANGE;
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
            const weaponDmg = hand1Item.stats?.damage || (combat?.damage || GameConstants.Combat.DEFAULT_DAMAGE);
            totalDmg += weaponDmg;

            // VFX: Per-weapon muzzle flash
            if (hand1Item.weaponType === 'ranged') {
                this.playMuzzleFlashForSlot(hero, target, activeSlots.mainHand);
            }

            // SFX based on weapon type
            if (window.AudioManager) {
                AudioManager.playSFX(hand1Item.weaponType === 'ranged' ? 'sfx_hero_shoot' : 'sfx_hero_swing');
            }
        }

        // Hand2 Attack  
        if (hand2InRange) {
            const weaponDmg = hand2Item.stats?.damage || (combat?.damage || GameConstants.Combat.DEFAULT_DAMAGE);
            totalDmg += weaponDmg;

            // VFX: Per-weapon muzzle flash
            if (hand2Item.weaponType === 'ranged') {
                this.playMuzzleFlashForSlot(hero, target, activeSlots.offHand);
            }

            // SFX based on weapon type (only if different from hand1)
            if (window.AudioManager && !hand1InRange) {
                AudioManager.playSFX(hand2Item.weaponType === 'ranged' ? 'sfx_hero_shoot' : 'sfx_hero_swing');
            }
        }

        // Fallback for non-ranged targets (mining)
        if (!isRangedTarget) {
            totalDmg = combat ? combat.damage : GameConstants.Combat.DEFAULT_DAMAGE;
            if (window.AudioManager) {
                AudioManager.playSFX('sfx_hero_swing');
            }
        }

        // Legacy muzzle flash for ranged targets if neither weapon has ranged type
        if (isRangedTarget && !hand1InRange && !hand2InRange) {
            this.playMuzzleFlash(hero, target, isRangedTarget);
        }

        Logger.info(`[HeroCombatService] Attacking ${target.constructor.name}, damage: ${totalDmg} (H1:${hand1InRange}, H2:${hand2InRange})`);

        // Damage Logic
        let justKilled = false;
        if (isEnemy && target.takeDamage) {
            justKilled = target.takeDamage(totalDmg, hero);
        } else if (target.components && target.components.health) {
            justKilled = target.components.health.takeDamage(totalDmg);
        } else if (target.takeDamage) {
            justKilled = target.takeDamage(totalDmg);
        }

        // Spawn damage popup
        if (window.FloatingTextManager && totalDmg > 0) {
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
        if (!window.ProjectileVFX) return;

        const item = hero.equipment?.getSlot?.(slotId);
        const weaponType = item?.weaponSubtype || 'pistol';

        ProjectileVFX.spawn(
            { x: hero.x, y: hero.y },
            { x: target.x, y: target.y },
            weaponType
        );
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
        if (window.ProjectileVFX) {
            const weaponType = ProjectileVFX.getWeaponType(hero);
            ProjectileVFX.spawn(
                { x: hero.x, y: hero.y },
                { x: target.x, y: target.y },
                weaponType
            );
            return;
        }

        // Fallback to legacy VFX system
        if (!window.VFXConfig || !this.game) return;

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
window.HeroCombatService = HeroCombatService;
if (window.Registry) Registry.register('HeroCombatService', HeroCombatService);

// ES6 Module Export
export { HeroCombatService };
