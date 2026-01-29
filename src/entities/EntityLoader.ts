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

// Pre-import all entity modules using Vite's import.meta.glob (eager mode)
// This allows synchronous access to all entity data at runtime
const entityModules: Record<string, { default: any }> = import.meta.glob(
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
        './hero/*.ts'
    ],
    { eager: true }
);

// EntityRegistry - populated by EntityLoader.load()
// Persistent across HMR updates
declare global {
    interface Window {
        __ENTITY_REGISTRY__: any;
    }
}

const EntityRegistry: any =
    typeof window !== 'undefined' && window.__ENTITY_REGISTRY__ ? window.__ENTITY_REGISTRY__ : {};

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
    },

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
                .filter((k) => typeof EntityRegistry[k] === 'object' && k !== 'defaults')
                .map((k) => {
                    const count =
                        EntityRegistry[k] && typeof EntityRegistry[k] === 'object'
                            ? Object.keys(EntityRegistry[k]).length
                            : 0;
                    return count > 0 ? `${count} ${k}` : null;
                })
                .filter(Boolean);
            Logger.info(`[EntityLoader] Loaded: ${counts.join(', ')}`);
            return true;
        } catch (error) {
            Logger.error(`[EntityLoader] Failed to load: ${error.message}`);
            return false;
        }
    },

    /**
     * Load entities from manifest
     */
    async loadFromManifest(manifest) {
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
            'environment',
            'hero' // Hero skins as a category
        ];

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
    async loadGenericEntity(category, id) {
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
        } catch (e) {
            Logger.warn(`[EntityLoader] Could not load ${category}/${id}: ${e.message}`);
            return null;
        }
    },

    /**
     * Store entity data in the registry with proper processing
     */
    storeEntity(category: string, id: string, data: any) {
        if (!data) {
            Logger.warn(`[EntityLoader] No default export in ${category}/${id}`);
            return null;
        }

        // For enemies/bosses, use processEntity for backward compatibility
        if (category === 'enemies' || category === 'bosses') {
            const entity = this.processEntity(data, category);
            if (!EntityRegistry[category]) {
                EntityRegistry[category] = {};
            }
            EntityRegistry[category][id] = entity;
            return entity;
        }

        // For other categories, store directly with minimal processing
        const entity = {
            ...data,
            _sourceFile: `${id}.ts`
        };

        // Fix: Flatten display properties to root for ALL entities
        // This ensures EntityScaling can find width/height/scale regardless of category
        if (data.display) {
            Object.assign(entity, data.display);
        }

        // Ensure registry category exists
        if (!EntityRegistry[category]) {
            EntityRegistry[category] = {};
        }

        EntityRegistry[category][id] = entity;
        return entity;
    },

    /**
     * Extract weapon subtype from weapon ID
     * e.g. weapon_melee_sword_t1_01 -> sword, weapon_ranged_pistol_t1_01 -> pistol
     */
    getWeaponSubtype(id) {
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
    getToolType(id) {
        const match = id.match(/^tool_([a-z_]+?)_t\d/);
        if (match) {
            return match[1]; // e.g. "mining", "woodcutting", "fishing"
        }
        return null;
    },

    /**
     * Load all entities from a category folder
     */
    async loadCategory(category) {
        try {
            const indexResp = await fetch(`${this.basePath}${category}/index.json`);
            if (!indexResp.ok) return;

            const index = await indexResp.json();
            const promises = index.map((id) => this.loadEntity(category, id));
            await Promise.all(promises);
        } catch (e) {
            Logger.warn(`[EntityLoader] Could not load category ${category}`);
        }
    },

    /**
     * Load a single entity JSON file
     */
    async loadEntity(category, id) {
        try {
            const resp = await fetch(`${this.basePath}${category}/${id}.json`);
            if (!resp.ok) return null;

            const data = await resp.json();
            const entity = this.processEntity(data, category);

            // Store in registry
            if (category === 'bosses') {
                EntityRegistry.bosses[id] = entity;
                EntityRegistry.enemies[id] = entity; // Also in enemies for unified lookup
            } else {
                EntityRegistry.enemies[id] = entity;
            }

            return entity;
        } catch (e) {
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
     * Process entity data: flatten nested structures, apply defaults
     */
    processEntity(data, category) {
        const defaults = category === 'bosses' ? this.defaults.boss : this.defaults.enemy;
        const entity = {
            entityType: category === 'bosses' ? 'Boss' : 'Enemy',
            ...defaults
        };

        // Copy direct properties override defaults
        for (const [key, value] of Object.entries(data)) {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                entity[key] = value;
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
            entity.lootTable = data.loot.map((l) => ({
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
                    height: entity.height ? entity.height * boundsScale : 32
                },
                offset: { x: 0, y: 0 },
                layer: layer,
                mask: mask,
                isTrigger: isTrigger
            };
        }

        return entity;
    },

    // ============ Lookup Helpers ============

    getEnemy(id) {
        return EntityRegistry?.enemies?.[id] || null;
    },

    getBoss(id: string) {
        return EntityRegistry?.bosses?.[id] || null;
    },

    getHero() {
        return EntityRegistry?.hero || null;
    },

    getEnemiesForBiome(biomeId: string) {
        const enemies = EntityRegistry?.enemies || {};
        return Object.values(enemies).filter(
            (e: any) => e.spawnBiomes?.includes(biomeId) && !e.isBoss
        );
    },

    getEnemiesByTier(tier: number) {
        const enemies = EntityRegistry?.enemies || {};
        return Object.values(enemies).filter((e: any) => e.tier === tier);
    },

    getEnemiesByCategory(category: string) {
        const enemies = EntityRegistry?.enemies || {};
        return Object.values(enemies).filter((e: any) => e.category === category);
    },

    /**
     * Get all equipment from EntityRegistry.equipment
     * Derives sourceFile from ID prefix (chest_, head_, weapon_, etc.)
     * @returns {Array} All equipment items as an array
     */
    getAllEquipment() {
        const equipment = EntityRegistry?.equipment || {};
        const allEquipment: any[] = [];

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

            const itemData = item as any;
            allEquipment.push({
                ...itemData,
                id: itemData.id || id,
                sourceFile: sourceFile
            });
        }

        return allEquipment;
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
    import.meta.hot.accept((newModule) => {
        if (newModule) {
            Logger.info('[HMR] EntityLoader updated');
            // Re-run load to refresh data from new modules
            // (Note: This relies on EntityRegistry being persistent in window)
            newModule.EntityLoader.load();
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
    if (!EntityRegistry[category]) return;

    const registryEntity = EntityRegistry[category][configId];
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
        // Debug logging for first few items to see what we are comparing against
        if (updatedCount === 0 && activeEntities.indexOf(entity) < 3) {
            // console.log('Checking entity:', entity); 
        }

        // Check if this entity uses the updated config
        // Matches if any type identifier equals the configId
        const matchesInfo =
            (entity as any).registryId === configId || // Primary standard match
            (entity as any).enemyType === configId ||
            (entity as any).dinoType === configId ||
            (entity as any).bossType === configId ||
            (entity as any).resourceType === configId ||
            (entity as any).itemType === configId ||
            (entity as any).spriteId === configId ||
            (entity as any).sprite === configId; // Fallback for simple props using sprite as ID

        if (!matchesInfo) {
            // Detailed debug for why it didn't match (only log if it looks relevant)
            if ((entity as any).sprite?.includes(configId) || (entity as any).registryId?.includes(configId)) {
                Logger.warn(`[EntityLoader] Near miss for ${configId}: RegID=${(entity as any).registryId}, Sprite=${(entity as any).sprite}`);
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
                    if (key === 'maxHealth') (entity as any).maxHealth = numVal;
                    // If updating base health in config, usually implies max health update too
                    if (key === 'health') {
                        // If entity was at full health, keep it at full health
                        const wasFull = (entity as any).health >= ((entity as any).maxHealth || 0);
                        (entity as any).health = numVal;
                        // Determine if we should update maxHealth (often same in config)
                        if (!(entity as any).maxHealth || (entity as any).maxHealth < numVal) {
                            (entity as any).maxHealth = numVal;
                        }
                    }
                }
            }
            // Handle deep stats object (e.g. stats.damage)
            else if (key.startsWith('stats.')) {
                const statName = key.split('.')[1];
                const numVal = Number(value);
                if (!isNaN(numVal)) {
                    (entity as any)[statName] = numVal;
                }
            } else {
                // Direct property update (speed, damage, etc.)
                // Filter out complex objects or arrays unless specific handler
                if (typeof value !== 'object') {
                    (entity as any)[key] = value;
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
            if (typeof (entity as any).refreshConfig === 'function') {
                (entity as any).refreshConfig();
            } else {
                // Fallback for entities without refreshConfig
                if (updates.width) (entity as any).width = Number(updates.width);
                if (updates.height) (entity as any).height = Number(updates.height);

                // Update Collision if present
                if ((entity as any).collision && (entity as any).collision.bounds) {
                    (entity as any).collision.bounds.width = (entity as any).width;
                    (entity as any).collision.bounds.height = (entity as any).height;
                }
            }
        }
        updatedCount++;
    }


    if (updatedCount > 0) {
        Logger.info(`[EntityLoader] Live updated ${updatedCount} active instances of ${configId}`);
    }
}
