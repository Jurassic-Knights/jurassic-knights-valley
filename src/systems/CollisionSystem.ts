/**
 * CollisionSystem – Resolves spatial collisions, movement, and triggers between entities using a spatial hash.
 */
import { ISystem, IGame, IEntity } from '../types/core';
import { Entity } from '../core/Entity';
import { Logger } from '../core/Logger';
import { CollisionComponent, CollisionLayers } from '../components/CollisionComponent';
import { IslandManager } from '../world/IslandManager';
import { GameConstants } from '../data/GameConstants';
import { EventBus } from '../core/EventBus';
import { Registry } from '../core/Registry';
import { EntityManagerService } from '../core/EntityManager';
import { EntityTypes } from '../config/EntityTypes';
import { ZoneType } from '../config/WorldTypes';

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
            this.updateSpatialHash(entity);
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
            // We only strictly *need* to hash entities that CAN collide.
            if (entity.collision) {
                this.updateSpatialHash(entity);
            }
        }

        if (this.debugMode) {
            // Render handled by GameRenderer
        }
    }

    /**
     * Add entity to spatial hash buckets
     */
    private updateSpatialHash(entity: Entity) {
        const bounds = entity.collision ? this.getCollisionBounds(entity) : entity.getBounds();

        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (!this.spatialHash.has(key)) {
                    this.spatialHash.set(key, []);
                }
                this.spatialHash.get(key)!.push(entity);
            }
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
        if (this.checkCollision(entity)) {
            entity.x = originalX;
            colX = true;
        }
        const movedX = entity.x - originalX;

        // Resolve Y
        const originalY = entity.y;
        entity.y += dy;
        let colY = false;
        if (this.checkCollision(entity)) {
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
            // No collision, just move
            entity.x += dx;
            entity.y += dy;
            return { x: dx, y: dy };
        }

        const startX = entity.x;
        const startY = entity.y;

        // 1. Horizontal Movement
        if (dx !== 0) {
            entity.x += dx;
            if (this.checkCollision(entity)) {
                // Hit something, resolve X
                // Simple resolution: Step back until clear? Or explicit calculation?
                // Step back method for robustness:
                entity.x -= dx;
                // Optional: Slide close to wall?
                // For now, full stop on collision axis
                dx = 0;
            }
        }

        // 2. Vertical Movement
        if (dy !== 0) {
            entity.y += dy;
            if (this.checkCollision(entity)) {
                // Hit something, resolve Y
                entity.y -= dy;
                dy = 0;
            }
        }

        // 3. IslandManager Grid Check (Terrain)
        // This is distinct from Entity-Entity check usually, 
        // but checkCollision() already wraps both via isBlocked checks.

        // Separation Logic for Enemies
        if (col.layer === CollisionLayers.ENEMY) {
            this.applySeparation(entity);
        }

        // 4. Trigger Checks (Start/End Events)
        // Check after all movement is finalized
        this.checkTriggers(entity);

        return { x: dx, y: dy };
    }

    /**
     * Check if entity collides with anything in its current position
     */
    private checkCollision(entity: Entity): boolean {
        const col = entity.collision;
        const bounds = this.getCollisionBounds(entity);

        // 1. Terrain Check (Static Grid)
        // Check corners of the bounding box
        if (IslandManager.isBlocked(bounds.x, bounds.y) ||
            IslandManager.isBlocked(bounds.x + bounds.width, bounds.y) ||
            IslandManager.isBlocked(bounds.x, bounds.y + bounds.height) ||
            IslandManager.isBlocked(bounds.x + bounds.width, bounds.y + bounds.height)) {
            return true;
        }

        // 2. Entity Check (Spatial Hash)
        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                const neighbors = this.spatialHash.get(key);
                if (!neighbors) continue;

                for (const other of neighbors) {
                    if (other === entity) continue;
                    if (!other.active) continue;

                    const otherCol = other.collision;
                    if (!otherCol || !otherCol.enabled) continue;

                    // Mask Check: Does my layer collide with their layer?
                    // (A.layer & B.mask) !== 0

                    // Case 1: Hard Collision (Stop)
                    // Default: Hero vs Wall, Enemy vs Wall
                    // We only return TRUE (Stop) if it's a blocking collision.

                    // Case 1: Hard Collision (Stop)
                    if (col && this.isHardCollision(col, otherCol)) {
                        if (entity.collidesWith(other)) {
                            return true;
                        }
                    }

                    // Case 2: Trigger (Overlap event) - Handled separately in checkTriggers
                    // We don't return true (Hard Stop) for triggers
                }
            }
        }

        return false;
    }

    /**
     * Check for overlaps and manage Trigger Events (Start/End).
     * Reuses _currentOverlapsScratch and per-entity Sets to avoid allocation in hot path.
     */
    private checkTriggers(entity: Entity) {
        const col = entity.collision;
        if (!col) return;

        const bounds = this.getCollisionBounds(entity);
        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);
        const endX = Math.floor((bounds.x + bounds.width) / this.cellSize);
        const endY = Math.floor((bounds.y + bounds.height) / this.cellSize);

        const currentOverlaps = this._currentOverlapsScratch;
        currentOverlaps.clear();

        // Find current overlaps
        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                const neighbors = this.spatialHash.get(key);
                if (!neighbors) continue;

                for (const other of neighbors) {
                    if (other === entity || !other.active) continue;

                    const otherCol = other.collision;
                    if (!otherCol || !otherCol.enabled) continue;

                    // Trigger Check: Must involve a trigger or matching mask
                    // We check triggers specifically for Events
                    if (this.isTriggerCollision(col, otherCol)) {
                        if (entity.collidesWith(other)) {
                            currentOverlaps.add(other.id);
                        }
                    }
                }
            }
        }

        let previousOverlaps = this.activeCollisions.get(entity.id);
        if (!previousOverlaps) {
            previousOverlaps = new Set();
            this.activeCollisions.set(entity.id, previousOverlaps);
        }

        // START Events (In Current but not Previous)
        for (const otherId of currentOverlaps) {
            if (!previousOverlaps.has(otherId)) {
                // Find entity object for event data? We only have IDs here.
                // We shouldn't store full entity refs in set to avoid leaks, but we need refs for Event.
                // We'll simplistic lookup or iterate again?
                // Optimization: We are inside the loops above where we have `other`.
                // But we are aggregating into a Set first.
                // Better: Emit immediately inside loop if new?
                // But we need to handle END events too.
                // Let's rely on looking up by ID if needed, or just iterate `entities` (slow).
                // Or store ref in map temporarily?
                // For this task, let's assume getEntityById is cheap or we just fire event with ID?
                // Events usually carry Entity references.
                // We'll iterate all currentOverlaps again to find the Entity?
                const other = this.entities.find(e => e.id === otherId); // Potentially slow O(N)
                if (other) {
                    EventBus.emit(GameConstants.Events.COLLISION_START, { a: entity, b: other });
                    // Logger.info(`Contact Start: ${entity.id} -> ${other.id}`);
                }
            }
        }

        // END Events (In Previous but not Current)
        for (const otherId of previousOverlaps) {
            if (!currentOverlaps.has(otherId)) {
                const other = this.entities.find(e => e.id === otherId);
                if (other) {
                    EventBus.emit(GameConstants.Events.COLLISION_END, { a: entity, b: other });
                    // Logger.info(`Contact End: ${entity.id} -> ${other.id}`);
                }
            }
        }

        // Update state: reuse previousOverlaps for next frame (clear and copy current)
        previousOverlaps.clear();
        for (const id of currentOverlaps) {
            previousOverlaps.add(id);
        }
    }

    private isHardCollision(a: CollisionComponent, b: CollisionComponent): boolean {
        if (a.isTrigger || b.isTrigger) return false;
        // If I am meant to collide with THEM
        return (a.mask & b.layer) !== 0;
    }

    private isTriggerCollision(a: CollisionComponent, b: CollisionComponent): boolean {
        return (a.isTrigger || b.isTrigger) && (a.mask & b.layer) !== 0;
    }

    private handleTrigger(a: Entity, b: Entity) {
        // Debounce? Or just emit 'COLLISION_START'
        // For now, simple emit
        EventBus.emit(GameConstants.Events.COLLISION_START, { a, b });
    }

    private applySeparation(entity: Entity) {
        const bounds = this.getCollisionBounds(entity);
        const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };

        const startX = Math.floor(bounds.x / this.cellSize);
        const startY = Math.floor(bounds.y / this.cellSize);

        // Check neighbors for soft push
        // ... Implementation of separation vector ...
        // For now, omitting full flocking logic to keep initial impl simple.
    }

    private getCollisionBounds(entity: Entity) {
        const col = entity.collision;
        if (col) {
            return {
                x: entity.x - col.bounds.width / 2 + col.bounds.offsetX,
                y: entity.y - col.bounds.height / 2 + col.bounds.offsetY,
                width: col.bounds.width,
                height: col.bounds.height
            };
        }
        return entity.getBounds();
    }

    /**
     * Render collision debug info (Called by GameRenderer)
     * Context is already translated to World View
     */
    renderDebug(ctx: CanvasRenderingContext2D) {
        if (!this.debugMode) return;

        const logRate = GameConstants.CollisionDebug.LOG_SAMPLE_RATE;
        if (Math.random() < logRate) {
            const activeWithCol = this.entities.filter(e => e.active && e.collision).length;
            Logger.info(`[CollisionSystem] Rendering... Entities: ${this.entities.length}, Drawable: ${activeWithCol}`);
            if (activeWithCol > 0) {
                const sample = this.entities.find(e => e.active && e.collision);
                if (sample) Logger.info(`[CollisionSystem] Sample: ${sample.id} at ${sample.x},${sample.y}`);
            }
        }

        // Draw Spatial Hash Grid (Optional - visual noise)
        // this.drawSpatialGrid(ctx);

        // Draw Terrain Blocks (IslandManager)
        this.drawTerrainDebug(ctx);

        // Draw Entity Hitboxes
        ctx.lineWidth = 1;

        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2; // Make it thicker

        let loggedOne = false;

        for (const entity of this.entities) {
            if (!entity.active) continue;

            const col = entity.collision;
            if (!col || !col.enabled) continue;

            const bounds = this.getCollisionBounds(entity);

            // Additional logging for coordinate verification
            if (!loggedOne && Math.random() < logRate) {
                Logger.info(`[CollisionSystem] Drawing ${entity.id} at [${Math.floor(bounds.x)}, ${Math.floor(bounds.y)}] size [${bounds.width}x${bounds.height}] color: ${entity.entityType === EntityTypes.HERO ? 'GREEN' : 'OTHER'}`);
                loggedOne = true;
            }

            // Color coding
            if (entity.entityType === EntityTypes.HERO) {
                ctx.strokeStyle = '#00FF00'; // Green (Hero)
            } else if (col.layer === CollisionLayers.ENEMY) {
                ctx.strokeStyle = '#FF0000'; // Red (Enemy)
            } else if (col.isTrigger) {
                ctx.strokeStyle = '#FFFF00'; // Yellow (Trigger)
            } else {
                ctx.strokeStyle = '#FFFFFF'; // White (Other)
            }

            // Draw Box
            ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

            // Draw Velocity/Direction (if active)
            // Use safe check for inputMove
            if ('inputMove' in entity) {
                const move = (entity as IEntity & { inputMove?: { x: number; y: number } }).inputMove;
                if (move && (move.x !== 0 || move.y !== 0)) {
                    ctx.beginPath();
                    ctx.moveTo(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
                    const scale = GameConstants.CollisionDebug.DIRECTION_VECTOR_SCALE;
                    ctx.lineTo(bounds.x + bounds.width / 2 + move.x * scale, bounds.y + bounds.height / 2 + move.y * scale);
                    ctx.strokeStyle = 'cyan';
                    ctx.stroke();
                }
            }
        }
        ctx.restore();
    }

    private drawSpatialGrid(ctx: CanvasRenderingContext2D) {
        // Draw Spatial Hash Grid (Optional - visual noise, keeping disabled)
    }

    private drawTerrainDebug(ctx: CanvasRenderingContext2D) {
        if (!IslandManager || !IslandManager.collisionBlocks) return;

        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';

        for (const block of IslandManager.collisionBlocks) {
            // Draw block
            ctx.fillRect(block.x, block.y, block.width, block.height);
            ctx.strokeRect(block.x, block.y, block.width, block.height);
        }

        // Draw Unlock Triggers (Bridges)
        ctx.fillStyle = 'rgba(0, 0, 255, 0.2)'; // Blue triggers
        if (IslandManager.walkableZones) {
            for (const zone of IslandManager.walkableZones) {
                if (zone.type === ZoneType.BRIDGE) {
                    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
                }
            }
        }
    }
}

const collisionSystem = new CollisionSystem();
if (Registry) Registry.register('CollisionSystem', collisionSystem);
export { collisionSystem };
