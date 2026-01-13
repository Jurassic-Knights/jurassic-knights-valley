/**
 * EntityManager
 * Centralized storage and management for all game entities.
 * Replaces disconnected arrays in Game.js.
 */
class EntityManagerService {
    constructor() {
        this.game = null;
        this.entities = [];
        this.entitiesByType = {}; // cached lists by constructor name

        // Quadtree for spatial querying
        // Bounds should ideally match World Size (GameRenderer.worldWidth), but we fallback to a large area
        // We'll init it properly in init() when game is available, or here with defaults
        this.tree = null;

        // GC Optimization: Pre-allocated buffer for queryRect results
        this._queryBuffer = [];

        // GC Optimization: Pool for Quadtree insert wrappers (keyed by entity)
        this._insertPool = new WeakMap();

        Logger.info('[EntityManager] Constructed');
    }
    // ...
    // (We just need to change the class name and the window assignment.
    //  Using a smaller ReplaceBlock for safety might be better, but I'll do the start and end as planned.)

    init(game) {
        this.game = game;

        if (window.Quadtree) {
            // Use GameRenderer's dynamic world size, fallback to calculated default
            const worldW = window.GameRenderer?.worldWidth || 7680;
            const worldH = window.GameRenderer?.worldHeight || 7680;
            this.tree = new Quadtree({ x: 0, y: 0, width: worldW, height: worldH });
            Logger.info(`[EntityManager] Quadtree initialized (${worldW}x${worldH})`);
        }

        Logger.info('[EntityManager] Initialized');
    }

    /**
     * Update all active entities
     * @param {number} dt 
     */
    update(dt) {
        // 1. Rebuild Quadtree (Static reconstruction strategy)
        if (this.tree) {
            this.tree.clear();
        }

        // Iterate backwards to allow safe removal
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const entity = this.entities[i];

            if (!entity.active) {
                this.remove(entity);
                continue;
            }

            // Insert into Quadtree
            if (this.tree) {
                // GC Optimization: Reuse wrapper object from pool
                let wrapper = this._insertPool.get(entity);
                if (!wrapper) {
                    wrapper = { x: 0, y: 0, width: 1, height: 1, entity: entity };
                    this._insertPool.set(entity, wrapper);
                }
                // Update wrapper with current position
                wrapper.x = entity.x;
                wrapper.y = entity.y;
                wrapper.width = entity.width || 1;
                wrapper.height = entity.height || 1;

                this.tree.insert(wrapper);
            }

            if (typeof entity.update === 'function') {
                entity.update(dt);
            }
        }
    }

    /**
     * Add an entity to the manager
     * @param {object} entity 
     */
    add(entity) {
        if (!entity) return;

        this.entities.push(entity);

        // Add to type cache (must use constructor.name to match getByType calls)
        const type = entity.constructor.name;
        if (!this.entitiesByType[type]) {
            this.entitiesByType[type] = [];
        }
        this.entitiesByType[type].push(entity);

        Logger.info(`[EntityManager] Added ${type}. Total: ${this.entities.length}`);

        // Optional: Trigger event?
        // if (window.EventBus) EventBus.emit(Events.ENTITY_SPAWNED, entity);
    }

    /**
     * Remove an entity
     * @param {object} entity 
     */
    remove(entity) {
        const idx = this.entities.indexOf(entity);
        if (idx !== -1) {
            this.entities.splice(idx, 1);

            // Remove from type cache (must match add() key)
            const type = entity.constructor.name;
            if (this.entitiesByType[type]) {
                const typeIdx = this.entitiesByType[type].indexOf(entity);
                if (typeIdx !== -1) {
                    this.entitiesByType[type].splice(typeIdx, 1);
                }
            }

            // Optional: Cleanup method on entity
            if (typeof entity.destroy === 'function') {
                entity.destroy();
            }
        }
    }

    /**
     * Get all entities
     */
    getAll() {
        return this.entities;
    }

    /**
     * Get entities by class name
     * @param {string} typeName - e.g. 'Dinosaur', 'Resource'
     */
    getByType(typeName) {
        return this.entitiesByType[typeName] || [];
    }

    /**
     * Query entities within a rectangular region (View Frustum)
     * @param {object} rect {x, y, width, height}
     * @returns {array} Array of Entities
     */
    queryRect(rect) {
        if (!this.tree) return this.entities; // Fallback to all if no tree

        const results = this.tree.queryRect(rect);

        // GC Optimization: Reuse buffer instead of map()
        const buffer = this._queryBuffer;
        buffer.length = 0;
        for (let i = 0; i < results.length; i++) {
            buffer.push(results[i].entity);
        }
        return buffer;
    }

    /**
     * Find entities within radius of a point
     * (Naive O(N) implementation for now, Quadtree later)
     */
    getInRadius(x, y, radius, type = null) {
        const results = [];
        const targets = type ? (this.entitiesByType[type] || []) : this.entities;

        for (const entity of targets) {
            if (!entity.active) continue;

            // Assuming entity has x, y (center or top-left?)
            // Standardize on center for distance check if possible
            const ex = entity.x + (entity.width ? entity.width / 2 : 0);
            const ey = entity.y + (entity.height ? entity.height / 2 : 0);

            const dx = x - ex;
            const dy = y - ey;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radius * radius) {
                results.push(entity);
            }
        }
        return results;
    }
}

// Global & Register
window.EntityManager = new EntityManagerService();
if (window.Registry) Registry.register('EntityManager', window.EntityManager);
