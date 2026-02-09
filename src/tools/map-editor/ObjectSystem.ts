import * as PIXI from 'pixi.js';
import { Logger } from '@core/Logger';
import { AssetLoader } from '@core/AssetLoader';
import { MapEditorConfig } from './MapEditorConfig';
import { ChunkData } from './MapEditorTypes';
import { EditorContext } from './EditorContext';

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

    public renderObject(container: PIXI.Container, assetId: string, worldX: number, worldY: number, chunkX: number, chunkY: number) {
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;

        // Local position within chunk
        const localX = worldX - (chunkX * chunkSizePx);
        const localY = worldY - (chunkY * chunkSizePx);

        // 1. Create Placeholder Sprite Immediately
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
        sprite.tint = 0xFFFF00; // Yellow = Loading
        sprite.width = 64;
        sprite.height = 64;
        sprite.anchor.set(0.5);
        sprite.x = localX;
        sprite.y = localY;
        container.addChild(sprite);

        // 2. Load Asset Asynchronously (via AssetLoader for White BG removal)
        AssetLoader.preloadImage(assetId)
            .then((imageSource) => {
                if (!sprite.destroyed) {
                    const texture = PIXI.Texture.from(imageSource);
                    sprite.texture = texture;
                    sprite.tint = 0xFFFFFF; // Remove tint

                    // --- Smart Sizing ---
                    // Lookup entity config to get intended game size
                    let targetWidth = 64;
                    let targetHeight = 64;

                    // Search all registries for this ID
                    // Registry access via EditorContext
                    const reg = EditorContext.registry;
                    if (reg) {
                        const entity = reg.nodes?.[assetId] ||
                            reg.enemies?.[assetId] ||
                            reg.environment?.[assetId] ||
                            reg.resources?.[assetId];

                        if (entity && entity.width && entity.height) {
                            targetWidth = entity.width;
                            targetHeight = entity.height;
                        }
                    }

                    sprite.width = targetWidth;
                    sprite.height = targetHeight;
                }
            })
            .catch((err) => {
                Logger.warn(`[ObjectSystem] Failed to load ${assetId}: ${err}`);
                if (!sprite.destroyed) {
                    sprite.tint = 0xFF00FF; // Magenta = Error
                }
            });

        Logger.info(`[ObjectSystem] Placed object ${assetId} at local ${localX.toFixed(0)},${localY.toFixed(0)}`);
    }
    public removeObject(container: PIXI.Container, data: ChunkData, x: number, y: number, chunkX: number, chunkY: number): boolean {
        if (!data.objects) return false;

        // 1. Remove from Data
        const index = data.objects.findIndex(o => Math.abs(o.x - x) < 1 && Math.abs(o.y - y) < 1);
        if (index === -1) return false;

        data.objects.splice(index, 1);

        // 2. Remove Sprite
        const { CHUNK_SIZE, TILE_SIZE } = MapEditorConfig;
        const chunkSizePx = CHUNK_SIZE * TILE_SIZE;
        const localX = x - (chunkX * chunkSizePx);
        const localY = y - (chunkY * chunkSizePx);

        // Find sprite near localX, localY
        const sprite = container.children.find(c => Math.abs(c.x - localX) < 1 && Math.abs(c.y - localY) < 1);
        if (sprite) {
            sprite.destroy();
        }

        Logger.info(`[ObjectSystem] Removed object at ${x},${y}`);
        return true;
    }
}
