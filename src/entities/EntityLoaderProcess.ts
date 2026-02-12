/**
 * EntityLoaderProcess - Process entity data: flatten nested structures, apply defaults
 */
import { GameConstants } from '@data/GameConstants';
import { EntityConfig } from '../types/core';

const L = GameConstants.EntityLoader;

const entityDefaults = {
    gridSize: 1,
    width: 128,
    height: 128,
    health: L.DEFAULT_HEALTH,
    speed: L.DEFAULT_SPEED,
    damage: L.DEFAULT_DAMAGE,
    defense: 0,
    attackRange: L.DEFAULT_ATTACK_RANGE,
    attackRate: 1.0,
    aggroRange: L.DEFAULT_AGGRO_RANGE,
    leashDistance: L.DEFAULT_LEASH_DISTANCE,
    respawnTime: L.DEFAULT_RESPAWN_TIME,
    xpReward: L.DEFAULT_XP_REWARD
};

const bossDefaults = {
    gridSize: 3,
    width: 384,
    height: 384,
    health: L.BOSS_HEALTH,
    speed: L.BOSS_SPEED,
    damage: L.BOSS_DAMAGE,
    defense: L.BOSS_DEFENSE,
    attackRange: L.BOSS_ATTACK_RANGE,
    attackRate: 0.8,
    aggroRange: L.BOSS_AGGRO_RANGE,
    respawnTime: L.BOSS_RESPAWN_TIME,
    xpReward: L.BOSS_XP_REWARD
};

export function processEntity(
    data: Partial<EntityConfig>,
    category: string
): EntityConfig {
    const defs = category === 'bosses' ? bossDefaults : entityDefaults;
    const entity: EntityConfig = {
        entityType: category === 'bosses' ? 'Boss' : 'Enemy',
        ...defs
    } as EntityConfig;

    for (const [key, value] of Object.entries(data)) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            (entity as Record<string, unknown>)[key] = value;
        }
    }

    if (data.stats) Object.assign(entity, data.stats);
    if (data.combat) Object.assign(entity, data.combat);
    if (data.size) Object.assign(entity, data.size);

    if (data.display) {
        Object.assign(entity, data.display);
        entity.display = data.display;
    }

    if (data.spawning) {
        entity.spawnBiomes = data.spawning.biomes;
        if (data.spawning.groupSize) {
            entity.groupSize = {
                min: data.spawning.groupSize[0] || 1,
                max: data.spawning.groupSize[1] || 1
            };
        }
        entity.spawnWeight = data.spawning.weight;
        entity.respawnTime = data.spawning.respawnTime;
    }

    if (data.assets) {
        entity.sprite = data.assets.sprite;
        entity.spriteId = data.assets.sprite;
        entity.sfx = data.assets.sfx;
        entity.vfx = data.assets.vfx;
    }

    if (data.sprite && !entity.sprite) {
        entity.sprite = data.sprite;
        entity.spriteId = data.sprite;
    }

    if (data.loot) {
        entity.lootTable = data.loot.map((l: { item: string; chance: number; amount?: number | [number, number] }) => ({
            item: l.item,
            chance: l.chance,
            amount: Array.isArray(l.amount)
                ? { min: l.amount[0], max: l.amount[1] }
                : l.amount || 1
        }));
    }

    if (!entity.collision) {
        let layer = 0;
        let mask = 0;
        let isTrigger = false;
        let boundsScale = 0.4;

        if (category === 'bosses' || category === 'enemies') {
            layer = 0b0100;
            mask = 0b0011;
        } else if (category === 'items' || category === 'projectiles') {
            layer = 0b1000;
            mask = 0b0010;
            isTrigger = true;
            boundsScale = 0.5;
        } else if (category === 'resources' || category === 'nodes' || category === 'environment') {
            layer = 0b0001;
            mask = 0b0111;
            boundsScale = 0.8;
        } else if (category === 'npcs') {
            layer = 0b0001;
            mask = 0b0111;
            boundsScale = 0.6;
        }

        entity.collision = {
            bounds: {
                x: 0,
                y: 0,
                width: entity.width ? entity.width * boundsScale : 32,
                height: entity.height ? entity.height * boundsScale : 32,
                offsetX: 0,
                offsetY: 0
            },
            layer,
            mask,
            isTrigger
        };
    }

    return entity;
}
