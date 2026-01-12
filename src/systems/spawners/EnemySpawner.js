/**
 * EnemySpawner - Handles enemy spawning in open world biomes
 * 
 * Extracted from SpawnManager.js for modularity.
 * Manages enemy groups, biome population, and bosses.
 * 
 * Owner: Combat System
 */

class EnemySpawner {
    constructor(spawnManager) {
        this.spawnManager = spawnManager;
    }

    /**
     * Spawn test enemies near home island for debugging
     */
    spawnTestEnemies() {
        if (!window.Enemy || !window.BiomeConfig) {
            console.log('[EnemySpawner] Enemy system not loaded, skipping test spawn');
            return;
        }

        const islandManager = this.spawnManager.game?.getSystem('IslandManager');
        if (!islandManager) return;

        const home = islandManager.getHomeIsland();
        if (!home) return;

        const testX = home.worldX + home.width / 2;
        const testY = home.worldY - 200;

        this.spawnEnemyGroup('grasslands', testX, testY, 'enemy_raptor', 3);
        console.log('[EnemySpawner] Spawned test enemies north of home island');
    }

    /**
     * Spawn a group of enemies at a location
     */
    spawnEnemyGroup(biomeId, x, y, enemyId, count, options = {}) {
        if (!window.Enemy) {
            console.warn('[EnemySpawner] Enemy class not found');
            return [];
        }

        const groupId = options.groupId ||
            `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const waveId = options.waveId || groupId;
        const spacing = window.GameConstants?.Biome?.GROUP_SPACING || 50;

        const enemies = [];

        for (let i = 0; i < count; i++) {
            const offsetX = (Math.random() - 0.5) * spacing * 2;
            const offsetY = (Math.random() - 0.5) * spacing * 2;

            const enemy = new Enemy({
                x: x + offsetX,
                y: y + offsetY,
                enemyType: enemyId,
                biomeId: biomeId,
                groupId: groupId,
                waveId: waveId,
                level: options.level || this.getEnemyLevelForBiome(biomeId),
                forceNormal: options.forceNormal || false
            });

            if (window.EntityManager) {
                EntityManager.add(enemy);
            }

            enemies.push(enemy);
        }

        console.log(`[EnemySpawner] Spawned ${count} ${enemyId} in ${biomeId} (group: ${groupId})`);
        return enemies;
    }

    /**
     * Get appropriate enemy level for a biome
     */
    getEnemyLevelForBiome(biomeId) {
        const biome = window.BiomeConfig?.types?.[biomeId];
        if (!biome || !biome.levelRange) return 1;

        const { min, max } = biome.levelRange;
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    /**
     * Populate a biome area with enemy groups based on spawn table
     */
    populateBiome(biomeId, bounds, options = {}) {
        if (!window.Enemy || !window.BiomeConfig?.types?.[biomeId]) {
            console.warn(`[EnemySpawner] Cannot populate biome: ${biomeId}`);
            return;
        }

        const biome = BiomeConfig.types[biomeId];
        const spawnTable = biome.enemySpawnTable;

        if (!spawnTable || spawnTable.length === 0) {
            console.log(`[EnemySpawner] No spawn table for biome: ${biomeId}`);
            return;
        }

        const padding = 100;
        let totalSpawned = 0;

        for (const spawn of spawnTable) {
            const groupCount = Math.max(1, Math.floor(spawn.weight / 20));

            for (let g = 0; g < groupCount; g++) {
                const x = bounds.x + padding + Math.random() * (bounds.width - padding * 2);
                const y = bounds.y + padding + Math.random() * (bounds.height - padding * 2);

                const sizeRange = spawn.groupSize || { min: 1, max: 1 };
                const size = sizeRange.min +
                    Math.floor(Math.random() * (sizeRange.max - sizeRange.min + 1));

                const enemies = this.spawnEnemyGroup(biomeId, x, y, spawn.enemyId, size, {
                    waveId: options.waveId || `wave_${biomeId}_${g}`
                });

                totalSpawned += enemies.length;
            }
        }

        console.log(`[EnemySpawner] Populated ${biomeId} with ${totalSpawned} enemies`);
        return totalSpawned;
    }

    /**
     * Spawn boss enemy for a biome
     */
    spawnBiomeBoss(biomeId, x, y) {
        const biome = window.BiomeConfig?.types?.[biomeId];
        if (!biome || !biome.bossId) {
            console.warn(`[EnemySpawner] No boss configured for biome: ${biomeId}`);
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
            boss.respawnTime = biome.bossRespawnTime ||
                window.GameConstants?.Biome?.BOSS_RESPAWN_DEFAULT || 300;
            console.log(`[EnemySpawner] Spawned boss ${biome.bossId} for ${biomeId}`);
            return boss;
        }
        return null;
    }

    /**
     * Get all enemies in a specific biome
     */
    getEnemiesInBiome(biomeId) {
        if (!window.EntityManager) return [];

        const enemies = [
            ...EntityManager.getByType(EntityTypes.ENEMY_DINOSAUR),
            ...EntityManager.getByType(EntityTypes.ENEMY_SOLDIER)
        ];

        return enemies.filter(e => e.biomeId === biomeId && !e.isDead);
    }

    /**
     * Despawn all enemies in a biome
     */
    clearBiomeEnemies(biomeId) {
        const enemies = this.getEnemiesInBiome(biomeId);

        for (const enemy of enemies) {
            enemy.active = false;
            if (window.EntityManager) {
                EntityManager.remove(enemy);
            }
        }

        console.log(`[EnemySpawner] Cleared ${enemies.length} enemies from ${biomeId}`);
    }
}

window.EnemySpawner = EnemySpawner;
