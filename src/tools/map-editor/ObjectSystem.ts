import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { EntityRegistry } from '@entities/EntityLoader';
import { EntityScaling } from '../../utils/EntityScaling';
import * as Lookup from '@entities/EntityLoaderLookup';

/** Label for object sprites so we can find and refresh them on entity display updates */
export const OBJECT_SPRITE_LABEL = 'map_object';

/**
 * ObjectSystem — Object placement and rendering for map editor chunks.
 * Renders entity sprites at world positions using EntityRegistry sizes.
 */
export class ObjectSystem {

    public addObject(data: ChunkData, assetId: string, x: number, y: number) {
        if (!data.objects) data.objects = [];
        data.objects.push({ id: assetId, x, y });
    }

    public renderChunkObjects(container: PIXI.Container, data: ChunkData, chunkX: number, chunkY: number) {
        if (!data.objects) return;
        for (const obj of data.objects) {
            this.renderObject(container, obj.id, obj.x, obj.y, chunkX, chunkY);
        }
    }

    /** Remove existing object sprites and re-render with current entity sizes (for real-time display updates) */
    public refreshChunkObjects(container: PIXI.Container, data: ChunkData, chunkX: number, chunkY: number) {
        const toRemove = container.children.filter((c) => (c as { label?: string }).label === OBJECT_SPRITE_LABEL);
        toRemove.forEach((c) => c.destroy());
        this.renderChunkObjects(container, data, chunkX, chunkY);
    }

    private getEntitySize(assetId: string): { width: number; height: number } {
        const reg = EntityRegistry as import('@entities/EntityLoaderLookup').EntityRegistryStrict;
        const cfg = Lookup.getConfig(reg, assetId);
        if (!cfg) return { width: 64, height: 64 };

        const size = EntityScaling.calculateSize(
            {},
            cfg as { width?: number; height?: number; sizeScale?: number },
            { width: 64, height: 64 }
        );
        return { width: size.width, height: size.height };
    }

    public renderObject(container: PIXI.Container, assetId: string, worldX: number, worldY: number, chunkX: number, chunkY: number) {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        // Local position within chunk
        const localX = worldX - (chunkX * chunkSizePx);
        const localY = worldY - (chunkY * chunkSizePx);

        const { width: entityW, height: entityH } = this.getEntitySize(assetId);

        const cached = AssetLoader.getImage(assetId);
        if (cached) {
            // Image preloaded on palette select: show actual asset immediately
            const sprite = new PIXI.Sprite(PIXI.Texture.from(cached));
            (sprite as { label?: string }).label = OBJECT_SPRITE_LABEL;
            sprite.width = entityW;
            sprite.height = entityH;
            sprite.anchor.set(0.5);
            sprite.x = localX;
            sprite.y = localY;
            container.addChild(sprite);
            Logger.info(`[ObjectSystem] Placed object ${assetId} at local ${localX.toFixed(0)},${localY.toFixed(0)}`);
            return;
        }

        // Not cached: add invisible sprite to claim slot, replace with real texture when loaded
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        (sprite as { label?: string }).label = OBJECT_SPRITE_LABEL;
        sprite.alpha = 0;
        sprite.width = entityW;
        sprite.height = entityH;
        sprite.anchor.set(0.5);
        sprite.x = localX;
        sprite.y = localY;
        container.addChild(sprite);

        AssetLoader.preloadImage(assetId)
            .then((imageSource) => {
                if (!sprite.destroyed && imageSource) {
                    sprite.texture = PIXI.Texture.from(imageSource);
                    sprite.alpha = 1;
                }
            })
            .catch((err) => Logger.warn(`[ObjectSystem] Failed to load ${assetId}: ${err}`));

        Logger.info(`[ObjectSystem] Placed object ${assetId} at local ${localX.toFixed(0)},${localY.toFixed(0)}`);
    }
    public removeObject(
        container: PIXI.Container | null,
        data: ChunkData,
        x: number,
        y: number,
        chunkX: number,
        chunkY: number
    ): boolean {
        if (!data.objects) return false;

        // 1. Remove from Data
        const index = data.objects.findIndex((o) => Math.abs(o.x - x) < 1 && Math.abs(o.y - y) < 1);
        if (index === -1) return false;

        data.objects.splice(index, 1);

        // 2. Remove Sprite (if chunk is loaded)
        if (container) {
            const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
            const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
            const localX = x - chunkX * chunkSizePx;
            const localY = y - chunkY * chunkSizePx;
            const sprite = container.children.find(
                (c) => Math.abs(c.x - localX) < 1 && Math.abs(c.y - localY) < 1
            );
            if (sprite) sprite.destroy();
        }

        Logger.info(`[ObjectSystem] Removed object at ${x},${y}`);
        return true;
    }
}
