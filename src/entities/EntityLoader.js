/**
 * EntityLoader - Orchestrator for entity-centric architecture
 * 
 * Loads all entity files and builds the global EntityRegistry.
 * Systems read from EntityRegistry instead of scattered config files.
 * 
 * Usage:
 *   EntityLoader.init();
 *   const raptor = EntityLoader.get('creatures.hostile.velociraptor');
 */

const EntityLoader = {
    /**
     * Initialize the entity registry
     * Called after all entity files are loaded
     */
    init() {
        console.log('[EntityLoader] Initializing entity registry...');

        // Ensure registry exists
        window.EntityRegistry = window.EntityRegistry || {
            hero: null,
            creatures: { hostile: {}, passive: {} },
            enemies: {},
            bosses: {},
            npcs: {},
            resources: {},
            items: {},
            equipment: {},
            props: {}
        };

        // Count registered entities
        const counts = {
            hero: window.EntityRegistry.hero ? 1 : 0,
            creatures: Object.keys(window.EntityRegistry.creatures.hostile).length +
                Object.keys(window.EntityRegistry.creatures.passive).length,
            enemies: Object.keys(window.EntityRegistry.enemies).length,
            bosses: Object.keys(window.EntityRegistry.bosses).length,
            npcs: Object.keys(window.EntityRegistry.npcs).length,
            resources: Object.keys(window.EntityRegistry.resources).length,
            items: Object.keys(window.EntityRegistry.items).length,
            equipment: Object.keys(window.EntityRegistry.equipment).length,
            props: Object.keys(window.EntityRegistry.props).length
        };

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        console.log(`[EntityLoader] Loaded ${total} entities:`, counts);
    },

    /**
     * Get entity by dot-notation path
     * @param {string} path - e.g., 'creatures.hostile.velociraptor'
     * @returns {Object|null}
     */
    get(path) {
        const parts = path.split('.');
        let current = window.EntityRegistry;

        for (const part of parts) {
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                console.warn(`[EntityLoader] Entity not found: ${path}`);
                return null;
            }
        }

        return current;
    },

    /**
     * Get all entities of a category
     * @param {string} category - e.g., 'enemies', 'creatures.hostile'
     * @returns {Object}
     */
    getCategory(category) {
        return this.get(category) || {};
    },

    /**
     * Get entities that spawn in a specific biome
     * @param {string} biomeId
     * @returns {Array}
     */
    getByBiome(biomeId) {
        const results = [];

        // Check all hostile creatures and enemies
        const checkEntities = (entities) => {
            for (const [id, entity] of Object.entries(entities)) {
                if (entity.spawnBiomes && entity.spawnBiomes.includes(biomeId)) {
                    results.push({ id, ...entity });
                }
            }
        };

        checkEntities(window.EntityRegistry.creatures.hostile);
        checkEntities(window.EntityRegistry.enemies);
        checkEntities(window.EntityRegistry.bosses);

        return results;
    },

    /**
     * Merge entity with its base
     * @param {Object} entity - Entity definition
     * @param {Object} base - Base definition
     * @returns {Object} - Merged entity
     */
    mergeWithBase(entity, base) {
        return {
            ...base,
            ...entity,
            sfx: { ...base.sfx, ...entity.sfx },
            vfx: { ...base.vfx, ...entity.vfx }
        };
    },

    /**
     * Register an entity
     * @param {string} category - e.g., 'enemies', 'creatures.hostile'
     * @param {string} id
     * @param {Object} entity
     */
    register(category, id, entity) {
        const parts = category.split('.');
        let target = window.EntityRegistry;

        for (const part of parts) {
            if (!target[part]) target[part] = {};
            target = target[part];
        }

        target[id] = entity;
    }
};

window.EntityLoader = EntityLoader;
