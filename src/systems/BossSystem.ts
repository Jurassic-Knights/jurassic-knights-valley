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

import { Logger } from '@core/Logger';
import { EventBus } from '@core/EventBus';
import { GameConstants, getConfig } from '@data/GameConstants';
import { entityManager } from '@core/EntityManager';
import { Registry } from '@core/Registry';
import { EntityRegistry } from '@entities/EntityLoader';
import { BiomeConfig } from '@data/BiomeConfig';
import { EntityTypes } from '@config/EntityTypes';
import { Boss } from '../gameplay/Boss';
import type { IGame, IEntity } from '../types/core';

class BossSystem {
    game: IGame | null = null;
    bosses: Map<string, Boss> = new Map();
    respawnTimers: Map<string, number> = new Map();

    constructor() {
        Logger.info('[BossSystem] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        this.initListeners();

        const delay = GameConstants.Timing.BOSS_SPAWN_DELAY_MS;
        setTimeout(() => {
            this.spawnAllBosses();
        }, delay);

        Logger.info('[BossSystem] Initialized');
    }

    initListeners() {
        if (EventBus && GameConstants?.Events) {
            // Listen for enemy death to track boss deaths
            EventBus.on('ENEMY_DIED', (data: { entity: IEntity }) => this.onEnemyDied(data));

            // Listen for biome entry to spawn bosses
            EventBus.on(GameConstants.Events.BIOME_ENTERED, (data: { biomeId: string }) =>
                this.onBiomeEntered(data)
            );
        }
    }

    /**
     * Spawn boss for a biome
     * @param {string} biomeId
     */
    spawnBoss(biomeId: string) {
        // Check if already spawned or respawning
        if (this.bosses.has(biomeId) || this.respawnTimers.has(biomeId)) {
            return null;
        }

        // Get biome config
        const biome = (BiomeConfig?.types as Record<string, { bossId?: string; bossSpawn?: { x: number; y: number }; bounds?: { x: number; y: number; width: number; height: number }; [key: string]: unknown }>)?.[biomeId];
        if (!biome?.bossId) {
            Logger.info(`[BossSystem] No boss configured for biome: ${biomeId}`);
            return null;
        }

        // Get boss type config
        const bossConfig = EntityRegistry.bosses?.[biome.bossId];
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
            level: biome.levelRange?.max ?? GameConstants.Boss.DEFAULT_LEVEL
        });

        // Register with EntityManager
        if (entityManager) {
            entityManager.add(boss);
        }

        // Track
        this.bosses.set(biomeId, boss);

        // Emit spawn event
        if (EventBus && GameConstants?.Events) {
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
    getBossSpawnPosition(biomeId: string) {
        // Try to get from biome config
        const biome = (BiomeConfig?.types as Record<string, { bossSpawn?: { x: number; y: number }; bounds?: { x: number; y: number; width: number; height: number }; [key: string]: unknown }>)?.[biomeId];
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

        const offsetX = GameConstants.World.IRONHAVEN_OFFSET_X;
        const offsetY = GameConstants.World.IRONHAVEN_OFFSET_Y;
        const offsets = GameConstants?.Boss?.SPAWN_OFFSETS;
        const g = offsets?.grasslands ?? { x: 5500, y: 3000 };
        const t = offsets?.tundra ?? { x: 3000, y: 5500 };
        const d = offsets?.desert ?? { x: 5500, y: 5500 };
        const b = offsets?.badlands ?? { x: 3000, y: 3000 };
        const def = offsets?.default ?? { x: 3500, y: 3500 };
        const defaults: Record<string, { x: number; y: number }> = {
            grasslands: { x: offsetX + g.x, y: offsetY + g.y },
            tundra: { x: offsetX + t.x, y: offsetY + t.y },
            desert: { x: offsetX + d.x, y: offsetY + d.y },
            badlands: { x: offsetX + b.x, y: offsetY + b.y }
        };
        return defaults[biomeId] ?? { x: offsetX + def.x, y: offsetY + def.y };
    }

    /**
     * Handle enemy death - track boss deaths
     */
    onEnemyDied(data: { entity: IEntity; enemy?: IEntity & { isBoss?: boolean; biomeId?: string; respawnTime?: number; bossName?: string } }) {
        const enemy = data.enemy || data.entity;
        if (!enemy?.isBoss) return;

        const biomeId = enemy.biomeId;
        if (!biomeId) return;

        // Remove from active bosses
        this.bosses.delete(biomeId);

        const msPerSecond = GameConstants.Timing.MS_PER_SECOND;
        const respawnTime = enemy.respawnTime * msPerSecond;
        this.respawnTimers.set(biomeId, respawnTime);

        Logger.info(`[BossSystem] ${enemy.bossName} killed. Respawning in ${enemy.respawnTime}s`);
    }

    /**
     * Handle biome entry - spawn boss if not already spawned
     */
    onBiomeEntered(data: { biomeId: string }) {
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
    update(dt: number) {
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
    isBossAlive(biomeId: string) {
        const boss = this.bosses.get(biomeId);
        return boss && !boss.isDead && boss.active;
    }

    /**
     * Get active boss for biome
     * @param {string} biomeId
     * @returns {Boss|null}
     */
    getBoss(biomeId: string) {
        return this.bosses.get(biomeId) || null;
    }

    /**
     * Get time until boss respawn (in seconds)
     * @param {string} biomeId
     * @returns {number}
     */
    getRespawnTime(biomeId: string) {
        const timer = this.respawnTimers.get(biomeId);
        const ms = GameConstants.Timing.MS_PER_SECOND;
        return timer ? Math.ceil(timer / ms) : 0;
    }

    /**
     * Spawn all bosses for testing/initial load
     */
    spawnAllBosses() {
        const biomes = BiomeConfig?.types;
        if (!biomes) return;

        for (const biomeId of Object.keys(biomes)) {
            if ((biomes as Record<string, { bossId?: string; [key: string]: unknown }>)[biomeId]?.bossId) {
                this.spawnBoss(biomeId);
            }
        }
    }
}

// Create singleton and export
const bossSystem = new BossSystem();
if (Registry) Registry.register('BossSystem', bossSystem);

export { BossSystem, bossSystem };
