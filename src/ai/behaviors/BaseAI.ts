/**
 * BaseAI - Shared AI utility functions
 *
 * Provides common methods used by all AI behavior modules:
 * - Distance calculations
 * - Line of sight checks
 * - Movement helpers
 *
 * Owner: AI System
 */

import { getConfig } from '@data/GameConfig';
import { MathUtils } from '@core/MathUtils';

const BaseAI = {
    /**
     * Check if entity can see target (within aggro range)
     */
    canSee(entity: any, target: any) {
        if (!target || entity.isDead) return false;
        const range = entity.aggroRange || getConfig().AI?.AGGRO_RANGE || 500;
        return this.distanceTo(entity, target) <= range;
    },

    /**
     * Calculate distance between two entities
     */
    distanceTo(entity: any, target: any) {
        return MathUtils.distance(entity.x, entity.y, target.x, target.y);
    },

    /**
     * Check if entity is within leash distance of spawn
     */
    isWithinLeash(entity: any) {
        const dist = MathUtils.distance(entity.x, entity.y, entity.spawnX, entity.spawnY);
        const leash = entity.leashDistance || getConfig().AI?.LEASH_DISTANCE || 800;
        return dist <= leash;
    },

    /**
     * Check if target is within attack range
     */
    inAttackRange(entity: any, target: any) {
        if (!target) return false;
        return this.distanceTo(entity, target) <= (entity.attackRange || 100);
    },

    /**
     * Move entity towards a target position
     */
    moveTowards(entity: any, targetX: number, targetY: number, speed: number, dt: number) {
        const dx = targetX - entity.x;
        const dy = targetY - entity.y;
        const dist = MathUtils.distance(entity.x, entity.y, targetX, targetY);

        if (dist < 10) return true; // Arrived

        const moveSpeed = speed * (dt / 1000);
        entity.x += (dx / dist) * moveSpeed;
        entity.y += (dy / dist) * moveSpeed;
        entity.facingRight = dx > 0;

        return false;
    },

    /**
     * Move using pathfinding if available, else direct movement
     */
    moveAlongPath(entity: any, targetX: number, targetY: number, speed: number, dt: number) {
        if (typeof entity.moveAlongPath === 'function') {
            return entity.moveAlongPath(targetX, targetY, speed, dt);
        }
        return this.moveTowards(entity, targetX, targetY, speed, dt);
    },

    /**
     * Pick a random wander target within patrol radius
     */
    getRandomWanderTarget(entity: any) {
        const angle = Math.random() * Math.PI * 2;
        const radius = entity.patrolRadius || getConfig().AI?.PATROL_AREA_RADIUS || 400;
        const dist = Math.random() * radius * 0.5;
        return {
            x: entity.spawnX + Math.cos(angle) * dist,
            y: entity.spawnY + Math.sin(angle) * dist
        };
    }
};

// ES6 Module Export
export { BaseAI };
