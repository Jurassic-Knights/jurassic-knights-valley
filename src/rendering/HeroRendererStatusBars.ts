/**
 * HeroRendererStatusBars - Health and resolve bar drawing
 */
import { RenderConfig } from '@config/RenderConfig';
import { MathUtils } from '@core/MathUtils';
import { ColorPalette } from '@config/ColorPalette';
import type { Hero } from '../gameplay/Hero';

export function drawStatusBars(ctx: CanvasRenderingContext2D, hero: Hero) {
    const barWidth = RenderConfig.UI.HEALTH_BAR_WIDTH;
    const barHeight = RenderConfig.UI.HEALTH_BAR_HEIGHT;
    const cornerRadius = 4;

    const healthY = hero.y - hero.height / 2 - 18;
    const healthPercent = MathUtils.clamp(hero.health / hero.maxHealth, 0, 1);
    const colors = ColorPalette;

    drawBar(
        ctx,
        hero.x,
        healthY,
        barWidth,
        barHeight,
        healthPercent,
        colors.HEALTH_GREEN,
        colors.HEALTH_BG,
        cornerRadius
    );
}

export function drawBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    percent: number,
    fillColor: string,
    bgColor: string,
    radius: number
) {
    const halfWidth = width / 2;

    ctx.save();

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(x - halfWidth, y - height / 2, width, height, radius);
    ctx.fill();

    if (percent > 0) {
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        const fillWidth = width * percent;
        ctx.roundRect(x - halfWidth, y - height / 2, fillWidth, height, radius);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - halfWidth, y - height / 2, width, height, radius);
    ctx.stroke();

    ctx.restore();
}
