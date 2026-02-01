/**
 * AmbientSystem - Manages ambient creatures and environmental effects
 *
 * Handles spawning decorative entities like birds (Pteranodon) that fly
 * across the screen to add life to the world.
 */

import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { GameRenderer } from '@core/GameRenderer';
import { AudioManager } from '../audio/AudioManager';
import { Registry } from '@core/Registry';
import { AmbientCreatureConfig } from '../types/vfx';

class AmbientCreature {
    type: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    active: boolean = true;
    image: HTMLImageElement | null = null;
    bobOffset: number;
    bobSpeed: number;
    bobHeight: number;
    trail: { x: number; y: number; age: number }[] = [];
    trailTimer: number = 0;
    trailInterval: number = 0.05;
    shadowOffset: number = 160;

    constructor(config: AmbientCreatureConfig) {
        this.type = config.type || 'dino_pteranodon_base';
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.scale = 0.9 + Math.random() * 0.2;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2 + Math.random() * 2;
        this.bobHeight = 10 + Math.random() * 20;

        // Load sprite
        if (AssetLoader) {
            this.image = AssetLoader.getImage(this.type);
            if (!this.image) {
                AssetLoader.preloadImage(this.type).then(
                    (img: unknown) => (this.image = img as HTMLImageElement)
                );
            }
        }
    }

    update(dt: number) {
        const dtSec = dt / 1000;

        // Move
        this.x += this.vx * dtSec;
        this.y += this.vy * dtSec;

        // Bobbing motion (simulate flying)
        this.y +=
            Math.sin((Date.now() / 1000) * this.bobSpeed + this.bobOffset) *
            (this.bobHeight * dtSec);

        // Update Trail
        this.trailTimer += dtSec;
        if (this.trailTimer >= this.trailInterval) {
            this.trailTimer = 0;
            this.trail.unshift({ x: this.x, y: this.y, age: 0 });
            if (this.trail.length > 10) this.trail.pop();
        }

        // Age points
        for (const p of this.trail) {
            p.age += dtSec;
        }
    }

    render(ctx: CanvasRenderingContext2D) {
        // Render Trail (World Space)
        if (this.trail.length > 1) {
            ctx.save();

            // Pass 1: Outer "Vapor" (Billowy puffs)
            for (const p of this.trail) {
                const size = 8 + p.age * 40;
                const alpha = Math.max(0, 0.2 - p.age * 0.3);

                if (alpha > 0) {
                    ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        if (!this.image) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Face direction of movement
        if (this.vx < 0) {
            ctx.scale(-1, 1);
        }

        ctx.scale(this.scale, this.scale);

        const w = 100;
        const h = 100;

        // Shadow (simulating height)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, this.shadowOffset, w / 3, h / 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main sprite
        ctx.drawImage(this.image, -w / 2, -h / 2, w, h);

        ctx.restore();
    }
}

const AmbientSystem = {
    creatures: [] as AmbientCreature[],
    spawnTimer: 0,
    spawnRate: 10000,

    init() {
        this.creatures = [];
        this.spawnTimer = 0;
        this.setNextSpawnTime();
        Logger.info('[AmbientSystem] Initialized');
    },

    setNextSpawnTime() {
        this.spawnRate = 10000 + Math.random() * 50000;
    },

    update(dt: number) {
        // 1. Update existing creatures
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const c = this.creatures[i];
            c.update(dt);

            // Check Despawn (if sufficiently far from viewport)
            if (GameRenderer) {
                const vp = GameRenderer.viewport;
                const margin = 300;

                if (
                    (c.vx > 0 && c.x > vp.x + vp.width + margin) ||
                    (c.vx < 0 && c.x < vp.x - margin)
                ) {
                    c.active = false;
                }
            }

            if (!c.active) {
                this.creatures.splice(i, 1);
            }
        }

        // 2. Spawn new creatures
        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnTimer = 0;
            this.spawnPteranodon();
            this.setNextSpawnTime();
        }

        // 3. Update Fog/Atmosphere
        this.updateFog(dt);
    },

    updateFog(_dt: number) {
        // Disabled: Replaced by WorldRenderer Pixelated Fog
    },

    spawnPteranodon() {
        if (!GameRenderer) return;

        const vp = GameRenderer.viewport;
        const fromLeft = Math.random() > 0.5;
        const startX = fromLeft ? vp.x - 100 : vp.x + vp.width + 100;
        const startY = vp.y + Math.random() * vp.height * 0.4;
        const speed = 200 + Math.random() * 200;
        const vx = fromLeft ? speed : -speed;

        const creature = new AmbientCreature({
            type: 'dino_pteranodon_base',
            x: startX,
            y: startY,
            vx: vx,
            vy: 0
        });

        this.creatures.push(creature);

        if (AudioManager) {
            Logger.info('[AmbientSystem] Playing pterodactyl swoop SFX');
            AudioManager.playSFX('sfx_pterodactyl_swoop');
        }
    },

    render(ctx: CanvasRenderingContext2D) {
        for (const c of this.creatures) {
            c.render(ctx);
        }
    }
};

if (Registry) Registry.register('AmbientSystem', AmbientSystem);

export { AmbientSystem, AmbientCreature };
