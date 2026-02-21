/**
 * WorldRendererWater – Draw scrolling water background.
 */
import type { IViewport } from '../types/core';

export interface WaterState {
    _assetLoader: { getImagePath: (id: string) => string; createImage: (path: string, cb?: () => void) => HTMLImageElement } | null;
    game: { getSystem: (name: string) => unknown } | null;
    backgroundPattern: CanvasPattern | null;
    _baseLayerImg: HTMLImageElement | null;
    _baseLayerLoaded: boolean;
}

export function drawWater(ctx: CanvasRenderingContext2D, viewport: IViewport, state: WaterState): void {
    ctx.save();
    const assetLoader = state._assetLoader || (state.game?.getSystem('AssetLoader') as WaterState['_assetLoader']);
    const bgId = 'bg_base_all_01';

    if (!state._baseLayerImg && assetLoader) {
        const path = assetLoader.getImagePath(bgId);
        if (path && !path.includes('PH.png')) {
            state._baseLayerImg = assetLoader.createImage(path, () => {
                state._baseLayerLoaded = true;
                state.backgroundPattern = null;
            });
        }
    }

    let pattern = state.backgroundPattern;
    if (state._baseLayerLoaded && !pattern && state._baseLayerImg) {
        pattern = ctx.createPattern(state._baseLayerImg, 'repeat');
        if (pattern) state.backgroundPattern = pattern;
    }

    if (pattern) {
        ctx.translate(-viewport.x, -viewport.y);
        ctx.scale(0.5, 0.5);
        ctx.fillStyle = pattern;
        ctx.fillRect(viewport.x * 2, viewport.y * 2, viewport.width * 2, viewport.height * 2);
    } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.restore();
}
