/**
 * WorldRenderer
 * Handles rendering of static world elements: Water, Islands, Bridges, Fog, Borders.
 * Extracted from GameRenderer to improve modularity.
 */
class WorldRenderer {
    constructor() {
        this.game = null;
        this.backgroundPattern = null;
        this._zoneImages = {};
        this._fogPattern = null;
        Logger.info('[WorldRenderer] Constructed');
    }

    init(game) {
        this.game = game;
        // Cache system references for performance
        this._assetLoader = game.getSystem('AssetLoader');
        this._islandManager = game.getSystem('IslandManager');
        this._gameRenderer = game.getSystem('GameRenderer');

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
        const islands = this._islandManager.islands || [];

        for (const island of islands) {
            // Cache asset ID on island
            if (!island._cachedAssetId) {
                island._cachedAssetId = island.type === 'home'
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
                    this._zoneImages[assetId] = new Image();
                    this._zoneImages[assetId].src = bgPath;
                }
            }
        }

        Logger.info(`[WorldRenderer] Pre-loaded ${Object.keys(this._zoneImages).length} zone images`);
    }

    /**
     * Main render entry point
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} viewport 
     */
    render(ctx, viewport) {
        if (!this.game) return;

        // Hook into GameRenderer timing if available
        const timing = window.GameRenderer?._renderTiming;
        let t0;

        // 1. Water / Background
        if (timing) t0 = performance.now();
        this.drawWater(ctx, viewport);
        if (timing) { timing.worldWater = (timing.worldWater || 0) + performance.now() - t0; }

        // 2. Islands & Bridges
        if (timing) t0 = performance.now();
        this.drawWorld(ctx, viewport);
        if (timing) { timing.worldIslands = (timing.worldIslands || 0) + performance.now() - t0; }

        // 3. Debug Overlays
        if (timing) t0 = performance.now();
        this.drawDebug(ctx, viewport);
        if (timing) { timing.worldDebug = (timing.worldDebug || 0) + performance.now() - t0; }
    }

    /**
     * Draw the scrolling water background
     */
    drawWater(ctx, viewport) {
        ctx.save();

        // Use cached ref with fallback
        const assetLoader = this._assetLoader || (this.game && this.game.getSystem('AssetLoader'));
        const bgId = 'world_base_layer';

        // Lazy load pattern
        if (!this.backgroundPattern) {
            const img = assetLoader && assetLoader.cache.get(bgId);
            if (img) {
                this.backgroundPattern = ctx.createPattern(img, 'repeat');
            } else if (assetLoader) {
                // Request load if not ready
                assetLoader.preloadImage(bgId).then(() => {
                    this.backgroundPattern = null; // Will trigger creation next frame
                });
            }
        }

        if (this.backgroundPattern) {
            // Apply translation so pattern is anchored to world (0,0)
            ctx.translate(-viewport.x, -viewport.y);

            // Scale down pattern (0.5 = half size = double repetition)
            ctx.scale(0.5, 0.5);
            ctx.fillStyle = this.backgroundPattern;

            // Fill visible area (scaled up to cover viewport)
            ctx.fillRect(
                viewport.x * 2,
                viewport.y * 2,
                viewport.width * 2,
                viewport.height * 2
            );
        } else {
            // Fallback color
            ctx.fillStyle = '#000'; // Black (was Deep water blue)
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        ctx.restore();
    }

    /**
     * Draw Islands, Bridges, and Home Outpost
     */
    drawWorld(ctx, viewport) {
        // Use cached refs with fallback
        const islandManager = this._islandManager || (this.game && this.game.getSystem('IslandManager'));
        const assetLoader = this._assetLoader || (this.game && this.game.getSystem('AssetLoader'));

        if (!islandManager) {
            this.drawFallbackGrid(ctx, viewport);
            return;
        }

        if (!this._preloadDone && islandManager.islands && islandManager.islands.length > 0) {
            this._preloadZoneImages();
            this._preloadDone = true;
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false; // Pixel Art: Crisper edges + faster rendering
        ctx.translate(-viewport.x, -viewport.y);

        // Viewport bounds for culling (with padding for large islands)
        const vpLeft = viewport.x - 200;
        const vpRight = viewport.x + viewport.width + 200;
        const vpTop = viewport.y - 200;
        const vpBottom = viewport.y + viewport.height + 200;

        // A. Draw Islands
        const islandColor = '#4A5D23';  // Muddy green
        const islandBorder = '#3A4D13'; // Darker border

        for (const island of islandManager.islands) {
            // Viewport culling - skip islands not visible
            if (island.worldX + island.width < vpLeft || island.worldX > vpRight ||
                island.worldY + island.height < vpTop || island.worldY > vpBottom) {
                continue;
            }

            // Island fill
            let drawn = false;

            // Try to draw background image
            if (assetLoader) {
                // PERF: Cache asset ID on island to avoid string ops per frame
                if (!island._cachedAssetId) {
                    island._cachedAssetId = island.type === 'home'
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

                // PERF: Only create image once
                if (!this._zoneImages[assetId]) {
                    const bgPath = assetLoader.getImagePath(assetId);
                    if (bgPath) {
                        this._zoneImages[assetId] = new Image();
                        this._zoneImages[assetId].src = bgPath;
                    }
                }

                const img = this._zoneImages[assetId];
                if (img && img.complete && img.naturalWidth) {
                    ctx.drawImage(img, island._drawX, island._drawY, island._scaledW, island._scaledH);
                    drawn = true;
                }
            }


            if (!drawn) {
                ctx.fillStyle = islandColor;
                ctx.fillRect(island.worldX, island.worldY, island.width, island.height);

                // Island border (Fallback only)
                ctx.strokeStyle = islandBorder;
                ctx.lineWidth = 3;
                ctx.strokeRect(island.worldX, island.worldY, island.width, island.height);
            }

            // Locked State (Fog)
            if (!island.unlocked) {
                this.drawLockedOverlay(ctx, island);
            }
            // REMOVED: Zone text labels (not needed)
        }

        // B. Draw Bridges
        this.drawBridges(ctx, islandManager, assetLoader);

        // C. Draw Home Outpost Marker
        this.drawHomeOutpost(ctx, islandManager);

        // D. World Boundary - Use cached ref
        const gameRenderer = this._gameRenderer;
        if (gameRenderer) {
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, gameRenderer.worldWidth, gameRenderer.worldHeight);
        }

        ctx.restore();
    }

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

            // Draw Bridge
            if (planksImg) {
                ctx.translate(bridge.x + bridge.width / 2, bridge.y + bridge.height / 2);

                if (bridge.type === 'horizontal') {
                    ctx.rotate(Math.PI / 2);
                    ctx.drawImage(planksImg, -bridge.height / 2, -bridge.width / 2, bridge.height, bridge.width);
                } else {
                    ctx.drawImage(planksImg, -bridge.width / 2, -bridge.height / 2, bridge.width, bridge.height);
                }
            } else {
                // Fallback
                ctx.fillStyle = '#8D6E63'; // Wood
                ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);

                // Helper lines
                ctx.strokeStyle = '#5A4A2A';
                ctx.lineWidth = 2;
                if (bridge.type === 'horizontal') {
                    for (let x = bridge.x + 10; x < bridge.x + bridge.width; x += 15) {
                        ctx.beginPath(); ctx.moveTo(x, bridge.y); ctx.lineTo(x, bridge.y + bridge.height); ctx.stroke();
                    }
                } else {
                    for (let y = bridge.y + 10; y < bridge.y + bridge.height; y += 15) {
                        ctx.beginPath(); ctx.moveTo(bridge.x, y); ctx.lineTo(bridge.x + bridge.width, y); ctx.stroke();
                    }
                }
            }

            ctx.restore();
        }
    }

    drawLockedOverlay(ctx, island) {
        // FOG VFX REMOVED - Placeholder for new implementation
        // Just draw Lock icon and cost for now

        // Lock icon
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 80px "Courier New", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔒', island.worldX + island.width / 2, island.worldY + island.height / 2 - 40);

        // Cost label
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px "Courier New", sans-serif';
        ctx.fillText(`${island.unlockCost} Gold`, island.worldX + island.width / 2, island.worldY + island.height / 2 + 60);
    }

    drawHomeOutpost(ctx, islandManager) {
        const home = islandManager.getHomeIsland();
        if (!home) return;

        const centerX = home.worldX + home.width / 2;
        const centerY = home.worldY + home.height / 2;
        const radius = 200;

        // Outer glow
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        ctx.fill();

        // Base circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        ctx.fill();

        // Border
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 6;
        ctx.setLineDash([40, 20]);

        ctx.lineDashOffset = -(performance.now() / 15);

        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('REST AREA', centerX, centerY);
    }

    drawFallbackGrid(ctx, viewport) {
        const gridSize = 50;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        const offsetX = -viewport.x % gridSize;
        const offsetY = -viewport.y % gridSize;
        for (let x = offsetX; x < ctx.canvas.width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke();
        }
        for (let y = offsetY; y < ctx.canvas.height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ctx.canvas.width, y); ctx.stroke();
        }
    }

    drawDebug(ctx, viewport) {
        // Debug visualization removed - collision blocks are now shown in GameRenderer
    }
}

// Global & Register
window.WorldRenderer = new WorldRenderer();
if (window.Registry) Registry.register('WorldRenderer', window.WorldRenderer);
