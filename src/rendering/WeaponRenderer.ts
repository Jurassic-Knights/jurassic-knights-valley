/**
 * WeaponRenderer - Draw equipped weapons and tools
 *
 * Extracted from HeroRenderer.js to reduce file size.
 * Handles melee weapons, ranged weapons, and tools with animations.
 *
 * Owner: Director
 */

import { RenderConfig } from '@config/RenderConfig';
import { MeleeTrailVFX } from '@vfx/MeleeTrailVFX';
import { AssetLoader } from '@core/AssetLoader';
import { Hero } from '../gameplay/Hero';

const WeaponRenderer = {
    // Image caches
    _weaponImages: {} as Record<string, HTMLImageElement>,
    _rangedImages: {} as Record<string, HTMLImageElement>,
    _toolImages: {} as Record<string, HTMLImageElement>,

    /**
     * Draw melee weapon with swing animation
     * @param {CanvasRenderingContext2D} ctx - Already translated to hero position
     * @param {Hero} hero
     * @param {number} baseAngle - Aim angle
     * @param {boolean} facingRight
     * @param {string} spriteId - Weapon sprite ID
     * @param {string} weaponSubtype - Weapon subtype for trail VFX
     */
    drawMeleeWeapon(ctx: CanvasRenderingContext2D, hero: Hero, baseAngle: number, facingRight: boolean, spriteId: string, weaponSubtype = 'sword') {
        const cfg = RenderConfig ? RenderConfig.Hero.WEAPON.SHOVEL : null;
        if (!cfg) return;

        // Swing Animation
        let swingOffset = cfg.IDLE_ANGLE;
        let progress = 0;

        if (hero.isAttacking && hero.attackTimer > 0) {
            const rate = hero.components?.combat?.rate || 2;
            const cooldown = 1 / rate;
            progress = 1 - hero.attackTimer / cooldown;

            if (progress < 0.2) {
                swingOffset = cfg.COCK_ANGLE - (progress / 0.2) * 0.5;
            } else if (progress < 0.5) {
                swingOffset = cfg.SWING_FWD_ANGLE + ((progress - 0.2) / 0.3) * cfg.SWING_MAX_ANGLE;
            } else {
                swingOffset =
                    cfg.SWING_FWD_ANGLE +
                    cfg.SWING_MAX_ANGLE -
                    ((progress - 0.5) / 0.5) * cfg.RETURN_ANGLE;
            }

            // Spawn melee trail VFX during swing phase at weapon tip
            if (MeleeTrailVFX && progress >= 0.2 && progress <= 0.6) {
                // Calculate weapon tip position
                // After SPRITE_ROTATION aligns tip with swing direction, tip is at weaponAngle
                const weaponAngle = baseAngle + swingOffset;
                const weaponLength = cfg.TARGET_HEIGHT * (cfg.TIP_DISTANCE_FACTOR || 0.85);
                const tipX = hero.x + Math.cos(weaponAngle) * weaponLength;
                const tipY = hero.y + Math.sin(weaponAngle) * weaponLength;
                MeleeTrailVFX.spawn(tipX, tipY, weaponAngle, progress, weaponSubtype);
            }
        }

        // Apply sprite rotation for tip alignment (same as ranged weapons)
        const spriteRotation = cfg.SPRITE_ROTATION || Math.PI / 4;
        const effectiveRotation = facingRight ? spriteRotation : -spriteRotation;
        ctx.rotate(baseAngle + swingOffset + effectiveRotation);

        // When aiming left (west), flip Y to keep weapon right-side up
        if (!facingRight) {
            ctx.scale(1, -1);
        }

        // Draw Sprite from equipped item
        const weaponPath = AssetLoader ? AssetLoader.getImagePath(spriteId) : null;
        if (weaponPath) {
            if (!this._weaponImages[spriteId]) {
                this._weaponImages[spriteId] = AssetLoader.createImage(weaponPath);
            }
            const img = this._weaponImages[spriteId];

            if (img.complete && img.naturalWidth) {
                const scale = cfg.TARGET_HEIGHT / img.naturalHeight;
                const drawWidth = img.naturalWidth * scale;
                const drawHeight = cfg.TARGET_HEIGHT;

                ctx.save();
                ctx.rotate(cfg.SPRITE_ROTATION || Math.PI / 4);

                // Position weapon with handle (bottom-left) at pivot point
                // ANCHOR_X: 0 = left edge, 1 = right edge
                // ANCHOR_Y: 0 = top edge, 1 = bottom edge
                const anchorX = cfg.ANCHOR_X !== undefined ? cfg.ANCHOR_X : 0;
                const anchorY = cfg.ANCHOR_Y !== undefined ? cfg.ANCHOR_Y : 1;
                const offsetX = -drawWidth * anchorX;
                const offsetY = -drawHeight * anchorY;

                ctx.drawImage(img, offsetX, offsetY + cfg.OFFSET_Y, drawWidth, drawHeight);
                ctx.restore();
            }
        } else {
            // Fallback
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(10, -3, 30, 6);
        }
    },

    /**
     * Draw ranged weapon (rifle) with recoil animation
     */
    drawRifle(ctx: CanvasRenderingContext2D, hero: Hero, baseAngle: number, facingRight = true, spriteId = 'weapon_ranged_pistol_t1_01') {
        const cfg = RenderConfig ? RenderConfig.Hero.WEAPON.RIFLE : null;
        if (!cfg) return;

        // Apply base aim angle plus sprite rotation for muzzle alignment
        // When facing left, negate sprite rotation because Y-flip inverts the rotation
        const spriteRotation = cfg.SPRITE_ROTATION || Math.PI / 4;
        const effectiveRotation = facingRight ? spriteRotation : -spriteRotation;
        ctx.rotate(baseAngle + effectiveRotation);

        // When aiming left (west), flip Y to keep weapon right-side up
        if (!facingRight) {
            ctx.scale(1, -1);
        }

        // Recoil Animation
        let recoil = 0;
        if (hero.isAttacking && hero.attackTimer > 0) {
            const rate = hero.components?.combat?.rate || 2;
            const cooldown = 1 / rate;
            const progress = 1 - hero.attackTimer / cooldown;

            if (progress < cfg.KICK_DURATION_PCT) {
                recoil = cfg.RECOIL_DISTANCE * (progress / cfg.KICK_DURATION_PCT);
            } else if (progress < cfg.KICK_DURATION_PCT + cfg.RECOVER_DURATION_PCT) {
                const recoverProgress =
                    (progress - cfg.KICK_DURATION_PCT) / cfg.RECOVER_DURATION_PCT;
                recoil = cfg.RECOIL_DISTANCE * (1 - recoverProgress);
            }
        }

        ctx.translate(recoil, 0);

        // Draw Sprite using spriteId
        const gunPath = AssetLoader ? AssetLoader.getImagePath(spriteId) : null;
        if (gunPath) {
            if (!this._rangedImages[spriteId]) {
                this._rangedImages[spriteId] = AssetLoader.createImage(gunPath);
            }
            const img = this._rangedImages[spriteId];

            if (img.complete && img.naturalWidth) {
                const scale = cfg.TARGET_WIDTH / img.naturalWidth;
                const drawWidth = cfg.TARGET_WIDTH;
                const drawHeight = img.naturalHeight * scale;

                // Position with grip (bottom-left) at pivot point
                const anchorX = cfg.ANCHOR_X !== undefined ? cfg.ANCHOR_X : 0;
                const anchorY = cfg.ANCHOR_Y !== undefined ? cfg.ANCHOR_Y : 1;
                const offsetX = -drawWidth * anchorX + cfg.OFFSET_X;
                const offsetY = -drawHeight * anchorY;

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
        }
        // No fallback - skip rendering until sprite loads
    },

    /**
     * Draw tool (shovel/pickaxe) with swing animation
     * Tool images have handle at bottom-left, tip at top-right (diagonal orientation)
     */
    drawShovel(ctx: CanvasRenderingContext2D, hero: Hero, baseAngle: number, facingRight = true, spriteId = 'tool_t1_01') {
        const cfg = RenderConfig ? RenderConfig.Hero.WEAPON.SHOVEL : null;
        if (!cfg) return;

        // Swing Animation
        let swingOffset = cfg.IDLE_ANGLE;

        if (hero.isAttacking && hero.attackTimer > 0) {
            const rate = hero.components?.combat?.rate || 2;
            const cooldown = 1 / rate;
            const progress = 1 - hero.attackTimer / cooldown;

            if (progress < 0.2) {
                // Wind up - pull back
                swingOffset = cfg.COCK_ANGLE - (progress / 0.2) * 0.5;
            } else if (progress < 0.5) {
                // Forward swing
                swingOffset = cfg.SWING_FWD_ANGLE + ((progress - 0.2) / 0.3) * cfg.SWING_MAX_ANGLE;
            } else {
                // Return to idle
                swingOffset =
                    cfg.SWING_FWD_ANGLE +
                    cfg.SWING_MAX_ANGLE -
                    ((progress - 0.5) / 0.5) * cfg.RETURN_ANGLE;
            }
        }

        // Apply sprite rotation for diagonal alignment (bottom-left to top-right)
        // Tool images are diagonal: handle @ bottom-left, tip @ top-right
        const spriteRotation = cfg.SPRITE_ROTATION || Math.PI / 4;
        const effectiveRotation = facingRight ? spriteRotation : -spriteRotation;
        ctx.rotate(baseAngle + swingOffset + effectiveRotation);

        // When aiming left, flip Y to keep tool right-side up
        if (!facingRight) {
            ctx.scale(1, -1);
        }

        // Draw Sprite using spriteId
        const toolPath = AssetLoader ? AssetLoader.getImagePath(spriteId) : null;
        if (toolPath) {
            if (!this._toolImages[spriteId]) {
                this._toolImages[spriteId] = AssetLoader.createImage(toolPath);
            }
            const img = this._toolImages[spriteId];

            if (img.complete && img.naturalWidth) {
                const scale = cfg.TARGET_HEIGHT / img.naturalHeight;
                const drawWidth = img.naturalWidth * scale;
                const drawHeight = cfg.TARGET_HEIGHT;

                ctx.save();
                // Apply additional rotation to align with swing direction
                ctx.rotate(spriteRotation);

                // Position tool with handle (bottom-left of image) at pivot point
                // ANCHOR_X: 0 = left edge, 1 = right edge
                // ANCHOR_Y: 0 = top edge, 1 = bottom edge
                const anchorX = cfg.ANCHOR_X !== undefined ? cfg.ANCHOR_X : 0;
                const anchorY = cfg.ANCHOR_Y !== undefined ? cfg.ANCHOR_Y : 1;
                const offsetX = -drawWidth * anchorX;
                const offsetY = -drawHeight * anchorY + (cfg.OFFSET_Y || 0);

                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                ctx.restore();
            }
        }
        // No fallback - skip rendering until sprite loads
    }
};

// ES6 Module Export
export { WeaponRenderer };
