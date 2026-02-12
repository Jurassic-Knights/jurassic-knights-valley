/**
 * GroundSystemTileTexture - Tile texture computation for ground blending
 */
import * as PIXI from 'pixi.js';
import { AssetLoader } from '@core/AssetLoader';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { GroundBlendRenderer, BlendAssets } from '@core/rendering/GroundBlendRenderer';
import { getSplatWeight } from './GroundSystemSplat';
import type { GroundPaletteEntry } from '@data/ZonePalette';

export interface PreloadedAssets {
    base: unknown;
    mid: unknown;
    overlay: unknown;
    noise: unknown;
    heightMap: unknown;
    width: number;
    height: number;
    baseTexture?: PIXI.Texture;
    palette: GroundPaletteEntry;
}

export type LoadAssetFn = (id: string, isHeightMap?: boolean) => Promise<Uint8ClampedArray | null>;

export async function computeTileTexture(
    chunkKey: string,
    lx: number,
    ly: number,
    data: ChunkData,
    splatData: Uint8ClampedArray,
    worldData: Map<string, ChunkData> | undefined,
    preloadedAssets: PreloadedAssets | undefined,
    loadAsset: LoadAssetFn,
    palette: GroundPaletteEntry,
    textureCache: Record<string, PIXI.Texture>,
    renderer: GroundBlendRenderer
): Promise<PIXI.Texture> {
    const { CHUNK_SIZE } = MapEditorConfig;
    const SPLAT_RES = CHUNK_SIZE * 4;

    let maxWeight = 0;
    const weights = new Uint8ClampedArray(36); // 6x6

    for (let sy = 0; sy < 6; sy++) {
        for (let sx = 0; sx < 6; sx++) {
            const sampleX = lx * 4 + sx - 1;
            const sampleY = ly * 4 + sy - 1;

            const w = worldData
                ? getSplatWeight(chunkKey, sampleX, sampleY, data, worldData)
                : (() => {
                      const clampedX = Math.max(0, Math.min(SPLAT_RES - 1, sampleX));
                      const clampedY = Math.max(0, Math.min(SPLAT_RES - 1, sampleY));
                      const idx = clampedY * SPLAT_RES + clampedX;
                      return idx < splatData.length ? splatData[idx] : 0;
                  })();

            weights[sy * 6 + sx] = w;
            if (w > maxWeight) maxWeight = w;
        }
    }

    if (maxWeight === 0) {
        if (preloadedAssets?.baseTexture) return preloadedAssets.baseTexture;
        return textureCache[palette.baseId] ?? PIXI.Texture.WHITE;
    }

    let base: Uint8ClampedArray | null;
    let mid: Uint8ClampedArray | null;
    let overlay: Uint8ClampedArray | null;
    let noise: Uint8ClampedArray | null;
    let baseH: Uint8ClampedArray | null;
    let texWidth = 32;
    let texHeight = 32;

    if (preloadedAssets) {
        base = preloadedAssets.base as Uint8ClampedArray;
        mid = preloadedAssets.mid as Uint8ClampedArray;
        overlay = preloadedAssets.overlay as Uint8ClampedArray;
        noise = preloadedAssets.noise as Uint8ClampedArray;
        baseH = preloadedAssets.heightMap as Uint8ClampedArray;
        texWidth = preloadedAssets.width;
        texHeight = preloadedAssets.height;
    } else {
        [base, mid, overlay, noise, baseH] = await Promise.all([
            loadAsset(palette.baseId, false),
            loadAsset(palette.midId, false),
            loadAsset(palette.overlayId, false),
            loadAsset(palette.noiseId, false),
            loadAsset(palette.baseId, true)
        ]);
        const img = AssetLoader.getImage(palette.baseId);
        if (img) {
            texWidth = img.width;
            texHeight = img.height;
        }
    }

    if (!base || base.length === 0) return PIXI.Texture.WHITE;

    if (base.length > 0) {
        const expectedPixels = base.length / 4;
        const currentPixels = texWidth * texHeight;
        if (currentPixels !== expectedPixels) {
            const side = Math.sqrt(expectedPixels);
            if (Number.isInteger(side)) {
                texWidth = side;
                texHeight = side;
            }
        }
    }

    const assets: BlendAssets = {
        base,
        mid: mid ?? base,
        overlay: overlay ?? base,
        noise: noise ?? base,
        heightMap: baseH ?? base,
        width: texWidth,
        height: texHeight
    };

    const [cx, cy] = chunkKey.split(',').map(Number);
    const globalTx = cx * CHUNK_SIZE + lx;
    const globalTy = cy * CHUNK_SIZE + ly;

    const bitmap = await renderer.generateTile(weights, assets, {
        thresholdBias: 0.5,
        noiseScale: 0.2,
        tileX: globalTx,
        tileY: globalTy
    });
    const texture = PIXI.Texture.from(bitmap);
    (texture as { _isGenerated?: boolean })._isGenerated = true;
    return texture;
}
