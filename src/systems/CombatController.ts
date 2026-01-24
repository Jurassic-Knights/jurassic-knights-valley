/**
 * CombatController - Manages combat targeting, attacks, and loot drops
 *
 * Extracted from Game.js to separate combat logic from the core game loop.
 * Handles auto-targeting, attack execution, and item spawning.
 *
 * Owner: Gameplay Engineer
 */

import { Logger } from '../core/Logger';
import { entityManager } from '../core/EntityManager';
import { Registry } from '../core/Registry';
import { heroSystem } from './HeroSystem';

// Reference entityManager as EntityManager for global usage pattern
const EntityManager = entityManager;

class CombatController {
    game: any = null;
    _logTimer: number = 0;

    constructor() {
        Logger.info('[CombatController] Constructed');
    }

    /**
     * Initialize with game reference
     * @param {Game} game
     */
    init(game: any) {
        this.game = game;
        Logger.info('[CombatController] Initialized');
    }

    /**
     * Update combat logic
     * @param {number} dt - Delta time
     */
    update(dt) {
        if (!this.game || !this.game.hero) return;

        // Debug Throttle (every ~60 frames)
        this._logTimer++;
        const doLog = this._logTimer % 60 === 0;

        const hero = this.game.hero;
        // Use EntityManager for efficient lookups
        const resources = EntityManager ? EntityManager.getByType('Resource') : [];
        const dinosaurs = EntityManager ? EntityManager.getByType('Dinosaur') : [];

        // Debug once per second
        if (doLog) {
            // Logger.info(`[CombatController] Entities - Resources: ${resources.length}, Dinos: ${dinosaurs.length}`);
        }

        const combat = hero.components && hero.components.combat;

        // Reset dinosaur attack flags
        for (const dino of dinosaurs) {
            if (dino.active) {
                dino.isBeingAttacked = false;
            }
        }

        // Find closest target (Resource or Dinosaur)
        let closestTarget = null;
        let closestDist = Infinity;
        let targetType = null;

        // Check resources (Mining Range)
        const miningDist = hero.miningRange || (combat ? combat.range : 75);
        let i = 0;
        for (const resource of resources) {
            // Must be active AND ready (not depleted)
            if (resource.active && resource.state === 'ready') {
                const dist = resource.distanceTo(hero);

                if (dist <= miningDist && dist < closestDist) {
                    closestDist = dist;
                    closestTarget = resource;
                    targetType = 'resource';
                }
            }
            i++;
        }

        // Check dinosaurs (Gun Range) - use stats component for equipped weapon range
        const gunDist = hero.stats?.getAttackRange?.() || (combat ? combat.range : 500);

        for (const dino of dinosaurs) {
            if (dino.active) {
                const dist = dino.distanceTo(hero);
                // Dinos are valid targets if within gun range (and not dead)
                if (dino.state !== 'dead' && dist <= gunDist && dist < closestDist) {
                    closestDist = dist;
                    closestTarget = dino;
                    targetType = 'dinosaur';
                }
            }
        }

        // Check enemies (highest priority - hostile entities)
        // Note: Use constructor.name ('Enemy', 'Boss') since entityType varies
        const enemies = EntityManager
            ? [...EntityManager.getByType('Enemy'), ...EntityManager.getByType('Boss')]
            : [];

        for (const enemy of enemies) {
            if (enemy.active && !enemy.isDead) {
                const dist = enemy.distanceTo
                    ? enemy.distanceTo(hero)
                    : Math.sqrt((enemy.x - hero.x) ** 2 + (enemy.y - hero.y) ** 2);
                // Enemies are valid targets within gun range
                if (dist <= gunDist && dist < closestDist) {
                    closestDist = dist;
                    closestTarget = enemy;
                    targetType = 'enemy';
                }
            }
        }

        // Auto-attack closest target
        if (closestTarget) {
            // Logger.info(`[Combat] Target found: ${targetType}`);
            // Freeze dinosaurs while being attacked
            if (targetType === 'dinosaur') {
                closestTarget.isBeingAttacked = true;
            }

            // Execute attack (Delegated to HeroSystem)
            let destroyed = false;
            if (heroSystem) {
                destroyed = heroSystem.tryAttack(hero, closestTarget);
            }

            if (destroyed) {
                this.handleTargetDestruction(closestTarget, targetType);
            }
        } else {
            hero.targetResource = null;
        }
    }

    /**
     * Handle logic when a target is destroyed (state updates, VFX)
     * NOTE: Drops are already created by Resource.takeDamage / DinosaurSystem
     * @param {Entity} target
     * @param {string} type - 'resource' or 'dinosaur'
     */
    handleTargetDestruction(target, type) {
        // Drops are handled by the entity's own takeDamage method
        // This method is now only used for any additional destruction effects
        // (Currently none - preserved for future extension like VFX, audio, etc.)
    }
}

// Create singleton and export
const combatController = new CombatController();

// Register at module load time
Registry.register('CombatController', combatController);

export { CombatController, combatController };
