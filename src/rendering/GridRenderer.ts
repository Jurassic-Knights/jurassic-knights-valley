/**
 * GridRenderer - Island and bridge rendering
 *
 * Extracted from GameRenderer.js for modularity.
 * Handles drawing islands, bridges, and lock overlays.
 *
 * Owner: Rendering System
 */

const GridRenderer = {
    _zoneImages: {},

    /**
     * Draw islands and bridges
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} viewport - Current viewport {x, y}
     * @param {Object} canvas - Canvas element
     * @param {Object} game - Game reference
     */
    drawGrid(ctx, viewport, canvas, game) {
        const islandManager = game ? game.getSystem('IslandManager') : null;
        const assetLoader = game ? game.getSystem('AssetLoader') : null;

        if (!islandManager) {
            this.drawFallbackGrid(ctx, viewport, canvas);
            return;
        }

        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);

        // Draw islands
        this.drawIslands(ctx, islandManager, assetLoader);

        // Draw bridges
        this.drawBridges(ctx, islandManager, assetLoader);

        ctx.restore();
    },

    /**
     * Fallback grid when IslandManager not available
     */
    drawFallbackGrid(ctx, viewport, canvas) {
        const gridSize = 50;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        const offsetX = -viewport.x % gridSize;
        const offsetY = -viewport.y % gridSize;

        for (let x = offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = offsetY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    },

    /**
     * Draw all islands
     */
    drawIslands(ctx, islandManager, assetLoader) {
        const islandColor = '#4A5D23';
        const islandBorder = '#3A4D13';

        for (const island of islandManager.islands) {
            let drawn = false;

            // Try background image
            if (assetLoader) {
                let assetId = 'zone_' + island.name.toLowerCase().replace(/ /g, '_');
                if (island.type === 'home') assetId = 'world_island_home';

                const bgPath = assetLoader.getImagePath(assetId);
                if (bgPath) {
                    if (!this._zoneImages[assetId]) {
                        this._zoneImages[assetId] = assetLoader.createImage(bgPath);
                    }

                    const img = this._zoneImages[assetId];
                    if (img.complete && img.naturalWidth) {
                        const scale = 1.2;
                        const w = island.width * scale;
                        const h = island.height * scale;
                        const x = island.worldX - (w - island.width) / 2;
                        const y = island.worldY - (h - island.height) / 2;
                        ctx.drawImage(img, x, y, w, h);
                        drawn = true;
                    }
                }
            }

            // Fallback fill
            if (!drawn) {
                ctx.fillStyle = islandColor;
                ctx.fillRect(island.worldX, island.worldY, island.width, island.height);
                ctx.strokeStyle = islandBorder;
                ctx.lineWidth = 3;
                ctx.strokeRect(island.worldX, island.worldY, island.width, island.height);
            }

            // Lock overlay or name label
            if (!island.unlocked) {
                this.drawLockOverlay(ctx, island);
            } else {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(island.name, island.worldX + island.width / 2, island.worldY + 50);
            }
        }
    },

    /**
     * Draw lock overlay for locked islands
     */
    drawLockOverlay(ctx, island) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 80px "Courier New", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            '🔒',
            island.worldX + island.width / 2,
            island.worldY + island.height / 2 - 40
        );

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px "Courier New", sans-serif';
        ctx.fillText(
            `${island.unlockCost} Gold`,
            island.worldX + island.width / 2,
            island.worldY + island.height / 2 + 60
        );
    },

    /**
     * Draw all bridges
     */
    drawBridges(ctx, islandManager, assetLoader) {
        const bridges = islandManager.getBridges();
        let planksImg = null;

        if (assetLoader) {
            planksImg = assetLoader.cache.get('world_bridge_planks');
            if (!planksImg) {
                assetLoader.preloadImage('world_bridge_planks');
            }
        }

        for (const bridge of bridges) {
            ctx.save();

            if (planksImg) {
                ctx.translate(bridge.x + bridge.width / 2, bridge.y + bridge.height / 2);

                if (bridge.type === 'horizontal') {
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(
                        planksImg,
                        -bridge.height / 2,
                        -bridge.width / 2,
                        bridge.height,
                        bridge.width
                    );
                } else {
                    ctx.drawImage(
                        planksImg,
                        -bridge.width / 2,
                        -bridge.height / 2,
                        bridge.width,
                        bridge.height
                    );
                }
            } else {
                // Fallback
                ctx.fillStyle = '#8D6E63';
                ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);

                ctx.strokeStyle = '#5A4A2A';
                ctx.lineWidth = 2;
                if (bridge.type === 'horizontal') {
                    for (let x = bridge.x + 10; x < bridge.x + bridge.width; x += 15) {
                        ctx.beginPath();
                        ctx.moveTo(x, bridge.y);
                        ctx.lineTo(x, bridge.y + bridge.height);
                        ctx.stroke();
                    }
                } else {
                    for (let y = bridge.y + 10; y < bridge.y + bridge.height; y += 15) {
                        ctx.beginPath();
                        ctx.moveTo(bridge.x, y);
                        ctx.lineTo(bridge.x + bridge.width, y);
                        ctx.stroke();
                    }
                }
            }

            ctx.restore();
        }
    }
};

export { GridRenderer };
