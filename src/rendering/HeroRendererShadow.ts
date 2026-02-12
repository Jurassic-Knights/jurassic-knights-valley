/**
 * HeroRendererShadow - Hero shadow drawing
 */
import { RenderConfig } from '@config/RenderConfig';
import { environmentRenderer } from './EnvironmentRenderer';
import type { Hero } from '../gameplay/Hero';

export interface ShadowParams {
    shadowImg: HTMLImageElement | HTMLCanvasElement | null;
    forceOpaque?: boolean;
}

export function drawShadow(
    ctx: CanvasRenderingContext2D,
    hero: Hero,
    params: ShadowParams
): void {
    const cfg = RenderConfig?.Hero ?? null;
    if (!cfg) return;

    const env = environmentRenderer;
    let scaleY = 0.3;
    let alpha = 0.3;

    if (env) {
        scaleY = env.shadowScaleY;
        alpha = env.shadowAlpha;
    }

    ctx.save();
    ctx.translate(hero.x, hero.y + hero.height / 2 - 6);

    if (params.forceOpaque) {
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 1.0;
    } else {
        ctx.fillStyle = 'black';
        ctx.globalAlpha = alpha;
    }

    const contactWidth = hero.width * 0.5;
    const contactHeight = hero.height * 0.12;

    ctx.beginPath();
    ctx.ellipse(0, 0, contactWidth / 2, contactHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(hero.x, hero.y + hero.height / 2 - 6);

    const skew = env ? env.shadowSkew || 0 : 0;
    ctx.transform(1, 0, skew, 1, 0, 0);
    ctx.scale(1, -scaleY);

    if (params.forceOpaque) {
        ctx.globalAlpha = 1.0;
    } else {
        ctx.globalAlpha = alpha;
    }

    if (params.shadowImg) {
        ctx.drawImage(
            params.shadowImg,
            -hero.width / 2,
            -hero.height,
            hero.width,
            hero.height
        );
    }

    ctx.restore();
}
