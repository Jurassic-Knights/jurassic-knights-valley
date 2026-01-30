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
import { IGame } from '../types/core';
import { IslandUpgrades } from '../gameplay/IslandUpgrades';
import { Hero } from '../gameplay/Hero';
import { Registry } from '@core/Registry';
import { PropSpawner } from './spawners/PropSpawner';
import { ResourceSpawner } from './spawners/ResourceSpawner';
import { EnemySpawner } from './spawners/EnemySpawner';
import { DropSpawner } from './spawners/DropSpawner';
import { Merchant } from '../gameplay/Merchant';
import { PropConfig } from '@data/PropConfig';

// Unmapped modules - need manual import

class SpawnManagerService {
    private game: IGame | null = null;
    private merchants: any[] = [];
    private propSpawner: any = null;
    private resourceSpawner: any = null;
    private enemySpawner: any = null;
    private dropSpawner: any = null;

    constructor() {
        Logger.info('[SpawnManager] Initialized Service');
    }

    /**
     * Initialize with game reference
     */
    init(game: any): void {
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
        EventBus.on(GameConstants.Events.ISLAND_UNLOCKED, (data: any) =>
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
            const islandManager = Registry.get('IslandManager');

            if (islandManager) {
                const spawn = islandManager.getHeroSpawnPosition();
                spawnX = spawn.x;
                spawnY = spawn.y;
            } else {
                Logger.warn('[SpawnManager] IslandManager not found, using fallback spawn');
                const gameRenderer = Registry.get('GameRenderer');
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

            const gameRenderer = Registry.get('GameRenderer');
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

        const islandManager = Registry.get('IslandManager');
        if (!islandManager) return;

        const bridges = islandManager.getBridges();

        for (const island of islandManager.islands) {
            if (island.type === 'home') continue;

            const bounds = islandManager.getPlayableBounds(island);
            if (!bounds) continue;

            const entryBridge = bridges.find(
                (b: any) => b.to.col === island.gridX && b.to.row === island.gridY
            );

            const config = getConfig().Spawning as any;
            let merchantX = bounds.x + (PropConfig?.MERCHANT?.DEFAULT_OFFSET || config.MERCHANT_OFFSET_X);
            let merchantY = bounds.y + (PropConfig?.MERCHANT?.DEFAULT_OFFSET || config.MERCHANT_OFFSET_Y);
            const padding = PropConfig?.MERCHANT?.PADDING || config.MERCHANT_PADDING;

            if (entryBridge) {
                if (entryBridge.type === 'horizontal') {
                    merchantX = bounds.left + padding;
                    const bridgeCenterY = entryBridge.y + entryBridge.height / 2;
                    merchantY = (bridgeCenterY + bounds.top) / 2;
                } else {
                    const bridgeCenterX = entryBridge.x + entryBridge.width / 2;
                    merchantX = (bridgeCenterX + bounds.left) / 2;
                    merchantY = bounds.top + padding;
                }
            }

            const merchant = new Merchant({
                x: merchantX,
                y: merchantY,
                islandId: `${island.gridX}_${island.gridY}`,
                islandName: island.name
            });

            this.merchants.push(merchant);
            entityManager.add(merchant);
        }

        Logger.info(`[SpawnManager] Spawned ${this.merchants.length} merchants`);
    }

    getMerchantNearHero(hero: any): any {
        if (!hero) return null;

        for (const merchant of this.merchants) {
            if (merchant.isInRange(hero)) {
                const [gridX, gridY] = merchant.islandId.split('_').map(Number);
                const islandManager = Registry.get('IslandManager');
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

        if (island.category === 'dinosaur') {
            const allDinos = entityManager.getByType('Dinosaur');
            const currentCount = allDinos.filter(
                (d: any) => d.islandGridX === gridX && d.islandGridY === gridY
            ).length;
            const needed = targetCount - currentCount;

            if (needed > 0 && this.resourceSpawner) {
                this.resourceSpawner.spawnDinosaursOnIsland(island, needed);
            }
            return;
        }

        const allResources = entityManager.getByType('Resource');
        const currentResources = allResources.filter(
            (res: any) => res.islandGridX === gridX && res.islandGridY === gridY
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

    spawnCraftedItem(x: number, y: number, type: string, options: any = {}): void {
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
        options: any = {}
    ): any[] {
        if (this.enemySpawner) {
            return this.enemySpawner.spawnEnemyGroup(biomeId, x, y, enemyId, count, options);
        }
        return [];
    }

    populateBiome(biomeId: string, bounds: any, options: any = {}): void {
        if (this.enemySpawner) {
            return this.enemySpawner.populateBiome(biomeId, bounds, options);
        }
    }

    spawnBiomeBoss(biomeId: string, x: number, y: number): any {
        if (this.enemySpawner) {
            return this.enemySpawner.spawnBiomeBoss(biomeId, x, y);
        }
        return null;
    }

    getEnemiesInBiome(biomeId: string): any[] {
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
