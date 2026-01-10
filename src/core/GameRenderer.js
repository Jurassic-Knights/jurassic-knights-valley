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

    // GC Optimization: Pre-allocated array for Y-sorting
    _sortableEntities: [],


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

        // GC Optimization: Cache system references for render loop
        this._worldRenderer = this.game.getSystem('WorldRenderer');
        this._vfxController = this.game.getSystem('VFXController');
        this._homeBase = this.game.getSystem('HomeBase');
        this._heroRenderer = this.game.getSystem('HeroRenderer');
        this._dinosaurRenderer = this.game.getSystem('DinosaurRenderer');
        this._resourceRenderer = this.game.getSystem('ResourceRenderer');
        this._ambientSystem = this.game.getSystem('AmbientSystem');
        this._fogSystem = this.game.getSystem('FogOfWarSystem');
        this._envRenderer = this.game.getSystem('EnvironmentRenderer');

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
     * Set simpleShadows = true for performance (simple ellipses instead of sprite shadows)
     */
    simpleShadows: false, // Use complex sprite shadows

    renderShadowPass(entities) {
        if (!this.ctx || !window.EnvironmentRenderer) return;

        // PERFORMANCE MODE: Simple ellipse shadows (much faster)
        if (this.simpleShadows) {
            this.renderSimpleShadows(entities);
            return;
        }

        const timing = this._renderTiming;
        let tSub;

        // PERF: Render shadows directly to main canvas instead of intermediate
        // This avoids the expensive 18ms+ drawImage composite step
        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);
        this.ctx.globalAlpha = window.EnvironmentRenderer.shadowAlpha || 0.3;

        // Render Opaque Shadows - Use cached refs
        const heroRenderer = this._heroRenderer;
        const dinosaurRenderer = this._dinosaurRenderer;
        const resourceRenderer = this._resourceRenderer;

        for (const entity of entities) {
            if (timing) tSub = performance.now();

            if (entity === this.hero) {
                if (heroRenderer) heroRenderer.drawShadow(this.ctx, entity, false);
                if (timing) { timing.shadowHero = (timing.shadowHero || 0) + performance.now() - tSub; }
            } else if (entity.entityType === EntityTypes.DINOSAUR) {
                if (dinosaurRenderer) dinosaurRenderer.renderShadow(this.ctx, entity, false);
                if (timing) { timing.shadowDino = (timing.shadowDino || 0) + performance.now() - tSub; }
            } else if (entity.entityType === EntityTypes.RESOURCE) {
                if (resourceRenderer) resourceRenderer.renderShadow(this.ctx, entity, false);
                if (timing) { timing.shadowRes = (timing.shadowRes || 0) + performance.now() - tSub; }
            } else if (entity.entityType === EntityTypes.MERCHANT) {
                if (typeof entity.drawShadow === 'function') entity.drawShadow(this.ctx, false);
                if (timing) { timing.shadowMerch = (timing.shadowMerch || 0) + performance.now() - tSub; }
            } else {
                if (typeof entity.drawShadow === 'function') entity.drawShadow(this.ctx, false);
                if (timing) { timing.shadowOther = (timing.shadowOther || 0) + performance.now() - tSub; }
            }
        }

        this.ctx.restore();
        // No composite step needed - shadows rendered directly!
    },

    /**
     * Fast simple ellipse shadows (performance mode)
     */
    renderSimpleShadows(entities) {
        const alpha = window.EnvironmentRenderer?.shadowAlpha || 0.3;

        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);
        this.ctx.fillStyle = 'rgba(0, 0, 0, ' + alpha + ')';

        for (const entity of entities) {
            const w = entity.width || 64;
            const h = entity.height || 64;
            const shadowW = w * 0.4;
            const shadowH = h * 0.15;
            const x = entity.x;
            const y = entity.y + h * 0.4; // At feet

            this.ctx.beginPath();
            this.ctx.ellipse(x, y, shadowW, shadowH, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    },

    /**
     * Clear and render all entities
     */
    render() {
        if (!this.ctx) return;

        // Detailed profiling when enabled
        const timing = this._renderTiming;
        if (timing) timing.frames++;
        let t0, t1;

        // Update camera to follow hero
        this.updateCamera();

        // --- WORLD LAYER --- (Use cached ref)
        if (timing) t0 = performance.now();
        const worldRenderer = this._worldRenderer;
        if (worldRenderer) {
            worldRenderer.render(this.ctx, this.viewport);
        } else {
            // Safe fallback if not yet registered
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (timing) { timing.world += performance.now() - t0; }

        // --- VFX LAYER (Background) --- (Use cached ref)
        if (timing) t0 = performance.now();
        const vfxController = this._vfxController;

        if (vfxController && vfxController.bgParticles) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            vfxController.bgParticles.render(this.ctx);
            this.ctx.restore();
        }
        if (timing) { timing.vfxBg += performance.now() - t0; }

        // Y-SORT: Collect all active world entities from EntityManager
        if (timing) t0 = performance.now();
        // GC Optimization: Reuse pre-allocated array
        const sortableEntities = this._sortableEntities;
        sortableEntities.length = 0; // Clear without deallocation

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
        if (timing) { timing.entitySort += performance.now() - t0; }

        // --- SHADOW PASS ---
        if (timing) t0 = performance.now();
        // Render all shadows to offscreen buffer and composite ONCE
        this.renderShadowPass(sortableEntities);
        if (timing) { timing.shadows += performance.now() - t0; }

        // Render all entities (with viewport offset)
        if (timing) t0 = performance.now();
        this.ctx.save();
        this.ctx.translate(-this.viewport.x, -this.viewport.y);

        // Render HomeBase (Trees + Outpost Building) ON TOP of rest area overlay (Use cached ref)
        let tSub;
        if (timing) tSub = performance.now();
        const homeBase = this._homeBase;
        if (homeBase) {
            homeBase.render(this.ctx);
        }
        if (timing) { timing.entHomeBase = (timing.entHomeBase || 0) + performance.now() - tSub; }

        // Use cached renderer refs
        const heroRenderer = this._heroRenderer;
        const dinosaurRenderer = this._dinosaurRenderer;
        const resourceRenderer = this._resourceRenderer;

        // Track entity counts and sub-times
        if (timing) {
            timing.entHeroTime = timing.entHeroTime || 0;
            timing.entDinoTime = timing.entDinoTime || 0;
            timing.entResTime = timing.entResTime || 0;
            timing.entOtherTime = timing.entOtherTime || 0;
            timing.entCount = timing.entCount || 0;
        }

        for (const entity of sortableEntities) {
            if (timing) tSub = performance.now();
            // Type-based Rendering Dispatch using entityType (faster than constructor.name)
            const type = entity.entityType;

            // Pass 'false' for includeShadow to prevent double rendering
            if (entity === this.hero) {
                if (heroRenderer) {
                    heroRenderer.render(this.ctx, this.hero, false);
                } else {
                    if (typeof entity.render === 'function') entity.render(this.ctx);
                }
                if (timing) { timing.entHeroTime += performance.now() - tSub; }
            }
            else if (type === EntityTypes.DINOSAUR && dinosaurRenderer) {
                dinosaurRenderer.render(this.ctx, entity, false);
                if (timing) { timing.entDinoTime += performance.now() - tSub; }
            }
            else if (type === EntityTypes.RESOURCE && resourceRenderer) {
                resourceRenderer.render(this.ctx, entity, false);
                if (timing) { timing.entResTime += performance.now() - tSub; }
            }
            else if (type === EntityTypes.MERCHANT) {
                // Merchant handles its own rendering
                if (typeof entity.render === 'function') entity.render(this.ctx);
                if (timing) {
                    timing.entMerchantTime = (timing.entMerchantTime || 0) + performance.now() - tSub;
                    timing.entMerchantCount = (timing.entMerchantCount || 0) + 1;
                }
            }
            else if (type === EntityTypes.DROPPED_ITEM) {
                // Dropped item rendering
                if (typeof entity.render === 'function') entity.render(this.ctx);
                if (timing) {
                    timing.entDroppedTime = (timing.entDroppedTime || 0) + performance.now() - tSub;
                    timing.entDroppedCount = (timing.entDroppedCount || 0) + 1;
                }
            }
            else {
                // Unknown entity type - track it
                if (typeof entity.render === 'function') {
                    entity.render(this.ctx);
                }
                if (timing) {
                    timing.entOtherTime += performance.now() - tSub;
                    // Track unknown types
                    const typeName = type || entity.constructor?.name || 'unknown';
                    timing.entOtherTypes = timing.entOtherTypes || {};
                    timing.entOtherTypes[typeName] = (timing.entOtherTypes[typeName] || 0) + 1;
                }
            }
            if (timing) timing.entCount++;
        }

        // Render UI Overlays (Health Bars) on top of EVERYTHING
        if (timing) tSub = performance.now();
        for (const entity of sortableEntities) {
            if (typeof entity.renderUI === 'function') {
                entity.renderUI(this.ctx);
            }
        }
        if (timing) { timing.entUITime = (timing.entUITime || 0) + performance.now() - tSub; }

        this.ctx.restore();
        if (timing) { timing.entities += performance.now() - t0; }



        // Render Ambient Layer (Sky/Cloud level) - Use cached ref
        if (timing) t0 = performance.now();
        const ambientSystem = this._ambientSystem;
        if (ambientSystem) {
            this.ctx.save();
            this.ctx.translate(-this.viewport.x, -this.viewport.y);
            ambientSystem.render(this.ctx);
            this.ctx.restore();
        }
        if (timing) { timing.ambient += performance.now() - t0; }

        // Render Fog of War - Use cached ref
        if (timing) t0 = performance.now();
        const fogSystem = this._fogSystem;
        if (fogSystem) {
            fogSystem.render(this.ctx, this.viewport);
        }
        if (timing) { timing.fog += performance.now() - t0; }

        // Render Foreground VFX (e.g. Explosions) ON TOP of everything
        if (timing) t0 = performance.now();
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
        if (timing) { timing.vfxFg += performance.now() - t0; }

        // --- AMBIENT OVERLAY (Day/Night Cycle) --- Use cached ref
        if (timing) t0 = performance.now();
        const envRenderer = this._envRenderer;
        if (envRenderer) {
            envRenderer.render(this.ctx, this.viewport);
        }
        if (timing) { timing.envOverlay += performance.now() - t0; }

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
     * Start detailed render profiling
     */
    startRenderProfile() {
        this._renderTiming = {
            world: 0, vfxBg: 0, entitySort: 0, shadows: 0,
            entities: 0, ambient: 0, fog: 0, vfxFg: 0, envOverlay: 0,
            frames: 0
        };
        console.log('[GameRenderer] Render profiling started...');
    },

    /**
     * Stop render profiling and print results
     */
    stopRenderProfile() {
        const t = this._renderTiming;
        if (!t) return;

        console.log('=== RENDER PHASE BREAKDOWN ===');
        console.log(`Frames: ${t.frames}`);
        const phases = [
            ['World', t.world], ['VFX BG', t.vfxBg], ['Entity Sort', t.entitySort],
            ['Shadows', t.shadows], ['Entities', t.entities], ['Ambient', t.ambient],
            ['Fog', t.fog], ['VFX FG', t.vfxFg], ['Env Overlay', t.envOverlay]
        ];
        for (const [name, time] of phases.sort((a, b) => b[1] - a[1])) {
            console.log(`  ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)`);
        }

        // World sub-phase breakdown
        console.log('--- World Sub-Phases ---');
        const worldPhases = [
            ['Water/BG', t.worldWater || 0],
            ['Islands', t.worldIslands || 0],
            ['Debug', t.worldDebug || 0]
        ];
        for (const [name, time] of worldPhases.sort((a, b) => b[1] - a[1])) {
            console.log(`    ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)`);
        }

        // Shadow sub-phase breakdown
        console.log('--- Shadow Sub-Phases ---');
        const shadowPhases = [
            ['Clear', t.shadowClear || 0],
            ['Composite', t.shadowComposite || 0],
            ['Hero', t.shadowHero || 0],
            ['Dinosaurs', t.shadowDino || 0],
            ['Resources', t.shadowRes || 0],
            ['Merchants', t.shadowMerch || 0],
            ['Other', t.shadowOther || 0]
        ];
        for (const [name, time] of shadowPhases.sort((a, b) => b[1] - a[1])) {
            console.log(`    ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)`);
        }

        // Entity sub-phase breakdown
        console.log('--- Entity Sub-Phases ---');
        console.log(`  Total Entities Rendered: ${t.entCount || 0} (${((t.entCount || 0) / t.frames).toFixed(1)}/frame)`);
        const entPhases = [
            ['HomeBase', t.entHomeBase || 0],
            ['Hero', t.entHeroTime || 0],
            ['Dinosaurs', t.entDinoTime || 0],
            ['Resources', t.entResTime || 0],
            ['DroppedItems', t.entDroppedTime || 0, t.entDroppedCount || 0],
            ['Merchants', t.entMerchantTime || 0, t.entMerchantCount || 0],
            ['Other', t.entOtherTime || 0],
            ['UI Overlays', t.entUITime || 0]
        ];
        for (const [name, time, count] of entPhases.sort((a, b) => b[1] - a[1])) {
            const countStr = count ? ` [${count} total]` : '';
            console.log(`    ${name}: ${time.toFixed(1)}ms (${(time / t.frames).toFixed(2)}ms/frame)${countStr}`);
        }

        // Log unknown entity types
        if (t.entOtherTypes && Object.keys(t.entOtherTypes).length > 0) {
            console.log('  Unknown Entity Types:');
            for (const [typeName, count] of Object.entries(t.entOtherTypes)) {
                console.log(`    - ${typeName}: ${count}`);
            }
        }

        console.log('==============================');
        this._renderTiming = null;
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

        // --- DEBUG: Show Collision Blocks (Red) ---
        const islandManager = this.game ? this.game.getSystem('IslandManager') : null;
        if (this.debugMode && islandManager && islandManager.collisionBlocks) {
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.lineWidth = 1;

            for (const block of islandManager.collisionBlocks) {
                this.ctx.beginPath();
                this.ctx.rect(block.x, block.y, block.width, block.height);
                this.ctx.fill();
                this.ctx.stroke();
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

        // Draw X,Y label in center of each cell (large, stacked)
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let gx = startGx; gx <= endGx; gx++) {
            for (let gy = startGy; gy <= endGy; gy++) {
                const centerX = gx * cellSize + cellSize / 2;
                const centerY = gy * cellSize + cellSize / 2;
                // X on top
                this.ctx.fillText(`X${gx}`, centerX, centerY - 20);
                // Y on bottom
                this.ctx.fillText(`Y${gy}`, centerX, centerY + 20);
            }
        }

        // Reset text alignment
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
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

