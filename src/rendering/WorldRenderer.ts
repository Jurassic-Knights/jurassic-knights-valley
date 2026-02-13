/**
 * WorldRenderer
 * Handles rendering of static world elements. Uses mapgen4 polygon map.
 */

import { Logger } from '@core/Logger';
import { GameRenderer } from '@core/GameRenderer';
import { Registry } from '@core/Registry';
import { IGame, IViewport } from '../types/core.d';
import { worldRendererMapgen4 } from './WorldRendererMapgen4';

class WorldRenderer {
    game: IGame | null = null;

    constructor() {
        Logger.info('[WorldRenderer] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        worldRendererMapgen4.init(game);
        Logger.info('[WorldRenderer] Initialized (mapgen4)');
    }

    render(ctx: CanvasRenderingContext2D, viewport: IViewport) {
        if (!this.game) return;

        const timing = (GameRenderer as { _renderTiming?: Record<string, number> })?._renderTiming;
        const t0 = timing ? performance.now() : 0;

        worldRendererMapgen4.render(ctx, viewport);

        if (timing) {
            timing.world = (timing.world || 0) + performance.now() - t0;
        }
    }
}

const worldRenderer = new WorldRenderer();
if (Registry) Registry.register('WorldRenderer', worldRenderer);

export { WorldRenderer, worldRenderer };
