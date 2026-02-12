/**
 * CollisionSystem – Resolves spatial collisions, movement, and triggers between entities using a spatial hash.
 */
import { ISystem, IGame } from '../types/core';
import { Entity } from '../core/Entity';
import { Logger } from '../core/Logger';
import { CollisionLayers } from '../components/CollisionComponent';
import { GameConstants } from '../data/GameConstants';
import { EventBus } from '../core/EventBus';
import { Registry } from '../core/Registry';
import { EntityManagerService } from '../core/EntityManager';
import { renderCollisionDebug } from './CollisionSystemDebug';
import { getCollisionBounds } from './CollisionSystemUtils';
import { updateSpatialHash } from './CollisionSystemSpatialHash';
import { checkCollision, checkTriggers } from './CollisionSystemCollision';

export class CollisionSystem implements ISystem {
    private entities: Entity[] = [];
    private spatialHash: Map<string, Entity[]> = new Map();
    private activeCollisions: Map<string, Set<string>> = new Map(); // EntityID -> Set<OtherID>
    /** Scratch Set reused per entity in checkTriggers to avoid allocation in hot path */
    private _currentOverlapsScratch: Set<string> = new Set();
    private cellSize: number;
    private debugMode: boolean = false;

    constructor() {
        this.entities = [];
        this.spatialHash = new Map();
        this.activeCollisions = new Map();
    }

    init(game: IGame): void {
        this.cellSize = GameConstants.Grid.CELL_SIZE;
        Logger.info('[CollisionSystem] Initialized');

        // Listen for entity registration
        EventBus.on(GameConstants.Events.ENTITY_ADDED, (data: { entity: Entity }) => {
            if (data && data.entity) {
                this.register(data.entity);
                Logger.info(`[CollisionSystem] Event ADDED: ${data.entity.id}`);
            }
        });

        EventBus.on(GameConstants.Events.ENTITY_REMOVED, (data: { entity: Entity }) => {
            if (data && data.entity) this.unregister(data.entity);
        });

        EventBus.on(GameConstants.Events.ENTITY_MOVE_REQUEST, (data: { entity: Entity; dx: number; dy: number }) => {
            if (data?.entity != null && this.entities.includes(data.entity)) {
                const result = this.move(data.entity, data.dx, data.dy);
                EventBus.emit(GameConstants.Events.MOVEMENT_UPDATE_RESULT, {
                    entity: data.entity,
                    actualDx: result.x,
                    actualDy: result.y
                });
            }
        });

        // Initial Sync (Get existing entities from EntityManager)
        const entityManager = Registry.get<EntityManagerService>('EntityManager');
        if (entityManager) {
            // EntityManager returns IEntity[], but we need Entity[] locally if we rely on Entity class features
            // In practice, all entities are instances of Entity class
            const existing = entityManager.getAll() as Entity[]; // Safe cast as we know runtime types
            existing.forEach((e: Entity) => this.register(e));
            Logger.info(`[CollisionSystem] Synced ${existing.length} initial entities`);
        }
    }

    toggleDebug(): boolean {
        this.debugMode = !this.debugMode;
        Logger.info(`[CollisionSystem] Debug Mode: ${this.debugMode}`);
        return this.debugMode;
    }

    public get isDebugMode(): boolean {
        return this.debugMode;
    }

    start(): void {
        // Optional start logic
    }

    register(entity: Entity): void {
        if (!this.entities.includes(entity)) {
            this.entities.push(entity);
            updateSpatialHash(entity, this.spatialHash, this.cellSize);
            Logger.info(`[CollisionSystem] Registered ${entity.id}. Total: ${this.entities.length}`);
        }
    }

    unregister(entity: Entity): void {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Main update loop - Rebuilds spatial hash for dynamic entities.
     * Reuses bucket arrays to avoid per-frame allocation (object pooling).
     */
    update(dt: number): void {
        // Clear bucket contents but reuse arrays (no new allocation)
        for (const bucket of this.spatialHash.values()) {
            bucket.length = 0;
        }

        for (const entity of this.entities) {
            if (!entity.active) continue;
            if (entity.collision) updateSpatialHash(entity, this.spatialHash, this.cellSize);
        }

        if (this.debugMode) {
            // Render handled by GameRenderer
        }
    }

    /**
     * Update entity movement with collision resolution
     */
    public updateMovement(entity: Entity, direction: { x: number, y: number }, speed: number, dt: number) {
        if (!entity.active || speed <= 0) return { x: 0, y: 0, collidedX: false, collidedY: false };

        const msPerSecond = GameConstants.Timing.MS_PER_SECOND;
        const dx = direction.x * (speed * dt / msPerSecond);
        const dy = direction.y * (speed * dt / msPerSecond);

        // Resolve X
        const originalX = entity.x;
        entity.x += dx;
        let colX = false;
        if (checkCollision(entity, this.spatialHash, this.cellSize, getCollisionBounds)) {
            entity.x = originalX;
            colX = true;
        }
        const movedX = entity.x - originalX;

        // Resolve Y
        const originalY = entity.y;
        entity.y += dy;
        let colY = false;
        if (checkCollision(entity, this.spatialHash, this.cellSize, getCollisionBounds)) {
            entity.y = originalY;
            colY = true;
        }
        const movedY = entity.y - originalY;

        // Update Prev Position for interpolation (at end of frame usually, but here is fine for now)
        entity.prevX = originalX; // Note: This might be updated elsewhere too
        entity.prevY = originalY;

        return {
            x: movedX,
            y: movedY,
            collidedX: colX,
            collidedY: colY
        };
    }

    /**
     * Attempt to move an entity by (dx, dy) handling collisions.
     * Returns the ACTUAL amount moved.
     */
    move(entity: Entity, dx: number, dy: number): { x: number, y: number } {
        const col = entity.collision;
        if (!col || !col.enabled) {
            entity.x += dx;
            entity.y += dy;
            return { x: dx, y: dy };
        }

        let actualDx = dx;
        let actualDy = dy;

        if (dx !== 0) {
            entity.x += dx;
            if (checkCollision(entity, this.spatialHash, this.cellSize, getCollisionBounds)) {
                entity.x -= dx;
                actualDx = 0;
            }
        }
        if (dy !== 0) {
            entity.y += dy;
            if (checkCollision(entity, this.spatialHash, this.cellSize, getCollisionBounds)) {
                entity.y -= dy;
                actualDy = 0;
            }
        }

        if (col.layer === CollisionLayers.ENEMY) this.applySeparation(entity);

        checkTriggers(entity, this.spatialHash, this.cellSize, this.activeCollisions, this._currentOverlapsScratch, this.entities, getCollisionBounds);

        return { x: actualDx, y: actualDy };
    }

    private applySeparation(_entity: Entity) {
        // Separation/flocking logic not yet implemented
    }

    /** Render collision debug info (Called by GameRenderer). Context is already translated to World View. */
    renderDebug(ctx: CanvasRenderingContext2D): void {
        renderCollisionDebug(ctx, {
            debugMode: this.debugMode,
            entities: this.entities,
            getCollisionBounds
        });
    }
}

const collisionSystem = new CollisionSystem();
if (Registry) Registry.register('CollisionSystem', collisionSystem);
export { collisionSystem };
