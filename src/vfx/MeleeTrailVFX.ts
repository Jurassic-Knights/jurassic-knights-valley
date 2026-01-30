/**
 * MeleeTrailVFX - Unique trailing effects for each melee weapon type
 *
 * Tracks weapon tip positions and renders type-specific effects:
 * - Swords: Clean arc trails
 * - Greatswords: Heavy blur + particles
 * - Axes: Chunky debris
 * - Hammers: Impact shockwaves
 * - Knives: Quick afterimages
 * - Lances/Spears: Thrust lines
 * - Flails: Chain trails
 *
 * Owner: VFX Specialist
 */

import { VFXController } from './VFXController';
import { Registry } from '@core/Registry';

import type { MeleeTrailConfig, MeleeTrailPoint } from '../types/vfx';

const MeleeTrailVFX = {
    // Active trail points per weapon slot
    trails: {
        hand1: [] as MeleeTrailPoint[],
        hand2: [] as MeleeTrailPoint[]
    },

    // Trail configs by weapon subtype with unique render styles
    configs: {
        // Knife: Quick thin afterimage
        knife: {
            color: '#00FFFF',
            fadeColor: '#004444',
            width: 3,
            maxPoints: 6,
            lifetime: 0.08,
            style: 'afterimage',
            flickerRate: 3
        },
        // Sword: Clean curved arc
        sword: {
            color: '#FFFFFF',
            fadeColor: '#4466AA',
            width: 6,
            maxPoints: 12,
            lifetime: 0.14,
            style: 'arc',
            glow: true
        },
        // Longsword: Extended arc with shimmer
        longsword: {
            color: '#66BBFF',
            fadeColor: '#224488',
            width: 7,
            maxPoints: 14,
            lifetime: 0.16,
            style: 'arc',
            glow: true,
            shimmer: true
        },
        // Greatsword: Heavy blur + particles
        greatsword: {
            color: '#2266FF',
            fadeColor: '#112266',
            width: 16,
            maxPoints: 18,
            lifetime: 0.28,
            style: 'heavy',
            blur: true,
            particles: true
        },
        // Axe: Chunky debris trail
        axe: {
            color: '#FF8800',
            fadeColor: '#663300',
            width: 10,
            maxPoints: 10,
            lifetime: 0.12,
            style: 'debris',
            sparks: true
        },
        // War Axe: Thick crescent + embers
        war_axe: {
            color: '#FF2200',
            fadeColor: '#660000',
            width: 18,
            maxPoints: 12,
            lifetime: 0.18,
            style: 'crescent',
            embers: true
        },
        // Mace: Blunt impact burst
        mace: {
            color: '#FFAA00',
            fadeColor: '#553300',
            width: 10,
            maxPoints: 8,
            lifetime: 0.1,
            style: 'burst',
            shockwave: true
        },
        // War Hammer: Heavy impact + ground crack
        war_hammer: {
            color: '#FFCC00',
            fadeColor: '#664400',
            width: 20,
            maxPoints: 10,
            lifetime: 0.2,
            style: 'impact',
            shockwave: true,
            sparks: true
        },
        // Lance: Long thrust line + flash
        lance: {
            color: '#AACCEE',
            fadeColor: '#446688',
            width: 5,
            maxPoints: 16,
            lifetime: 0.12,
            style: 'thrust',
            flash: true
        },
        // Halberd: Wide sweep
        halberd: {
            color: '#DD4422',
            fadeColor: '#551111',
            width: 14,
            maxPoints: 14,
            lifetime: 0.2,
            style: 'sweep',
            windTrail: true
        },
        // Spear: Quick thrust + afterimage
        spear: {
            color: '#22DD22',
            fadeColor: '#115511',
            width: 5,
            maxPoints: 14,
            lifetime: 0.1,
            style: 'thrust',
            afterimage: true
        },
        // Flail: Chain trail with ball
        flail: {
            color: '#CC8844',
            fadeColor: '#553311',
            width: 4,
            maxPoints: 14,
            lifetime: 0.16,
            style: 'chain',
            ball: true
        },
        default: {
            color: '#FFFFFF',
            fadeColor: '#444444',
            width: 5,
            maxPoints: 10,
            lifetime: 0.15,
            style: 'arc'
        }
    } as Record<string, MeleeTrailConfig>,

    /**
     * Add a trail point at weapon tip position
     */
    addPoint(x: number, y: number, weaponSubtype = 'sword', slot = 'hand1') {
        if (!isFinite(x) || !isFinite(y)) return;

        const config = this.configs[weaponSubtype] || this.configs.default;
        const trail = this.trails[slot as 'hand1' | 'hand2'] || [];

        trail.unshift({
            x: x,
            y: y,
            age: 0,
            config: config,
            subtype: weaponSubtype
        });

        while (trail.length > config.maxPoints) {
            trail.pop();
        }

        this.trails[slot as 'hand1' | 'hand2'] = trail;

        // Spawn particles for particle-emitting weapons
        if (config.particles && trail.length === 1 && VFXController) {
            VFXController.playForeground(x, y, {
                type: 'spark',
                color: config.color,
                count: 2,
                speed: 20,
                lifetime: 150,
                size: 3,
                spread: 1.0,
                drag: 0.9
            });
        }
    },

    /**
     * Update all trail point ages
     */
    update(dt: number) {
        const dtSec = dt / 1000;

        for (const slot of ['hand1', 'hand2'] as const) {
            const trail = this.trails[slot];
            if (!trail) continue;

            for (let i = trail.length - 1; i >= 0; i--) {
                trail[i].age += dtSec;
                if (trail[i].age >= trail[i].config.lifetime) {
                    trail.splice(i, 1);
                }
            }
        }
    },

    /**
     * Render all trails
     */
    render(ctx: CanvasRenderingContext2D, viewport: { x: number; y: number }) {
        for (const slot of ['hand1', 'hand2'] as const) {
            const trail = this.trails[slot];
            if (!trail || trail.length < 2) continue;

            const config = trail[0]?.config;
            if (!config) continue;

            // Route to style-specific renderer
            switch (config.style) {
                case 'afterimage':
                    this.renderAfterimage(ctx, trail);
                    break;
                case 'heavy':
                    this.renderHeavy(ctx, trail);
                    break;
                case 'debris':
                    this.renderDebris(ctx, trail);
                    break;
                case 'crescent':
                    this.renderCrescent(ctx, trail);
                    break;
                case 'burst':
                case 'impact':
                    this.renderImpact(ctx, trail);
                    break;
                case 'thrust':
                    this.renderThrust(ctx, trail);
                    break;
                case 'sweep':
                    this.renderSweep(ctx, trail);
                    break;
                case 'chain':
                    this.renderChain(ctx, trail);
                    break;
                default:
                    this.renderArc(ctx, trail);
            }
        }
    },

    // ============ STYLE RENDERERS ============

    /** Arc style: Clean curved trail (swords) */
    renderArc(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const config = trail[0].config;

        // Glow layer
        if (config.glow) {
            ctx.shadowColor = config.color;
            ctx.shadowBlur = 15;
        }

        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i],
                p2 = trail[i + 1];
            const progress = p1.age / config.lifetime;
            const alpha = Math.max(0, 1 - progress);
            const width = config.width * (1 - progress * 0.5);

            ctx.strokeStyle = this.hexToRgba(config.color, alpha);
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        ctx.restore();
    },

    /** Afterimage style: Flickering copies (knives) */
    renderAfterimage(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;
        const time = Date.now() / 1000;

        for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            const progress = p.age / config.lifetime;
            const flicker = Math.sin(time * config.flickerRate * 10 + i) * 0.5 + 0.5;
            const alpha = Math.max(0, (1 - progress) * flicker);
            const size = config.width * (1 - progress * 0.3);

            ctx.fillStyle = this.hexToRgba(config.color, alpha * 0.7);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    /** Heavy style: Motion blur + thick trail (greatswords) */
    renderHeavy(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        ctx.lineCap = 'round';

        const config = trail[0].config;

        // Blur effect via multiple offset lines
        for (let offset = -2; offset <= 2; offset++) {
            ctx.globalAlpha = 0.3;
            for (let i = 0; i < trail.length - 1; i++) {
                const p1 = trail[i],
                    p2 = trail[i + 1];
                const progress = p1.age / config.lifetime;
                const alpha = Math.max(0, 0.6 - progress);
                const width = config.width * (1 - progress * 0.4);

                ctx.strokeStyle = this.hexToRgba(config.color, alpha);
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(p1.x + offset, p1.y + offset);
                ctx.lineTo(p2.x + offset, p2.y + offset);
                ctx.stroke();
            }
        }

        // Core line
        ctx.globalAlpha = 1;
        this.renderArc(ctx, trail);

        ctx.restore();
    },

    /** Debris style: Chunky particles (axes) */
    renderDebris(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;

        // Main trail
        this.renderArc(ctx, trail);

        // Debris chunks
        for (let i = 0; i < trail.length; i += 2) {
            const p = trail[i];
            const progress = p.age / config.lifetime;
            const alpha = Math.max(0, 0.8 - progress);
            const size = config.width * 0.6 * (1 - progress);

            ctx.fillStyle = this.hexToRgba(config.fadeColor, alpha);
            ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        }

        ctx.restore();
    },

    /** Crescent style: Thick curved arc (war axe) */
    renderCrescent(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;

        // Draw thick crescent
        ctx.lineCap = 'round';
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 20;

        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i],
                p2 = trail[i + 1];
            const progress = p1.age / config.lifetime;
            const alpha = Math.max(0, 1 - progress * 0.8);
            const width = config.width * (1 - progress * 0.3);

            ctx.strokeStyle = this.hexToRgba(config.color, alpha);
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        ctx.restore();
    },

    /** Impact style: Burst + shockwave (hammers) */
    renderImpact(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;
        const newest = trail[0];
        const progress = newest.age / config.lifetime;

        // Short stubby trail
        ctx.lineCap = 'round';
        const trailLen = Math.min(trail.length, 4);
        for (let i = 0; i < trailLen - 1; i++) {
            const p1 = trail[i],
                p2 = trail[i + 1];
            const alpha = Math.max(0, 0.8 - progress);
            ctx.strokeStyle = this.hexToRgba(config.color, alpha);
            ctx.lineWidth = config.width * (1 - i * 0.2);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // Shockwave ring
        if (config.shockwave && progress < 0.5) {
            const ringRadius = 10 + progress * 60;
            const ringAlpha = 0.6 - progress * 1.2;
            ctx.strokeStyle = this.hexToRgba(config.color, Math.max(0, ringAlpha));
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(newest.x, newest.y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    },

    /** Thrust style: Linear pierce (lances, spears) */
    renderThrust(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;

        // Streak line
        ctx.lineCap = 'round';
        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i],
                p2 = trail[i + 1];
            const progress = p1.age / config.lifetime;
            const alpha = Math.max(0, 1 - progress);

            ctx.strokeStyle = this.hexToRgba(config.color, alpha);
            ctx.lineWidth = config.width * (1 - progress * 0.6);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // Flash at tip
        if (config.flash && trail.length > 0) {
            const tip = trail[0];
            const alpha = Math.max(0, 0.8 - tip.age * 4);
            ctx.fillStyle = this.hexToRgba('#FFFFFF', alpha);
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    /** Sweep style: Wide diagonal (halberds) */
    renderSweep(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;

        // Wind trail effect - wider at start
        ctx.lineCap = 'round';
        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i],
                p2 = trail[i + 1];
            const progress = p1.age / config.lifetime;
            const alpha = Math.max(0, 0.9 - progress);
            const width = config.width * (1 - i * 0.05);

            ctx.strokeStyle = this.hexToRgba(config.color, alpha);
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        ctx.restore();
    },

    /** Chain style: Segmented trail with ball (flails) */
    renderChain(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]) {
        ctx.save();
        const config = trail[0].config;

        // Chain segments (dotted line effect)
        for (let i = 0; i < trail.length; i++) {
            const p = trail[i];
            const progress = p.age / config.lifetime;
            const alpha = Math.max(0, 0.8 - progress);
            const size = config.width * 0.8;

            ctx.fillStyle = this.hexToRgba(config.fadeColor, alpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ball at head
        if (trail.length > 0 && config.ball) {
            const head = trail[0];
            const alpha = Math.max(0, 1 - head.age * 2);
            ctx.fillStyle = this.hexToRgba(config.color, alpha);
            ctx.beginPath();
            ctx.arc(head.x, head.y, config.width * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    // ============ HELPERS ============

    hexToRgba(hex: string, alpha: number) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    },

    clear() {
        this.trails = { hand1: [], hand2: [] };
    },

    spawn(x: number, y: number, angle: number, progress: number, weaponSubtype: string) {
        this.addPoint(x, y, weaponSubtype, 'hand1');
    }
};

if (Registry) Registry.register('MeleeTrailVFX', MeleeTrailVFX);

// ES6 Module Export
export { MeleeTrailVFX };
