/**
 * EnemyBehaviorPath – Pathfinding and movement for Enemy.
 */
import { Enemy } from './EnemyCore';
import { GameConstants } from '@data/GameConstants';
import { IslandManager } from '../world/IslandManager';
import { pathfindingSystem as PathfindingSystem } from '@systems/PathfindingSystem';
import { MathUtils } from '@core/MathUtils';

export function setupEnemyPathBehavior() {
    Enemy.prototype.moveAlongPath = function (this: Enemy, targetX: number, targetY: number, speed: number, dt: number) {
        const distToTarget = MathUtils.distance(this.x, this.y, targetX, targetY);
        const arrivalDist = GameConstants.AI.PATH_ARRIVAL_DIST;
        if (distToTarget < arrivalDist) {
            this.currentPath = [];
            this.pathIndex = 0;
            return true;
        }

        this.pathRecalcTimer += dt;
        const recalcMs = GameConstants.AI.PATH_RECALC_INTERVAL_MS;
        const targetThresh = GameConstants.AI.PATH_TARGET_THRESHOLD;
        const needsNewPath =
            this.currentPath.length === 0 ||
            this.pathIndex >= this.currentPath.length ||
            this.pathRecalcTimer > recalcMs ||
            (this.pathTarget && Math.abs(this.pathTarget.x - targetX) > targetThresh) ||
            Math.abs(this.pathTarget.y - targetY) > targetThresh;

        if (needsNewPath && PathfindingSystem) {
            this.currentPath = PathfindingSystem.findPath(this.x, this.y, targetX, targetY);
            this.pathIndex = 0;
            this.pathTarget = { x: targetX, y: targetY };
            this.pathRecalcTimer = 0;

            if (this.currentPath.length > 1) {
                const first = this.currentPath[0];
                const distToFirst = MathUtils.distance(this.x, this.y, first.x, first.y);
                if (distToFirst < GameConstants.AI.PATH_LEAD_DIST) this.pathIndex = 1;
            }
        }

        if (this.currentPath.length === 0) return this.moveDirectly(targetX, targetY, speed, dt);
        if (this.pathIndex >= this.currentPath.length) this.pathIndex = this.currentPath.length - 1;

        const waypoint = this.currentPath[this.pathIndex];
        const dx = waypoint.x - this.x;
        const dy = waypoint.y - this.y;
        const dist = MathUtils.distance(this.x, this.y, waypoint.x, waypoint.y);

        if (dist < GameConstants.AI.PATH_WAYPOINT_DIST) {
            this.pathIndex++;
            if (this.pathIndex >= this.currentPath.length) {
                this.currentPath = [];
                return true;
            }
            return this.moveAlongPath(targetX, targetY, speed, dt);
        }

        const msPerSec = GameConstants.Timing.MS_PER_SECOND;
        const moveSpeed = speed * (dt / msPerSec);
        this.x += (dx / dist) * moveSpeed;
        this.y += (dy / dist) * moveSpeed;
        this.facingRight = dx > 0;
        return false;
    };

    Enemy.prototype.moveDirectly = function (this: Enemy, targetX: number, targetY: number, speed: number, dt: number) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = MathUtils.distance(this.x, this.y, targetX, targetY);

        if (dist < GameConstants.AI.MOVE_DIRECT_ARRIVAL) return true;

        const msPerSec = GameConstants.Timing.MS_PER_SECOND;
        const moveSpeed = speed * (dt / msPerSec);
        const newX = this.x + (dx / dist) * moveSpeed;
        const newY = this.y + (dy / dist) * moveSpeed;

        const im = IslandManager;
        if (!im || (im.isWalkable(newX, this.y) && !im.isBlocked(newX, this.y))) this.x = newX;
        if (!im || (im.isWalkable(this.x, newY) && !im.isBlocked(this.x, newY))) this.y = newY;
        this.facingRight = dx > 0;
        return false;
    };
}
