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
        console.log('[WorldRenderer] Constructed');
    }

    init(game) {
        this.game = game;
        console.log('[WorldRenderer] Initialized');
    }

    /**
     * Main render entry point
     * @param {CanvasRenderingContext2D} ctx 
     * @param {object} viewport 
     */
    render(ctx, viewport) {
        if (!this.game) return;

        // 1. Water / Background
        this.drawWater(ctx, viewport);

        // 2. Islands & Bridges
        this.drawWorld(ctx, viewport);

        // 3. Debug Overlays
        this.drawDebug(ctx, viewport);
    }

    /**
     * Draw the scrolling water background
     */
    drawWater(ctx, viewport) {
        ctx.save();

        const assetLoader = this.game.getSystem('AssetLoader');
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
        const islandManager = this.game.getSystem('IslandManager');
        const assetLoader = this.game.getSystem('AssetLoader');

        if (!islandManager) {
            this.drawFallbackGrid(ctx, viewport);
            return;
        }

        ctx.save();
        ctx.translate(-viewport.x, -viewport.y);

        // A. Draw Islands
        const islandColor = '#4A5D23';  // Muddy green
        const islandBorder = '#3A4D13'; // Darker border

        for (const island of islandManager.islands) {
            // Island fill
            let drawn = false;

            // Try to draw background image
            if (assetLoader) {
                let assetId = 'zone_' + island.name.toLowerCase().replace(/ /g, '_');
                if (island.type === 'home') assetId = 'world_island_home';

                const bgPath = assetLoader.getImagePath(assetId);
                if (bgPath) {
                    if (!this._zoneImages[assetId]) {
                        this._zoneImages[assetId] = new Image();
                        this._zoneImages[assetId].src = bgPath;
                    }

                    const img = this._zoneImages[assetId];
                    if (img.complete && img.naturalWidth) {
                        // Scale up by 20%
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
            } else {
                // Island name label (only for unlocked)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.font = '28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(island.name, island.worldX + island.width / 2, island.worldY + 50);
            }
        }

        // B. Draw Bridges
        this.drawBridges(ctx, islandManager, assetLoader);

        // C. Draw Home Outpost Marker
        this.drawHomeOutpost(ctx, islandManager);

        // D. World Boundary
        const gameRenderer = this.game.getSystem('GameRenderer');
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
        const renderer = this.game.getSystem('GameRenderer');
        const islandManager = this.game.getSystem('IslandManager');

        if (renderer && renderer.debugMode && islandManager && islandManager.walkableZones) {
            ctx.save();
            ctx.translate(-viewport.x, -viewport.y);

            ctx.lineWidth = 2;

            for (const zone of islandManager.walkableZones) {
                if (zone.type === 'bridge') {
                    ctx.strokeStyle = '#00FF00';
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                } else {
                    ctx.strokeStyle = '#32CD32';
                    ctx.fillStyle = 'rgba(50, 205, 50, 0.1)';
                }

                ctx.beginPath();
                ctx.rect(zone.x, zone.y, zone.width, zone.height);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#FFF';
                ctx.font = '10px monospace';
                ctx.fillText(zone.id, zone.x + 5, zone.y + 15);
            }

            ctx.restore();
        }
    }
}

// Global & Register
window.WorldRenderer = new WorldRenderer();
if (window.Registry) Registry.register('WorldRenderer', window.WorldRenderer);
