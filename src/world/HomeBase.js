/**
 * HomeBase - Player's starting home island with harvestable trees
 * 
 * Creates collectible wood resources around the home island perimeter.
 * Trees are actual Resource entities that can be gathered.
 * 
 * Owner: Level Architect
 */

const HomeBase = {
    treeBorderWidth: 100,  // Width of tree zone on each edge

    /**
     * Get tree resources from EntityManager (unified with resource system)
     * @returns {Array} Array of wood Resource entities on home island
     */
    get treeResources() {
        if (!window.EntityManager || !window.IslandManager) return [];
        const home = IslandManager.getHomeIsland();
        if (!home) return [];

        // Query EntityManager for wood resources on home island
        return EntityManager.getByType('Resource').filter(r =>
            r.resourceType === 'wood' &&
            r.islandGridX === home.gridX &&
            r.islandGridY === home.gridY
        );
    },

    /**
     * Initialize the home base (trees now spawned via SpawnManager)
     */
    init() {
        if (!window.IslandManager) {
            console.error('[HomeBase] IslandManager not found');
            return;
        }

        const home = IslandManager.getHomeIsland();
        if (!home) {
            console.error('[HomeBase] Home island not found');
            return;
        }

        // Trees are now spawned by SpawnManager.spawnHomeIslandTrees()
        console.log('[HomeBase] Initialized (trees spawned via SpawnManager)');

        // Bind Forge Button
        const btn = document.getElementById('btn-open-craft');
        if (btn) {
            btn.onclick = () => {
                if (window.CraftingUI) CraftingUI.open();
            };
        }
    },

    update(dt) {
        if (!window.GameRenderer || !GameRenderer.hero) return;

        const hero = GameRenderer.hero;

        // === Home Base / Rest Area Detection ===
        if (window.IslandManager) {
            const home = IslandManager.getHomeIsland();
            if (home) {
                const bounds = IslandManager.getPlayableBounds(home);
                if (bounds) {
                    const centerX = bounds.x + bounds.width / 2;
                    const centerY = bounds.y + bounds.height / 2;
                    const restRadius = 200; // Hero must be within this radius to rest

                    const dx = hero.x - centerX;
                    const dy = hero.y - centerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const wasAtHome = this._heroAtHome || false;
                    const isAtHome = dist < restRadius;

                    if (isAtHome && !wasAtHome) {
                        // Just entered home base
                        hero.isAtHomeOutpost = true;
                        if (window.EventBus) EventBus.emit(GameConstants.Events.HOME_BASE_ENTERED);
                        console.log('[HomeBase] Hero entered rest area');
                    } else if (!isAtHome && wasAtHome) {
                        // Just exited home base
                        hero.isAtHomeOutpost = false;
                        if (window.EventBus) EventBus.emit(GameConstants.Events.HOME_BASE_EXITED);
                        console.log('[HomeBase] Hero exited rest area');
                    }

                    this._heroAtHome = isAtHome;
                }
            }
        }

        // === Forge Proximity Detection ===
        if (this._forgePos) {
            const dx = hero.x - this._forgePos.x;
            const dy = hero.y - this._forgePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const wasAtForge = this._heroAtForge || false;
            const isAtForge = dist < 200;

            if (isAtForge && !wasAtForge) {
                // Just entered forge area
                if (window.EventBus) EventBus.emit(GameConstants.Events.FORGE_ENTERED);
                console.log('[HomeBase] Hero entered forge area');
            } else if (!isAtForge && wasAtForge) {
                // Just exited forge area
                if (window.EventBus) EventBus.emit(GameConstants.Events.FORGE_EXITED);
                console.log('[HomeBase] Hero exited forge area');
            }

            this._heroAtForge = isAtForge;
        }
    },

    // NOTE: Tree spawning moved to SpawnManager.spawnHomeIslandTrees()
    // Trees are now queried via the treeResources getter from EntityManager

    /**
     * Custom render for trees (override default resource rendering)
     * Called from GameRenderer after islands are drawn
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        // === DEBUG: Draw spawn zone visualization (only when debug mode active) ===
        if (this._debugSpawnZone && window.GameRenderer && GameRenderer.debugMode) {
            const z = this._debugSpawnZone;
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(z.minX, z.minY, z.maxX - z.minX, z.maxY - z.minY);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.fillRect(z.minX, z.minY, z.maxX - z.minX, z.maxY - z.minY);
            ctx.beginPath();
            ctx.arc(z.centerX, z.centerY, z.restAreaRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(100, 0, 0, 0.3)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.stroke();
            ctx.fillStyle = 'red';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('TREE SPAWN ZONE', z.centerX, z.minY - 20);
            ctx.fillText(`Trees: ${this.treeResources.length}`, z.centerX, z.minY - 50);
            ctx.restore();
        }

        // Render Outpost Building (Center of Rest Area)
        if (window.AssetLoader && window.IslandManager) {
            const home = IslandManager.getHomeIsland();
            if (home) {
                const bounds = IslandManager.getPlayableBounds(home);
                if (bounds) {
                    const centerX = bounds.x + bounds.width / 2;
                    const centerY = bounds.y + bounds.height / 2;

                    const outpostPath = AssetLoader.getImagePath('building_outpost');
                    if (outpostPath) {
                        if (!this._outpostImg) {
                            this._outpostImg = AssetLoader.createImage(outpostPath);
                        }
                        if (this._outpostImg.complete && this._outpostImg.naturalWidth) {
                            const size = 300;
                            ctx.drawImage(this._outpostImg, centerX - size / 2, centerY - size / 2, size, size);
                        }
                    }
                }
            }
        }

        // Render Forge Building (Bottom Left of Safe Area)
        if (window.AssetLoader && window.IslandManager) {
            const home = IslandManager.getHomeIsland();
            if (home) {
                const bounds = IslandManager.getPlayableBounds(home);
                if (bounds) {
                    const forgeSize = 250;
                    const forgeX = bounds.x + forgeSize / 2 + 30;
                    const forgeY = bounds.y + bounds.height - forgeSize / 2 - 30;
                    this._forgePos = { x: forgeX, y: forgeY, size: forgeSize };

                    const forgePath = AssetLoader.getImagePath('building_forge');
                    if (forgePath) {
                        if (!this._forgeImg) {
                            this._forgeImg = AssetLoader.createImage(forgePath);
                        }
                        if (this._forgeImg.complete && this._forgeImg.naturalWidth) {
                            ctx.drawImage(this._forgeImg, forgeX - forgeSize / 2, forgeY - forgeSize / 2, forgeSize, forgeSize);
                        }
                    }
                }
            }
        }

        // Load sprite on first render
        if (!this._treeImage && window.AssetLoader) {
            const imagePath = AssetLoader.getImagePath('world_wood');
            if (imagePath) {
                this._treeImage = AssetLoader.createImage(imagePath, () => { this._treeLoaded = true; });
                this._treeLoaded = false;
            }
        }

        // Load consumed tree sprite on first render
        if (!this._treeConsumedImage && window.AssetLoader) {
            const consumedPath = AssetLoader.getImagePath('world_wood_consumed');
            if (consumedPath) {
                this._treeConsumedImage = AssetLoader.createImage(consumedPath, () => { this._treeConsumedLoaded = true; });
                this._treeConsumedLoaded = false;
            }
        }

        // Sort trees by Y for correct draw order
        const sortedTrees = [...this.treeResources].sort((a, b) => a.y - b.y);

        for (const tree of sortedTrees) {
            if (tree.state === 'depleted') {
                if (this._treeConsumedLoaded && this._treeConsumedImage) {
                    const size = 160;
                    ctx.drawImage(this._treeConsumedImage, tree.x - size / 2, tree.y - size / 2, size, size);
                } else {
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.fillStyle = '#3E2723';
                    ctx.beginPath();
                    ctx.arc(tree.x, tree.y + 10, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                continue;
            }

            if (!tree.active) continue;

            if (this._treeLoaded && this._treeImage) {
                const size = 160;
                ctx.drawImage(this._treeImage, tree.x - size / 2, tree.y - size / 2, size, size);
            } else {
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(tree.x - 6, tree.y + 5, 12, 20);

                ctx.fillStyle = '#2E7D32';
                ctx.beginPath();
                ctx.arc(tree.x, tree.y - 5, 22, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#1B5E20';
                ctx.beginPath();
                ctx.arc(tree.x, tree.y - 8, 14, 0, Math.PI * 2);
                ctx.fill();
            }

            if (tree.renderHealthBar) {
                tree.renderHealthBar(ctx);
            }
        }
    },

    /**
     * Get the safe spawn area (center of home island, away from trees)
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getSafeArea() {
        if (!window.IslandManager) return null;

        const home = IslandManager.getHomeIsland();
        if (!home) return null;

        const border = this.treeBorderWidth;
        return {
            x: home.worldX + border,
            y: home.worldY + border,
            width: home.width - border * 2,
            height: home.height - border * 2
        };
    },

    /**
     * Check if blocking by trees - now always returns false (trees don't block)
     * @returns {boolean}
     */
    isBlockedByTrees() {
        return false; // Trees are resources, not barriers
    }
};

// Export
window.HomeBase = HomeBase;
if (window.Registry) Registry.register('HomeBase', HomeBase);
