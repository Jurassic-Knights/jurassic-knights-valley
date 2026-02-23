/**
 * EnemyCoreConfig – Config merging, elite and biome multipliers for Enemy.
 */
import { EnemyConfig } from '@config/EnemyConfig';
import { EntityRegistry } from '@entities/EntityLoader';
import { GameConstants } from '@data/GameConstants';
import { BiomeConfig } from '@data/BiomeConfig';
import { EntityTypes } from '@config/EntityTypes';
import { SpeciesScaleConfig } from '@config/SpeciesScaleConfig';
import { getConfig } from '@data/GameConstants';
import type { EntityConfig } from '../types/core';

export interface EnemyConfigResult {
    finalConfig: EntityConfig;
    typeConfig: EntityConfig;
    isElite: boolean;
    entityType: string;
    sizeInfo: { width: number; height: number };
}

export function buildEnemyConfig(config: EntityConfig): EnemyConfigResult {
    const defaults = (EnemyConfig.defaults as Record<string, unknown>) || {};
    let typeConfig: EntityConfig = {};
    if (config.enemyType) {
        typeConfig = EntityRegistry.enemies?.[config.enemyType] || {};
    }

    const finalConfig = { ...defaults, ...typeConfig, ...config };

    const eliteChance =
        (EnemyConfig.eliteSpawnChance as number) ?? BiomeConfig.Biome?.ELITE_SPAWN_CHANCE ?? 0.05;
    const isElite = config.isElite || (!config.forceNormal && Math.random() < eliteChance);

    if (isElite) {
        const mult = (EnemyConfig.eliteMultipliers as { health: number; damage: number; xpReward: number; lootDrops: number }) || {
            health: 2.0,
            damage: 2.0,
            xpReward: 3.0,
            lootDrops: 3.0
        };
        const eliteFallback = GameConstants.Enemy.ELITE_FALLBACK_HEALTH;
        finalConfig.health = (Number(finalConfig.health) || eliteFallback) * mult.health;
        finalConfig.maxHealth = (Number(finalConfig.maxHealth) || Number(finalConfig.health)) * mult.health;
        finalConfig.damage = (Number(finalConfig.damage) || GameConstants.Enemy.DEFAULT_DAMAGE) * mult.damage;
        finalConfig.xpReward = (Number(finalConfig.xpReward) || GameConstants.Enemy.DEFAULT_XP_REWARD) * mult.xpReward;
    }

    if (config.biomeId && (BiomeConfig.types as unknown as Record<string, { difficulty?: number }>)?.[config.biomeId]) {
        const biome = (BiomeConfig.types as unknown as Record<string, { difficulty?: number }>)[config.biomeId];
        const diffMult = (BiomeConfig.difficultyMultipliers as Record<number, { health?: number; damage?: number; xp?: number }>)?.[biome.difficulty!] || {
            health: 1,
            damage: 1,
            xp: 1,
            loot: 1
        };
        finalConfig.health = (Number(finalConfig.health) || 0) * (diffMult.health ?? 1);
        finalConfig.maxHealth = finalConfig.health;
        finalConfig.damage = (Number(finalConfig.damage) || 0) * (diffMult.damage ?? 1);
        finalConfig.xpReward = (Number(finalConfig.xpReward) || 0) * (diffMult.xp ?? 1);
    }

    let entityType = finalConfig.entityType;
    if (!entityType) {
        const sourceFile = (String(typeConfig.sourceFile || '') || String(config.enemyType || '')).toLowerCase();
        if (sourceFile.includes('soldier') || sourceFile.includes('human')) entityType = EntityTypes.ENEMY_SOLDIER;
        else if (sourceFile.includes('saurian')) entityType = EntityTypes.ENEMY_SAURIAN;
        else entityType = EntityTypes.ENEMY_DINOSAUR;
    }

    const isBoss = Boolean(typeConfig.isBoss) || typeConfig.entityType === 'Boss';
    const defaultSize = GameConstants.Enemy.DEFAULT_SIZE;
    const sizeInfo = SpeciesScaleConfig.getSize(typeConfig, isBoss) || { width: defaultSize, height: defaultSize };

    return { finalConfig, typeConfig, isElite, entityType, sizeInfo };
}

export function getPatrolConfig(
    finalConfig: EntityConfig,
    _config: EntityConfig
): { patrolRadius: number; leashDistance: number; aggroRange: number } {
    const Biome = GameConstants.Biome;
    return {
        patrolRadius:
            Number(finalConfig.patrolRadius) ||
            Number(getConfig().AI?.PATROL_AREA_RADIUS) ||
            Number(BiomeConfig.patrolDefaults?.areaRadius) ||
            Biome.PATROL_AREA_RADIUS,
        leashDistance:
            Number(finalConfig.leashDistance) ||
            Number(getConfig().Biome?.LEASH_DISTANCE) ||
            Number(BiomeConfig.patrolDefaults?.leashDistance) ||
            Biome.LEASH_DISTANCE,
        aggroRange:
            Number(finalConfig.aggroRange) ||
            Number(getConfig().Biome?.AGGRO_RANGE) ||
            Number(BiomeConfig.patrolDefaults?.aggroRange) ||
            Biome.AGGRO_RANGE
    };
}
