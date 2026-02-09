/**
 * EntityLoader - Loads entity definitions from individual JSON files
 *
 * Source of truth: src/entities/{category}/{entity_id}.json
 * Bidirectionally synced with dashboard.
 * Populates EntityRegistry for runtime access.
 *
 * Owner: Director
 */

import { Logger } from '@core/Logger';
import { Registry } from '@core/Registry';
import manifest from './manifest';
import { EntityConfig, IEntity } from '../types/core';

// Entity Module Interface for Vite's glob import
interface EntityModule {
    default: Partial<EntityConfig>;
}

// Pre-import all entity modules using Vite's import.meta.glob (eager mode)
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

// Typed Entity Registry Structure
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

// EntityRegistry - populated by EntityLoader.load()
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

const EntityLoader = {
    loaded: false,
    basePath: 'src/entities/',

    // Default stats applied when entity JSON is missing fields
    defaults: {
        enemy: {
            gridSize: 1,
            width: 128,
            height: 128,
            health: 50,
            speed: 80,
            damage: 10,
            defense: 0,
            attackRange: 80,
            attackRate: 1.0,
            aggroRange: 200,
            leashDistance: 400,
            respawnTime: 30,
            xpReward: 10
        },
        boss: {
            gridSize: 3,
            width: 384,
            height: 384,
            health: 500,
            speed: 60,
            damage: 40,
            defense: 10,
            attackRange: 150,
            attackRate: 0.8,
            aggroRange: 400,
            respawnTime: 180,
            xpReward: 200
        }
    } as Record<string, unknown>,

    /**
     * Initialize - called by Game.js via SystemConfig
     */
    async init() {
        return this.load();
    },

    /**
     * Load all entity JSON files from folders
     */
    async load() {
        if (this.loaded) return true;

        // IMPORTANT: Modify properties instead of reassigning EntityRegistry
        // This preserves the object reference for modules that already imported it
        EntityRegistry.enemies = {};
        EntityRegistry.bosses = {};
        EntityRegistry.nodes = {};
        EntityRegistry.resources = {};
        EntityRegistry.items = {};
        EntityRegistry.equipment = {};
        EntityRegistry.npcs = {};
        EntityRegistry.environment = {};
        EntityRegistry.ground = {};
        EntityRegistry.hero = {}; // Hero skins registry (hero_t1_01, etc.)
        EntityRegistry.defaults = this.defaults;

        try {
            // Load entity manifest from imported module
            if (manifest && (manifest.enemies || manifest.hero)) {
                await this.loadFromManifest(manifest);
            } else {
                // Fallback: try to load known categories
                Logger.warn('[EntityLoader] No manifest data found, using fallback');
                await this.loadCategory('enemies');
                await this.loadCategory('bosses');
                await this.loadHero();
            }

            this.loaded = true;
            const counts = Object.keys(EntityRegistry)
                .filter((k) => {
                    const key = k as keyof EntityRegistryStrict;
                    return typeof EntityRegistry[key] === 'object' && key !== 'defaults';
                })
                .map((k) => {
                    const key = k as keyof EntityRegistryStrict;
                    const count =
                        EntityRegistry[key] && typeof EntityRegistry[key] === 'object'
                            ? Object.keys(EntityRegistry[key] as object).length
                            : 0;
                    return count > 0 ? `${count} ${key}` : null;
                })
                .filter(Boolean);
            Logger.info(`[EntityLoader] Loaded: ${counts.join(', ')}`);
            return true;
            return true;
        } catch (error: unknown) {
            Logger.error(`[EntityLoader] Failed to load: ${error.message}`);
            return false;
        }
    },

    /**
     * Load entities from manifest
     */
    /**
     * Load entities from manifest
     */
    async loadFromManifest(manifest: Record<string, unknown>) {
        const promises = [];

        // All entity categories
        const categories = [
            'enemies',
            'bosses',
            'nodes',
            'resources',
            'items',
            'equipment',
            'npcs',
            'npcs',
            'environment',
            'ground',
            'hero' // Hero skins as a category
        ] as const;

        for (const category of categories) {
            if (manifest[category] && Array.isArray(manifest[category])) {
                for (const id of manifest[category]) {
                    promises.push(this.loadGenericEntity(category, id));
                }
            }
        }

        // Legacy: Load hero from hero.json if manifest.hero is true but no hero array
        if (manifest.hero === true) {
            promises.push(this.loadLegacyHero());
        }

        await Promise.all(promises);
    },

    /**
     * Load a generic entity TypeScript module into the correct registry category
     * Uses pre-loaded entityModules from Vite's import.meta.glob
     */
    async loadGenericEntity(category: keyof EntityRegistryStrict, id: string) {
        try {
            // Build the module path key to lookup in pre-loaded entityModules
            let modulePath: string;

            // For equipment weapons, route to subfolder
            if (category === 'equipment' && id.startsWith('weapon_')) {
                const subtype = this.getWeaponSubtype(id);
                if (subtype) {
                    modulePath = `./${category}/weapons/${subtype}/${id}.ts`;
                } else {
                    modulePath = `./${category}/${id}.ts`;
                }
            }
            // For equipment tools, route to subfolder
            else if (category === 'equipment' && id.startsWith('tool_')) {
                const toolType = this.getToolType(id);
                if (toolType) {
                    modulePath = `./${category}/tools/${toolType}/${id}.ts`;
                } else {
                    modulePath = `./${category}/${id}.ts`;
                }
            } else {
                modulePath = `./${category}/${id}.ts`;
            }

            // Lookup from pre-loaded modules
            const module = entityModules[modulePath];
            if (!module) {
                // Try without subfolder for equipment items that might be in root
                if (category === 'equipment') {
                    const fallbackPath = `./${category}/${id}.ts`;
                    const fallbackModule = entityModules[fallbackPath];
                    if (fallbackModule) {
                        const data = fallbackModule.default;
                        return this.storeEntity(category, id, data);
                    }
                }
                Logger.warn(`[EntityLoader] Module not found: ${modulePath}`);
                return null;
            }

            const data = module.default;
            return this.storeEntity(category, id, data);
        } catch (e: unknown) {
            Logger.warn(`[EntityLoader] Could not load ${category}/${id}: ${e.message}`);
            return null;
        }
    },

    /**
     * Store entity data in the registry with proper processing
     */
    storeEntity(category: keyof EntityRegistryStrict, id: string, data: Partial<EntityConfig>) {
        if (!data) {
            Logger.warn(`[EntityLoader] No default export in ${category}/${id}`);
            return null;
        }

        // For enemies/bosses, use processEntity for backward compatibility
        if (category === 'enemies' || category === 'bosses') {
            const entity = this.processEntity(data, category);

            // TS check to ensure category is correct before assignment
            if (category === 'enemies') EntityRegistry.enemies[id] = entity;
            if (category === 'bosses') EntityRegistry.bosses[id] = entity;

            return entity;
        }

        // For other categories, store directly with minimal processing
        const entity: EntityConfig = {
            ...data,
            // Cast to satisfy 'sourceFile' if it's not in EntityConfig yet, or assume it is
            // Using logic to infer it later
        };
        // Add sourceFile metadata if possible (EntityConfig allows [key: string]: any)
        (entity as Record<string, unknown>)._sourceFile = `${id}.ts`;

        // Fix: Flatten display properties to root for ALL entities
        // This ensures EntityScaling can find width/height/scale regardless of category
        if (data.display) {
            Object.assign(entity, data.display);
        }

        // Ensure registry category exists and assign
        if (EntityRegistry[category]) {
            EntityRegistry[category][id] = entity;
        }
        return entity;
    },

    /**
     * Extract weapon subtype from weapon ID
     * e.g. weapon_melee_sword_t1_01 -> sword, weapon_ranged_pistol_t1_01 -> pistol
     */
    /**
     * Extract weapon subtype from weapon ID
     * e.g. weapon_melee_sword_t1_01 -> sword, weapon_ranged_pistol_t1_01 -> pistol
     */
    getWeaponSubtype(id: string) {
        const match = id.match(/^weapon_(melee|ranged)_([a-z_]+?)_t\d/);
        if (match) {
            return match[2]; // e.g. "sword", "pistol", "machine_gun"
        }
        return null;
    },

    /**
     * Extract tool type from tool ID
     * e.g. tool_mining_t1_01 -> mining, tool_woodcutting_t2_01 -> woodcutting
     */
    getToolType(id: string) {
        const match = id.match(/^tool_([a-z_]+?)_t\d/);
        if (match) {
            return match[1]; // e.g. "mining", "woodcutting", "fishing"
        }
        return null;
    },

    /**
     * Load all entities from a category folder
     */
    /**
     * Load all entities from a category folder
     */
    async loadCategory(category: string) {
        try {
            const indexResp = await fetch(`${this.basePath}${category}/index.json`);
            if (!indexResp.ok) return;

            const index = await indexResp.json();
            const promises = index.map((id: string) => this.loadEntity(category, id));
            await Promise.all(promises);
        } catch (e) {
            Logger.warn(`[EntityLoader] Could not load category ${category}`);
        }
    },

    /**
     * Load a single entity JSON file
     */
    async loadEntity(category: string, id: string) {
        try {
            const resp = await fetch(`${this.basePath}${category}/${id}.json`);
            if (!resp.ok) return null;

            const data = await resp.json();
            const entity = this.processEntity(data, category);

            // Store in registry
            const validCategory = category as keyof EntityRegistryStrict;

            // TS check: allow "bosses" to populate "enemies" too
            if (category === 'bosses') {
                EntityRegistry.bosses[id] = entity;
                EntityRegistry.enemies[id] = entity; // Also in enemies for unified lookup
            } else if (EntityRegistry[validCategory]) {
                EntityRegistry[validCategory][id] = entity;
            }

            return entity;
        } catch (e: unknown) {
            Logger.warn(`[EntityLoader] Could not load ${category}/${id}: ${e.message}`);
            return null;
        }
    },

    /**
     * Load legacy hero entity (single hero.json config)
     * @deprecated Use hero category in manifest instead
     */
    async loadLegacyHero() {
        try {
            const resp = await fetch(`${this.basePath}hero/hero.json`);
            if (!resp.ok) return null;

            const data = await resp.json();
            // Store as both legacy single hero and in hero skins registry
            EntityRegistry.hero['hero'] = {
                id: 'hero',
                entityType: 'Hero',
                ...data
            };
            return EntityRegistry.hero['hero'];
        } catch (e) {
            Logger.warn('[EntityLoader] Could not load legacy hero');
            return null;
        }
    },

    /**
     * Alias for backward compatibility
     */
    async loadHero() {
        return this.loadLegacyHero();
    },

    /**
     * Process entity data: flatten nested structures, apply defaults
     */
    /**
     * Process entity data: flatten nested structures, apply defaults
     */
    processEntity(data: Partial<EntityConfig>, category: string): EntityConfig {
        const defaults = category === 'bosses' ? this.defaults.boss : this.defaults.enemy;
        const entity: EntityConfig = {
            entityType: category === 'bosses' ? 'Boss' : 'Enemy',
            ...defaults
        };

        // Copy direct properties override defaults
        for (const [key, value] of Object.entries(data)) {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                (entity as Record<string, unknown>)[key] = value;
            }
        }

        // Flatten nested objects
        if (data.stats) Object.assign(entity, data.stats);
        if (data.combat) Object.assign(entity, data.combat);
        // Size override from JSON takes precedence over defaults
        if (data.size) Object.assign(entity, data.size);

        // Handle display block (species-based sizing)
        // Both flatten properties AND preserve the display object for game code
        if (data.display) {
            Object.assign(entity, data.display);
            entity.display = data.display; // Keep reference for EnemyCore/Dinosaur
        }

        // Handle spawning
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

        // Handle assets
        if (data.assets) {
            entity.sprite = data.assets.sprite;
            entity.spriteId = data.assets.sprite;
            entity.sfx = data.assets.sfx;
            entity.vfx = data.assets.vfx;
        }

        // Alternative: sprite at top level
        if (data.sprite && !entity.sprite) {
            entity.sprite = data.sprite;
            entity.spriteId = data.sprite;
        }

        // Handle loot
        if (data.loot) {
            entity.lootTable = data.loot.map((l: { item: string; chance: number; amount?: number | [number, number]; min?: number; max?: number }) => ({
                item: l.item,
                chance: l.chance,
                amount: Array.isArray(l.amount)
                    ? { min: l.amount[0], max: l.amount[1] }
                    : l.amount || 1
            }));
        }

        // Inject default collision config if missing
        if (!entity.collision) {
            // Determine default collision settings based on category
            let layer = 0;
            let mask = 0;
            let isTrigger = false;
            let boundsScale = 0.4; // Default bounds scaling

            // Use bitmasks directly to avoid circular imports if CollisionComponent loads EntityLoader
            // CollisionLayers: WORLD=1, HERO=2, ENEMY=4, TRIGGER=8
            // DefaultMasks: WORLD=7, HERO=5, ENEMY=3, TRIGGER=2

            if (category === 'bosses' || category === 'enemies') {
                layer = 0b0100; // ENEMY
                mask = 0b0011;  // WORLD | HERO
            } else if (category === 'items' || category === 'projectiles') {
                layer = 0b1000; // TRIGGER
                mask = 0b0010;  // HERO
                isTrigger = true;
                boundsScale = 0.5;
            } else if (category === 'resources' || category === 'nodes' || category === 'environment') {
                // Static World Objects
                layer = 0b0001; // WORLD
                mask = 0b0111;  // EVERYTHING
                boundsScale = 0.8;
            } else if (category === 'npcs') {
                layer = 0b0001; // Treat NPCs as World obstacles for now? Or triggers?
                mask = 0b0111;
                boundsScale = 0.6;
            }

            entity.collision = {
                // Default to logic box if not specified
                bounds: {
                    x: 0,
                    y: 0,
                    width: entity.width ? entity.width * boundsScale : 32,
                    height: entity.height ? entity.height * boundsScale : 32,
                    offsetX: 0,
                    offsetY: 0
                },
                layer: layer,
                mask: mask,
                isTrigger: isTrigger
            };
        }

        return entity;
    },

    // ============ Lookup Helpers ============

    // ============ Lookup Helpers ============

    getEnemy(id: string) {
        return EntityRegistry?.enemies?.[id] || null;
    },

    getBoss(id: string) {
        return EntityRegistry?.bosses?.[id] || null;
    },

    getHero() {
        return EntityRegistry?.hero || null;
    },

    getEnemiesForBiome(biomeId: string) {
        const enemies = EntityRegistry.enemies || {};
        return Object.values(enemies).filter(
            (e: EntityConfig) => e.spawning?.biomes?.includes(biomeId) && e.entityType !== 'Boss'
        );
    },

    getEnemiesByTier(tier: number) {
        const enemies = EntityRegistry.enemies || {};
        return Object.values(enemies).filter((e: IEntity & { tier?: string }) => e.tier === tier);
    },

    getEnemiesByCategory(category: string) {
        const enemies = EntityRegistry.enemies || {};
        return Object.values(enemies).filter((e: IEntity & { category?: string }) => e.category === category);
    },

    /**
     * Get all equipment from EntityRegistry.equipment
     * Derives sourceFile from ID prefix (chest_, head_, weapon_, etc.)
     * @returns {Array} All equipment items as an array
     */
    getAllEquipment() {
        const equipment = EntityRegistry?.equipment || {};
        const allEquipment: Array<{ id: string; [key: string]: unknown }> = [];

        for (const [id, item] of Object.entries(equipment)) {
            // Derive sourceFile from ID prefix
            let sourceFile = 'equipment';
            if (id.startsWith('chest_')) sourceFile = 'chest';
            else if (id.startsWith('head_')) sourceFile = 'head';
            else if (id.startsWith('hands_')) sourceFile = 'hands';
            else if (id.startsWith('feet_')) sourceFile = 'feet';
            else if (id.startsWith('legs_')) sourceFile = 'legs';
            else if (id.startsWith('tool_')) sourceFile = 'tool';
            else if (id.startsWith('weapon_')) sourceFile = 'weapon';
            else if (id.startsWith('signature_')) sourceFile = 'signature';
            else if (id.startsWith('accessory_')) sourceFile = 'accessory';

            const itemData = item as Record<string, unknown>;
            allEquipment.push({
                ...itemData,
                id: itemData.id || id,
                sourceFile: sourceFile
            });
        }

        return allEquipment;
    },

    /**
     * Generic config lookup by ID across all categories
     */
    getConfig(id: string): EntityConfig | null {
        if (!EntityRegistry) return null;

        // Check all known categories
        // Optimization: Checking in order of likelihood?
        if (EntityRegistry.enemies?.[id]) return EntityRegistry.enemies[id];
        if (EntityRegistry.bosses?.[id]) return EntityRegistry.bosses[id];
        if (EntityRegistry.resources?.[id]) return EntityRegistry.resources[id];
        if (EntityRegistry.nodes?.[id]) return EntityRegistry.nodes[id];
        if (EntityRegistry.items?.[id]) return EntityRegistry.items[id];
        if (EntityRegistry.equipment?.[id]) return EntityRegistry.equipment[id];
        if (EntityRegistry.npcs?.[id]) return EntityRegistry.npcs[id];
        if (EntityRegistry.environment?.[id]) return EntityRegistry.environment[id];
        if (EntityRegistry.hero?.[id]) return EntityRegistry.hero[id];

        // Fallback for simple sprite-based lookups (e.g. props)
        // This is slow, maybe avoid?
        return null;
    }
};

// Export for global access
if (Registry) {
    if (Registry.get('EntityLoader')) {
        // HMR: Force update the reference
        Registry.services.set('EntityLoader', EntityLoader);
        Logger.info('[EntityLoader] HMR: Updated registry reference');
    } else {
        Registry.register('EntityLoader', EntityLoader);
    }
}

export { EntityLoader, EntityRegistry };

// ============================================
// VITE HMR - Hot reload without full page refresh
// ============================================

if (import.meta.hot) {
    import.meta.hot.accept(async (newModule) => {
        if (newModule) {
            Logger.info('[HMR] EntityLoader updated');
            // Re-run load to refresh data from new modules
            await newModule.EntityLoader.load();

            // HMR: Refresh all active entities with new config
            if (entityManager) {
                const count = entityManager.getAll().length;
                Logger.info(`[HMR] Refreshing ${count} active entities...`);
                entityManager.getAll().forEach(entity => {
                    if (entity.refreshConfig) {
                        entity.refreshConfig();
                    }
                });
            }
        }
    });
}

// ============================================
// BROADCAST LISTENERS - Live updates from Dashboard
// ============================================

import { entityManager } from '@core/EntityManager';

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
    const entityChannel = new BroadcastChannel('game-entity-updates');

    entityChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'ENTITY_UPDATE') {
            const { category, id, updates } = event.data;
            handleEntityUpdate(category, id, updates);
        }
    };

    Logger.info('[EntityLoader] Listening for dashboard updates');
}

/**
 * Handle live entity updates from dashboard
 * Applies changes directly to the registry and logs the update
 */
function handleEntityUpdate(category: string, configId: string, updates: Record<string, unknown>) {
    // 1. Update Registry (Source of Truth for new spawns)
    const validCategory = category as keyof EntityRegistryStrict;
    if (!EntityRegistry[validCategory]) return;

    const registryEntity = EntityRegistry[validCategory][configId];
    if (!registryEntity) {
        Logger.warn(`[EntityLoader] Received update for unknown entity: ${category}/${configId}`);
        return;
    }

    // Apply updates deeply to Registry
    for (const [key, value] of Object.entries(updates)) {
        if (key.includes('.')) {
            const parts = key.split('.');
            let target = registryEntity;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!target[parts[i]]) target[parts[i]] = {};
                target = target[parts[i]];
            }
            target[parts[parts.length - 1]] = value;

            // Fix: Mirror display properties to root for consistency
            // Because EntityLoader flattens these during load, we must maintain that state
            if (parts[0] === 'display') {
                const param = parts[1];
                if (param === 'width' || param === 'height' || param === 'sizeScale' || param === 'scale') {
                    registryEntity[param] = value;
                }
            }
        } else {
            registryEntity[key] = value;
        }
    }

    Logger.info(`[EntityLoader] Live update applied to Registry: ${category}/${configId}`);

    // 2. Update Active Instances (Live patch)
    if (!entityManager) return;

    const activeEntities = entityManager.getAll();
    let updatedCount = 0;

    Logger.info(`[EntityLoader] Attempting to patch active entities for ${configId}. Count: ${activeEntities.length}`);

    for (const entity of activeEntities) {
        // Check if this entity uses the updated config
        // Matches if any type identifier equals the configId
        const matchesInfo =
            entity.registryId === configId || // Primary standard match
            entity.entityType === configId ||
            entity.dinoType === configId ||
            entity.bossType === configId ||
            entity.resourceType === configId ||
            entity.itemType === configId ||
            entity.spriteId === configId ||
            entity.sprite === configId; // Fallback for simple props using sprite as ID

        if (!matchesInfo) {
            // Detailed debug for why it didn't match (only log if it looks relevant)
            if (entity.sprite?.includes(configId) || entity.registryId?.includes(configId)) {
                Logger.warn(`[EntityLoader] Near miss for ${configId}: RegID=${entity.registryId}, Sprite=${entity.sprite}`);
            }
            continue;
        }

        // Apply updates to instance
        for (const [key, value] of Object.entries(updates)) {
            // Handle specific logic for stats to ensure safety
            if (key === 'health' || key === 'maxHealth') {
                const numVal = Number(value);
                if (!isNaN(numVal)) {
                    // Update max health
                    if (key === 'maxHealth') entity.maxHealth = numVal;
                    // If updating base health in config, usually implies max health update too
                    if (key === 'health') {
                        // If entity was at full health, keep it at full health
                        const wasFull = (entity.health || 0) >= (entity.maxHealth || 0);
                        entity.health = numVal;
                        // Determine if we should update maxHealth (often same in config)
                        if (!entity.maxHealth || entity.maxHealth < numVal) {
                            entity.maxHealth = numVal;
                        }
                    }
                }
            }
            // Handle deep stats object (e.g. stats.damage)
            else if (key.startsWith('stats.')) {
                const statName = key.split('.')[1];
                const numVal = Number(value);
                if (!isNaN(numVal)) {
                    (entity as Record<string, unknown>)[statName] = numVal;
                }
            } else {
                // Direct property update (speed, damage, etc.)
                // Filter out complex objects or arrays unless specific handler
                if (typeof value !== 'object') {
                    (entity as Record<string, unknown>)[key] = value;
                }
            }
        }

        // Fix: Explicitly handle display/size updates (width, height, sizeScale)
        if (updates.width || updates.height ||
            updates.sizeScale || updates.scale ||
            updates['display.width'] || updates['display.height'] ||
            updates['display.sizeScale'] || updates['display.scale']) {

            Logger.info(`[EntityLoader] Triggering refreshConfig for ${configId}`);
            // Re-read fresh config from registry to get final calculated sizes
            // This is safer than trying to manually patch width/height here
            if (entity.refreshConfig && typeof entity.refreshConfig === 'function') {
                entity.refreshConfig();
            } else {
                // Fallback for entities without refreshConfig
                if (updates.width) entity.width = Number(updates.width);
                if (updates.height) entity.height = Number(updates.height);

                // Update Collision if present
                const ent = entity as IEntity & { collision?: { bounds?: { width: number; height: number } } };
                if (ent.collision?.bounds) {
                    ent.collision.bounds.width = entity.width;
                    ent.collision.bounds.height = entity.height;
                }
            }
        }
        updatedCount++;
    }


    if (updatedCount > 0) {
        Logger.info(`[EntityLoader] Live updated ${updatedCount} active instances of ${configId}`);
    }
}
