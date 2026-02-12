/**
 * EnemySpawner - Handles enemy spawning in open world biomes
 *
 * Extracted from SpawnManager.js for modularity.
 * Manages enemy groups, biome population, and bosses.
 *
 * Owner: Combat System
 */

import { Logger } from '@core/Logger';
import { entityManager } from '@core/EntityManager';
import { GameConstants } from '@data/GameConstants';
import { BiomeConfig } from '@data/BiomeConfig';
import { EntityTypes } from '@config/EntityTypes';
import { Enemy } from '../../gameplay/EnemyCore';
import { IslandManagerService } from '../../world/IslandManager';
import { SpawnManagerService } from '../SpawnManager';

interface SpawnOptions {
    groupId?: string;
    waveId?: string;
    level?: number;
    forceNormal?: boolean;
}

interface BiomeOptions {
    waveId?: string;
}

class EnemySpawner {
    private spawnManager: SpawnManagerService;

    constructor(spawnManager: SpawnManagerService) {
        this.spawnManager = spawnManager;
    }

    /**
     * Spawn test enemies near home island for debugging
     */
    spawnTestEnemies() {
        if (!Enemy || !BiomeConfig) {
            Logger.info('[EnemySpawner] Enemy system not loaded, skipping test spawn');
            return;
        }

        const islandManager = this.spawnManager.getIslandManager();
        if (!islandManager) return;

        const home = islandManager.getHomeIsland();
        if (!home) return;

        const testX = home.worldX + home.width / 2;
        const offsetNorth = GameConstants.Spawning.ENEMY_TEST_OFFSET_NORTH;
        const testY = home.worldY - offsetNorth;

        this.spawnEnemyGroup('grasslands', testX, testY, 'enemy_dinosaur_t1_01', 3);
        Logger.info('[EnemySpawner] Spawned test enemies north of home island');
    }

    /**
     * Spawn a group of enemies at a location
     */
    spawnEnemyGroup(biomeId: string, x: number, y: number, enemyId: string, count: number, options: SpawnOptions = {}) {
        if (!Enemy) {
            Logger.warn('[EnemySpawner] Enemy class not found');
            return [];
        }

        // Inline loot definitions matching entity JSON files
        const enemyLoot: Record<string, { item: string; chance: number; amount: number | number[] }[]> = {
            // Dinosaurs - drop food and bone
            enemy_dinosaur_t1_01: [
                { item: 'food_t1_02', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.15, amount: [1, 1] }
            ],
            enemy_dinosaur_t1_02: [
                { item: 'food_t1_02', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.15, amount: [1, 1] }
            ],
            enemy_dinosaur_t1_03: [
                { item: 'food_t1_02', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.15, amount: [1, 1] }
            ],
            enemy_dinosaur_t1_04: [
                { item: 'food_t1_02', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.15, amount: [1, 1] }
            ],
            enemy_dinosaur_t2_01: [
                { item: 'food_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.2, amount: [1, 1] }
            ],
            enemy_dinosaur_t2_03: [
                { item: 'food_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.2, amount: [1, 1] }
            ],
            enemy_dinosaur_t2_04: [
                { item: 'food_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.2, amount: [1, 1] }
            ],
            enemy_dinosaur_t2_05: [
                { item: 'food_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.2, amount: [1, 1] }
            ],
            enemy_dinosaur_t3_01: [
                { item: 'food_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.25, amount: [1, 2] }
            ],
            enemy_dinosaur_t3_03: [
                { item: 'food_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.25, amount: [1, 2] }
            ],
            enemy_dinosaur_t3_04: [
                { item: 'food_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.25, amount: [1, 2] }
            ],
            // Humans - drop salvage and food
            enemy_human_t1_01: [
                { item: 'salvage_t1_01', chance: 0.6, amount: [1, 1] },
                { item: 'food_t1_03', chance: 0.4, amount: [1, 1] }
            ],
            enemy_human_t1_02: [
                { item: 'salvage_t1_01', chance: 0.6, amount: [1, 1] },
                { item: 'food_t1_03', chance: 0.4, amount: [1, 1] }
            ],
            enemy_human_t1_03: [
                { item: 'salvage_t1_01', chance: 0.6, amount: [1, 1] },
                { item: 'food_t1_03', chance: 0.4, amount: [1, 1] }
            ],
            enemy_human_t2_01: [
                { item: 'salvage_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'food_t2_01', chance: 0.4, amount: [1, 1] }
            ],
            enemy_human_t2_02: [
                { item: 'salvage_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'food_t2_01', chance: 0.4, amount: [1, 1] }
            ],
            enemy_human_t2_03: [
                { item: 'salvage_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'food_t2_01', chance: 0.4, amount: [1, 1] }
            ],
            enemy_human_t3_01: [
                { item: 'salvage_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'food_t3_01', chance: 0.5, amount: [1, 2] }
            ],
            enemy_human_t3_02: [
                { item: 'salvage_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'food_t3_01', chance: 0.5, amount: [1, 2] }
            ],
            enemy_human_t3_03: [
                { item: 'salvage_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'food_t3_01', chance: 0.5, amount: [1, 2] }
            ],
            // Saurians - drop metal and bone
            enemy_saurian_t1_01: [
                { item: 'metal_t1_01', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.3, amount: [1, 1] }
            ],
            enemy_saurian_t1_02: [
                { item: 'metal_t1_01', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.3, amount: [1, 1] }
            ],
            enemy_saurian_t1_03: [
                { item: 'metal_t1_01', chance: 0.6, amount: [1, 1] },
                { item: 'bone_t1_01', chance: 0.3, amount: [1, 1] }
            ],
            enemy_saurian_t2_01: [
                { item: 'metal_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.35, amount: [1, 1] }
            ],
            enemy_saurian_t2_02: [
                { item: 'metal_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.35, amount: [1, 1] }
            ],
            enemy_saurian_t2_03: [
                { item: 'metal_t2_01', chance: 0.7, amount: [1, 2] },
                { item: 'bone_t2_01', chance: 0.35, amount: [1, 1] }
            ],
            enemy_saurian_t3_01: [
                { item: 'metal_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.4, amount: [1, 2] }
            ],
            enemy_saurian_t3_02: [
                { item: 'metal_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.4, amount: [1, 2] }
            ],
            enemy_saurian_t3_03: [
                { item: 'metal_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.4, amount: [1, 2] }
            ],
            enemy_saurian_t3_04: [
                { item: 'metal_t3_01', chance: 0.8, amount: [1, 2] },
                { item: 'bone_t3_01', chance: 0.4, amount: [1, 2] }
            ]
        };

        const groupId =
            options.groupId || `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const waveId = options.waveId || groupId;
        const spacing = BiomeConfig.Biome?.GROUP_SPACING ?? GameConstants.Biome.GROUP_SPACING;

        const enemies: Enemy[] = [];

        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * spacing * 2;
            const offsetY = (Math.random() - 0.5) * spacing * 2;

            const enemy = new Enemy({
                x: x + offsetX,
                y: y + offsetY,
                enemyType: enemyId,
                lootTable: enemyLoot[enemyId] || enemyLoot['enemy_dinosaur_t1_01'],
                biomeId: biomeId,
                groupId: groupId,
                waveId: waveId,
                level: options.level || this.getEnemyLevelForBiome(biomeId),
                forceNormal: options.forceNormal || false
            });

            if (entityManager) {
                entityManager.add(enemy);
            }

            enemies.push(enemy);
        }

        Logger.info(`[EnemySpawner] Spawned ${count} ${enemyId} in ${biomeId} (group: ${groupId})`);
        return enemies;
    }

    /** Get appropriate enemy level for a biome */
    getEnemyLevelForBiome(biomeId: string) {
        const biome = BiomeConfig.types?.[biomeId as keyof typeof BiomeConfig.types];
        if (!biome || !biome.levelRange) return 1;

        const { min, max } = biome.levelRange;
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /** Populate a biome area with enemy groups based on spawn table */
    populateBiome(biomeId: string, bounds: { x: number; y: number; width: number; height: number }, options: BiomeOptions = {}) {
        if (!Enemy || !BiomeConfig.types?.[biomeId as keyof typeof BiomeConfig.types]) {
            Logger.warn(`[EnemySpawner] Cannot populate biome: ${biomeId}`);
            return;
        }

        const biome = BiomeConfig.types[biomeId as keyof typeof BiomeConfig.types];
        const spawnTable = biome.enemySpawnTable;

        if (!spawnTable || spawnTable.length === 0) {
            Logger.info(`[EnemySpawner] No spawn table for biome: ${biomeId}`);
            return;
        }

        const padding = GameConstants.Spawning.BIOME_POPULATE_PADDING;
        let totalSpawned = 0;
        const weightDivisor = GameConstants.Spawning.BIOME_GROUP_WEIGHT_DIVISOR;

        for (const spawn of spawnTable) {
            const groupCount = Math.max(1, Math.floor(spawn.weight / weightDivisor));

            for (let g = 0; g < groupCount; g++) {
                const x = bounds.x + padding + Math.random() * (bounds.width - padding * 2);
                const y = bounds.y + padding + Math.random() * (bounds.height - padding * 2);

                const sizeRange = spawn.groupSize || { min: 1, max: 1 };
                const size =
                    sizeRange.min + Math.floor(Math.random() * (sizeRange.max - sizeRange.min + 1));

                const enemies = this.spawnEnemyGroup(biomeId, x, y, spawn.enemyId, size, {
                    waveId: options.waveId || `wave_${biomeId}_${g}`
                });

                totalSpawned += enemies.length;
            }
        }

        Logger.info(`[EnemySpawner] Populated ${biomeId} with ${totalSpawned} enemies`);
        return totalSpawned;
    }

    /** Spawn boss enemy for a biome */
    spawnBiomeBoss(biomeId: string, x: number, y: number) {
        const biome = BiomeConfig.types?.[biomeId as keyof typeof BiomeConfig.types];
        if (!biome || !biome.bossId) {
            Logger.warn(`[EnemySpawner] No boss configured for biome: ${biomeId}`);
            return null;
        }

        const bosses = this.spawnEnemyGroup(biomeId, x, y, biome.bossId, 1, {
            groupId: `boss_${biomeId}`,
            waveId: `boss_wave_${biomeId}`,
            forceNormal: false
        });

        if (bosses.length > 0) {
            const boss = bosses[0];
            boss.isBoss = true;
            boss.respawnTime =
                biome.bossRespawnTime || BiomeConfig.Biome?.BOSS_RESPAWN_DEFAULT || 300;
            Logger.info(`[EnemySpawner] Spawned boss ${biome.bossId} for ${biomeId}`);
            return boss;
        }
        return null;
    }

    /**
     * Get all enemies in a specific biome
     */
    getEnemiesInBiome(biomeId: string) {
        if (!entityManager) return [];

        const enemies = [
            ...entityManager.getByType(EntityTypes.ENEMY_DINOSAUR),
            ...entityManager.getByType(EntityTypes.ENEMY_SOLDIER)
        ];

        return enemies.filter((e) => e.biomeId === biomeId && !e.isDead);
    }

    /**
     * Despawn all enemies in a biome
     */
    clearBiomeEnemies(biomeId: string) {
        const enemies = this.getEnemiesInBiome(biomeId);

        for (const enemy of enemies) {
            enemy.active = false;
            if (entityManager) {
                entityManager.remove(enemy);
            }
        }

        Logger.info(`[EnemySpawner] Cleared ${enemies.length} enemies from ${biomeId}`);
    }
}

// ES6 Module Export
export { EnemySpawner };
