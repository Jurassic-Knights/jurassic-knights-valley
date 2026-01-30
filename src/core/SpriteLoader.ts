/**
 * SpriteLoader - Utility for managing entity sprite loading
 *
 * Provides a consistent pattern for loading sprites with:
 * - Cache hit detection for immediate rendering
 * - Async loading with loaded state tracking
 * - Fallback handling when sprites are missing
 *
 * Owner: Director
 */

const SpriteLoader = {
    /**
     * Load a sprite for an entity and attach it to the entity
     * Uses AssetLoader's fallback chain: _clean → _original → PH.png
     * @param {object} entity - Entity to attach sprite to
     * @param {string} assetId - Asset ID from AssetLoader registry
     * @param {string} propName - Property name for the sprite (default: '_sprite')
     * @returns {boolean} True if sprite is ready to render
     */
    load(entity: any, assetId: string, propName: string = '_sprite'): boolean { // Entity is generic object for now
        const loadedProp = propName + 'Loaded';

        // Already loaded?
        if (entity[loadedProp]) {
            return true;
        }

        // Already loading?
        if (entity[propName]) {
            return entity[loadedProp] || false;
        }

        // Get path from AssetLoader
        if (!AssetLoader) return false;
        const path = AssetLoader.getImagePath(assetId);
        if (!path) return false;

        // Use AssetLoader.createImage for built-in fallback chain
        entity[propName] = AssetLoader.createImage(path, () => {
            entity[loadedProp] = true;
        });

        // Check for immediate cache hit
        if (entity[propName].complete) {
            entity[loadedProp] = true;
            return true;
        }

        return false;
    },

    /**
     * Draw a loaded sprite centered on position
     * @param {CanvasRenderingContext2D} ctx
     * @param {object} entity - Entity with sprite attached
     * @param {string} propName - Property name for the sprite
     * @returns {boolean} True if sprite was drawn
     */
    draw(ctx: CanvasRenderingContext2D, entity: any, propName: string = '_sprite'): boolean {
        const loadedProp = propName + 'Loaded';

        if (!entity[loadedProp] || !entity[propName]) {
            return false;
        }

        ctx.drawImage(
            entity[propName],
            entity.x - entity.width / 2,
            entity.y - entity.height / 2,
            entity.width,
            entity.height
        );

        return true;
    },

    /**
     * Load multiple sprites for an entity (e.g., animation frames)
     * @param {object} entity - Entity to attach sprites to
     * @param {string[]} assetIds - Array of asset IDs
     * @param {string} propName - Property name for the sprites object
     * @returns {boolean} True if all sprites are loaded
     */
    loadMultiple(entity: any, assetIds: string[], propName: string = '_sprites'): boolean {
        const loadedProp = propName + 'Loaded';

        if (!entity[propName]) {
            entity[propName] = {};
        }

        if (!AssetLoader) return false;

        let allLoaded = true;
        let loadCount = 0;

        for (const assetId of assetIds) {
            // Already loaded this one?
            if (entity[propName][assetId] && entity[propName][assetId].complete) {
                loadCount++;
                continue;
            }

            // Use AssetLoader.createImage for built-in fallback chain
            if (!entity[propName][assetId]) {
                const path = AssetLoader.getImagePath(assetId);
                if (!path) continue;

                entity[propName][assetId] = AssetLoader.createImage(path, () => {
                    // Check if all loaded
                    let count = 0;
                    for (const id of assetIds) {
                        if (entity[propName][id] && entity[propName][id].complete) {
                            count++;
                        }
                    }
                    if (count === assetIds.length) {
                        entity[loadedProp] = true;
                    }
                });
            }

            // Check cache hit
            if (entity[propName][assetId].complete) {
                loadCount++;
            } else {
                allLoaded = false;
            }
        }

        if (loadCount === assetIds.length) {
            entity[loadedProp] = true;
            return true;
        }

        return allLoaded;
    }
};


// ES6 Module Export
export { SpriteLoader };
