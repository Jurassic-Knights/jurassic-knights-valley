/**
 * AmbientSystem - Manages ambient creatures and environmental effects
 *
 * Handles spawning decorative entities like birds (Pteranodon) that fly
 * across the screen to add life to the world.
 */

class AmbientCreature {
    constructor(config) {
        this.type = config.type || 'dino_pteranodon_base';
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;

        // Standardized scale (1.0 = 100px)
        this.scale = 0.9 + Math.random() * 0.2; // 0.9x to 1.1x
        this.active = true;

        // Load sprite
        this.image = null;
        if (window.AssetLoader) {
            this.image = AssetLoader.getImage(this.type);
            if (!this.image) {
                AssetLoader.preloadImage(this.type).then((img) => (this.image = img));
            }
        }

        // Animation
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2 + Math.random() * 2;
        this.bobHeight = 10 + Math.random() * 20;

        // Trail Config
        this.trail = [];
        this.trailTimer = 0;
        this.trailInterval = 0.05; // Seconds between points

        this.shadowOffset = 160; // 2x height
    }

    update(dt) {
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
            this.trail.unshift({ x: this.x, y: this.y, age: 0 }); // unshift to add to front
            if (this.trail.length > 10) this.trail.pop(); // Limit length
        }

        // Age points
        for (const p of this.trail) {
            p.age += dtSec;
        }

        // Despawn if far off screen
        // We need viewport info, but for now just safely despawn if HUGE coords
        // Better: The System checks viewport bounds for despawning.
    }

    render(ctx) {
        // Render Trail (World Space)
        if (this.trail.length > 1) {
            ctx.save();

            // Pass 1: Outer "Vapor" (Billowy puffs)
            // Draws expanding circles to simulate turbulence/clouds
            for (const p of this.trail) {
                // Age 0 = size 8, Age Max = size 28 (grows)
                const size = 8 + p.age * 40;
                // Fades out linearly
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

        // Draw centered
        // FORCED SIZE: Match Dinosaur.js (100x100)
        // We ignore natural dimensions to ensure visual consistency with game entities
        const w = 100;
        const h = 100;

        // Shadow (simulating height)
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        // Shadow is offset downwards and moves less (simulate parallax/height)
        ctx.ellipse(0, this.shadowOffset, w / 3, h / 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main sprite
        ctx.drawImage(this.image, -w / 2, -h / 2, w, h);

        ctx.restore();
    }
}

const AmbientSystem = {
    creatures: [],
    spawnTimer: 0,
    // Config: Random between 10s and 60s
    spawnRate: 10000,

    init() {
        this.creatures = [];
        this.spawnTimer = 0;
        this.setNextSpawnTime();
        Logger.info('[AmbientSystem] Initialized');
    },

    setNextSpawnTime() {
        // 10 to 60 seconds (10000 to 60000 ms)
        this.spawnRate = 10000 + Math.random() * 50000;
    },

    update(dt) {
        // 1. Update existing creatures
        for (let i = this.creatures.length - 1; i >= 0; i--) {
            const c = this.creatures[i];
            c.update(dt);

            // Check Despawn (if sufficiently far from viewport)
            if (window.GameRenderer) {
                const vp = GameRenderer.viewport;
                const margin = 300; // Allow full fly-out

                // If moved way past left or way past right
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

    /**
     * Update Fog/Clouds over locked islands
     * Extracted from IslandManager
     */
    updateFog(dt) {
        // Disabled: Replaced by WorldRenderer Pixelated Fog
    },

    spawnPteranodon() {
        if (!window.GameRenderer) return;

        const vp = GameRenderer.viewport;

        // Spawn edge: Left or Right
        const fromLeft = Math.random() > 0.5;

        // X Position: Just outside view
        const startX = fromLeft ? vp.x - 100 : vp.x + vp.width + 100;

        // Y Position: Top 40% of screen (Sky)
        const startY = vp.y + Math.random() * vp.height * 0.4;

        // Speed: 200-400 px/sec
        const speed = 200 + Math.random() * 200;
        const vx = fromLeft ? speed : -speed;

        const creature = new AmbientCreature({
            type: 'dino_pteranodon_base',
            x: startX,
            y: startY,
            vx: vx,
            vy: 0 // Mostly horizontal flight
        });

        this.creatures.push(creature);

        // Play distant swoop sound
        if (window.AudioManager) {
            Logger.info('[AmbientSystem] Playing pterodactyl swoop SFX');
            AudioManager.playSFX('sfx_pterodactyl_swoop');
        }
    },

    /**
     * Render all ambient creatures
     * Called by GameRenderer
     */
    render(ctx) {
        for (const c of this.creatures) {
            c.render(ctx);
        }
    }
};

window.AmbientSystem = AmbientSystem;
if (window.Registry) Registry.register('AmbientSystem', AmbientSystem);

// ES6 Module Export
export { AmbientSystem };
