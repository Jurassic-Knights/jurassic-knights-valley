/**
 * MeleeTrailRenderers – Style-specific canvas renderers for melee weapon trails.
 */
import type { MeleeTrailPoint } from '../types/vfx';

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

export function renderArc(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const config = trail[0].config;
    if (config.glow) {
        ctx.shadowColor = config.color;
        ctx.shadowBlur = 15;
    }
    for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i], p2 = trail[i + 1];
        const progress = p1.age / config.lifetime;
        const alpha = Math.max(0, 1 - progress);
        const width = config.width * (1 - progress * 0.5);
        ctx.strokeStyle = hexToRgba(config.color, alpha);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    ctx.restore();
}

export function renderAfterimage(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    const time = Date.now() / 1000;
    for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const progress = p.age / config.lifetime;
        const flicker = Math.sin(time * config.flickerRate * 10 + i) * 0.5 + 0.5;
        const alpha = Math.max(0, (1 - progress) * flicker);
        const size = config.width * (1 - progress * 0.3);
        ctx.fillStyle = hexToRgba(config.color, alpha * 0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

export function renderHeavy(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    ctx.lineCap = 'round';
    const config = trail[0].config;
    for (let offset = -2; offset <= 2; offset++) {
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i], p2 = trail[i + 1];
            const progress = p1.age / config.lifetime;
            const alpha = Math.max(0, 0.6 - progress);
            const width = config.width * (1 - progress * 0.4);
            ctx.strokeStyle = hexToRgba(config.color, alpha);
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(p1.x + offset, p1.y + offset);
            ctx.lineTo(p2.x + offset, p2.y + offset);
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
    renderArc(ctx, trail);
    ctx.restore();
}

export function renderDebris(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    renderArc(ctx, trail);
    for (let i = 0; i < trail.length; i += 2) {
        const p = trail[i];
        const progress = p.age / config.lifetime;
        const alpha = Math.max(0, 0.8 - progress);
        const size = config.width * 0.6 * (1 - progress);
        ctx.fillStyle = hexToRgba(config.fadeColor, alpha);
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.restore();
}

export function renderCrescent(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    ctx.lineCap = 'round';
    ctx.shadowColor = config.color;
    ctx.shadowBlur = 20;
    for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i], p2 = trail[i + 1];
        const progress = p1.age / config.lifetime;
        const alpha = Math.max(0, 1 - progress * 0.8);
        const width = config.width * (1 - progress * 0.3);
        ctx.strokeStyle = hexToRgba(config.color, alpha);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    ctx.restore();
}

export function renderImpact(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    const newest = trail[0];
    const progress = newest.age / config.lifetime;
    ctx.lineCap = 'round';
    const trailLen = Math.min(trail.length, 4);
    for (let i = 0; i < trailLen - 1; i++) {
        const p1 = trail[i], p2 = trail[i + 1];
        const alpha = Math.max(0, 0.8 - progress);
        ctx.strokeStyle = hexToRgba(config.color, alpha);
        ctx.lineWidth = config.width * (1 - i * 0.2);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    if (config.shockwave && progress < 0.5) {
        const ringRadius = 10 + progress * 60;
        const ringAlpha = 0.6 - progress * 1.2;
        ctx.strokeStyle = hexToRgba(config.color, Math.max(0, ringAlpha));
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(newest.x, newest.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

export function renderThrust(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    ctx.lineCap = 'round';
    for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i], p2 = trail[i + 1];
        const progress = p1.age / config.lifetime;
        const alpha = Math.max(0, 1 - progress);
        ctx.strokeStyle = hexToRgba(config.color, alpha);
        ctx.lineWidth = config.width * (1 - progress * 0.6);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    if (config.flash && trail.length > 0) {
        const tip = trail[0];
        const alpha = Math.max(0, 0.8 - tip.age * 4);
        ctx.fillStyle = hexToRgba('#FFFFFF', alpha);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

export function renderSweep(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    ctx.lineCap = 'round';
    for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i], p2 = trail[i + 1];
        const progress = p1.age / config.lifetime;
        const alpha = Math.max(0, 0.9 - progress);
        const width = config.width * (1 - i * 0.05);
        ctx.strokeStyle = hexToRgba(config.color, alpha);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }
    ctx.restore();
}

export function renderChain(ctx: CanvasRenderingContext2D, trail: MeleeTrailPoint[]): void {
    ctx.save();
    const config = trail[0].config;
    for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const progress = p.age / config.lifetime;
        const alpha = Math.max(0, 0.8 - progress);
        ctx.fillStyle = hexToRgba(config.fadeColor, alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, config.width * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
    if (trail.length > 0 && config.ball) {
        const head = trail[0];
        const alpha = Math.max(0, 1 - head.age * 2);
        ctx.fillStyle = hexToRgba(config.color, alpha);
        ctx.beginPath();
        ctx.arc(head.x, head.y, config.width * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}
