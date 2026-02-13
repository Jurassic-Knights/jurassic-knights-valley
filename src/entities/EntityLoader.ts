/**
 * EntityLoader - Loads entity definitions from individual JSON files
 *
 * Source of truth: src/entities/{category}/{entity_id}.json
 * Bidirectionally synced with dashboard.
 * Populates EntityRegistry for runtime access.
 */
import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';
import { GameConstants } from '@data/GameConstants';
import { entityManager } from '@core/EntityManager';
import manifest from './manifest';
import { EntityConfig } from '../types/core';
import { processEntity } from './EntityLoaderProcess';
import { handleEntityUpdate } from './EntityLoaderBroadcast';
import * as Lookup from './EntityLoaderLookup';

interface EntityModule {
    default: Partial<EntityConfig>;
}

const entityModules: Record<string, EntityModule> = import.meta.glob(
    [
        './enemies/*.ts',
        './bosses/*.ts',
        './nodes/*.ts',
        './resources/*.ts',
        './items/*.ts',
        './equipment/*.ts',
        './equipment/**/*.ts',
        './npcs/*.ts',
        './environment/*.ts',
        './ground/**/*.ts',
        './hero/*.ts'
    ],
    { eager: true }
);

interface EntityRegistryStrict {
    enemies: Record<string, EntityConfig>;
    bosses: Record<string, EntityConfig>;
    nodes: Record<string, EntityConfig>;
    resources: Record<string, EntityConfig>;
    items: Record<string, EntityConfig>;
    equipment: Record<string, EntityConfig>;
    npcs: Record<string, EntityConfig>;
    environment: Record<string, EntityConfig>;
    ground: Record<string, EntityConfig>;
    hero: Record<string, EntityConfig>;
    defaults: Record<string, Partial<EntityConfig>>;
}

declare global {
    interface Window {
        __ENTITY_REGISTRY__: EntityRegistryStrict;
    }
}

const EntityRegistry: EntityRegistryStrict =
    typeof window !== 'undefined' && window.__ENTITY_REGISTRY__
        ? window.__ENTITY_REGISTRY__
        : {
              enemies: {},
              bosses: {},
              nodes: {},
              resources: {},
              items: {},
              equipment: {},
              npcs: {},
              environment: {},
              ground: {},
              hero: {},
              defaults: {}
          };

if (typeof window !== 'undefined') {
    window.__ENTITY_REGISTRY__ = EntityRegistry;
}

const L = GameConstants.EntityLoader;
const CATEGORIES = ['enemies', 'bosses', 'nodes', 'resources', 'items', 'equipment', 'npcs', 'environment', 'ground', 'hero'] as const;
const getDefaults = () =>
    ({
        enemy: {
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
        },
        boss: {
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
        }
    }) as Record<string, unknown>;

const EntityLoader = {
    loaded: false,
    basePath: 'src/entities/',

    get defaults() {
        return getDefaults();
    },

    async init() {
        return this.load();
    },

    async load() {
        if (this.loaded) return true;

        CATEGORIES.forEach((c) => (EntityRegistry[c] = {}));
        EntityRegistry.defaults = this.defaults;

        try {
            if (manifest && (manifest.enemies || manifest.hero)) {
                await this.loadFromManifest(manifest);
            } else {
                Logger.warn('[EntityLoader] No manifest data found, using TS fallback');
                await this.loadGenericEntity('enemies', 'enemy_dinosaur_t1_01');
                await this.loadGenericEntity('hero', 'hero_t1_01');
            }

            this.loaded = true;
            const counts = CATEGORIES
                .map((c) => {
                    const n = Object.keys(EntityRegistry[c] || {}).length;
                    return n > 0 ? `${n} ${c}` : null;
                })
                .filter(Boolean);
            Logger.info(`[EntityLoader] Loaded: ${counts.join(', ')}`);
            return true;
        } catch (error: unknown) {
            Logger.error(`[EntityLoader] Failed to load: ${(error as Error).message}`);
            return false;
        }
    },

    async loadFromManifest(manifestData: Record<string, unknown>) {
        const promises: Promise<EntityConfig | null>[] = [];
        for (const category of CATEGORIES) {
            if (manifestData[category] && Array.isArray(manifestData[category])) {
                for (const id of manifestData[category] as string[]) {
                    promises.push(this.loadGenericEntity(category, id));
                }
            }
        }

        await Promise.all(promises);
    },

    async loadGenericEntity(category: keyof EntityRegistryStrict, id: string) {
        try {
            let modulePath = `./${category}/${id}.ts`;
            if (category === 'equipment') {
                const w = id.match(/^weapon_(?:melee|ranged)_([a-z_]+?)_t\d/);
                const t = id.match(/^tool_([a-z_]+?)_t\d/);
                if (w) modulePath = `./${category}/weapons/${w[1]}/${id}.ts`;
                else if (t) modulePath = `./${category}/tools/${t[1]}/${id}.ts`;
            }

            const module = entityModules[modulePath];
            if (!module) {
                if (category === 'equipment') {
                    const fallback = entityModules[`./${category}/${id}.ts`];
                    if (fallback) return this.storeEntity(category, id, fallback.default);
                }
                Logger.warn(`[EntityLoader] Module not found: ${modulePath}`);
                return null;
            }
            return this.storeEntity(category, id, module.default);
        } catch (e: unknown) {
            Logger.warn(`[EntityLoader] Could not load ${category}/${id}: ${(e as Error).message}`);
            return null;
        }
    },

    storeEntity(category: keyof EntityRegistryStrict, id: string, data: Partial<EntityConfig>) {
        if (!data) {
            Logger.warn(`[EntityLoader] No default export in ${category}/${id}`);
            return null;
        }

        if (category === 'enemies' || category === 'bosses') {
            const entity = processEntity(data, category);
            if (category === 'enemies') EntityRegistry.enemies[id] = entity;
            if (category === 'bosses') EntityRegistry.bosses[id] = entity;
            return entity;
        }

        const entity: EntityConfig = { ...data };
        (entity as Record<string, unknown>)._sourceFile = `${id}.ts`;

        if (data.display) Object.assign(entity, data.display);
        if (EntityRegistry[category]) EntityRegistry[category][id] = entity;
        return entity;
    },

    getEnemy(id: string) {
        return Lookup.getEnemy(EntityRegistry, id);
    },

    getBoss(id: string) {
        return Lookup.getBoss(EntityRegistry, id);
    },

    getHero() {
        return Lookup.getHero(EntityRegistry);
    },

    getEnemiesForBiome(biomeId: string) {
        return Lookup.getEnemiesForBiome(EntityRegistry, biomeId);
    },

    getEnemiesByTier(tier: number) {
        return Lookup.getEnemiesByTier(EntityRegistry, tier);
    },

    getEnemiesByCategory(category: string) {
        return Lookup.getEnemiesByCategory(EntityRegistry, category);
    },

    getAllEquipment() {
        return Lookup.getAllEquipment(EntityRegistry);
    },

    getConfig(id: string): EntityConfig | null {
        return Lookup.getConfig(EntityRegistry, id);
    }
};

if (Registry) {
    if (Registry.get('EntityLoader')) {
        Registry.services.set('EntityLoader', EntityLoader);
        Logger.info('[EntityLoader] HMR: Updated registry reference');
    } else {
        Registry.register('EntityLoader', EntityLoader);
    }
}

export { EntityLoader, EntityRegistry };

if (import.meta.hot) {
    import.meta.hot.accept(async (newModule) => {
        if (newModule) {
            Logger.info('[HMR] EntityLoader updated');
            await newModule.EntityLoader.load();
            if (entityManager) {
                const count = entityManager.getAll().length;
                Logger.info(`[HMR] Refreshing ${count} active entities...`);
                entityManager.getAll().forEach((entity) => {
                    if (entity.refreshConfig) entity.refreshConfig();
                });
            }
        }
    });
}

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    const entityChannel = new BroadcastChannel('game-entity-updates');
    entityChannel.onmessage = (event) => {
        if (event.data?.type === 'ENTITY_UPDATE') {
            const { category, id, updates } = event.data;
            handleEntityUpdate(EntityRegistry, category, id, updates);
        }
    };
    Logger.info('[EntityLoader] Listening for dashboard updates');
}
