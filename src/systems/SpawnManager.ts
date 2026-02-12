/**
 * SpawnManagerService - Orchestrates entity spawning via specialized spawners
 *
 * This is the main SpawnManager, now slimmed down to delegate to:
 * - PropSpawner: Decorative props in water gaps
 * - ResourceSpawner: Resources, dinosaurs, trees
 * - EnemySpawner: Enemies in biomes
 * - DropSpawner: Dropped items
 *
 * Owner: Director / Level Architect
 */

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants } from '@data/GameConstants';
import { entityManager } from '@core/EntityManager';
import { GameState } from '@core/State';
import { IslandManager } from '../world/IslandManager';
import { IGame, IEntity } from '../types/core';
import { IIslandManager } from '../types/world';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { Hero } from '../gameplay/Hero';
import { Registry } from '@core/Registry';
import { GameRenderer } from '@core/GameRenderer';
import { PropSpawner } from './spawners/PropSpawner';
import { ResourceSpawner } from './spawners/ResourceSpawner';
import { EnemySpawner } from './spawners/EnemySpawner';
import { DropSpawner } from './spawners/DropSpawner';
import { Merchant } from '../gameplay/Merchant';
import { spawnMerchants as spawnMerchantsFn, getMerchantNearHero as getMerchantNearHeroFn } from './SpawnManagerMerchants';
import { refreshIslandResources as refreshIslandResourcesFn, updateIslandRespawnTimers as updateIslandRespawnTimersFn } from './SpawnManagerIslands';

// Unmapped modules - need manual import

class SpawnManagerService {
    private game: IGame | null = null;
    private _islandManager: IIslandManager | null = null;
    private _gameRenderer: typeof GameRenderer | null = null;
    private merchants: Merchant[] = [];
    private propSpawner: PropSpawner | null = null;
    private resourceSpawner: ResourceSpawner | null = null;
    private enemySpawner: EnemySpawner | null = null;
    private dropSpawner: DropSpawner | null = null;

    constructor() {
        Logger.info('[SpawnManager] Initialized Service');
    }

    public get gameInstance(): IGame | null {
        return this.game;
    }

    public getIslandManager(): IIslandManager | null {
        return this._islandManager;
    }

    public getGameRenderer(): typeof GameRenderer | null {
        return this._gameRenderer;
    }

    /**
     * Initialize with game reference
     */
    init(game: IGame): void {
        this.game = game;
        this._islandManager = game.getSystem<IIslandManager>('IslandManager') ?? Registry.get<IIslandManager>('IslandManager') ?? null;
        this._gameRenderer = game.getSystem<typeof GameRenderer>('GameRenderer') ?? (Registry.get('GameRenderer') as typeof GameRenderer) ?? null;

        // Initialize sub-spawners
        this.propSpawner = new PropSpawner(this);
        this.resourceSpawner = new ResourceSpawner(this);
        this.enemySpawner = new EnemySpawner(this);
        this.dropSpawner = new DropSpawner(this);

        this.initListeners();
        Logger.info('[SpawnManager] Initialized');
    }

    private initListeners(): void {
        EventBus.on(GameConstants.Events.ISLAND_UNLOCKED, (data: { gridX: number; gridY: number }) =>
            this.initializeIsland(data.gridX, data.gridY)
        );
        EventBus.on(
            GameConstants.Events.RESPAWN_REFRESH_REQUESTED,
            (data: { gridX: number; gridY: number; type: string }) => {
                const { gridX, gridY, type } = data;
                if (type === 'resourceSlots') {
                    refreshIslandResourcesFn(gridX, gridY, this.resourceSpawner);
                } else if (type === 'respawnTime') {
                    updateIslandRespawnTimersFn(gridX, gridY);
                }
            }
        );
    }

    /**
     * Update loop (required for System registration)
     */
    update(_dt: number): void {
        // Mostly event-driven
    }

    /**
     * Start lifecycle hook (called after all systems are initialized)
     */
    start(): void {
        if (!this.game) return;

        Logger.info('[SpawnManager] Starting lifecycle...');
        this.spawnHero();

        if (this.resourceSpawner) {
            this.resourceSpawner.spawnHomeIslandTrees();
            this.resourceSpawner.spawnResources();
        }

        this.spawnMerchants();

        // Props disabled for performance
        // if (this.propSpawner) this.propSpawner.spawnProps();

        // Spawn test enemies in biomes
        if (this.enemySpawner) {
            this.enemySpawner.spawnTestEnemies();
        }
    }

    // ============================================
    // HERO SPAWNING
    // ============================================

    private spawnHero(): void {
        if (!this.game) {
            Logger.error('[SpawnManager] Cannot spawn hero - game not initialized');
            return;
        }

        try {
            let spawnX: number, spawnY: number;
            const islandManager = this._islandManager;

            if (islandManager) {
                const spawn = islandManager.getHeroSpawnPosition();
                spawnX = spawn.x;
                spawnY = spawn.y;
            } else {
                Logger.warn('[SpawnManager] IslandManager not found, using fallback spawn');
                const gameRenderer = this._gameRenderer;
                if (gameRenderer) {
                    spawnX = gameRenderer.worldWidth / 2;
                    spawnY = gameRenderer.worldHeight / 2;
                } else {
                    spawnX = GameConstants.World.DEFAULT_SPAWN_X;
                    spawnY = GameConstants.World.DEFAULT_SPAWN_Y;
                }
            }

            // Check if Hero class is available
            if (typeof Hero === 'undefined') {
                Logger.error('[SpawnManager] Hero class not found! Check imports.');
                return;
            }

            const hero = new Hero({ x: spawnX, y: spawnY });
            this.game.hero = hero;

            const gameRenderer = this._gameRenderer;
            if (gameRenderer && typeof gameRenderer.setHero === 'function') {
                gameRenderer.setHero(hero);
            }

            entityManager.add(hero);
            Logger.info(`[SpawnManager] Hero added. Total: ${entityManager.getAll().length}`);

            const savedGold = GameState.get('gold');
            if (savedGold !== undefined && savedGold !== null) {
                hero.inventory.gold = savedGold;
            }

            Logger.info('[SpawnManager] Hero spawned at home island');
        } catch (err) {
            Logger.error('[SpawnManager] Failed to spawn hero:', err);
        }
    }

    private spawnMerchants(): void {
        spawnMerchantsFn(this._islandManager, this.merchants);
    }

    getMerchantNearHero(hero: IEntity): Merchant | null {
        return getMerchantNearHeroFn(this._islandManager, this.merchants, hero);
    }

    // ============================================
    // ISLAND MANAGEMENT
    // ============================================

    initializeIsland(gridX: number, gridY: number): void {
        const island = IslandManager.getIslandByGrid(gridX, gridY);
        if (!island) return;

        const count = IslandUpgrades?.getResourceSlots?.(gridX, gridY) || 1;
        Logger.info(
            `[SpawnManager] Initializing ${island.name} (${island.category}), count: ${count}`
        );

        if (this.resourceSpawner) {
            if (island.category === 'resource') {
                this.resourceSpawner.spawnResourcesGridOnIsland(island, count);
            } else if (island.category === 'dinosaur') {
                this.resourceSpawner.spawnDinosaursOnIsland(island, count);
            }
        }

        Logger.info(`[SpawnManager] Initialized unlocked island: ${island.name}`);
    }

    refreshIslandResources(gridX: number, gridY: number): void {
        refreshIslandResourcesFn(gridX, gridY, this.resourceSpawner);
    }

    updateIslandRespawnTimers(gridX: number, gridY: number): void {
        updateIslandRespawnTimersFn(gridX, gridY);
    }

    // ============================================
    // DELEGATION METHODS (Public API for legacy code)
    // ============================================

    spawnDrop(x: number, y: number, resourceType: string, amount: number = 1): void {
        if (this.dropSpawner) {
            this.dropSpawner.spawnDrop(x, y, resourceType, amount);
        }
    }

    spawnCraftedItem(x: number, y: number, type: string, options: Record<string, unknown> = {}): void {
        if (this.dropSpawner) {
            this.dropSpawner.spawnCraftedItem(x, y, type, options);
        }
    }

    spawnEnemyGroup(
        biomeId: string,
        x: number,
        y: number,
        enemyId: string,
        count: number,
        options: Record<string, unknown> = {}
    ): IEntity[] {
        if (this.enemySpawner) {
            return this.enemySpawner.spawnEnemyGroup(biomeId, x, y, enemyId, count, options);
        }
        return [];
    }

    populateBiome(biomeId: string, bounds: { x: number; y: number; width: number; height: number }, options: Record<string, unknown> = {}): number {
        if (this.enemySpawner) {
            return this.enemySpawner.populateBiome(biomeId, bounds, options);
        }
        return 0;
    }

    spawnBiomeBoss(biomeId: string, x: number, y: number): IEntity | null {
        if (this.enemySpawner) {
            return this.enemySpawner.spawnBiomeBoss(biomeId, x, y);
        }
        return null;
    }

    getEnemiesInBiome(biomeId: string): IEntity[] {
        if (this.enemySpawner) {
            return this.enemySpawner.getEnemiesInBiome(biomeId);
        }
        return [];
    }

    clearBiomeEnemies(biomeId: string): void {
        if (this.enemySpawner) {
            this.enemySpawner.clearBiomeEnemies(biomeId);
        }
    }

    spawnProps(): void {
        if (this.propSpawner) {
            this.propSpawner.spawnProps();
        }
    }

    isOnBridgeVisual(x: number, y: number, padding: number = GameConstants.World.BRIDGE_VISUAL_PADDING): boolean {
        if (this.propSpawner) {
            return this.propSpawner.isOnBridgeVisual(x, y, padding);
        }
        return false;
    }
}

// Create singleton instance
const spawnManager = new SpawnManagerService();
if (Registry) Registry.register('SpawnManager', spawnManager);

// ES6 Module Export
export { SpawnManagerService, spawnManager };
