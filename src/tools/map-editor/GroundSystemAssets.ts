/**
 * GroundSystemAssets - Asset loading and caching for ground tiles
 */
import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { GroundBlendRenderer } from '@core/rendering/GroundBlendRenderer';
import { GroundPalette } from '@data/ZonePalette';

export interface AssetCaches {
    dataCache: Map<string, Uint8ClampedArray>;
    textureCache: Record<string, PIXI.Texture>;
}

export function loadImage(path: string | null): Promise<HTMLImageElement | null> {
    if (!path) return Promise.resolve(null);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = path;
    });
}

function createFallbackTexture(): { data: Uint8ClampedArray; texture: PIXI.Texture } {
    const size = 32;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
    const data = ctx.getImageData(0, 0, size, size).data;
    return { data, texture: PIXI.Texture.from(c) };
}

export async function getAssetData(
    id: string,
    isHeightMap: boolean,
    caches: AssetCaches
): Promise<Uint8ClampedArray | null> {
    const cacheKey = isHeightMap ? id + '_height' : id;
    if (caches.dataCache.has(cacheKey)) return caches.dataCache.get(cacheKey)!;

    let data: Uint8ClampedArray | null = null;

    if (isHeightMap) {
        const path = AssetLoader.getHeightMapPath(id);
        if (path) {
            const img = await loadImage(path);
            if (img) data = GroundBlendRenderer.extractData(img);
        }
    } else {
        const path = AssetLoader.getImagePath(id);
        const img = await AssetLoader.preloadImage(id, false);
        if (img) {
            data = GroundBlendRenderer.extractData(img);
            if (!caches.textureCache[id]) {
                caches.textureCache[id] = PIXI.Texture.from(img);
            }
        } else {
            Logger.error(`[GroundSystem] Failed to load ${id}. Path resolved to: ${path}`);
            const fallback = createFallbackTexture();
            data = fallback.data;
            if (!caches.textureCache[id]) {
                caches.textureCache[id] = fallback.texture;
            }
        }
    }

    if (data) caches.dataCache.set(cacheKey, data);
    return data;
}

export async function preloadPaletteAssets(
    uniquePaletteIds: Set<string>
): Promise<Map<string, unknown>> {
    const preloadedAssets = new Map<string, unknown>();
    await Promise.all(
        Array.from(uniquePaletteIds).map(async (pid) => {
            const palette = GroundPalette[pid] || GroundPalette['default'];
            const [b, m, o, n, h] = await Promise.all([
                AssetLoader.preloadImage(palette.baseId, false),
                AssetLoader.preloadImage(palette.midId, false),
                AssetLoader.preloadImage(palette.overlayId, false),
                AssetLoader.preloadImage(palette.noiseId, false),
                loadImage(AssetLoader.getHeightMapPath(palette.baseId))
            ]);

            if (b) {
                const safeM = m || b;
                const safeO = o || b;
                const safeN = n || b;
                const safeH = h || b;
                const assetData = {
                    base: GroundBlendRenderer.extractData(b),
                    mid: GroundBlendRenderer.extractData(safeM),
                    overlay: GroundBlendRenderer.extractData(safeO),
                    noise: GroundBlendRenderer.extractData(safeN),
                    heightMap: GroundBlendRenderer.extractData(safeH),
                    width: b.width,
                    height: b.height,
                    baseTexture: PIXI.Texture.from(b),
                    palette
                };
                preloadedAssets.set(pid, assetData);
            } else {
                Logger.error(`[GroundSystem] Failed to load BASE texture for ${pid} (${palette.baseId})`);
            }
        })
    );
    return preloadedAssets;
}
