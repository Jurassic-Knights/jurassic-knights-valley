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
     * @param {object} entity - Entity to attach sprite to
     * @param {string} assetId - Asset ID from AssetLoader registry
     * @param {string} propName - Property name for the sprite (default: '_sprite')
     * @returns {boolean} True if sprite is ready to render
     */
    load(entity, assetId, propName = '_sprite') {
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
        if (!window.AssetLoader) return false;
        const path = AssetLoader.getImagePath(assetId);
        if (!path) return false;

        // Create and load image
        entity[propName] = new Image();
        entity[propName].onload = () => {
            entity[loadedProp] = true;
        };
        entity[propName].src = path;

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
    draw(ctx, entity, propName = '_sprite') {
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
    loadMultiple(entity, assetIds, propName = '_sprites') {
        const loadedProp = propName + 'Loaded';

        if (!entity[propName]) {
            entity[propName] = {};
        }

        if (!window.AssetLoader) return false;

        let allLoaded = true;
        let loadCount = 0;

        for (const assetId of assetIds) {
            // Already loaded this one?
            if (entity[propName][assetId] && entity[propName][assetId].complete) {
                loadCount++;
                continue;
            }

            const path = AssetLoader.getImagePath(assetId);
            if (!path) {
                continue;
            }

            // Create and load
            if (!entity[propName][assetId]) {
                entity[propName][assetId] = new Image();
                entity[propName][assetId].onload = () => {
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
                };
                entity[propName][assetId].src = path;
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

window.SpriteLoader = SpriteLoader;
