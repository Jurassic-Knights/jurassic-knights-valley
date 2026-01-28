/**
 * FogOfWarSystem
 * Hybrid fog system: Combines texture-based clouds with procedural pixel overlay.
 * - Base layer: Your fog_of_war.png texture (tiled/repeated)
 * - Overlay: Procedural pixelated noise for detail and movement
 */

import { Registry } from '@core/Registry';
import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { IslandManager } from '../world/IslandManager';

// Helper to get AssetLoader from Registry (avoid circular dependency)
const getAssetLoader = () => Registry?.get('AssetLoader');

const FogOfWarSystem = {
    islands: new Map(),
    fogTexture: null,
    textureLoaded: false,

    COVERAGE_PADDING: 100,

    init(game) {
        this.game = game;
        Logger.info('[FogOfWarSystem] Initialized');

        // Load the fog texture via AssetLoader (fallback chain enabled)
        const AssetLoader = getAssetLoader();
        if (AssetLoader) {
            const fogPath = AssetLoader.getImagePath('vfx_fog_of_war');
            this.fogTexture = AssetLoader.createImage(fogPath, () => {
                this.textureLoaded = true;
                Logger.info('[FogOfWarSystem] Fog texture loaded');
            });
        } else {
            // Fallback for initialization order - still try AssetLoader path
            Logger.warn('[FogOfWarSystem] AssetLoader not ready, fog texture may not load');
        }

        if (EventBus && GameConstants) {
            EventBus.on(GameConstants.Events.ISLAND_UNLOCKED, (data) => {
                this.onIslandUnlocked(data);
            });
        }
    },

    update(dt) {
        if (!IslandManager) return;

        for (const island of IslandManager.islands) {
            const id = `${island.gridX}_${island.gridY}`;

            if (!island.unlocked && !this.islands.has(id)) {
                this.createFogForIsland(island, id);
            }

            const data = this.islands.get(id);
            if (data) {
                this.updateFog(data, dt);

                if (data.dispersing && data.alpha <= 0) {
                    this.islands.delete(id);
                }
            }
        }
    },

    createFogForIsland(island, id) {
        const pad = this.COVERAGE_PADDING;

        this.islands.set(id, {
            x: island.worldX - pad,
            y: island.worldY - pad,
            width: island.width + pad * 2,
            height: island.height + pad * 2,
            centerX: island.worldX + island.width / 2,
            centerY: island.worldY + island.height / 2,
            time: Math.random() * 100,
            alpha: 1,
            dispersing: false,
            // Multiple cloud instances with different properties
            clouds: this.generateClouds(island, id)
        });
    },

    generateClouds(island, id) {
        const clouds = [];
        const numClouds = 5 + Math.floor(Math.random() * 3); // 5-7 cloud instances

        for (let i = 0; i < numClouds; i++) {
            clouds.push({
                // Position offset within island
                offsetX: (Math.random() - 0.5) * island.width * 0.6,
                offsetY: (Math.random() - 0.5) * island.height * 0.6,
                // Scale 0.7 to 1.35 (10% smaller)
                scale: 0.7 + Math.random() * 0.65,
                // Scale animation
                scalePhase: Math.random() * Math.PI * 2,
                scaleSpeed: 0.2 + Math.random() * 0.15,
                scaleAmount: 0.05 + Math.random() * 0.08, // 5-13% pulse
                // Rotation
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.001,
                // Drift animation
                driftPhaseX: Math.random() * Math.PI * 2,
                driftPhaseY: Math.random() * Math.PI * 2,
                driftSpeedX: 0.1 + Math.random() * 0.1,
                driftSpeedY: 0.08 + Math.random() * 0.08,
                driftAmplitudeX: 20 + Math.random() * 30,
                driftAmplitudeY: 15 + Math.random() * 25,
                // Alpha variance
                baseAlpha: 0.5 + Math.random() * 0.4,
                alphaPhase: Math.random() * Math.PI * 2,
                // Disperse velocity
                disperseVel: { x: 0, y: 0 }
            });
        }

        return clouds;
    },

    updateFog(data, dt) {
        const dtSec = dt / 1000;
        data.time += dtSec;

        for (const cloud of data.clouds) {
            cloud.rotation += cloud.rotationSpeed * dtSec * 60;
        }

        if (data.dispersing) {
            data.alpha -= 0.5 * dtSec;

            for (const cloud of data.clouds) {
                cloud.offsetX += cloud.disperseVel.x * dtSec * 60;
                cloud.offsetY += cloud.disperseVel.y * dtSec * 60;
                cloud.rotation += cloud.rotationSpeed * 5 * dtSec * 60;
            }
        }
    },

    onIslandUnlocked(eventData) {
        const id = `${eventData.gridX}_${eventData.gridY}`;
        const data = this.islands.get(id);

        if (data && !data.dispersing) {
            data.dispersing = true;

            for (let i = 0; i < data.clouds.length; i++) {
                const cloud = data.clouds[i];
                const angle = ((Math.PI * 2) / data.clouds.length) * i + Math.random() * 0.5;
                const speed = 3 + Math.random() * 4;
                cloud.disperseVel.x = Math.cos(angle) * speed;
                cloud.disperseVel.y = Math.sin(angle) * speed;
                cloud.rotationSpeed = (Math.random() - 0.5) * 0.01;
            }

            Logger.info(`[FogOfWarSystem] Dispersing fog for island ${id}`);
        }
    },

    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    },

    render(ctx, viewport) {
        if (!this.textureLoaded) return;

        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);

        // Viewport bounds for culling
        const vpLeft = viewport.x - 300;
        const vpRight = viewport.x + viewport.width + 300;
        const vpTop = viewport.y - 300;
        const vpBottom = viewport.y + viewport.height + 300;

        for (const [id, data] of this.islands) {
            if (data.alpha <= 0) continue;

            // Viewport culling
            if (
                data.x + data.width < vpLeft ||
                data.x > vpRight ||
                data.y + data.height < vpTop ||
                data.y > vpBottom
            ) {
                continue;
            }

            const time = data.time;
            const texW = this.fogTexture.width;
            const texH = this.fogTexture.height;

            // Render each cloud instance
            for (const cloud of data.clouds) {
                // Animated drift
                const driftX =
                    Math.sin(time * cloud.driftSpeedX + cloud.driftPhaseX) * cloud.driftAmplitudeX;
                const driftY =
                    Math.cos(time * cloud.driftSpeedY + cloud.driftPhaseY) * cloud.driftAmplitudeY;

                // Breathing alpha
                const breathe = 0.85 + Math.sin(time * 0.4 + cloud.alphaPhase) * 0.15;

                // Final position
                const drawX = data.centerX + cloud.offsetX + driftX;
                const drawY = data.centerY + cloud.offsetY + driftY;

                ctx.save();
                ctx.globalAlpha = data.alpha * cloud.baseAlpha * breathe;
                ctx.translate(drawX, drawY);
                ctx.rotate(cloud.rotation);
                // Animated scale
                const scalePulse =
                    1 + Math.sin(time * cloud.scaleSpeed + cloud.scalePhase) * cloud.scaleAmount;
                const finalScale = cloud.scale * scalePulse;

                ctx.scale(finalScale, finalScale);

                // Draw the texture centered
                ctx.drawImage(this.fogTexture, -texW / 2, -texH / 2);

                ctx.restore();
            }

            // Add pixelated overlay for extra detail (subtle)
            this.renderPixelOverlay(ctx, data, time);
        }

        ctx.restore();
    },

    renderPixelOverlay(ctx, data, time) {
        // PERFORMANCE: Skip pixel overlay entirely - it's very expensive
        // The cloud textures provide enough visual interest
        return;

        // Original code below kept for reference:
        /*
        // Subtle animated pixel noise on top
        const ps = 10; // Pixel size
        const density = 0.15; // Only 15% of cells get pixels

        ctx.globalAlpha = data.alpha * 0.3;

        const cols = Math.ceil(data.width / ps);
        const rows = Math.ceil(data.height / ps);
        const seed = data.x * 100 + data.y;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const noise = this.noise(c + seed, r + seed);
                if (noise > density) continue;

                // Animated position jitter
                const jitterX = Math.sin(time * 0.5 + noise * 10) * 5;
                const jitterY = Math.cos(time * 0.4 + noise * 8) * 5;

                // Radial fade
                const cx = (c / cols) * 2 - 1;
                const cy = (r / rows) * 2 - 1;
                const dist = Math.sqrt(cx * cx + cy * cy);
                if (dist > 0.7) continue;

                const brightness = 160 + noise * 80;
                ctx.fillStyle = `rgb(${brightness}, ${brightness + 5}, ${brightness + 15})`;

                const size = 6 + noise * 8;
                ctx.fillRect(
                    data.x + c * ps + jitterX,
                    data.y + r * ps + jitterY,
                    size,
                    size
                );
            }
        }
        */
    }
};

if (Registry) Registry.register('FogOfWarSystem', FogOfWarSystem);

// ES6 Module Export
export { FogOfWarSystem };
