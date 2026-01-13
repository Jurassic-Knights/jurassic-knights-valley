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
            hero.attackTimer -= (dt / 1000);
        }

        // Components update
        if (hero.components.combat) hero.components.combat.update(dt);

        // Find nearest valid target
        const target = this.findTarget(hero);

        // Auto-Attack
        if (target) {
            this.tryAttack(hero, target);
        } else {
            hero.isAttacking = false;
        }

        // Manual Interaction check (future expansion)
        if (window.InputSystem && typeof InputSystem.hasIntent === 'function' && InputSystem.hasIntent('INTERACT')) {
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
        const scanRange = hero.gunRange || GameConstants.Combat.DEFAULT_GUN_RANGE;

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
     * Attempt to attack a target
     * @param {Hero} hero 
     * @param {Entity} target 
     * @returns {boolean} Whether the target was killed
     */
    tryAttack(hero, target) {
        if (!target || !target.active) return false;

        // Determine target type
        const isEnemy = target.constructor.name === 'Enemy' ||
            target.constructor.name === 'Boss' ||
            target.isBoss === true;
        const isDino = target.constructor.name === 'Dinosaur' ||
            target.entityType === EntityTypes?.DINOSAUR;
        const isRangedTarget = isDino || isEnemy;

        // Skip if resource is depleted (but not for enemies/dinos)
        if (!isRangedTarget && target.state === 'depleted') return false;
        // Skip if enemy is dead
        if (isEnemy && target.isDead) return false;

        // Range check using squared distance
        const dx = hero.x - target.x;
        const dy = hero.y - target.y;
        const distSq = dx * dx + dy * dy;

        const combat = hero.components.combat;
        const effectiveRange = isRangedTarget
            ? (hero.gunRange || GameConstants.Combat.DEFAULT_GUN_RANGE)
            : (hero.miningRange || GameConstants.Combat.DEFAULT_MINING_RANGE);
        const rangeSq = effectiveRange * effectiveRange;

        if (distSq > rangeSq) return false;

        // Update Hero State for Renderer
        hero.targetResource = target;
        hero.isAttacking = true;

        // Combat Component Cooldown Check
        if (combat) {
            if (!combat.attack()) return false;
            hero.attackTimer = 1 / combat.rate;
        } else {
            if (hero.attackTimer > 0) return false;
            hero.attackTimer = 0.5;
        }

        // SFX
        if (window.AudioManager) {
            AudioManager.playSFX(isRangedTarget ? 'sfx_hero_shoot' : 'sfx_hero_swing');
        }

        // VFX: Muzzle Flash
        this.playMuzzleFlash(hero, target, isRangedTarget);

        // Damage Logic
        const dmg = combat ? combat.damage : GameConstants.Combat.DEFAULT_DAMAGE;
        Logger.info(`[HeroCombatService] Attacking ${target.constructor.name}, damage: ${dmg}`);

        let justKilled = false;
        if (isEnemy && target.takeDamage) {
            justKilled = target.takeDamage(dmg, hero);
        } else if (target.components && target.components.health) {
            justKilled = target.components.health.takeDamage(dmg);
        } else if (target.takeDamage) {
            justKilled = target.takeDamage(dmg);
        }

        return justKilled;
    },

    /**
     * Play muzzle flash VFX when attacking ranged targets
     * @param {Hero} hero 
     * @param {Entity} target 
     * @param {boolean} isRangedTarget 
     */
    playMuzzleFlash(hero, target, isRangedTarget) {
        if (!isRangedTarget || !window.VFXConfig || !this.game) return;

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
