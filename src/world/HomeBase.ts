/**
 * HomeBase - Player's starting home island with harvestable trees
 *
 * Creates collectible wood resources around the home island perimeter.
 * Trees are actual Resource entities that can be gathered.
 *
 * Owner: Level Architect
 */

import { Logger } from '@core/Logger';
import { GameRenderer } from '@core/GameRenderer';
import { GameConstants } from '@data/GameConstants';
import { getConfig } from '@data/GameConfig';
import { IslandManager } from './IslandManager';
import { AssetLoader } from '@core/AssetLoader';
import { entityManager } from '@core/EntityManager';
import { EventBus } from '@core/EventBus';
import { Registry } from '@core/Registry';
import type { Island, Bounds } from '../types/world';
import type { IEntity } from '../types/core';

// entityManager instance is imported, but we also need the EntityManager reference for static access
const EntityManager = entityManager;

const HomeBase = {
    treeBorderWidth: 100,

    // Private cache properties
    _cachedHome: null as Island | null,
    _cachedBounds: null as Bounds | null,
    _treeCacheFrame: 0,
    _cachedTrees: [] as IEntity[],
    _sortedTrees: [] as IEntity[],
    _heroAtHome: false,
    _heroAtForge: false,
    _forgePos: null as { x: number; y: number; size: number } | null,

    // Image Paths
    _outpostPath: null as string | null,
    _forgePath: null as string | null,
    _treePath: null as string | null,
    _treeConsumedPath: null as string | null,

    // Image Elements
    _outpostImg: null as HTMLImageElement | null,
    _forgeImg: null as HTMLImageElement | null,
    _treeImage: null as HTMLImageElement | null,
    _treeConsumedImage: null as HTMLImageElement | null,

    // Loading State
    _treeLoaded: false,
    _treeConsumedLoaded: false,

    // Debug
    _debugSpawnZone: null as any | null,

    /**
     * Get tree resources from EntityManager (cached per frame)
     * @returns {Array} Array of wood Resource entities on home island
     */
    get treeResources() {
        // Return cached if same frame
        const frame = (GameRenderer as any)?._renderTiming?.frames || 0;
        if (this._treeCacheFrame === frame && this._cachedTrees) {
            return this._cachedTrees;
        }

        if (!EntityManager || !this._cachedHome) return [];

        // Query and cache
        const home = this._cachedHome;
        this._cachedTrees = EntityManager.getByType('Resource').filter(
            (r) =>
                r.resourceType.startsWith('node_woodcutting_') &&
                r.islandGridX === home.gridX &&
                r.islandGridY === home.gridY
        );
        this._treeCacheFrame = frame;

        // Pre-sort trees (they don't move)
        this._sortedTrees = [...this._cachedTrees].sort((a, b) => a.y - b.y);

        return this._cachedTrees;
    },

    /**
     * Initialize the home base (trees now spawned via SpawnManager)
     */
    init() {
        if (!IslandManager) {
            Logger.error('[HomeBase]', 'IslandManager not found');
            return;
        }

        const home = IslandManager.getHomeIsland();
        if (!home) {
            Logger.error('[HomeBase]', 'Home island not found');
            return;
        }

        // PERF: Cache home island and bounds (don't change during gameplay)
        this._cachedHome = home;
        this._cachedBounds = IslandManager.getPlayableBounds(home);

        // PERF: Cache image paths at init
        if (AssetLoader) {
            this._outpostPath = AssetLoader.getImagePath('building_residential_01');
            this._forgePath = AssetLoader.getImagePath('building_industrial_01');
            this._treePath = AssetLoader.getImagePath('node_woodcutting_t1_01');
            this._treeConsumedPath = AssetLoader.getImagePath('node_woodcutting_t1_01_consumed');
        }

        // Trees are now spawned by SpawnManager.spawnHomeIslandTrees()
        Logger.info('[HomeBase]', 'Initialized (trees spawned via SpawnManager)');

        // Forge Button binding removed - CraftingUI not implemented
    },

    update(dt: number) {
        if (!GameRenderer || !GameRenderer.hero) return;

        const hero = GameRenderer.hero;
        const bounds = this._cachedBounds;

        // === Home Base / Rest Area Detection ===
        if (bounds) {
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;
            const restRadius = getConfig().Interaction.REST_AREA_RADIUS;

            const dx = hero.x - centerX;
            const dy = hero.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const wasAtHome = this._heroAtHome || false;
            const isAtHome = dist < restRadius;

            // ALWAYS sync the hero state with current radius check
            hero.isAtHomeOutpost = isAtHome;

            if (isAtHome && !wasAtHome) {
                if (EventBus) EventBus.emit(GameConstants.Events.HOME_BASE_ENTERED);
                Logger.debug('[HomeBase]', 'Hero entered rest area');
            } else if (!isAtHome && wasAtHome) {
                if (EventBus) EventBus.emit(GameConstants.Events.HOME_BASE_EXITED);
                Logger.debug('[HomeBase]', 'Hero exited rest area');
            }

            this._heroAtHome = isAtHome;
        }

        // === Forge Proximity Detection ===
        if (this._forgePos) {
            const dx = hero.x - this._forgePos.x;
            const dy = hero.y - this._forgePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const wasAtForge = this._heroAtForge || false;
            const isAtForge = dist < getConfig().Interaction.FORGE_AREA_RADIUS;

            if (isAtForge && !wasAtForge) {
                if (EventBus) EventBus.emit(GameConstants.Events.FORGE_ENTERED);
                Logger.debug('[HomeBase]', 'Hero entered forge area');
            } else if (!isAtForge && wasAtForge) {
                if (EventBus) EventBus.emit(GameConstants.Events.FORGE_EXITED);
                Logger.debug('[HomeBase]', 'Hero exited forge area');
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
    render(ctx: CanvasRenderingContext2D) {
        // PERF: Lazy init if init() was called before IslandManager was ready
        if (!this._cachedBounds && IslandManager) {
            const home = IslandManager.getHomeIsland();
            if (home) {
                this._cachedHome = home;
                this._cachedBounds = IslandManager.getPlayableBounds(home);
                if (AssetLoader) {
                    this._outpostPath = AssetLoader.getImagePath('building_residential_01');
                    this._forgePath = AssetLoader.getImagePath('building_industrial_01');
                    this._treePath = AssetLoader.getImagePath('node_woodcutting_t1_01');
                    this._treeConsumedPath = AssetLoader.getImagePath(
                        'node_woodcutting_t1_01_consumed'
                    );
                }
            }
        }

        const bounds = this._cachedBounds;

        // === DEBUG: Draw spawn zone visualization (only when debug mode active) ===
        if (this._debugSpawnZone && GameRenderer && GameRenderer.debugMode) {
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
            ctx.fillText(`Trees: ${this._cachedTrees?.length || 0}`, z.centerX, z.minY - 50);
            ctx.restore();
        }

        // Render Outpost Building (Center of Rest Area)
        if (bounds && this._outpostPath) {
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;

            if (!this._outpostImg) {
                this._outpostImg = AssetLoader.createImage(this._outpostPath);
            }
            if (this._outpostImg.complete && this._outpostImg.naturalWidth) {
                const size = 300;
                ctx.drawImage(this._outpostImg, centerX - size / 2, centerY - size / 2, size, size);
            }
        }

        // Render Forge Building (Bottom Left of Safe Area)
        if (bounds && this._forgePath) {
            const forgeSize = 250;
            const forgeX = bounds.x + forgeSize / 2 + 30;
            const forgeY = bounds.y + bounds.height - forgeSize / 2 - 30;
            this._forgePos = { x: forgeX, y: forgeY, size: forgeSize };

            if (!this._forgeImg) {
                this._forgeImg = AssetLoader.createImage(this._forgePath);
            }
            if (this._forgeImg.complete && this._forgeImg.naturalWidth) {
                ctx.drawImage(
                    this._forgeImg,
                    forgeX - forgeSize / 2,
                    forgeY - forgeSize / 2,
                    forgeSize,
                    forgeSize
                );
            }
        }

        // Load tree sprites once
        if (!this._treeImage && this._treePath) {
            this._treeImage = AssetLoader.createImage(this._treePath, () => {
                this._treeLoaded = true;
            });
            this._treeLoaded = false;
        }
        if (!this._treeConsumedImage && this._treeConsumedPath) {
            this._treeConsumedImage = AssetLoader.createImage(this._treeConsumedPath, () => {
                this._treeConsumedLoaded = true;
            });
            this._treeConsumedLoaded = false;
        }

        // Trigger cache refresh (once per frame via getter)
        this.treeResources;

        // Use pre-sorted trees (sorted when cache updates)
        const sortedTrees = this._sortedTrees || [];

        for (const tree of sortedTrees) {
            if (tree.state === 'depleted') {
                if (this._treeConsumedLoaded && this._treeConsumedImage) {
                    const size = 160;
                    ctx.drawImage(
                        this._treeConsumedImage,
                        tree.x - size / 2,
                        tree.y - size / 2,
                        size,
                        size
                    );
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
        if (!IslandManager) return null;

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

if (Registry) Registry.register('HomeBase', HomeBase);

export { HomeBase };
