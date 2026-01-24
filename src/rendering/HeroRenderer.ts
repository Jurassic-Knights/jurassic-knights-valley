/**
 * HeroRenderer - Dedicated rendering system for the player character
 *
 * Extracted from Hero.js to separate logic from presentation.
 * Uses RenderConfig for constants.
 */

import { Logger } from '../core/Logger';
import { RenderConfig } from '../config/RenderConfig';
import { MaterialLibrary } from '../vfx/MaterialLibrary';
import { AssetLoader } from '../core/AssetLoader';
import { entityManager } from '../core/EntityManager';
import { WeaponRenderer } from './WeaponRenderer';
import { Registry } from '../core/Registry';
import { EntityRegistry } from '../entities/EntityLoader';
import { ColorPalette } from '../config/ColorPalette';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { EntityTypes } from '../config/EntityTypes';

// Unmapped modules - need manual import


class HeroRendererSystem {
    // Cached image properties
    private _heroPath: string | null = null;
    private _heroImg: HTMLImageElement | null = null;
    private _heroCanvas: HTMLCanvasElement | null = null;
    private _heroW: number | null = null;
    private _heroH: number | null = null;
    private _shadowImg: HTMLImageElement | null = null;

    constructor() {
        Logger.info('[HeroRenderer] Initialized');
    }

    /**
     * Set the hero skin - clears cached images and loads new skin
     * @param {string} skinId - Hero skin ID (e.g., 'hero_t1_01')
     */
    setSkin(skinId) {
        // Get skin data from EntityRegistry
        const skinData = EntityRegistry?.hero?.[skinId];
        if (!skinData) {
            Logger.warn(`[HeroRenderer] Skin not found: ${skinId}`);
            return;
        }

        // Build image path from skin files
        let path = null;
        if (skinData.files?.clean) {
            path = 'assets/' + skinData.files.clean;
        } else if (skinData.files?.original) {
            path = 'assets/' + skinData.files.original;
        }

        if (!path) {
            Logger.warn(`[HeroRenderer] No image path for skin: ${skinId}`);
            return;
        }

        // Clear all cached images to force reload
        this._heroPath = path;
        this._heroImg = null;
        this._heroCanvas = null;
        this._heroW = null;
        this._heroH = null;
        this._shadowImg = null;

        Logger.info(`[HeroRenderer] Skin changed to: ${skinId} -> ${path}`);
    }

    /**
     * Render the hero and their equipped weapon
     * @param {CanvasRenderingContext2D} ctx
     * @param {Hero} hero
     */
    render(ctx, hero, includeShadow = true) {
        if (!hero || !hero.active) return;

        // Draw Shadow
        if (includeShadow) {
            this.drawShadow(ctx, hero);
        }

        // Draw Range Circles (beneath hero)
        this.drawRangeCircles(ctx, hero);

        // Draw Hero Body
        this.drawBody(ctx, hero);

        // Draw Weapon (and Muzzle Flash)
        this.drawWeapon(ctx, hero);

        // Draw Status Bars (Health above, Resolve below)
        this.drawStatusBars(ctx, hero);
    }

    /**
     * Draw health bar above hero
     */
    drawStatusBars(ctx, hero) {
        const barWidth = 80;
        const barHeight = 10;
        const cornerRadius = 4;

        // Health Bar (above hero) - Use ColorPalette
        const healthY = hero.y - hero.height / 2 - 18;
        const healthPercent = Math.max(0, Math.min(1, hero.health / hero.maxHealth));
        const colors = ColorPalette || {};

        this.drawBar(
            ctx,
            hero.x,
            healthY,
            barWidth,
            barHeight,
            healthPercent,
            colors.HEALTH_GREEN,
            colors.HEALTH_BG,
            cornerRadius
        );
    }

    /**
     * Helper to draw a rounded progress bar
     */
    drawBar(ctx, x, y, width, height, percent, fillColor, bgColor, radius) {
        const halfWidth = width / 2;

        ctx.save();

        // Background
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(x - halfWidth, y - height / 2, width, height, radius);
        ctx.fill();

        // Fill
        if (percent > 0) {
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            const fillWidth = width * percent;
            ctx.roundRect(x - halfWidth, y - height / 2, fillWidth, height, radius);
            ctx.fill();
        }

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - halfWidth, y - height / 2, width, height, radius);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Draw drop shadow
     */
    drawShadow(ctx, hero, forceOpaque = false) {
        // Safe access to RenderConfig
        const cfg = RenderConfig ? RenderConfig.Hero : null;
        if (!cfg) return;

        // Check EnvironmentRenderer for dynamic shadows
        const env = EnvironmentRenderer;

        // Default values if system missing
        let scaleY = 0.3;
        let alpha = 0.3;

        if (env) {
            scaleY = env.shadowScaleY;
            alpha = env.shadowAlpha;
        }

        // 1. Static Contact Shadow
        ctx.save();
        ctx.translate(hero.x, hero.y + hero.height / 2 - 6);

        if (forceOpaque) {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = 1.0;
        } else {
            ctx.fillStyle = 'black';
            ctx.globalAlpha = alpha;
        }

        const contactWidth = hero.width * 0.5;
        const contactHeight = hero.height * 0.12;

        ctx.beginPath();
        ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Dynamic Projected Shadow
        ctx.save();
        ctx.translate(hero.x, hero.y + hero.height / 2 - 6);

        // Skew
        const skew = env ? env.shadowSkew || 0 : 0;
        ctx.transform(1, 0, skew, 1, 0, 0);

        // Dynamic Scale & Flip
        ctx.scale(1, -scaleY);

        if (forceOpaque) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = alpha;
        }

        // PERF: Cache shadow image on renderer (retry until successful)
        if (!this._shadowImg) {
            const heroAssetId = 'world_hero';
            if (MaterialLibrary) {
                this._shadowImg = MaterialLibrary.get(heroAssetId, 'shadow', {});
            }
        }

        if (this._shadowImg) {
            // Draw anchored at bottom (0,0) -> (-W/2, -H)
            ctx.drawImage(this._shadowImg, -hero.width / 2, -hero.height, hero.width, hero.height);
        }
        // No fallback - skip rendering until shadow loads

        ctx.restore();
    }

    /**
     * Draw the main hero sprite
     */
    drawBody(ctx, hero) {
        // PERF: Cache heroPath on renderer - use saved skin or default
        if (!this._heroPath) {
            const savedSkin = localStorage.getItem('heroSelectedSkin') || 'hero_t1_01';
            const skinData = EntityRegistry?.hero?.[savedSkin];

            if (skinData?.files?.clean) {
                this._heroPath = 'assets/' + skinData.files.clean;
            } else if (skinData?.files?.original) {
                this._heroPath = 'assets/' + skinData.files.original;
            } else if (AssetLoader) {
                // Fallback to world_hero asset
                this._heroPath = AssetLoader.getImagePath('world_hero');
            }
        }

        if (this._heroPath) {
            // Lazy load image on the renderer instance
            if (!this._heroImg) {
                this._heroImg = AssetLoader.createImage(this._heroPath);
            }

            // Wait for image to be fully processed (white removal converts src to data URL)
            const isProcessed = this._heroImg.src.startsWith('data:') || this._heroImg.src.includes('PH.png');
            const isLoaded = this._heroImg.complete && this._heroImg.naturalWidth;

            if (isLoaded && isProcessed) {
                // PERF: Cache scaled sprite to avoid expensive resizing every frame
                // Invalidate cache if dimensions change
                if (
                    !this._heroCanvas ||
                    this._heroW !== hero.width ||
                    this._heroH !== hero.height
                ) {
                    this._heroW = hero.width;
                    this._heroH = hero.height;
                    this._heroCanvas = document.createElement('canvas');
                    this._heroCanvas.width = hero.width;
                    this._heroCanvas.height = hero.height;
                    const c = this._heroCanvas.getContext('2d');
                    c.imageSmoothingEnabled = false;
                    c.drawImage(this._heroImg, 0, 0, hero.width, hero.height);
                }

                ctx.drawImage(this._heroCanvas, hero.x - hero.width / 2, hero.y - hero.height / 2);
            }
        }
        // No fallback - skip rendering until sprite loads
    }

    /**
     * Draw the equipped weapon based on target
     * Uses equipped items from hero.equipment for sprite rendering
     * 
     * Positioning:
     * - Idle: Hand 1 on LEFT, Hand 2 on RIGHT, pointing diagonally upward
     * - Active (moving/targeting): Rotate toward aim direction
     */
    drawWeapon(ctx, hero) {
        // Determine if idle or active
        const inputMove = hero.inputMove || { x: 0, y: 0 };
        const isMoving = inputMove.x !== 0 || inputMove.y !== 0;
        const hasTarget = !!hero.targetResource;
        const isIdle = !isMoving && !hasTarget;

        // Calculate Aim Direction (only used when active)
        let aimX = 0;
        let aimY = 0;

        if (hasTarget) {
            const dx = hero.targetResource.x - hero.x;
            const dy = hero.targetResource.y - hero.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                aimX = dx / dist;
                aimY = dy / dist;
            }
        } else if (isMoving) {
            aimX = inputMove.x;
            aimY = inputMove.y;
        }

        ctx.save();
        ctx.translate(hero.x, hero.y);

        // Get equipped items from the active weapon set
        const activeWeapons = hero.equipment?.getActiveWeapons?.() || {};
        const hand1Item = activeWeapons.mainHand;
        const hand2Item = activeWeapons.offHand;

        // Determine target type
        const target = hero.targetResource;
        const isCombat =
            target &&
            (target.entityType === EntityTypes?.DINOSAUR ||
                target.constructor?.name === 'Dinosaur' ||
                target.constructor?.name === 'Enemy' ||
                target.constructor?.name === 'Boss');

        // Check if actively gathering at a resource node
        const isResource = target &&
            (target.entityType === EntityTypes?.RESOURCE ||
                target.entityType === 'resource' ||
                target.constructor?.name === 'Resource');
        const isGathering = isResource && hero.attackTimer > 0;

        // Get the appropriate tool based on node subtype
        let toolItem = null;
        if (isGathering && target) {
            const nodeSubtype = target.nodeSubtype;
            if (nodeSubtype) {
                const toolSlotId = `tool_${nodeSubtype}`;
                toolItem = hero.equipment?.getSlot?.(toolSlotId);
            }
        }

        if (isGathering && toolItem) {
            // Actively gathering at resource: draw equipped tool
            const baseAngle = Math.atan2(aimY, aimX);
            const facingRight = aimX >= 0;
            this.drawEquippedTool(ctx, hero, baseAngle, facingRight, toolItem);
        } else if (hand1Item || hand2Item) {
            if (isIdle) {
                // IDLE: Weapons on left/right sides at edge of hero sprite
                const idleOffsetX = hero.width / 2; // At edge of hero

                // Draw hand1 on LEFT side, pointing up-left
                // Use horizontal mirror + same angle as hand2 for symmetry
                if (hand1Item) {
                    ctx.save();
                    ctx.translate(-idleOffsetX, 0);
                    ctx.scale(-1, 1); // Mirror horizontally for left side
                    this.drawEquippedWeapon(ctx, hero, -Math.PI * 0.25, true, hand1Item, false);
                    ctx.restore();
                }

                // Draw hand2 on RIGHT side, pointing up-right
                if (hand2Item) {
                    ctx.save();
                    ctx.translate(idleOffsetX, 0);
                    this.drawEquippedWeapon(ctx, hero, -Math.PI * 0.25, true, hand2Item, false);
                    ctx.restore();
                }
            } else {
                // ACTIVE: Weapons follow aim direction
                const baseAngle = Math.atan2(aimY, aimX);
                const facingRight = aimX >= 0;

                // Normalize aim direction for consistent perpendicular offset
                const aimLen = Math.sqrt(aimX * aimX + aimY * aimY) || 1;
                const normAimX = aimX / aimLen;
                const normAimY = aimY / aimLen;

                // Perpendicular direction (rotated 90 degrees)
                const perpX = -normAimY;
                const perpY = normAimX;
                const offsetDistance = hero.width * 0.75;

                // When facing left, flip the weapons to mirror right-facing behavior
                if (!facingRight) {
                    ctx.scale(-1, 1); // Mirror horizontally
                }

                // Use absolute angle for consistent rendering
                const drawAngle = facingRight ? baseAngle : Math.PI - baseAngle;

                // Draw hand1 (right side of aim direction)
                if (hand1Item) {
                    ctx.save();
                    const ox = facingRight ? perpX * offsetDistance : -perpX * offsetDistance;
                    const oy = perpY * offsetDistance;
                    ctx.translate(ox, oy);
                    this.drawEquippedWeapon(ctx, hero, drawAngle, true, hand1Item, hero.hand1Attacking);
                    ctx.restore();
                }

                // Draw hand2 (left side of aim direction)
                if (hand2Item) {
                    ctx.save();
                    const ox = facingRight ? -perpX * offsetDistance : perpX * offsetDistance;
                    const oy = -perpY * offsetDistance;
                    ctx.translate(ox, oy);
                    this.drawEquippedWeapon(ctx, hero, drawAngle, true, hand2Item, hero.hand2Attacking);
                    ctx.restore();
                }
            }
        } else if (isCombat) {
            // Fallback: rifle for combat
            const baseAngle = Math.atan2(aimY, aimX);
            this.drawRifle(ctx, hero, baseAngle, aimX >= 0, 'weapon_ranged_pistol_t1_01');
        } else {
            // Fallback: shovel for resources (no weapons equipped)
            const baseAngle = isIdle ? -Math.PI * 0.5 : Math.atan2(aimY, aimX);
            this.drawShovel(ctx, hero, baseAngle, true, 'tool_t1_01');
        }

        ctx.restore();
    }

    /**
     * Draw equipped weapon (melee or ranged)
     * @param {boolean} isAttacking - Whether this specific weapon is attacking
     */
    drawEquippedWeapon(ctx, hero, baseAngle, facingRight, item, isAttacking = true) {
        const weaponType = item.weaponType || 'melee';
        const spriteId = item.id || 'weapon_ranged_pistol_t1_01';

        // Create a temporary hero state for this specific weapon's animation
        const heroState = isAttacking ? hero : { ...hero, isAttacking: false, attackTimer: 0 };

        if (weaponType === 'ranged') {
            this.drawRifle(ctx, heroState, baseAngle, facingRight, spriteId);
        } else {
            // Melee weapons use swing animation - pass subtype for trail VFX
            const weaponSubtype = item.weaponSubtype || 'sword';
            this.drawMeleeWeapon(ctx, heroState, baseAngle, facingRight, spriteId, weaponSubtype);
        }
    }

    /**
     * Draw equipped tool
     */
    drawEquippedTool(ctx, hero, baseAngle, facingRight, item) {
        const spriteId = item.id || 'tool_t1_01';
        this.drawShovel(ctx, hero, baseAngle, facingRight, spriteId);
    }

    /**
     * Draw melee weapon with swing animation (delegates to WeaponRenderer)
     * @param {string} weaponSubtype - Weapon subtype for trail VFX
     */
    drawMeleeWeapon(ctx, hero, baseAngle, facingRight, spriteId, weaponSubtype = 'sword') {
        if (WeaponRenderer) {
            WeaponRenderer.drawMeleeWeapon(ctx, hero, baseAngle, facingRight, spriteId, weaponSubtype);
        }
    }

    /**
     * Draw ranged weapon (delegates to WeaponRenderer)
     */
    drawRifle(ctx, hero, baseAngle, facingRight = true, spriteId = 'weapon_ranged_pistol_t1_01') {
        if (WeaponRenderer) {
            WeaponRenderer.drawRifle(ctx, hero, baseAngle, facingRight, spriteId);
        }
    }

    /**
     * Draw tool (delegates to WeaponRenderer)
     */
    drawShovel(ctx, hero, baseAngle, facingRight = true, spriteId = 'tool_t1_01') {
        if (WeaponRenderer) {
            WeaponRenderer.drawShovel(ctx, hero, baseAngle, facingRight, spriteId);
        }
    }

    /**
     * Draw attack range circles for equipped weapons
     * Shows 1 circle for 2H weapons, 2 circles for dual-wielding
     * Only displays when enemies are visible on screen
     */
    drawRangeCircles(ctx, hero) {
        // Only show range circles when enemies are nearby (within 1300 units)
        const detectionRange = 1300;
        let hasNearbyEnemy = false;

        // Check all entities for hostile enemies within range
        const allEntities = entityManager?.getAll?.() || [];
        for (const entity of allEntities) {
            if (!entity.active) continue;

            // Check if hostile enemy type
            const isEnemy = (
                entity.entityType === EntityTypes?.ENEMY_DINOSAUR ||
                entity.entityType === EntityTypes?.ENEMY_SOLDIER ||
                entity.constructor?.name === 'Enemy' ||
                entity.constructor?.name === 'Boss'
            );
            if (!isEnemy) continue;

            // Check distance
            const dx = entity.x - hero.x;
            const dy = entity.y - hero.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= detectionRange) {
                hasNearbyEnemy = true;
                break;
            }
        }
        if (!hasNearbyEnemy) return;

        const activeWeapons = hero.equipment?.getActiveWeapons?.() || {};
        const hand1Item = activeWeapons.mainHand;
        const hand2Item = activeWeapons.offHand;

        // No weapons = no circles
        if (!hand1Item && !hand2Item) return;

        // Check if using 2H weapon (only show one circle)
        const is2H = hand1Item?.gripType === '2-hand';

        // Get ranges
        const hand1Range = hand1Item?.stats?.range || 0;
        const hand2Range = (!is2H && hand2Item?.stats?.range) || 0;

        // Determine which is inner (smaller range = thicker line)
        if (hand1Range && hand2Range) {
            // Dual-wielding: draw both, smaller one is "inner" (thicker)
            const hand1IsInner = hand1Range <= hand2Range;
            this._drawSingleRangeCircle(ctx, hero, hand1Range, hand1IsInner);
            this._drawSingleRangeCircle(ctx, hero, hand2Range, !hand1IsInner);
        } else if (hand1Range) {
            // Single weapon: just draw it as inner (thicker)
            this._drawSingleRangeCircle(ctx, hero, hand1Range, true);
        } else if (hand2Range) {
            this._drawSingleRangeCircle(ctx, hero, hand2Range, true);
        }
    }

    /**
     * Draw a single range circle
     * @param {number} range - Circle radius in pixels
     * @param {boolean} isInner - If true, draws thicker line for inner/smaller range
     */
    _drawSingleRangeCircle(ctx, hero, range, isInner = false) {
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
}

// Create singleton and export
const HeroRenderer = new HeroRendererSystem();
if (Registry) Registry.register('HeroRenderer', HeroRenderer);

export { HeroRendererSystem, HeroRenderer };

