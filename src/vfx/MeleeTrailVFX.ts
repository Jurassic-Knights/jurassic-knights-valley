/**
 * MeleeTrailVFX - Unique trailing effects for each melee weapon type
 *
 * Tracks weapon tip positions and renders type-specific effects.
 * Configs: MeleeTrailConfig. Renderers: MeleeTrailRenderers.
 */

import { VFXController } from './VFXController';
import { Registry } from '@core/Registry';
import { MELEE_TRAIL_CONFIGS } from './MeleeTrailConfig';
import * as TrailRenderers from './MeleeTrailRenderers';
import type { MeleeTrailPoint } from '../types/vfx';

const MeleeTrailVFX = {
    trails: { hand1: [] as MeleeTrailPoint[], hand2: [] as MeleeTrailPoint[] },

    /**
     * Add a trail point at weapon tip position
     */
    addPoint(x: number, y: number, weaponSubtype = 'sword', slot = 'hand1') {
        if (!isFinite(x) || !isFinite(y)) return;

        const config = MELEE_TRAIL_CONFIGS[weaponSubtype] || MELEE_TRAIL_CONFIGS.default;
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

            switch (config.style) {
                case 'afterimage': TrailRenderers.renderAfterimage(ctx, trail); break;
                case 'heavy': TrailRenderers.renderHeavy(ctx, trail); break;
                case 'debris': TrailRenderers.renderDebris(ctx, trail); break;
                case 'crescent': TrailRenderers.renderCrescent(ctx, trail); break;
                case 'burst':
                case 'impact': TrailRenderers.renderImpact(ctx, trail); break;
                case 'thrust': TrailRenderers.renderThrust(ctx, trail); break;
                case 'sweep': TrailRenderers.renderSweep(ctx, trail); break;
                case 'chain': TrailRenderers.renderChain(ctx, trail); break;
                default: TrailRenderers.renderArc(ctx, trail);
            }
        }
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
