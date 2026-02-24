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
import type { IEntity } from '../../types/core';

/** Entity with optional AI/combat props used by BaseAI */
type AIEntity = IEntity & { aggroRange?: number; attackRange?: number; leashDistance?: number; patrolRadius?: number; spawnX?: number; spawnY?: number; facingRight?: boolean; moveAlongPath?(tx: number, ty: number, speed: number, dt: number): boolean };

const BaseAI = {
    /**
     * Check if entity can see target (within aggro range)
     */
    canSee(entity: AIEntity, target: IEntity | null) {
        if (!target || entity.isDead) return false;
        const range = entity.aggroRange || getConfig().AI?.AGGRO_RANGE || 500;
        return this.distanceTo(entity, target) <= range;
    },

    /**
     * Calculate distance between two entities
     */
    distanceTo(entity: IEntity, target: IEntity) {
        return MathUtils.distance(entity.x, entity.y, target.x, target.y);
    },

    /**
     * Check if entity is within leash distance of spawn
     */
    isWithinLeash(entity: AIEntity) {
        const sx = entity.spawnX ?? entity.x;
        const sy = entity.spawnY ?? entity.y;
        const dist = MathUtils.distance(entity.x, entity.y, sx, sy);
        const leash = entity.leashDistance || getConfig().AI?.LEASH_DISTANCE || 800;
        return dist <= (leash as number);
    },

    /**
     * Check if target is within attack range
     */
    inAttackRange(entity: AIEntity, target: IEntity | null) {
        if (!target) return false;
        return this.distanceTo(entity, target) <= (entity.attackRange || 100);
    },

    /**
     * Move entity towards a target position
     */
    moveTowards(entity: AIEntity & { x: number; y: number }, targetX: number, targetY: number, speed: number, dt: number) {
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
    moveAlongPath(entity: AIEntity, targetX: number, targetY: number, speed: number, dt: number) {
        if (typeof entity.moveAlongPath === 'function') {
            return entity.moveAlongPath(targetX, targetY, speed, dt);
        }
        return this.moveTowards(entity, targetX, targetY, speed, dt);
    },

    /**
     * Pick a random wander target within patrol radius
     */
    getRandomWanderTarget(entity: AIEntity) {
        const angle = Math.random() * Math.PI * 2;
        const radius = entity.patrolRadius || getConfig().AI?.PATROL_AREA_RADIUS || 400;
        const dist = Math.random() * (radius as number) * 0.5;
        const sx = entity.spawnX ?? entity.x;
        const sy = entity.spawnY ?? entity.y;
        return {
            x: sx + Math.cos(angle) * dist,
            y: sy + Math.sin(angle) * dist
        };
    }
};

// ES6 Module Export
export { BaseAI };
