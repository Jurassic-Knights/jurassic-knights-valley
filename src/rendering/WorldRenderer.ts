/**
 * WorldRenderer
 * Handles rendering of static world elements: Water, Islands, Bridges, Fog, Borders.
 */

import { Logger } from '@core/Logger';
import { GameRenderer } from '@core/GameRenderer';
import { Registry } from '@core/Registry';
import { IGame, IViewport } from '../types/core.d';
import { AssetLoader } from '@core/AssetLoader';
import { IslandManagerService } from '../world/IslandManagerCore';
import { Island } from '../types/world';
import { IslandType } from '@config/WorldTypes';
import { drawWater } from './WorldRendererWater';
import { drawWorld, drawFallbackGrid } from './WorldRendererIslands';

interface CachedIsland extends Island {
    _cachedAssetId?: string;
    _scaledW?: number;
    _scaledH?: number;
    _drawX?: number;
    _drawY?: number;
}

class WorldRenderer {
    game: IGame | null = null;
    backgroundPattern: CanvasPattern | null = null;
    _zoneImages: Record<string, HTMLImageElement> = {};
    _fogPattern: CanvasPattern | null = null;
    _assetLoader: typeof AssetLoader | null = null;
    _islandManager: IslandManagerService | null = null;
    _gameRenderer: typeof GameRenderer | null = null;
    _preloadDone: boolean = false;
    _baseLayerImg: HTMLImageElement | null = null;
    _baseLayerLoaded: boolean = false;

    constructor() {
        Logger.info('[WorldRenderer] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        // Cache system references for performance
        this._assetLoader = game.getSystem<typeof AssetLoader>('AssetLoader');
        this._islandManager = game.getSystem<IslandManagerService>('IslandManager');
        this._gameRenderer = game.getSystem<typeof GameRenderer>('GameRenderer');

        // PERF: Pre-load all zone images at init time
        this._preloadZoneImages();

        Logger.info('[WorldRenderer] Initialized');
    }

    /**
     * Pre-load all zone images to avoid per-frame loading
     */
    _preloadZoneImages() {
        if (!this._assetLoader || !this._islandManager) return;

        const assetLoader = this._assetLoader;
        const islands = (this._islandManager.islands || []) as CachedIsland[];

        for (const island of islands) {
            // Cache asset ID on island
            if (!island._cachedAssetId) {
                island._cachedAssetId =
                    island.type === IslandType.HOME
                        ? 'world_island_home'
                        : 'zone_' + island.name.toLowerCase().replace(/ /g, '_');

                // Pre-cache scaled dimensions
                const scale = 1.2;
                island._scaledW = island.width * scale;
                island._scaledH = island.height * scale;
                island._drawX = island.worldX - (island._scaledW - island.width) / 2;
                island._drawY = island.worldY - (island._scaledH - island.height) / 2;
            }

            const assetId = island._cachedAssetId;

            // Pre-load image
            if (!this._zoneImages[assetId]) {
                const bgPath = assetLoader.getImagePath(assetId);
                if (bgPath) {
                    this._zoneImages[assetId] = assetLoader.createImage(bgPath);
                }
            }
        }

        Logger.info(
            `[WorldRenderer] Pre-loaded ${Object.keys(this._zoneImages).length} zone images`
        );
    }

    /**
     * Main render entry point
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} viewport
     */
    render(ctx: CanvasRenderingContext2D, viewport: IViewport) {
        if (!this.game) return;

        // Hook into GameRenderer timing if available
        const timing = (GameRenderer as { _renderTiming?: Record<string, number> })?._renderTiming;
        let t0;

        if (timing) t0 = performance.now();
        drawWater(ctx, viewport, this);
        if (timing) timing.worldWater = (timing.worldWater || 0) + performance.now() - t0;

        if (timing) t0 = performance.now();
        const islandManager = this._islandManager || (this.game && this.game.getSystem('IslandManager'));
        const assetLoader = this._assetLoader || (this.game && this.game.getSystem('AssetLoader'));
        if (islandManager) {
            if (!this._preloadDone && islandManager.islands?.length) {
                this._preloadZoneImages();
                this._preloadDone = true;
            }
            drawWorld(ctx, viewport, islandManager, assetLoader, this._zoneImages, this._gameRenderer, (id, img) => { this._zoneImages[id] = img; });
        } else {
            drawFallbackGrid(ctx, viewport);
        }
        if (timing) timing.worldIslands = (timing.worldIslands || 0) + performance.now() - t0;

        // 3. Debug Overlays
        if (timing) t0 = performance.now();
        this.drawDebug(ctx, viewport);
        if (timing) {
            timing.worldDebug = (timing.worldDebug || 0) + performance.now() - t0;
        }
    }

    drawDebug(ctx: CanvasRenderingContext2D, viewport: IViewport) {
        // Debug visualization removed - collision blocks are now shown in GameRenderer
    }
}

const worldRenderer = new WorldRenderer();
if (Registry) Registry.register('WorldRenderer', worldRenderer);

export { WorldRenderer, worldRenderer };
