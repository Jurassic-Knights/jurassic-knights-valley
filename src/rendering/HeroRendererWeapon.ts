/**
 * HeroRendererWeapon - Weapon and tool drawing for hero
 */
import { MathUtils } from '@core/MathUtils';
import { WeaponRenderer } from './WeaponRenderer';
import { EntityTypes } from '@config/EntityTypes';
import type { Hero } from '../gameplay/Hero';

export function drawWeapon(ctx: CanvasRenderingContext2D, hero: Hero): void {
    const inputMove = hero.inputMove || { x: 0, y: 0 };
    const isMoving = inputMove.x !== 0 || inputMove.y !== 0;
    const hasTarget = !!hero.targetResource;
    const isIdle = !isMoving && !hasTarget;

    let aimX = 0;
    let aimY = 0;

    if (hasTarget) {
        const dist = MathUtils.distance(
            hero.x,
            hero.y,
            hero.targetResource!.x,
            hero.targetResource!.y
        );
        if (dist > 0) {
            const dx = hero.targetResource!.x - hero.x;
            const dy = hero.targetResource!.y - hero.y;
            aimX = dx / dist;
            aimY = dy / dist;
        }
    } else if (isMoving) {
        aimX = inputMove.x;
        aimY = inputMove.y;
    }

    ctx.save();
    ctx.translate(hero.x, hero.y);

    const activeWeapons = hero.equipment?.getActiveWeapons?.() || {};
    const hand1Item = activeWeapons.mainHand;
    const hand2Item = activeWeapons.offHand;

    const target = hero.targetResource;
    const isCombat =
        target &&
        (target.entityType === EntityTypes?.DINOSAUR ||
            target.constructor?.name === 'Dinosaur' ||
            target.constructor?.name === 'Enemy' ||
            target.constructor?.name === 'Boss');

    const isResource =
        target &&
        (target.entityType === EntityTypes?.RESOURCE ||
            target.entityType === 'resource' ||
            target.constructor?.name === 'Resource');
    const isGathering = isResource && hero.attackTimer > 0;

    let toolItem: { id?: string } | null = null;
    if (isGathering && target) {
        const nodeSubtype = target.nodeSubtype;
        if (nodeSubtype) {
            const toolSlotId = `tool_${nodeSubtype}`;
            toolItem = hero.equipment?.getSlot?.(toolSlotId) ?? null;
        }
    }

    if (isGathering && toolItem) {
        const baseAngle = Math.atan2(aimY, aimX);
        const facingRight = aimX >= 0;
        drawShovel(ctx, hero, baseAngle, facingRight, toolItem.id || 'tool_t1_01');
    } else if (hand1Item || hand2Item) {
        if (isIdle) {
            const idleOffsetX = hero.width / 2;

            if (hand1Item) {
                ctx.save();
                ctx.translate(-idleOffsetX, 0);
                ctx.scale(-1, 1);
                drawEquippedWeapon(ctx, hero, -Math.PI * 0.25, true, hand1Item, false);
                ctx.restore();
            }

            if (hand2Item) {
                ctx.save();
                ctx.translate(idleOffsetX, 0);
                drawEquippedWeapon(ctx, hero, -Math.PI * 0.25, true, hand2Item, false);
                ctx.restore();
            }
        } else {
            const baseAngle = Math.atan2(aimY, aimX);
            const facingRight = aimX >= 0;

            const aimLen = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
            const normAimX = aimX / aimLen;
            const normAimY = aimY / aimLen;
            const perpX = -normAimY;
            const perpY = normAimX;
            const offsetDistance = facingRight ? hero.width * 0.75 : hero.width * 0.35;

            if (!facingRight) {
                ctx.scale(-1, 1);
            }

            const drawAngle = facingRight ? baseAngle : Math.PI - baseAngle;

            if (hand1Item) {
                ctx.save();
                const ox = facingRight ? perpX * offsetDistance : -perpX * offsetDistance;
                const oy = perpY * offsetDistance;
                ctx.translate(ox, oy);
                drawEquippedWeapon(ctx, hero, drawAngle, true, hand1Item, hero.hand1Attacking);
                ctx.restore();
            }

            if (hand2Item) {
                ctx.save();
                const ox = facingRight ? -perpX * offsetDistance : perpX * offsetDistance;
                const oy = -perpY * offsetDistance;
                ctx.translate(ox, oy);
                drawEquippedWeapon(ctx, hero, drawAngle, true, hand2Item, hero.hand2Attacking);
                ctx.restore();
            }
        }
    } else if (isCombat) {
        const baseAngle = Math.atan2(aimY, aimX);
        drawRifle(ctx, hero, baseAngle, aimX >= 0, 'weapon_ranged_pistol_t1_01');
    } else {
        const baseAngle = isIdle ? -Math.PI * 0.5 : Math.atan2(aimY, aimX);
        drawShovel(ctx, hero, baseAngle, true, 'tool_t1_01');
    }

    ctx.restore();
}

function drawEquippedWeapon(
    ctx: CanvasRenderingContext2D,
    hero: Hero,
    baseAngle: number,
    facingRight: boolean,
    item: { weaponType?: string; id?: string; weaponSubtype?: string },
    isAttacking = true
): void {
    const weaponType = item.weaponType || 'melee';
    const spriteId = item.id || 'weapon_ranged_pistol_t1_01';

    const heroState: Hero = isAttacking
        ? hero
        : ({ ...hero, isAttacking: false, attackTimer: 0 } as Hero);

    if (weaponType === 'ranged') {
        drawRifle(ctx, heroState, baseAngle, facingRight, spriteId);
    } else {
        const weaponSubtype = item.weaponSubtype || 'sword';
        drawMeleeWeapon(ctx, heroState, baseAngle, facingRight, spriteId, weaponSubtype);
    }
}

function drawMeleeWeapon(
    ctx: CanvasRenderingContext2D,
    hero: Hero,
    baseAngle: number,
    facingRight: boolean,
    spriteId: string,
    weaponSubtype = 'sword'
): void {
    if (WeaponRenderer) {
        WeaponRenderer.drawMeleeWeapon(ctx, hero, baseAngle, facingRight, spriteId, weaponSubtype);
    }
}

function drawRifle(
    ctx: CanvasRenderingContext2D,
    hero: Hero,
    baseAngle: number,
    facingRight = true,
    spriteId = 'weapon_ranged_pistol_t1_01'
): void {
    if (WeaponRenderer) {
        WeaponRenderer.drawRifle(ctx, hero, baseAngle, facingRight, spriteId);
    }
}

function drawShovel(
    ctx: CanvasRenderingContext2D,
    hero: Hero,
    baseAngle: number,
    facingRight = true,
    spriteId = 'tool_t1_01'
): void {
    if (WeaponRenderer) {
        WeaponRenderer.drawShovel(ctx, hero, baseAngle, facingRight, spriteId);
    }
}
