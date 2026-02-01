/**
 * ProjectileVFX - Spawns traveling projectile visual effects
 *
 * Creates actual projectiles that travel from gun tip to target.
 * Supports different weapon types with unique visuals.
 *
 * Owner: VFX Specialist
 */

import { RenderConfig } from '@config/RenderConfig';
import { VFXController } from './VFXController';
import { LightingSystem } from './LightingSystem';
import { Registry } from '@core/Registry';
import { MathUtils } from '@core/MathUtils';

interface ProjectileConfig {
    color: string;
    coreColor: string;
    size: number;
    speed: number;
    length: number;
    glow?: boolean;
    glowSize?: number;
    trail?: boolean;
    fade?: boolean;
    pellets?: number;
    spread?: number;
}

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

// Minimal interface for Hero entity to avoid circular dependency loop if IEntity is heavy
interface IWeaponCarrier {
    equipment?: {
        getSlot?: (slot: string) => { id?: string; name?: string; weaponSubtype?: string; weaponType?: string };
    };
}

const ProjectileVFX = {
    // Active projectiles
    projectiles: [] as Projectile[],

    // Projectile visual configs by weapon subtype
    // Realistic tracer-style bullets with proper speed/size ratios
    configs: {
        // Pistol: Quick, compact round
        pistol: {
            color: '#FFF8DC',
            coreColor: '#FFFFFF',
            size: 3,
            speed: 1100,
            length: 15,
            glow: true,
            glowSize: 8
        },
        // Rifle: Longer tracer, faster
        rifle: {
            color: '#FFD700',
            coreColor: '#FFFFFF',
            size: 4,
            speed: 1400,
            length: 28,
            glow: true,
            glowSize: 12
        },
        // Sniper: Long bright cyan tracer with trail
        sniper_rifle: {
            color: '#00FFFF',
            coreColor: '#FFFFFF',
            size: 5,
            speed: 2000,
            length: 50,
            glow: true,
            glowSize: 15,
            trail: true
        },
        sniperrifle: {
            color: '#00FFFF',
            coreColor: '#FFFFFF',
            size: 5,
            speed: 2000,
            length: 50,
            glow: true,
            glowSize: 15,
            trail: true
        }, // Legacy alias
        // Shotgun: Multiple small pellets
        shotgun: {
            color: '#FF6600',
            coreColor: '#FFFF00',
            size: 2,
            speed: 900,
            length: 10,
            pellets: 8,
            spread: 0.35,
            glow: true,
            glowSize: 6
        },
        // Machine gun: Rapid small rounds
        machine_gun: {
            color: '#FFCC00',
            coreColor: '#FFFFFF',
            size: 3,
            speed: 1300,
            length: 18,
            glow: true,
            glowSize: 8
        },
        // SMG: Even faster, smaller
        submachine_gun: {
            color: '#FFE055',
            coreColor: '#FFFFFF',
            size: 2,
            speed: 1200,
            length: 12,
            glow: true,
            glowSize: 6
        },
        // Flamethrower: Slow burning projectile
        flamethrower: {
            color: '#FF4500',
            coreColor: '#FFFF00',
            size: 10,
            speed: 500,
            length: 20,
            fade: true,
            glow: true,
            glowSize: 20
        },
        // Bazooka: Large explosive round with smoke trail
        bazooka: {
            color: '#FF3300',
            coreColor: '#FFFF00',
            size: 10,
            speed: 600,
            length: 35,
            glow: true,
            glowSize: 25,
            trail: true
        },
        // Fallback
        default: {
            color: '#FFFFCC',
            coreColor: '#FFFFFF',
            size: 4,
            speed: 1100,
            length: 20,
            glow: true,
            glowSize: 10
        }
    } as Record<string, ProjectileConfig>,

    /**
     * Spawn projectile(s) from origin to target
     * @param {Object} origin - {x, y} world coordinates of origin (hero)
     * @param {Object} target - {x, y} world coordinates of target
     * @param {string} weaponType - Weapon subtype (pistol, rifle, etc)
     */
    spawn(origin: { x: number; y: number }, target: { x: number; y: number }, weaponType = 'pistol') {
        const config = this.configs[weaponType] || this.configs.default;

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

        // Spawn muzzle flash
        this.spawnMuzzleFlash(muzzleX, muzzleY, angle, config);

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
     * Spawn realistic multi-layered muzzle flash VFX
     * Combines: bright core flash, directional sparks, and smoke
     */
    spawnMuzzleFlash(x: number, y: number, angle: number, config: ProjectileConfig) {
        if (!VFXController) return;

        // Layer 1: Bright white-hot core flash (instant)
        VFXController.playForeground(x, y, {
            type: 'glow',
            color: '#FFFFFF',
            count: 1,
            speed: 0,
            lifetime: 60,
            size: 40,
            blendMode: 'lighter'
        });

        // Layer 2: Orange inner glow
        VFXController.playForeground(x, y, {
            type: 'glow',
            color: '#FF8800',
            count: 1,
            speed: 0,
            lifetime: 100,
            size: 25,
            blendMode: 'lighter'
        });

        // Layer 3: Directional sparks cone (toward target)
        VFXController.playForeground(x, y, {
            type: 'spark',
            color: '#FFF700',
            count: 8,
            speed: 18,
            lifetime: 120,
            size: 3,
            angle: angle,
            spread: 0.6,
            drag: 0.9,
            colorOverLifetime: ['#FFFFFF', '#FF4500'],
            blendMode: 'lighter'
        });

        // Layer 4: Hot debris spray (wider spread)
        VFXController.playForeground(x, y, {
            type: 'debris',
            color: '#FFCC00',
            count: 6,
            speed: 10,
            lifetime: 200,
            size: 4,
            angle: angle,
            spread: 1.2,
            gravity: 0.3,
            drag: 0.92,
            blendMode: 'lighter'
        });

        // Layer 5: Subtle smoke puff
        VFXController.playForeground(x, y, {
            type: 'glow',
            color: '#555555',
            count: 3,
            speed: 2,
            lifetime: 400,
            size: 15,
            angle: angle + Math.PI, // Smoke drifts backward
            spread: 0.8,
            alpha: 0.3,
            drag: 0.98,
            blendMode: 'source-over'
        });
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

    /**
     * Get the weapon subtype from equipped weapon
     * Reads weaponSubtype field from entity, falls back to name inference
     * @param {Object} hero - Hero entity
     * @returns {string} Weapon subtype (pistol, rifle, sword, etc)
     */
    getWeaponType(hero: IWeaponCarrier) {
        if (!hero?.equipment) return 'pistol';

        // Check hand1 for weapon
        const hand1 = hero.equipment.getSlot?.('hand1');
        if (hand1) {
            // First check for explicit weaponSubtype field (set from dashboard)
            if (hand1.weaponSubtype) {
                return hand1.weaponSubtype;
            }

            // Fallback: infer from weapon name/id for ranged weapons
            if (hand1.weaponType === 'ranged') {
                const id = (hand1.id || '').toLowerCase();
                const name = (hand1.name || '').toLowerCase();

                if (id.includes('shotgun') || name.includes('shotgun')) return 'shotgun';
                if (id.includes('sniper') || name.includes('sniper') || name.includes('marksman'))
                    return 'sniperrifle';
                if (id.includes('rifle') || name.includes('rifle')) return 'rifle';
                if (id.includes('machine') || id.includes('smg')) return 'machine_gun';
                if (id.includes('revolver') || name.includes('revolver')) return 'pistol';
                if (id.includes('pistol') || name.includes('pistol')) return 'pistol';

                return 'pistol';
            }
        }

        // Fallback - check hand2
        const hand2 = hero.equipment.getSlot?.('hand2');
        if (hand2?.weaponSubtype) {
            return hand2.weaponSubtype;
        }

        return 'pistol';
    }
};

// Export
if (Registry) Registry.register('ProjectileVFX', ProjectileVFX);

export { ProjectileVFX };
