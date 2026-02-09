/**
 * PathfindingSystem - A* pathfinding for grid-based navigation
 *
 * Uses the IslandManager's grid system to find paths around obstacles.
 * Enemies use this to intelligently navigate to destinations.
 *
 * Owner: AI Systems
 */

import { Logger } from '@core/Logger';
import { GameConstants, getConfig } from '@data/GameConstants';
import { IslandManager } from '../world/IslandManager';
import { Registry } from '@core/Registry';
import type { ISystem, IGame } from '../types/core';

interface PathNode {
    gx: number;
    gy: number;
    key?: string;
}

interface CachedPath {
    path: { x: number; y: number }[];
    time: number;
}

class PathfindingSystem implements ISystem {
    game: IGame | null = null;
    gridSize: number;
    pathCache: Map<string, CachedPath> = new Map();
    cacheTimeout: number;
    _openSet: PathNode[] = [];
    _closedSet: Set<string> = new Set();
    _cameFrom: Map<string, PathNode> = new Map();
    _gScore: Map<string, number> = new Map();
    _fScore: Map<string, number> = new Map();

    constructor() {
        this.cacheTimeout = GameConstants.AI.PATHFINDING_CACHE_TIMEOUT;
        Logger.info('[PathfindingSystem] Constructed');
    }

    init(game: IGame) {
        this.game = game;
        this.gridSize = GameConstants.AI.PATHFINDING_GRID_SIZE;
        Logger.info('[PathfindingSystem] Initialized');
        return true;
    }

    /**
     * Find a path from start to end using A*
     * @param {number} startX - Start world X
     * @param {number} startY - Start world Y
     * @param {number} endX - End world X
     * @param {number} endY - End world Y
     * @returns {Array<{x: number, y: number}>} Array of waypoints, or empty if no path
     */
    findPath(startX: number, startY: number, endX: number, endY: number) {
        // Convert to grid coordinates
        const startNode = this.worldToGrid(startX, startY);
        const endNode = this.worldToGrid(endX, endY);

        // Check cache
        const cacheKey = `${startNode.gx},${startNode.gy}-${endNode.gx},${endNode.gy}`;
        const cached = this.pathCache.get(cacheKey);
        if (cached && Date.now() - cached.time < this.cacheTimeout) {
            return cached.path;
        }

        // If start or end is blocked, try to find nearby valid positions
        if (this.isGridBlocked(startNode.gx, startNode.gy)) {
            const valid = this.findNearestValidCell(startNode.gx, startNode.gy);
            if (valid) {
                startNode.gx = valid.gx;
                startNode.gy = valid.gy;
            }
        }
        if (this.isGridBlocked(endNode.gx, endNode.gy)) {
            const valid = this.findNearestValidCell(endNode.gx, endNode.gy);
            if (valid) {
                endNode.gx = valid.gx;
                endNode.gy = valid.gy;
            }
        }

        // Same cell?
        if (startNode.gx === endNode.gx && startNode.gy === endNode.gy) {
            return [{ x: endX, y: endY }];
        }

        // A* algorithm - use pooled data structures (cleared for reuse)
        const openSet = this._openSet;
        const closedSet = this._closedSet;
        const cameFrom = this._cameFrom;
        const gScore = this._gScore;
        const fScore = this._fScore;

        // Clear pooled structures for reuse
        openSet.length = 0;
        closedSet.clear();
        cameFrom.clear();
        gScore.clear();
        fScore.clear();

        const startKey = `${startNode.gx},${startNode.gy}`;
        const endKey = `${endNode.gx},${endNode.gy}`;

        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startNode, endNode));
        openSet.push({ ...startNode, key: startKey });

        let iterations = 0;
        const maxIterations = GameConstants.AI.PATHFINDING_MAX_ITERATIONS; // Prevent infinite loops

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Get node with lowest fScore
            openSet.sort(
                (a, b) => (fScore.get(a.key!) || Infinity) - (fScore.get(b.key!) || Infinity)
            );
            const current = openSet.shift()!;

            // Reached goal?
            if (current.key === endKey) {
                const path = this.reconstructPath(cameFrom, current, endX, endY);
                this.pathCache.set(cacheKey, { path, time: Date.now() });
                return path;
            }

            closedSet.add(current.key!);

            // Check neighbors (8 directions)
            const neighbors = this.getNeighbors(current.gx, current.gy);

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.gx},${neighbor.gy}`;

                if (closedSet.has(neighborKey)) continue;
                if (this.isGridBlocked(neighbor.gx, neighbor.gy)) continue;

                // Diagonal movement cost is higher
                const isDiagonal = neighbor.gx !== current.gx && neighbor.gy !== current.gy;
                const moveCost = isDiagonal ? 1.414 : 1;

                const tentativeG = (gScore.get(current.key!) || 0) + moveCost;

                if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.heuristic(neighbor, endNode));

                    if (!openSet.find((n) => n.key === neighborKey)) {
                        openSet.push({ ...neighbor, key: neighborKey });
                    }
                }
            }
        }

        // No path found
        this.pathCache.set(cacheKey, { path: [], time: Date.now() });
        return [];
    }

    /**
     * Heuristic function (Manhattan distance)
     */
    heuristic(a: PathNode, b: PathNode) {
        return Math.abs(a.gx - b.gx) + Math.abs(a.gy - b.gy);
    }

    /**
     * Reconstruct path from A* result
     */
    reconstructPath(cameFrom: Map<string, PathNode>, current: PathNode, endX: number, endY: number) {
        const path: { x: number; y: number }[] = [];
        let node: PathNode | undefined = current;

        while (node && node.key) {
            const worldPos = this.gridToWorld(node.gx, node.gy);
            path.unshift(worldPos);
            node = cameFrom.get(node.key);
        }

        // Add exact destination as final waypoint
        if (path.length > 0) {
            path[path.length - 1] = { x: endX, y: endY };
        }

        // Simplify path - remove redundant waypoints in straight lines
        return this.simplifyPath(path);
    }

    /**
     * Simplify path by removing collinear points
     */
    simplifyPath(path: { x: number; y: number }[]) {
        if (path.length <= 2) return path;

        const simplified = [path[0]];

        for (let i = 1; i < path.length - 1; i++) {
            const prev = simplified[simplified.length - 1];
            const curr = path[i];
            const next = path[i + 1];

            // Check if direction changes
            const dx1 = Math.sign(curr.x - prev.x);
            const dy1 = Math.sign(curr.y - prev.y);
            const dx2 = Math.sign(next.x - curr.x);
            const dy2 = Math.sign(next.y - curr.y);

            if (dx1 !== dx2 || dy1 !== dy2) {
                simplified.push(curr);
            }
        }

        simplified.push(path[path.length - 1]);
        return simplified;
    }

    /**
     * Get valid neighbor cells
     */
    getNeighbors(gx: number, gy: number): PathNode[] {
        const neighbors: PathNode[] = [];
        const dirs = [
            { dx: 0, dy: -1 }, // N
            { dx: 1, dy: -1 }, // NE
            { dx: 1, dy: 0 }, // E
            { dx: 1, dy: 1 }, // SE
            { dx: 0, dy: 1 }, // S
            { dx: -1, dy: 1 }, // SW
            { dx: -1, dy: 0 }, // W
            { dx: -1, dy: -1 } // NW
        ];

        for (const dir of dirs) {
            const ngx = gx + dir.dx;
            const ngy = gy + dir.dy;

            // For diagonals, ensure both adjacent cells are passable
            if (dir.dx !== 0 && dir.dy !== 0) {
                if (this.isGridBlocked(gx + dir.dx, gy) || this.isGridBlocked(gx, gy + dir.dy)) {
                    continue; // Can't cut corners
                }
            }

            neighbors.push({ gx: ngx, gy: ngy });
        }

        return neighbors;
    }

    /**
     * Check if a grid cell is blocked
     */
    isGridBlocked(gx: number, gy: number) {
        const worldPos = this.gridToWorld(gx, gy);
        const im = IslandManager;

        if (!im) return false;

        // Check if walkable AND not blocked
        return !im.isWalkable(worldPos.x, worldPos.y) || im.isBlocked(worldPos.x, worldPos.y);
    }

    /**
     * Find nearest valid cell from a blocked position
     */
    findNearestValidCell(gx: number, gy: number): PathNode | null {
        for (let radius = 1; radius <= 5; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;

                    const testGx = gx + dx;
                    const testGy = gy + dy;

                    if (!this.isGridBlocked(testGx, testGy)) {
                        return { gx: testGx, gy: testGy };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Convert world coordinates to pathfinding grid
     */
    worldToGrid(x: number, y: number): PathNode {
        return {
            gx: Math.floor(x / this.gridSize),
            gy: Math.floor(y / this.gridSize)
        };
    }

    /**
     * Convert pathfinding grid to world coordinates (cell center)
     */
    gridToWorld(gx: number, gy: number) {
        return {
            x: gx * this.gridSize + this.gridSize / 2,
            y: gy * this.gridSize + this.gridSize / 2
        };
    }

    /**
     * Clear path cache
     */
    clearCache() {
        this.pathCache.clear();
    }
}

// Create singleton and export
const pathfindingSystem = new PathfindingSystem();
if (Registry) Registry.register('PathfindingSystem', pathfindingSystem);

export { PathfindingSystem, pathfindingSystem };
