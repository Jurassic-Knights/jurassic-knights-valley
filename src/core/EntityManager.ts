/**
 * EntityManager
 * Centralized storage and management for all game entities.
 * Replaces disconnected arrays in Game.js.
 * 
 * Owner: Core Systems
 */
import { Logger } from './Logger';
import { Quadtree } from './Quadtree';

// Ambient declaration for not-yet-migrated module
declare const GameRenderer: any;

class EntityManagerService {
    private game: any = null;
    private entities: any[] = [];
    private entitiesByType: Record<string, any[]> = {};
    private tree: Quadtree | null = null;
    private _queryBuffer: any[] = [];
    private _insertPool: WeakMap<any, any> = new WeakMap();

    constructor() {
        Logger.info('[EntityManager] Constructed');
    }

    init(game: any): void {
        this.game = game;

        if (Quadtree) {
            // Use GameRenderer's dynamic world size, fallback to calculated default
            const worldW = GameRenderer?.worldWidth || 7680;
            const worldH = GameRenderer?.worldHeight || 7680;
            this.tree = new Quadtree({ x: 0, y: 0, width: worldW, height: worldH });
            Logger.info(`[EntityManager] Quadtree initialized (${worldW}x${worldH})`);
        }

        Logger.info('[EntityManager] Initialized');
    }

    /**
     * Update all active entities
     */
    update(dt: number): void {
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
     */
    add(entity: any): void {
        if (!entity) return;

        this.entities.push(entity);

        // Add to type cache (must use constructor.name to match getByType calls)
        const type = entity.constructor.name;
        if (!this.entitiesByType[type]) {
            this.entitiesByType[type] = [];
        }
        this.entitiesByType[type].push(entity);

        Logger.info(`[EntityManager] Added ${type}. Total: ${this.entities.length}`);
    }

    /**
     * Remove an entity
     */
    remove(entity: any): void {
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
    getAll(): any[] {
        return this.entities;
    }

    /**
     * Get entities by class name
     */
    getByType(typeName: string): any[] {
        return this.entitiesByType[typeName] || [];
    }

    /**
     * Query entities within a rectangular region (View Frustum)
     */
    queryRect(rect: { x: number; y: number; width: number; height: number }): any[] {
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
     */
    getInRadius(x: number, y: number, radius: number, type: string | null = null): any[] {
        const results: any[] = [];
        const targets = type ? this.entitiesByType[type] || [] : this.entities;

        for (const entity of targets) {
            if (!entity.active) continue;

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

// Create singleton instance
const entityManager = new EntityManagerService();

// ES6 Module Export
export { EntityManagerService, entityManager };
