import { Entity } from '@core/Entity';
import { AssetLoader } from '@core/AssetLoader';
import { EntityRegistry } from '@entities/EntityLoader';
import { Logger } from '@core/Logger';
import { EntityScaling } from '../utils/EntityScaling';

import type { EntityConfig } from '../types/core';

class Prop extends Entity {
    scale: number;
    _img: HTMLImageElement | null = null;
    registryId: string | null = null;

    constructor(config: EntityConfig = {}) {
        // 1. Identify Registry ID
        // Priority: Explicit config.registryId > config.id (if matched) > config.sprite
        let registryId = config.registryId || null;

        if (!registryId) {
            // Check if config.id is a valid registry key (e.g. "prop_barrel_01")
            if (EntityRegistry.environment?.[config.id]) {
                registryId = config.id;
            } else if (EntityRegistry.environment?.[config.sprite]) {
                // Check if sprite matches (e.g. "props/barrel")
                registryId = config.sprite;
            } else {
                // Fallback: Use sprite as key (Legacy behavior)
                registryId = config.sprite;
            }
        }

        const registryConfig = EntityRegistry.environment?.[registryId] || {};

        // Calculate size using standard utility
        const size = EntityScaling.calculateSize(config, registryConfig, { width: 80, height: 80 });

        super({
            width: size.width,
            height: size.height,
            active: true,
            ...config
        });

        this.scale = size.scale;
        this.registryId = registryId;
    }

    /**
     * Render the prop with lazy-loading support
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx: CanvasRenderingContext2D) {
        if (!this.active) return;

        // Draw shadow first (underneath)
        this.drawShadow(ctx);

        // Use registryId when sprite is null (MapObjectSpawner passes registryId, not sprite)
        const assetId = this.sprite ?? this.registryId ?? null;
        let img = AssetLoader && assetId ? AssetLoader.getImage(assetId) : null;

        // Lazy load
        if (!img && AssetLoader && assetId) {
            const path = AssetLoader.getImagePath(assetId);
            if (path) {
                if (!this._img) {
                    this._img = AssetLoader.createImage(path);
                }
                if (this._img.complete && this._img.naturalWidth) {
                    img = this._img;
                }
            }
        }

        if (img) {
            // Draw centered using Final Dimensions (this.width/height)
            // No extra scaling!
            ctx.drawImage(img, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        }
    }

    /**
     * Refresh configuration from EntityRegistry
     */
    refreshConfig() {
        if (!this.registryId) return;

        const registryConfig = EntityRegistry.environment?.[this.registryId] || {};

        Logger.info(`[Prop] Refreshing config for ${this.registryId}`);

        // Update dimensions using standard utility
        EntityScaling.applyToEntity(this, {}, registryConfig, { width: 80, height: 80 });
    }
}

export { Prop };
