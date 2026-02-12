/**
 * EnvironmentRendererStorm – Lightning and wind state/update/render for storms.
 */
import { Logger } from '@core/Logger';
import { ProceduralSFX } from '../audio/ProceduralSFX';

export interface LightningBolt {
    points: { x: number; y: number }[];
    life: number;
}

export interface LightningState {
    timer: number;
    flashAlpha: number;
    bolt: LightningBolt | null;
    boltColor: string;
}

export interface WindState {
    currentX: number;
    targetX: number;
    baseX: number;
    gusting: boolean;
    timer: number;
}

export function createLightningState(): LightningState {
    return { timer: 0, flashAlpha: 0, bolt: null, boltColor: '#ffffff' };
}

export function createWindState(): WindState {
    return { currentX: 0, targetX: 0, baseX: 10, gusting: false, timer: 0 };
}

export function updateLightning(
    dt: number,
    state: LightningState,
    weatherType: string,
    triggerFn: () => void
): void {
    if (weatherType !== 'STORM') return;

    if (state.flashAlpha > 0) {
        state.flashAlpha -= dt / 200;
        if (state.flashAlpha < 0) state.flashAlpha = 0;
    }

    if (state.bolt) {
        state.bolt.life -= dt;
        if (state.bolt.life <= 0) state.bolt = null;
    }

    state.timer -= dt / 1000;
    if (state.timer <= 0) {
        triggerFn();
        state.timer = 2 + Math.random() * 6;
    }
}

export function triggerLightning(
    lightning: LightningState,
    ctx: CanvasRenderingContext2D | null,
    getCtx: (() => CanvasRenderingContext2D | null) | null
): void {
    let targetCtx = ctx;
    if (!targetCtx && getCtx) targetCtx = getCtx();
    if (!targetCtx) return;

    lightning.flashAlpha = 0.6 + Math.random() * 0.4;

    const startX = Math.random() * targetCtx.canvas.width;
    const startY = -50;
    const points = [{ x: startX, y: startY }];
    let currX = startX;
    let currY = startY;

    while (currY < targetCtx.canvas.height * (0.5 + Math.random() * 0.3)) {
        currY += 20 + Math.random() * 50;
        currX += (Math.random() - 0.5) * 80;
        points.push({ x: currX, y: currY });
    }

    lightning.bolt = { points, life: 150 };

    if (ProceduralSFX) ProceduralSFX.playThunder();
    Logger.info('[Weather] Lightning Strike!');
}

export function updateWind(dt: number, wind: WindState, weatherType: string): void {
    wind.timer -= dt / 1000;

    if (wind.timer <= 0) {
        const isStorm = weatherType === 'STORM';

        if (wind.gusting) {
            wind.gusting = false;
            wind.targetX = isStorm ? 50 : wind.baseX;
            wind.timer = isStorm ? 1 + Math.random() * 2 : 5 + Math.random() * 10;
        } else {
            const chance = isStorm ? 0.9 : 0.7;
            if (Math.random() < chance) {
                wind.gusting = true;
                const strength = isStorm ? 300 + Math.random() * 300 : 100 + Math.random() * 150;
                wind.targetX = strength;
                wind.timer = isStorm ? 3 + Math.random() * 3 : 2 + Math.random() * 4;
            } else {
                wind.timer = 2 + Math.random() * 3;
            }
        }
    }

    const lerpSpeed = 2.0 * (dt / 1000);
    const diff = wind.targetX - wind.currentX;
    if (Math.abs(diff) > 1) wind.currentX += diff * Math.min(1.0, lerpSpeed);
    else wind.currentX = wind.targetX;
}

export function renderLightning(ctx: CanvasRenderingContext2D, lightning: LightningState): void {
    if (lightning.flashAlpha > 0) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(255, 255, 255, ${lightning.flashAlpha})`;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    if (lightning.bolt) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = lightning.boltColor;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        const pts = lightning.bolt.points;
        if (pts.length > 0) {
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }
}
