/**
 * ProjectileVFX - Spawns traveling projectile visual effects
 *
 * Creates projectiles that travel from gun tip to target.
 * Configs: ProjectileVFXConfig. Muzzle: ProjectileMuzzleFlash. Weapon type: ProjectileWeaponType.
 */

import { RenderConfig } from '@config/RenderConfig';
import { LightingSystem } from './LightingSystem';
import { Registry } from '@core/Registry';
import { MathUtils } from '@core/MathUtils';
import { PROJECTILE_CONFIGS, type ProjectileConfig } from './ProjectileVFXConfig';
import { spawnMuzzleFlash } from './ProjectileMuzzleFlash';
import { getWeaponType } from './ProjectileWeaponType';

interface Projectile {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    angle: number;
    speed: number;
    color: string;
    coreColor: string;
    size: number;
    length: number;
    glow: boolean;
    glowSize: number;
    trail: boolean;
    fade: boolean;
    distance: number;
    traveled: number;
    active: boolean;
    alpha: number;
}

const ProjectileVFX = {
    projectiles: [] as Projectile[],

    /**
     * Spawn projectile(s) from origin to target
     * @param {Object} origin - {x, y} world coordinates of origin (hero)
     * @param {Object} target - {x, y} world coordinates of target
     * @param {string} weaponType - Weapon subtype (pistol, rifle, etc)
     */
    spawn(origin: { x: number; y: number }, target: { x: number; y: number }, weaponType = 'pistol') {
        const config = PROJECTILE_CONFIGS[weaponType] || PROJECTILE_CONFIGS.default;

        // Calculate trajectory
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        const angle = Math.atan2(dy, dx);

        // Muzzle offset - distance from hero center to gun muzzle (top-right of weapon image)
        // After sprite rotation, the muzzle is aligned with the aim direction (baseAngle)
        let muzzleOffset = 80; // Default fallback

        if (RenderConfig?.Hero?.WEAPON?.RIFLE) {
            const cfg = RenderConfig.Hero.WEAPON.RIFLE;
            // Weapon image has grip at bottom-left, muzzle at top-right (diagonal)
            // After SPRITE_ROTATION, muzzle points along the aim direction
            // So muzzle position is simply along the aim angle
            muzzleOffset = cfg.TARGET_WIDTH * 0.85; // Muzzle at 85% of weapon length
        }

        // Muzzle is along the aim direction (after rotation aligns it)
        const muzzleX = origin.x + Math.cos(angle) * muzzleOffset;
        const muzzleY = origin.y + Math.sin(angle) * muzzleOffset;

        // Calculate actual travel distance from muzzle to target
        const distance = MathUtils.distance(muzzleX, muzzleY, target.x, target.y);

        spawnMuzzleFlash(muzzleX, muzzleY, angle, config);

        // Spawn projectile(s)
        if (config.pellets) {
            // Shotgun: multiple pellets with spread
            for (let i = 0; i < config.pellets; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * (config.spread || 0.35);
                this.createProjectile(
                    muzzleX,
                    muzzleY,
                    spreadAngle,
                    distance,
                    config,
                    target
                );
            }
        } else {
            // Single projectile
            this.createProjectile(muzzleX, muzzleY, angle, distance, config, target);
        }
    },

    /**
     * Create a single projectile
     */
    createProjectile(x: number, y: number, angle: number, distance: number, config: ProjectileConfig, target: { x: number; y: number }) {
        const projectile: Projectile = {
            x: x,
            y: y,
            targetX: target.x,
            targetY: target.y,
            angle: angle,
            speed: config.speed,
            color: config.color,
            coreColor: config.coreColor || '#FFFFFF',
            size: config.size,
            length: config.length,
            glow: config.glow || false,
            glowSize: config.glowSize || config.size * 2,
            trail: config.trail || false,
            fade: config.fade || false,
            distance: distance,
            traveled: 0,
            active: true,
            alpha: 1.0
        };

        this.projectiles.push(projectile);
    },

    /**
     * Update all active projectiles
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt: number) {
        // Convert dt from milliseconds to seconds
        const dtSeconds = dt / 1000;

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Move projectile
            const moveDistance = p.speed * dtSeconds;
            p.x += Math.cos(p.angle) * moveDistance;
            p.y += Math.sin(p.angle) * moveDistance;
            p.traveled += moveDistance;

            // Check if reached target
            if (p.traveled >= p.distance) {
                p.active = false;
            }

            // Submit light to LightingSystem (if active and glowing)
            if (
                p.active &&
                p.glow &&
                LightingSystem &&
                typeof LightingSystem.addLight === 'function'
            ) {
                try {
                    const radius = 50 + (p.glowSize || p.size * 2) * 2;
                    // Elongation based on projectile length/size ratio
                    const elongation = 1.5; // Stretch 1.5x along direction
                    LightingSystem.addLight(
                        p.x,
                        p.y,
                        radius,
                        p.color,
                        p.alpha,
                        p.angle,
                        elongation
                    );
                } catch (e) {
                    // Silently ignore lighting errors
                }
            }

            // Fade effect
            if (p.fade) {
                p.alpha = 1.0 - p.traveled / p.distance;
            }

            // Remove inactive projectiles
            if (!p.active) {
                this.projectiles.splice(i, 1);
            }
        }
    },

    /**
     * Render all active projectiles
     * @param {CanvasRenderingContext2D} ctx - Canvas context (already translated by viewport)
     */
    render(ctx: CanvasRenderingContext2D) {
        if (!ctx) return;

        for (const p of this.projectiles) {
            if (!p.active) continue;

            const screenX = p.x;
            const screenY = p.y;

            // Calculate tail position
            const tailX = screenX - Math.cos(p.angle) * p.length;
            const tailY = screenY - Math.sin(p.angle) * p.length;

            ctx.save();
            ctx.globalAlpha = p.alpha;

            // Layer 1: Outer glow (if enabled)
            if (p.glow) {
                ctx.shadowColor = p.color;
                ctx.shadowBlur = p.glowSize;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 1.5;
                ctx.lineCap = 'round';
                ctx.globalAlpha = p.alpha * 0.5;
                ctx.beginPath();
                ctx.moveTo(tailX, tailY);
                ctx.lineTo(screenX, screenY);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Layer 2: Main tracer body
            ctx.globalAlpha = p.alpha;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(screenX, screenY);
            ctx.stroke();

            // Layer 3: Bright white-hot core (head of projectile)
            const coreLength = p.length * 0.4;
            const coreTailX = screenX - Math.cos(p.angle) * coreLength;
            const coreTailY = screenY - Math.sin(p.angle) * coreLength;
            ctx.strokeStyle = p.coreColor;
            ctx.lineWidth = p.size * 0.6;
            ctx.beginPath();
            ctx.moveTo(coreTailX, coreTailY);
            ctx.lineTo(screenX, screenY);
            ctx.stroke();

            if (p.trail) {
                ctx.globalAlpha = p.alpha * 0.2;
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 0.4;
                const trailLength = p.length * 2.5;
                const trailTailX = screenX - Math.cos(p.angle) * trailLength;
                const trailTailY = screenY - Math.sin(p.angle) * trailLength;
                ctx.beginPath();
                ctx.moveTo(trailTailX, trailTailY);
                ctx.lineTo(tailX, tailY);
                ctx.stroke();
            }

            ctx.restore();
        }
    },

    getWeaponType: getWeaponType
};

// Export
if (Registry) Registry.register('ProjectileVFX', ProjectileVFX);

export { ProjectileVFX };
