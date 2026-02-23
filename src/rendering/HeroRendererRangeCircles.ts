/**
 * HeroRendererRangeCircles - Attack range circle drawing
 */
import { entityManager } from '@core/EntityManager';
import { EntityTypes } from '@config/EntityTypes';
import { ColorPalette } from '@config/ColorPalette';
import { getWeaponStats } from '@data/GameConfig';
import type { Hero } from '../gameplay/Hero';

export function drawRangeCircles(ctx: CanvasRenderingContext2D, hero: Hero): void {
    const detectionRange = 1300;
    let hasNearbyEnemy = false;

    const allEntities = entityManager?.getAll?.() || [];
    for (const entity of allEntities) {
        if (!entity.active) continue;

        const isEnemy =
            entity.entityType === EntityTypes?.ENEMY_DINOSAUR ||
            entity.entityType === EntityTypes?.ENEMY_SOLDIER ||
            entity.constructor?.name === 'Enemy' ||
            entity.constructor?.name === 'Boss';
        if (!isEnemy) continue;

        const dx = entity.x - hero.x;
        const dy = entity.y - hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= detectionRange) {
            hasNearbyEnemy = true;
            break;
        }
    }
    if (!hasNearbyEnemy) return;

    const activeWeapons = (hero.equipment?.getActiveWeapons?.() as {
        mainHand?: { gripType?: string; weaponType?: string; weaponSubtype?: string; stats?: any };
        offHand?: { gripType?: string; weaponType?: string; weaponSubtype?: string; stats?: any };
    }) || {};
    const hand1Item = activeWeapons.mainHand;
    const hand2Item = activeWeapons.offHand;

    if (!hand1Item && !hand2Item) return;

    const is2H = hand1Item?.gripType === '2-hand';
    const hand1Range = hand1Item ? getWeaponStats(hand1Item).range : 0;
    const hand2Range = !is2H && hand2Item ? getWeaponStats(hand2Item).range : 0;

    if (hand1Range && hand2Range) {
        const hand1IsInner = hand1Range <= hand2Range;
        drawSingleRangeCircle(ctx, hero, hand1Range, hand1IsInner);
        drawSingleRangeCircle(ctx, hero, hand2Range, !hand1IsInner);
    } else if (hand1Range) {
        drawSingleRangeCircle(ctx, hero, hand1Range, true);
    } else if (hand2Range) {
        drawSingleRangeCircle(ctx, hero, hand2Range, true);
    }
}

function drawSingleRangeCircle(
    ctx: CanvasRenderingContext2D,
    hero: Hero,
    range: number,
    isInner = false
): void {
    const color = ColorPalette.GRAY_LIGHT;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = isInner ? 2.5 : 1.5;
    ctx.shadowColor = ColorPalette.WHITE;
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.arc(hero.x, hero.y, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}
