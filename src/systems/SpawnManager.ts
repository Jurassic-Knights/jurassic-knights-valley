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
import { GameConstants, getConfig } from '@data/GameConstants';
import { entityManager } from '@core/EntityManager';
import { GameState } from '@core/State';
import { IslandManager } from '../world/IslandManager';
import { IGame, IEntity } from '../types/core';
import { Island, IIslandManager, Bridge } from '../types/world';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { Hero } from '../gameplay/Hero';
import { Registry } from '@core/Registry';
import { GameRenderer } from '@core/GameRenderer';
import { PropSpawner } from './spawners/PropSpawner';
import { ResourceSpawner } from './spawners/ResourceSpawner';
import { EnemySpawner } from './spawners/EnemySpawner';
import { DropSpawner } from './spawners/DropSpawner';
import { Merchant } from '../gameplay/Merchant';
import { PropConfig } from '@data/PropConfig';

// Unmapped modules - need manual import

class SpawnManagerService {
    private game: IGame | null = null;
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

    /**
     * Initialize with game reference
     */
    init(game: IGame): void {
        this.game = game;

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
            const islandManager = Registry.get<IIslandManager>('IslandManager');

            if (islandManager) {
                const spawn = islandManager.getHeroSpawnPosition();
                spawnX = spawn.x;
                spawnY = spawn.y;
            } else {
                Logger.warn('[SpawnManager] IslandManager not found, using fallback spawn');
                const gameRenderer = Registry.get('GameRenderer') as typeof GameRenderer;
                const w = gameRenderer ? gameRenderer.worldWidth : 2000;
                const h = gameRenderer ? gameRenderer.worldHeight : 2000;
                spawnX = w / 2;
                spawnY = h / 2;
            }

            // Check if Hero class is available
            if (typeof Hero === 'undefined') {
                Logger.error('[SpawnManager] Hero class not found! Check imports.');
                return;
            }

            const hero = new Hero({ x: spawnX, y: spawnY });
            this.game.hero = hero;

            const gameRenderer = Registry.get('GameRenderer') as typeof GameRenderer;
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

    // ============================================
    // MERCHANT SPAWNING
    // ============================================

    private spawnMerchants(): void {
        this.merchants = [];

        const islandManager = Registry.get<IIslandManager>('IslandManager');
        if (!islandManager) return;

        const bridges = islandManager.getBridges();

        for (const island of islandManager.islands) {
            if (island.type === 'home') continue;

            const bounds = islandManager.getPlayableBounds(island);
            if (!bounds) continue;

            const entryBridge = bridges.find(
                (b: Bridge) => b.to.col === island.gridX && b.to.row === island.gridY
            );

            const config = getConfig().Spawning;
            // Config is now typed with DEFAULT_OFFSET
            const offsetX = PropConfig?.MERCHANT?.DEFAULT_OFFSET || config.MERCHANT.DEFAULT_OFFSET;
            const offsetY = PropConfig?.MERCHANT?.DEFAULT_OFFSET || config.MERCHANT.DEFAULT_OFFSET;

            let finalX = bounds.x + offsetX;
            let finalY = bounds.y + offsetY;
            const padding = PropConfig?.MERCHANT?.PADDING || config.MERCHANT.PADDING;

            if (entryBridge) {
                if (entryBridge.type === 'horizontal') {
                    finalX = bounds.left + padding;
                    const bridgeCenterY = entryBridge.y + entryBridge.height / 2;
                    finalY = (bridgeCenterY + bounds.top) / 2;
                } else {
                    const bridgeCenterX = entryBridge.x + entryBridge.width / 2;
                    finalX = (bridgeCenterX + bounds.left) / 2;
                    finalY = bounds.top + padding;
                }
            }

            const merchant = new Merchant({
                x: finalX,
                y: finalY,
                islandId: `${island.gridX}_${island.gridY}`,
                islandName: island.name
            });

            this.merchants.push(merchant);
            entityManager.add(merchant);
        }

        Logger.info(`[SpawnManager] Spawned ${this.merchants.length} merchants`);
    }

    getMerchantNearHero(hero: IEntity): Merchant | null {
        if (!hero) return null;

        for (const merchant of this.merchants) {
            if (merchant.isInRange(hero)) {
                const [gridX, gridY] = merchant.islandId.split('_').map(Number);
                const islandManager = Registry.get<IIslandManager>('IslandManager');
                const island = islandManager ? islandManager.getIslandByGrid(gridX, gridY) : null;
                if (island && island.unlocked) {
                    return merchant;
                }
            }
        }
        return null;
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
        const island = IslandManager.getIslandByGrid(gridX, gridY);
        if (!island) return;

        const targetCount = IslandUpgrades?.getResourceSlots?.(gridX, gridY) || 1;

        interface IWorldEntity extends IEntity {
            islandGridX?: number;
            islandGridY?: number;
            active: boolean;
            recalculateRespawnTimer?(): void;
        }

        if (island.category === 'dinosaur') {
            // TODO: Strictly type Dinosaur entity
            const allDinos = entityManager.getByType('Dinosaur');
            const currentCount = allDinos.filter(
                (d: IWorldEntity) => d.islandGridX === gridX && d.islandGridY === gridY
            ).length;
            const needed = targetCount - currentCount;

            if (needed > 0 && this.resourceSpawner) {
                this.resourceSpawner.spawnDinosaursOnIsland(island, needed);
            }
            return;
        }

        const allResources = entityManager.getByType('Resource');
        const currentResources = allResources.filter(
            (res: IWorldEntity) => res.islandGridX === gridX && res.islandGridY === gridY
        );
        const currentCount = currentResources.length;

        if (targetCount > currentCount && this.resourceSpawner) {
            this.resourceSpawner.spawnResourcesGridOnIsland(island, targetCount, currentCount);
        } else if (targetCount < currentCount) {
            let toRemove = currentCount - targetCount;
            for (let i = currentResources.length - 1; i >= 0; i--) {
                const res = currentResources[i];
                res.active = false;
                entityManager.remove(res);
                toRemove--;
                if (toRemove <= 0) break;
            }
        }
    }

    updateIslandRespawnTimers(gridX: number, gridY: number): void {
        const resources = entityManager.getByType('Resource');
        for (const res of resources) {
            if (res.islandGridX === gridX && res.islandGridY === gridY) {
                if (typeof res.recalculateRespawnTimer === 'function') {
                    res.recalculateRespawnTimer();
                }
            }
        }

        const dinosaurs = entityManager.getByType('Dinosaur');
        for (const dino of dinosaurs) {
            if (dino.islandGridX === gridX && dino.islandGridY === gridY) {
                if (typeof dino.recalculateRespawnTimer === 'function') {
                    dino.recalculateRespawnTimer();
                }
            }
        }

        Logger.info(`[SpawnManager] Updated respawn timers for island ${gridX},${gridY}`);
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

    isOnBridgeVisual(x: number, y: number, padding: number = 100): boolean {
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
