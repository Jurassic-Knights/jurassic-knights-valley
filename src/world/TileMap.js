/**
 * TileMap - Handles Tiled map loading and rendering
 * Compatible with Tiled Map Editor JSON exports
 * 
 * Owner: Level Architect (map data), Director (engine code)
 */

const TileMap = {
    currentMap: null,
    tilesets: new Map(),
    layers: {},

    /**
     * Load a Tiled JSON map
     * @param {string} mapPath - Path to the map JSON file
     */
    async load(mapPath) {
        try {
            const response = await fetch(mapPath);
            const mapData = await response.json();

            this.currentMap = mapData;
            this.layers = {};

            // Parse layers by name
            mapData.layers.forEach(layer => {
                this.layers[layer.name] = layer;
            });

            // Load embedded tilesets
            if (mapData.tilesets) {
                for (const tileset of mapData.tilesets) {
                    await this.loadTileset(tileset);
                }
            }

            Logger.info(`[TileMap] Loaded: ${mapPath}`);
            return true;
        } catch (error) {
            Logger.error('[TileMap] Failed to load map:', error);
            return false;
        }
    },

    /**
     * Load a tileset image
     */
    async loadTileset(tilesetData) {
        if (tilesetData.image) {
            const img = new Image();
            img.src = 'assets/maps/tilesets/' + tilesetData.image.split('/').pop();

            return new Promise((resolve) => {
                img.onload = () => {
                    this.tilesets.set(tilesetData.name, {
                        image: img,
                        firstgid: tilesetData.firstgid,
                        tileWidth: tilesetData.tilewidth,
                        tileHeight: tilesetData.tileheight,
                        columns: tilesetData.columns
                    });
                    resolve();
                };
                img.onerror = () => resolve(); // Continue even if tileset fails
            });
        }
    },

    /**
     * Get layer by name
     * @param {string} name - Layer name (ground, objects, collision, etc.)
     */
    getLayer(name) {
        return this.layers[name] || null;
    },

    /**
     * Check if a tile position is blocked
     * @param {number} x - Tile X coordinate
     * @param {number} y - Tile Y coordinate
     */
    isBlocked(x, y) {
        const collision = this.getLayer('collision');
        if (!collision || !collision.data) return false;

        const index = y * this.currentMap.width + x;
        return collision.data[index] !== 0;
    },

    /**
     * Get tile at position from a layer
     */
    getTile(layerName, x, y) {
        const layer = this.getLayer(layerName);
        if (!layer || !layer.data) return 0;

        const index = y * this.currentMap.width + x;
        return layer.data[index] || 0;
    },

    /**
     * Get spawn points from the spawns layer
     */
    getSpawnPoints() {
        const spawns = this.getLayer('spawns');
        if (!spawns || spawns.type !== 'objectgroup') return [];

        return spawns.objects || [];
    },

    /**
     * Get trigger zones from the triggers layer
     */
    getTriggers() {
        const triggers = this.getLayer('triggers');
        if (!triggers || triggers.type !== 'objectgroup') return [];

        return triggers.objects || [];
    },

    /**
     * Get map dimensions
     */
    getSize() {
        if (!this.currentMap) return { width: 0, height: 0 };
        return {
            width: this.currentMap.width,
            height: this.currentMap.height,
            tileWidth: this.currentMap.tilewidth,
            tileHeight: this.currentMap.tileheight
        };
    }
};

window.TileMap = TileMap;
