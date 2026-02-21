/**
 * HeroCombatTargeting - Find nearest valid target for hero auto-attack
 */

import { entityManager } from '@core/EntityManager';
import { getConfig } from '@data/GameConstants';
import { getWeaponStats } from '@data/GameConfig';
import { MathUtils } from '@core/MathUtils';
import type { Hero } from '../gameplay/Hero';
import type { IEntity } from '../types/core';

/**
 * Find nearest valid target for auto-attacking.
 * Priority: Enemies > Dinosaurs > Resources
 */
export function findTarget(hero: Hero): IEntity | null {
    if (!entityManager) return null;

    let target: IEntity | null = null;
    let minDistSq = Infinity;

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
            if (!candidate.active || (candidate as unknown as { isDead: boolean }).isDead) continue;

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
            if (!candidate.active || (candidate as unknown as { state: string }).state === 'dead') continue;

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
            if (!candidate.active || (candidate as unknown as { state: string }).state === 'depleted') continue;

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
}
