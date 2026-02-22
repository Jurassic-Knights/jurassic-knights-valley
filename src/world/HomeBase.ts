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
import { WorldManager } from './WorldManager';
import { AssetLoader } from '@core/AssetLoader';
import { entityManager } from '@core/EntityManager';
import { EventBus } from '@core/EventBus';
import { Registry } from '@core/Registry';
import { renderHomeBase } from './HomeBaseRenderer';
import type { Bounds } from '../types/world';
import type { IEntity } from '../types/core';

// entityManager instance is imported, but we also need the EntityManager reference for static access
const EntityManager = entityManager;

const HomeBase = {
    treeBorderWidth: 100,

    // Private cache properties
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
    _debugSpawnZone: null as {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        centerX: number;
        centerY: number;
        restAreaRadius: number;
    } | null,

    /**
     * Get tree resources from EntityManager (cached per frame)
     * @returns {Array} Array of wood Resource entities on home island
     */
    get treeResources() {
        // Return cached if same frame
        const renderer = GameRenderer as unknown as { _renderTiming?: { frames: number } };
        const frame = renderer?._renderTiming?.frames || 0;
        if (this._treeCacheFrame === frame && this._cachedTrees) {
            return this._cachedTrees;
        }

        if (!EntityManager || !this._cachedBounds) return [];

        // Query and cache
        const bounds = this._cachedBounds;
        this._cachedTrees = EntityManager.getByType('Resource').filter(
            (r) =>
                r.resourceType.startsWith('node_woodcutting_') &&
                r.x >= bounds.x && r.x <= bounds.x + bounds.width &&
                r.y >= bounds.y && r.y <= bounds.y + bounds.height
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
        if (!WorldManager) {
            Logger.error('[HomeBase]', 'WorldManager not found');
            return;
        }

        const spawn = WorldManager.getHeroSpawnPosition();
        if (!spawn) {
            Logger.error('[HomeBase]', 'Hero spawn not found');
            return;
        }

        // PERF: Cache bounds around spawn point
        const size = 2000;
        this._cachedBounds = {
            x: spawn.x - size / 2,
            y: spawn.y - size / 2,
            width: size,
            height: size
        };

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

    update(_dt: number) {
        if (!GameRenderer || !GameRenderer.hero) return;

        const hero = GameRenderer.hero;
        const bounds = this._cachedBounds;

        // === Home Base / Rest Area Detection ===
        // Rest zones: (1) home island center (legacy), (2) placed outpost props from map editor
        const restRadius = getConfig().Interaction.REST_AREA_RADIUS;
        const REST_ZONE_IDS = new Set(['building_t1_02', 'building_residential_01']);

        let isAtHome = false;
        if (bounds) {
            const centerX = bounds.x + bounds.width / 2;
            const centerY = bounds.y + bounds.height / 2;
            const dx = hero.x - centerX;
            const dy = hero.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            isAtHome = dist < restRadius;
        }
        if (!isAtHome && EntityManager) {
            const props = EntityManager.getByType('Prop') as Array<{ x: number; y: number; registryId?: string | null }>;
            for (const prop of props) {
                if (prop.registryId && REST_ZONE_IDS.has(prop.registryId)) {
                    const dx = hero.x - prop.x;
                    const dy = hero.y - prop.y;
                    if (Math.sqrt(dx * dx + dy * dy) < restRadius) {
                        isAtHome = true;
                        break;
                    }
                }
            }
        }

        const wasAtHome = this._heroAtHome || false;
        hero.isAtHomeOutpost = isAtHome;

        if (isAtHome && !wasAtHome) {
            if (EventBus) EventBus.emit(GameConstants.Events.HOME_BASE_ENTERED);
            Logger.debug('[HomeBase]', 'Hero entered rest area');
        } else if (!isAtHome && wasAtHome) {
            if (EventBus) EventBus.emit(GameConstants.Events.HOME_BASE_EXITED);
            Logger.debug('[HomeBase]', 'Hero exited rest area');
        }
        this._heroAtHome = isAtHome;

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

    render(ctx: CanvasRenderingContext2D) {
        if (!this._cachedBounds && WorldManager) {
            const spawn = WorldManager.getHeroSpawnPosition();
            if (spawn) {
                const size = 2000;
                this._cachedBounds = {
                    x: spawn.x - size / 2,
                    y: spawn.y - size / 2,
                    width: size,
                    height: size
                };
                if (AssetLoader) {
                    this._outpostPath = AssetLoader.getImagePath('building_residential_01');
                    this._forgePath = AssetLoader.getImagePath('building_industrial_01');
                    this._treePath = AssetLoader.getImagePath('node_woodcutting_t1_01');
                    this._treeConsumedPath = AssetLoader.getImagePath('node_woodcutting_t1_01_consumed');
                }
            }
        }
        const _ = this.treeResources;
        renderHomeBase(ctx, this as unknown as import('./HomeBaseRenderer').HomeBaseRenderState);
    },

    /**
     * Get the safe spawn area (center of home island, away from trees)
     * @returns {{x: number, y: number, width: number, height: number}}
     */
    getSafeArea() {
        if (!this._cachedBounds) return null;

        const b = this._cachedBounds;
        const border = this.treeBorderWidth;
        return {
            x: b.x + border,
            y: b.y + border,
            width: b.width - border * 2,
            height: b.height - border * 2
        };
    },

    /**
     * Check if blocking by trees - now always returns false (trees don't block)
     * @returns {boolean}
     */
    isBlockedByTrees(_x: number, _y: number) {
        return false; // Trees are resources, not barriers
    }
};

if (Registry) Registry.register('HomeBase', HomeBase);

export { HomeBase };
