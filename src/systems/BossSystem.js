/**
 * BossSystem
 * Manages boss spawning, respawn timers, and encounter tracking.
 *
 * Features:
 * - One boss per biome
 * - Respawn on timer after death
 * - Spawn on biome entry or game start
 *
 * Work Package: 09-boss-system.md
 */
class BossSystem {
    constructor() {
        this.game = null;
        this.bosses = new Map(); // biomeId -> Boss instance
        this.respawnTimers = new Map(); // biomeId -> remaining time (ms)

        Logger.info('[BossSystem] Constructed');
    }

    init(game) {
        this.game = game;
        this.initListeners();

        // Spawn all bosses on game start (delayed to ensure other systems ready)
        setTimeout(() => {
            this.spawnAllBosses();
        }, 1000);

        Logger.info('[BossSystem] Initialized');
    }

    initListeners() {
        if (window.EventBus && window.GameConstants?.Events) {
            // Listen for enemy death to track boss deaths
            EventBus.on('ENEMY_DIED', (data) => this.onEnemyDied(data));

            // Listen for biome entry to spawn bosses
            EventBus.on(GameConstants.Events.BIOME_ENTERED, (data) => this.onBiomeEntered(data));
        }
    }

    /**
     * Spawn boss for a biome
     * @param {string} biomeId
     */
    spawnBoss(biomeId) {
        // Check if already spawned or respawning
        if (this.bosses.has(biomeId) || this.respawnTimers.has(biomeId)) {
            return null;
        }

        // Get biome config
        const biome = window.BiomeConfig?.types?.[biomeId];
        if (!biome?.bossId) {
            Logger.info(`[BossSystem] No boss configured for biome: ${biomeId}`);
            return null;
        }

        // Get boss type config
        const bossConfig = window.EntityConfig?.boss?.types?.[biome.bossId];
        if (!bossConfig) {
            Logger.info(`[BossSystem] Boss type not found: ${biome.bossId}`);
            return null;
        }

        // Get spawn position
        const spawnPos = this.getBossSpawnPosition(biomeId);

        // Create boss
        const boss = new Boss({
            x: spawnPos.x,
            y: spawnPos.y,
            bossType: biome.bossId,
            biomeId: biomeId,
            level: biome.levelRange?.max || 10
        });

        // Register with EntityManager
        if (window.EntityManager) {
            EntityManager.add(boss);
        }

        // Track
        this.bosses.set(biomeId, boss);

        // Emit spawn event
        if (window.EventBus && window.GameConstants?.Events) {
            EventBus.emit(GameConstants.Events.BOSS_SPAWNED, {
                boss,
                biomeId,
                bossType: biome.bossId
            });
        }

        Logger.info(`[BossSystem] Spawned ${boss.bossName} in ${biomeId}`);
        return boss;
    }

    /**
     * Get spawn position for boss
     * @param {string} biomeId
     * @returns {{x: number, y: number}}
     */
    getBossSpawnPosition(biomeId) {
        // Try to get from biome config
        const biome = window.BiomeConfig?.types?.[biomeId];
        if (biome?.bossSpawn) {
            return biome.bossSpawn;
        }

        // Try to calculate from biome bounds
        if (biome?.bounds) {
            return {
                x: biome.bounds.x + biome.bounds.width / 2,
                y: biome.bounds.y + biome.bounds.height / 2
            };
        }

        // Fallback to positions within Ironhaven (island grid area)
        // Ironhaven is at offset (10000, 10000), islands ~2048 to 5120 inside that
        const offsetX = window.GameConstants?.World?.IRONHAVEN_OFFSET_X || 10000;
        const offsetY = window.GameConstants?.World?.IRONHAVEN_OFFSET_Y || 10000;

        const defaults = {
            grasslands: { x: offsetX + 5500, y: offsetY + 3000 }, // Near east edge of Ironhaven
            tundra: { x: offsetX + 3000, y: offsetY + 5500 }, // Near south edge of Ironhaven
            desert: { x: offsetX + 5500, y: offsetY + 5500 }, // Southeast of Ironhaven
            lava_crags: { x: offsetX + 3000, y: offsetY + 3000 } // Center of Ironhaven (for testing)
        };

        return defaults[biomeId] || { x: offsetX + 3500, y: offsetY + 3500 };
    }

    /**
     * Handle enemy death - track boss deaths
     */
    onEnemyDied(data) {
        const { enemy } = data;
        if (!enemy?.isBoss) return;

        const biomeId = enemy.biomeId;
        if (!biomeId) return;

        // Remove from active bosses
        this.bosses.delete(biomeId);

        // Start respawn timer
        const respawnTime = enemy.respawnTime * 1000; // Convert to ms
        this.respawnTimers.set(biomeId, respawnTime);

        Logger.info(`[BossSystem] ${enemy.bossName} killed. Respawning in ${enemy.respawnTime}s`);
    }

    /**
     * Handle biome entry - spawn boss if not already spawned
     */
    onBiomeEntered(data) {
        const { biomeId } = data;
        if (!biomeId) return;

        // Spawn boss if not already active or respawning
        if (!this.bosses.has(biomeId) && !this.respawnTimers.has(biomeId)) {
            this.spawnBoss(biomeId);
        }
    }

    /**
     * Update respawn timers
     * @param {number} dt - Delta time in milliseconds
     */
    update(dt) {
        // Update respawn timers
        for (const [biomeId, timer] of this.respawnTimers.entries()) {
            const newTimer = timer - dt;

            if (newTimer <= 0) {
                this.respawnTimers.delete(biomeId);
                this.spawnBoss(biomeId);
            } else {
                this.respawnTimers.set(biomeId, newTimer);
            }
        }
    }

    /**
     * Check if boss is alive in biome
     * @param {string} biomeId
     * @returns {boolean}
     */
    isBossAlive(biomeId) {
        const boss = this.bosses.get(biomeId);
        return boss && !boss.isDead && boss.active;
    }

    /**
     * Get active boss for biome
     * @param {string} biomeId
     * @returns {Boss|null}
     */
    getBoss(biomeId) {
        return this.bosses.get(biomeId) || null;
    }

    /**
     * Get time until boss respawn (in seconds)
     * @param {string} biomeId
     * @returns {number}
     */
    getRespawnTime(biomeId) {
        const timer = this.respawnTimers.get(biomeId);
        return timer ? Math.ceil(timer / 1000) : 0;
    }

    /**
     * Spawn all bosses for testing/initial load
     */
    spawnAllBosses() {
        const biomes = window.BiomeConfig?.types;
        if (!biomes) return;

        for (const biomeId of Object.keys(biomes)) {
            if (biomes[biomeId].bossId) {
                this.spawnBoss(biomeId);
            }
        }
    }
}

// Create singleton instance
window.BossSystem = new BossSystem();
if (window.Registry) Registry.register('BossSystem', window.BossSystem);

