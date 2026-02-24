/**
 * ParticleRenderer - Shape-specific particle drawing
 *
 * Extracted from ParticleSystem.js to reduce file size.
 * Called by ParticleSystem.render() for each particle.
 *
 * Owner: VFX Specialist
 */

import { MathUtils } from '@core/MathUtils';
import { Particle } from '../types/vfx';

const ParticleRenderer = {
    // Sprite cache for lazy-loading
    _spriteCache: {} as Record<string, HTMLImageElement>,

    /**
     * Render a single particle based on its type
     * @param {CanvasRenderingContext2D} ctx - Canvas context (already translated to particle position)
     * @param {object} p - Particle object
     * @param {number} pSize - Projected particle size
     * @param {number} scaleX - Scale factor for screen projection
     */
    renderParticle(ctx: CanvasRenderingContext2D, p: Particle, pSize: number, scaleX: number) {
        switch (p.type) {
            case 'glow':
                this.drawGlow(ctx, p, pSize);
                break;
            case 'streak':
                this.drawStreak(ctx, p, pSize, scaleX);
                break;
            case 'ray':
                this.drawRay(ctx, p, pSize);
                break;
            case 'ring':
                this.drawRing(ctx, p, pSize, scaleX);
                break;
            case 'spark':
                this.drawSpark(ctx, p, pSize, scaleX);
                break;
            case 'sprite':
                this.drawSprite(ctx, p, pSize);
                break;
            case 'fog_soft':
                this.drawFogSoft(ctx, p, pSize);
                break;
            case 'cloud':
                this.drawCloud(ctx, p, pSize);
                break;
            case 'debris':
                this.drawDebris(ctx, p, pSize);
                break;
            default:
                this.drawCircle(ctx, p, pSize);
        }
    },

    drawGlow(ctx: CanvasRenderingContext2D, p: Particle, pSize: number) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pSize);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, pSize, 0, Math.PI * 2);
        ctx.fill();
    },

    drawStreak(ctx: CanvasRenderingContext2D, p: Particle, pSize: number, scaleX: number) {
        const speed = MathUtils.distance(0, 0, p.vx, p.vy);
        const angle = Math.atan2(p.vy, p.vx);
        ctx.rotate(angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(-speed * 2 * scaleX, 0);
        ctx.lineTo(0, pSize / 2);
        ctx.lineTo(speed * 0.5 * scaleX, 0);
        ctx.lineTo(0, -pSize / 2);
        ctx.closePath();
        ctx.fill();
    },

    drawRay(ctx: CanvasRenderingContext2D, p: Particle, pSize: number) {
        ctx.rotate(p.rotation);
        const gradient = ctx.createLinearGradient(0, 0, pSize * 4, 0);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -pSize / 4);
        ctx.lineTo(pSize * 6, 0);
        ctx.lineTo(0, pSize / 4);
        ctx.closePath();
        ctx.fill();
    },

    drawRing(ctx: CanvasRenderingContext2D, p: Particle, pSize: number, scaleX: number) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 * scaleX;
        ctx.beginPath();
        ctx.arc(0, 0, pSize, 0, Math.PI * 2);
        ctx.stroke();
    },

    drawSpark(ctx: CanvasRenderingContext2D, p: Particle, pSize: number, scaleX: number) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2 * scaleX;
        ctx.beginPath();
        const vAngle = Math.atan2(p.vy, p.vx);
        ctx.rotate(vAngle);
        ctx.moveTo(0, 0);
        const len = Math.min(pSize * 3, MathUtils.distance(0, 0, p.vx, p.vy) * 3 * scaleX);
        ctx.lineTo(-len, 0);
        ctx.stroke();
    },

    drawSprite(ctx: CanvasRenderingContext2D, p: Particle, pSize: number) {
        if (!AssetLoader || !p.sprite) return;

        let img = AssetLoader.getImage(p.sprite);

        if (!img) {
            const path = AssetLoader.getImagePath(p.sprite);
            if (path) {
                if (!this._spriteCache[p.sprite]) {
                    this._spriteCache[p.sprite] = AssetLoader.createImage(path);
                }
                img = this._spriteCache[p.sprite];
            }
        }

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.rotate(p.rotation);

            if (p.warp) {
                this._drawWarpedSprite(ctx, img, p, pSize);
            } else {
                ctx.drawImage(img, -pSize / 2, -pSize / 2, pSize, pSize);
            }
        } else if (img instanceof HTMLCanvasElement) {
            ctx.rotate(p.rotation);
            ctx.drawImage(img, -pSize / 2, -pSize / 2, pSize, pSize);
        }
    },

    _drawWarpedSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, p: Particle, pSize: number) {
        if (!p.warp) return;
        const time = p.age * 0.001 * p.warp.speed;
        const slices = 10;
        const sliceH = pSize / slices;
        const imgSliceH = img.height / slices;

        for (let i = 0; i < slices; i++) {
            const ny = i / slices;
            const offset = p.warpOffset || 0;
            const wave = Math.sin(time + ny * Math.PI * (p.warp.freq || 2) + offset);
            const scaleFactor = 1 + wave * (p.warp.amp || 0.1);

            const dw = pSize * scaleFactor;
            const dh = sliceH;
            const dx = -dw / 2;
            const dy = -pSize / 2 + i * sliceH;

            const sx = 0;
            const sy = i * imgSliceH;
            const sw = img.width;
            const sh = imgSliceH;

            ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        }
    },

    drawFogSoft(ctx: CanvasRenderingContext2D, _p: Particle, pSize: number) {
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pSize / 2);
        grad.addColorStop(0, 'rgba(240, 245, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(200, 210, 230, 0.5)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, pSize / 2, 0, Math.PI * 2);
        ctx.fill();
    },

    drawCloud(ctx: CanvasRenderingContext2D, p: Particle, pSize: number) {
        if (!p.blobPoints) return;

        ctx.fillStyle = p.color;
        ctx.rotate(p.rotation);

        ctx.beginPath();
        const points = p.blobPoints;
        const len = points.length;
        const coords = [];

        for (let i = 0; i < len; i++) {
            const r = pSize * points[i];
            const a = (i / len) * Math.PI * 2;
            coords.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }

        const firstMidX = (coords[0].x + coords[len - 1].x) / 2;
        const firstMidY = (coords[0].y + coords[len - 1].y) / 2;
        ctx.moveTo(firstMidX, firstMidY);

        for (let i = 0; i < len; i++) {
            const next = coords[(i + 1) % len];
            const midX = (coords[i].x + next.x) / 2;
            const midY = (coords[i].y + next.y) / 2;
            ctx.quadraticCurveTo(coords[i].x, coords[i].y, midX, midY);
        }
        ctx.closePath();
        ctx.fill();
    },

    drawDebris(ctx: CanvasRenderingContext2D, p: Particle, pSize: number) {
        ctx.fillStyle = p.color;
        ctx.rotate(p.rotation);
        const s = pSize;
        ctx.fillRect(-s / 2, -s / 2, s, s);
    },

    drawCircle(ctx: CanvasRenderingContext2D, p: Particle, pSize: number) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, pSize, 0, Math.PI * 2);
        ctx.fill();
    }
};

// ES6 Module Export
export { ParticleRenderer };
