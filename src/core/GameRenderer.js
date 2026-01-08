/**
 * GameRenderer - Canvas rendering system with viewport
 * 
 * Mobile shows a cropped view, PC shows more of the world
 * 
 * Owner: Director
 */

const GameRenderer = {
    canvas: null,
    ctx: null,
    hero: null, // Still track hero for camera centering
    debugMode: false,
    gridMode: false, // Separate toggle for grid overlay

    // Fixed world size (game units) - scaled up for 1024px islands
    worldWidth: 4500,
    worldHeight: 4500,

    // Viewport (what portion of the world is visible)
    viewport: {
        x: 0,
        y: 0,
        width: 450,   // Mobile default (9:16 aspect)
        height: 800
    },


    /**
     * Initialize the renderer
     */
    init(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('[GameRenderer] Canvas not found');
            return false;
        }

        this.ctx = this.canvas.getContext('2d');

        // Create Shadow Buffer (Offscreen Canvas)
        this.shadowCanvas = document.createElement('canvas');
        this.shadowCtx = this.shadowCanvas.getContext('2d');
        // Initial size sync
        this.resizeShadowBuffer();

        // Listen for platform changes
        const platformManager = this.game ? this.game.getSystem('PlatformManager') : null;
        if (platformManager) {
            platformManager.on('modechange', () => this.updateViewport());
            this.updateViewport();
        } else {
            this.resize();
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.game && this.game.getSystem('PlatformManager').isMobile()) {
                this.updateViewport(); // Recalculate aspect ratio on mobile
            } else {
                this.resize();
            }
        });

        console.log('[GameRenderer] Initialized');
        return true;
    },

    resizeShadowBuffer() {
        if (this.shadowCanvas && this.canvas) {
            this.shadowCanvas.width = this.canvas.width;
            this.shadowCanvas.height = this.canvas.height;
        }
    },

    /**
     * Update viewport based on platform mode
     */
    updateViewport() {
        const container = this.canvas ? this.canvas.parentElement : null;
        if (!container) return;

        // Use container dimensions (not window) for accurate aspect ratio
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const containerAspect = containerWidth / containerHeight;
        const isPortrait = containerHeight > containerWidth;

        if (isPortrait) {
            // Portrait (Mobile): Fixed width, dynamic height
            // Shows more world vertically on tall screens
            this.viewport.width = 1100;
            this.viewport.height = this.viewport.width / containerAspect;
        } else {
            // Landscape (PC): Fixed height, dynamic width
            // Shows more world horizontally on wide screens (same zoom level as mobile)
            this.viewport.height = 1950;
            this.viewport.width = this.viewport.height * containerAspect;
        }

        // Viewport position will be set by updateCamera()
        this.resize();
        // Force re-render to clear artifacts immediately
        if (this.ctx) this.render();
        console.log(`[GameRenderer] Viewport Updated: ${Math.floor(this.viewport.width)}x${Math.floor(this.viewport.height)} (Container: ${containerWidth}x${containerHeight})`);
    },

    /**
     * Update camera to center on hero
     */
    updateCamera() {
        if (!this.hero) return;

        // Center viewport on hero
        this.viewport.x = this.hero.x - this.viewport.width / 2;
        this.viewport.y = this.hero.y - this.viewport.height / 2;

        // Clamp viewport to world bounds
        this.viewport.x = Math.max(0, Math.min(this.worldWidth - this.viewport.width, this.viewport.x));
        this.viewport.y = Math.max(0, Math.min(this.worldHeight - this.viewport.height, this.viewport.y));
    },

    /**
     * Set the hero reference
     * @param {Hero} hero
     */
    setHero(hero) {
        this.hero = hero;
    },

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.viewport.x,
            y: worldY - this.viewport.y
        };
    },

    /**
     * Get the visible world bounds
     */
    getVisibleBounds() {
        return {
            left: this.viewport.x,
            top: this.viewport.y,
            right: this.viewport.x + this.viewport.width,
            bottom: this.viewport.y + this.viewport.height,
            width: this.viewport.width,
            height: this.viewport.height
        };
    },

    /**
     * Resize canvas to fit container while maintaining aspect ratio
     */
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate aspect ratio from viewport
        const viewportAspect = this.viewport.width / this.viewport.height;
        const containerAspect = containerWidth / containerHeight;

        let canvasWidth, canvasHeight;

        if (containerAspect > viewportAspect) {
            // Container is wider than viewport - fit to height
            canvasHeight = containerHeight;
            canvasWidth = containerHeight * viewportAspect;
        } else {
            // Container is taller than viewport - fit to width
            canvasWidth = containerWidth;
            canvasHeight = containerWidth / viewportAspect;
        }

        // Set canvas size (internal rendering resolution)
        this.canvas.width = this.viewport.width;
        this.canvas.height = this.viewport.height;

        // Sync shadow buffer
        this.resizeShadowBuffer();

        // Set display size (CSS)
        // Set display size (CSS) - Force fill container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.margin = '0';
    },

    /**
     * Render the composite shadow pass
     */
    renderShadowPass(entities) {
        if (!this.shadowCtx || !window.EnvironmentRenderer) return;

        // Clear Shadow Buffer
        this.shadowCtx.clearRect(0, 0, this.shadowCanvas.width, this.shadowCanvas.height);

        this.shadowCtx.save();
        this.shadowCtx.translate(-this.viewport.x, -this.viewport.y);

        // Render Opaque Shadows
        // We iterate ALL entities and force them to draw their shadow opaque
        const heroRenderer = this.game ? this.game.getSystem('HeroRenderer') : null;
        const dinosaurRenderer = this.game ? this.game.getSystem('DinosaurRenderer') : null;
        const resourceRenderer = this.game ? this.game.getSystem('ResourceRenderer') : null;

        for (const entity of entities) {
            if (entity === this.hero) {
                if (heroRenderer) heroRenderer.drawShadow(this.shadowCtx, entity, true);
            } else if (entity.constructor.name === 'Dinosaur') {
                if (dinosaurRenderer) dinosaurRenderer.renderShadow(this.shadowCtx, entity, true);
            } else if (entity.constructor.name === 'Resource') {
                if (resourceRenderer) resourceRenderer.renderShadow(this.shadowCtx, entity, true);
            } else if (entity.constructor.name === 'Merchant') {
                // Merchant specific shadow (usually handles its own, but we need to intercept)
                // If Merchant uses generic Entity.drawShadow, we can call it.
                // But Merchant has custom render. We need to call its shadow logic.
                // Let's assume Merchant will be updated to have a drawShadow method or we use Entity's if compatible.
                // Merchant extends Entity.
                if (typeof entity.drawShadow === 'function') entity.drawShadow(this.shadowCtx, true);
            } else {
                if (typeof entity.drawShadow === 'function') entity.drawShadow(this.shadowCtx, true);
            }
        }

        this.shadowCtx.restore();

        // Composite onto Main Canvas
        // Apply Global Shadow transparency
        this.ctx.save();
        this.ctx.globalAlpha = window.EnvironmentRenderer.shadowAlpha || 0.3;
        // The shadow buffer is opaque black shapes. We draw them with global alpha 0.3.
        // This results in uniform 0.3 opacity regardless of overlap in the buffer.
        this.ctx.drawImage(this.shadowCanvas, 0, 0);
        this.ctx.restore();
    },

    /**
     * Clear and render all entities
     */
    render() {
        if (!this.ctx) return;

        // Update camera to follow hero
        this.updateCamera();

        // --- WORLD LAYER ---
        const worldRenderer = this.game ? this.game.getSystem('WorldRenderer') : null;
        if (worldRenderer) {
            worldRenderer.render(this.ctx, this.viewport);
        } else {
            // Safe fallback if not yet registered
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // --- VFX LAYER (Background) ---
        // Render Background VFX (e.g. Dust Trails) BEHIND entities but ON TOP of ground
        const vfxController = this.game ? this.game.getSystem('VFXController') : null;

        if (vfxController && vfxController.bgParticles) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            vfxController.bgParticles.render(this.ctx);
            this.ctx.restore();
        }

        // Y-SORT: Collect all active world entities from EntityManager
        let sortableEntities = [];
        if (window.EntityManager) {
            // Optimization: Query only visible entities (Quadtree)
            const bounds = this.getVisibleBounds();
            // Add padding to prevent culling objects partially on screen
            bounds.x -= 200;
            bounds.y -= 200;
            bounds.width += 400;
            bounds.height += 400;

            const allEntities = EntityManager.queryRect(bounds);

            // Shallow copy and filter active
            for (const e of allEntities) {
                if (e.active) sortableEntities.push(e);
            }
        }

        // Sort by Y position (bottom of sprite = y + height/2 for accurate depth)
        sortableEntities.sort((a, b) => {
            const ay = a.y + (a.height ? a.height / 2 : 0);
            const by = b.y + (b.height ? b.height / 2 : 0);
            return ay - by;
        });

        // --- SHADOW PASS ---
        // Render all shadows to offscreen buffer and composite ONCE
        this.renderShadowPass(sortableEntities);

        // Render all entities (with viewport offset)
        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);

        // Render HomeBase (Trees + Outpost Building) ON TOP of rest area overlay
        const homeBase = this.game ? this.game.getSystem('HomeBase') : null;
        if (homeBase) {
            homeBase.render(this.ctx);
        }

        const heroRenderer = this.game ? this.game.getSystem('HeroRenderer') : null;
        const dinosaurRenderer = this.game ? this.game.getSystem('DinosaurRenderer') : null;
        const resourceRenderer = this.game ? this.game.getSystem('ResourceRenderer') : null;

        for (const entity of sortableEntities) {
            // Type-based Rendering Dispatch
            const type = entity.constructor.name;

            // Pass 'false' for includeShadow to prevent double rendering
            if (entity === this.hero) {
                if (heroRenderer) {
                    heroRenderer.render(this.ctx, this.hero, false);
                } else {
                    if (typeof entity.render === 'function') entity.render(this.ctx);
                }
            }
            else if (type === 'Dinosaur' && dinosaurRenderer) {
                dinosaurRenderer.render(this.ctx, entity, false);
            }
            else if (type === 'Resource' && resourceRenderer) {
                resourceRenderer.render(this.ctx, entity, false);
            }
            else if (type === 'Merchant') {
                // Merchant handles its own rendering
                if (typeof entity.render === 'function') entity.render(this.ctx);
            }
            else {
                // Flashback / General Entities (e.g. DroppedItem, Prop)
                if (typeof entity.render === 'function') {
                    // Try to pass noShadow flag if supported, otherwise it might double render shadow
                    // For now, accept generic entities might double render until updated
                    entity.render(this.ctx);
                }
            }
        }

        // Render UI Overlays (Health Bars) on top of EVERYTHING
        for (const entity of sortableEntities) {
            if (typeof entity.renderUI === 'function') {
                entity.renderUI(this.ctx);
            }
        }

        this.ctx.restore();



        // Render Ambient Layer (Sky/Cloud level - over world, under UI VFX)
        const ambientSystem = this.game ? this.game.getSystem('AmbientSystem') : null;
        if (ambientSystem) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            ambientSystem.render(this.ctx);
            this.ctx.restore();
        }

        // Render Fog of War (Rolling Clouds over locked islands)
        const fogSystem = this.game ? this.game.getSystem('FogOfWarSystem') : null;
        if (fogSystem) {
            fogSystem.render(this.ctx, this.viewport);
        }

        // Render Foreground VFX (e.g. Explosions) ON TOP of everything
        if (vfxController) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);

            // Particles
            // fgParticles now rendered via VFXController.renderForeground() to overlay canvas
            // if (VFXController.fgParticles) {
            //    VFXController.fgParticles.render(this.ctx);
            // }

            // Floating Text (Canvas)
            if (typeof vfxController.render === 'function') {
                vfxController.render(this.ctx);
            }

            this.ctx.restore();
        }

        // --- AMBIENT OVERLAY (Day/Night Cycle) ---
        const envRenderer = this.game ? this.game.getSystem('EnvironmentRenderer') : null;
        if (envRenderer) {
            envRenderer.render(this.ctx, this.viewport);
        }

        // --- DEBUG OVERLAY ---
        if (this.debugMode) {
            this.drawWorldBoundary();
        }

        // --- GRID OVERLAY (separate toggle) ---
        if (this.gridMode) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            this.drawDebugGrid();
            this.ctx.restore();
        }
    },

    /**
     * Draw islands and bridges (replaces old grid)
     */
    drawGrid() {
        const islandManager = this.game ? this.game.getSystem('IslandManager') : null;
        const assetLoader = this.game ? this.game.getSystem('AssetLoader') : null;

        if (!islandManager) {
            // Fallback to old grid pattern
            const gridSize = 50;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.lineWidth = 1;
            const offsetX = -this.viewport.x % gridSize;
            const offsetY = -this.viewport.y % gridSize;
            for (let x = offsetX; x < this.canvas.width; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, 0);
                this.ctx.lineTo(x, this.canvas.height);
                this.ctx.stroke();
            }
            for (let y = offsetY; y < this.canvas.height; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y);
                this.ctx.lineTo(this.canvas.width, y);
                this.ctx.stroke();
            }
            return;
        }

        // Save context and apply viewport transform
        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);

        // Draw islands (land tiles)
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
                    if (!this._zoneImages) this._zoneImages = {};

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

                        this.ctx.drawImage(img, x, y, w, h);
                        drawn = true;
                    }
                }
            }


            if (!drawn) {
                this.ctx.fillStyle = islandColor;
                this.ctx.fillRect(island.worldX, island.worldY, island.width, island.height);

                // Island border (Fallback only)
                this.ctx.strokeStyle = islandBorder;
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(island.worldX, island.worldY, island.width, island.height);
            }

            // If locked, draw fog overlay
            // If locked, draw fog overlay
            if (!island.unlocked) {
                // FOG VFX REMOVED - Placeholder
                // Note: Main fog rendering handled by WorldRenderer

                // Lock icon
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.font = 'bold 80px "Courier New", sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('🔒', island.worldX + island.width / 2, island.worldY + island.height / 2 - 40);

                // Cost label
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 32px "Courier New", sans-serif';
                this.ctx.fillText(`${island.unlockCost} Gold`, island.worldX + island.width / 2, island.worldY + island.height / 2 + 60);
            } else {
                // Island name label (only for unlocked)
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.font = '28px sans-serif'; // Doubled from 14
                this.ctx.textAlign = 'center';
                this.ctx.fillText(island.name, island.worldX + island.width / 2, island.worldY + 50); // Offset adjusted
            }
        }

        // Draw bridges
        // ... (lines 306-330 kept same, drawing loop omitted for brevity in search/replace) ...
        const bridgeColor = '#6B5A3A';  // Wooden bridge color
        const bridges = islandManager.getBridges();
        // Check for bridge texture (use directly as image, not pattern)
        let planksImg = null;
        if (assetLoader) {
            planksImg = assetLoader.cache.get('world_bridge_planks');
            if (!planksImg) {
                assetLoader.preloadImage('world_bridge_planks');
            }
        }

        for (const bridge of bridges) {
            this.ctx.save();

            // Draw Bridge
            if (planksImg) {
                // If we have the image, we scale it to fit the bridge (Stretch/Squash)
                // Assuming planks.png is a square texture of minimal horizontal planks

                this.ctx.translate(bridge.x + bridge.width / 2, bridge.y + bridge.height / 2);

                if (bridge.type === 'horizontal') {
                    // Horizontal Bridge: We want vertical planks.
                    // Image: Horizontal planks.
                    // Rotate 90 degrees.
                    this.ctx.rotate(Math.PI / 2);

                    // Draw centered (swapped dimensions because of rotation)
                    // We want to fill the bridge area: w=bridge.width, h=bridge.height.
                    // In rotated space:
                    //   Local X aligns with World Y (Screen Top-Down). 
                    //   Local Y aligns with World -X (Screen Right-Left).
                    // We render the image into the rect (-h/2, -w/2, h, w).
                    // Image stretches to fit.
                    this.ctx.drawImage(planksImg, -bridge.height / 2, -bridge.width / 2, bridge.height, bridge.width);
                } else {
                    // Vertical Bridge: We want horizontal planks.
                    // Image: Horizontal planks.
                    // No rotation needed.
                    // Translate back to top-left? No, we are at center.
                    this.ctx.drawImage(planksImg, -bridge.width / 2, -bridge.height / 2, bridge.width, bridge.height);
                }
            } else {
                // FALLBACK (No image yet)
                this.ctx.fillStyle = '#8D6E63'; // Wood
                this.ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);

                // Drawer helper lines (Old style)
                this.ctx.strokeStyle = '#5A4A2A';
                this.ctx.lineWidth = 2;
                if (bridge.type === 'horizontal') {
                    for (let x = bridge.x + 10; x < bridge.x + bridge.width; x += 15) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, bridge.y);
                        this.ctx.lineTo(x, bridge.y + bridge.height);
                        this.ctx.stroke();
                    }
                } else {
                    for (let y = bridge.y + 10; y < bridge.y + bridge.height; y += 15) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(bridge.x, y);
                        this.ctx.lineTo(bridge.x + bridge.width, y);
                        this.ctx.stroke();
                    }
                }
            }

            this.ctx.restore();
        }



        this.ctx.restore();
    },

    /**
     * Toggle debug overlays
     */
    toggleDebug() {
        this.debugMode = !this.debugMode;
        console.log(`[GameRenderer] Debug mode: ${this.debugMode}`);
        return this.debugMode;
    },

    /**
     * Toggle grid overlay (separate from debug)
     */
    toggleGrid() {
        this.gridMode = !this.gridMode;
        console.log(`[GameRenderer] Grid mode: ${this.gridMode}`);
        return this.gridMode;
    },

    /**
     * Draw world boundary indicator
     */
    drawWorldBoundary() {
        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);

        // Draw world border
        this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        // --- DEBUG: Show Verified Walkable Zones (Green Box) ---
        const islandManager = this.game ? this.game.getSystem('IslandManager') : null;
        if (this.debugMode && islandManager && islandManager.walkableZones) {
            this.ctx.lineWidth = 2;

            for (const zone of islandManager.walkableZones) {
                // Different color based on type for clarity
                if (zone.type === 'bridge') {
                    this.ctx.strokeStyle = '#00FF00'; // Lime Green (Bridge)
                    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                } else {
                    this.ctx.strokeStyle = '#32CD32'; // Forest Green (Island)
                    this.ctx.fillStyle = 'rgba(50, 205, 50, 0.1)';
                }

                this.ctx.beginPath();
                this.ctx.rect(zone.x, zone.y, zone.width, zone.height);
                this.ctx.fill();
                this.ctx.stroke();

                // Label
                this.ctx.fillStyle = '#FFF';
                this.ctx.font = '10px monospace';
                this.ctx.fillText(zone.id, zone.x + 5, zone.y + 15);
            }

            // --- DEBUG: Draw 128px Grid Overlay ---
            this.drawDebugGrid();
        }

        this.ctx.restore();
    },

    /**
     * Draw 128px gameplay grid overlay (debug only)
     */
    drawDebugGrid() {
        const cellSize = window.GameConstants ? GameConstants.Grid.CELL_SIZE : 128;

        // Get visible bounds with padding
        const bounds = this.getVisibleBounds();
        const startGx = Math.floor(bounds.left / cellSize);
        const startGy = Math.floor(bounds.top / cellSize);
        const endGx = Math.ceil(bounds.right / cellSize);
        const endGy = Math.ceil(bounds.bottom / cellSize);

        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)'; // Yellow grid lines
        this.ctx.lineWidth = 1;
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';

        // Draw vertical lines
        for (let gx = startGx; gx <= endGx; gx++) {
            const x = gx * cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, bounds.top);
            this.ctx.lineTo(x, bounds.bottom);
            this.ctx.stroke();
        }

        // Draw horizontal lines
        for (let gy = startGy; gy <= endGy; gy++) {
            const y = gy * cellSize;
            this.ctx.beginPath();
            this.ctx.moveTo(bounds.left, y);
            this.ctx.lineTo(bounds.right, y);
            this.ctx.stroke();
        }

        // Draw cell coordinates at intersections (sparse - every 4th cell)
        for (let gx = startGx; gx <= endGx; gx += 4) {
            for (let gy = startGy; gy <= endGy; gy += 4) {
                const x = gx * cellSize + 4;
                const y = gy * cellSize + 12;
                this.ctx.fillText(`${gx},${gy}`, x, y);
            }
        }
    },

    /**
     * Draw home outpost at center of world or home island
     */
    drawHomeOutpost() {
        let centerX = this.worldWidth / 2;
        let centerY = this.worldHeight / 2;

        // Use IslandManager if available
        const islandManager = this.game ? this.game.getSystem('IslandManager') : null;
        if (islandManager) {
            const home = islandManager.getHomeIsland();
            if (home) {
                centerX = home.worldX + home.width / 2;
                centerY = home.worldY + home.height / 2;
            }
        }

        const radius = 200;

        // Outer glow
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        this.ctx.fill();

        // Base circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#4CAF50'; // Green
        this.ctx.lineWidth = 6; // Bigger line
        this.ctx.setLineDash([40, 20]); // Bigger dashes

        // Animate rotation (marching ants effect)
        this.ctx.lineDashOffset = -(performance.now() / 15);

        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.lineDashOffset = 0;

        // Label (kept for clarity, scaled up)
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = 'bold 40px sans-serif'; // Doubled from 20
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('REST AREA', centerX, centerY);
    }
};

// Export
window.GameRenderer = GameRenderer;
if (window.Registry) Registry.register('GameRenderer', GameRenderer);

